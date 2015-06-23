/**
 * JobController
 *
 * @description :: Server-side logic for managing jobs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var util = require('util'),
	path = require('path');

module.exports = {

	/**
	*
	* Lists all of the current render jobs for a user
	*
	**/

	index: function (req, res){
		Job.find({owner: req.user.id })
			.populate('queue')
			.populate('renders')
			.exec(
				function(err, results){
					if(err){
						return res.negotiate(err);
					}

					sails.log(req.session);

					res.view('job/index',{
						jobs: results
					});
				}
			);

	},

	/**
	*
	* Responsible for destroying a job along with associated uploads, queue and renders.
	*
	**/
	destroy: function(req, res){
		//Check to see if the job is active via the Job.status.
		//If active:
		//	Kill the job and destroy any running instances
		//If not:
		//	Just remove the job record along with associated file records.

		//Check to see if the job exists and the user has permission.
		Job.find({ id: req.param('id'), owner: req.user.id })
			.populate('queue')
			.populate('uploads')
			.populate('renders')
			.exec( function(err, job){

				if (err) {
					req.flash('error', 'You are not allowed to perform this action.');
					return res.negotiate(err);
				}

				Job.destroy({ id: req.param('id'), owner: req.user.id }).exec(
					function (err) {
						if (err) {
							req.flash('error', 'You are not allowed to perform this action.');
							return res.negotiate(err);
						}

						var promises = [];

						sails.log('uploads:');
						sails.log(job[0].uploads);

						if(typeof job[0].uploads !== 'undefined'){
							//Delete associations
							var deleteFiles = new sails.RSVP.Promise( function(fulfill, reject) {
								File.destroy({ id: job[0].uploads[0] }).exec(
									function(err){
										if(err){
											reject(err);
										}

										fulfill();
									}
								);
							});
							promises.push(deleteFiles);
						}

						sails.log('queue:');
						sails.log(job[0].queue);

						if(typeof job[0].queue !== 'undefined'){

							var deleteQueue = new sails.RSVP.Promise( function(fulfill, reject) {

								//Delete the queue on Amazon
								amazon.deleteSQSWorkQueue(job[0].queue)
									.then(
										function(result){

											//Delete the queue record
											Queue.destroy({ id: job[0].queue }).exec(
												function(err){
													if(err){
														reject(err);
													}

													fulfill();
												}
											);

										},
										function(err){
											reject(err);
										}
									);

							});
							promises.push(deleteQueue);
						}

						/*if(typeof job[0].renders !== 'undefined'){

							var deleteRenders = new sails.RSVP.Promise( function(fulfill, reject) {

								//Delete the queue on Amazon
								brenda.deleteRenderConfigFiles(job[0].renders)
									.then(
										function(result){

											//Delete the queue record
											Render.destroy({ id: job[0].renders }).exec(
												function(err){
													if(err){
														reject(err);
													}

													fulfill();
												}
											);

										},
										function(err){
											reject(err);
										}
									);

							});
							promises.push(deleteQueue);
						}*/

						if(promises.length > 0){

							//Run the promise queue
							sails.RSVP.allSettled(promises).then(
								function(array){
									var errors = [];
									for(var i=0;i<array.length;i++){
										if(array[i].state == 'rejected'){
											errors.push(array[i].reason);
											req.flash('error', array[i].reason);
										}
									}

									sails.log(array);
									//Check the total errors found.
									if(errors.length > 0){
										req.flash('error', '<br><br>Please file a bug report at <a href="https://github.com/robksawyer/brenda-web/issues/new?labels=bug">github.com/robksawyer/brenda-web/issues/new?labels=bug</a>.');
									} else {
										sails.log('Job ' + job[0].name + ' destroyed successfully!');
										req.flash('success', 'Job ' + job[0].name + ' destroyed successfully!');
									}
								},
								function(err){
									req.flash('error', 'There was an server error.<br>Please file a bug report at <a href="https://github.com/robksawyer/brenda-web/issues/new?labels=bug">github.com/robksawyer/brenda-web/issues/new?labels=bug</a>.');
									return res.negotiate(err);
								}
							);

						} else {
							req.flash('success', 'Job ' + job[0].name + ' destroyed successfully!');
						}

						return res.redirect('/job');
					}
				);

			}); //end exec
	},

	/**
	*
	* Handles adding a job to the Amazon SQS Queuing service.
	*
	**/

	add_spot: function (req, res){

		//Pull the user's settings from the database
		brenda.getUserSettings(req).then( function(settings) {

			var errors = [];

			if (req.method == 'POST') {

				if(!sails.config.aws.credentials.accessKeyId){
					errors.push({message: 'You must provide a valid AWS access key.'});
				}
				if(!sails.config.aws.credentials.secretAccessKey){
					errors.push({message: 'You must provide a valid AWS secret access key.'});
				}
				if(!settings.aws_s3_project_bucket){
					errors.push({message: 'You have not configured an AWS S3 project bucket. Do this on the <a href="/settings">settings page</a>.'});
				}
				if(!settings.aws_s3_region){
					errors.push({message: 'You have not configured a AWS S3 region. Do this on the <a href="/settings">settings page</a>.'});
				}

				if(errors.length < 1) {

					//Check to see if a Blender file was uploaded
					if(typeof req.file('project_file') !== 'undefined') {

						var fileStream = req.file('project_file')._files[0].stream,
							filename = fileStream.filename,
							extension = path.extname(filename),
							allowedExtensions = ['.zip','.gz'];

						errors = uploader.validate(fileStream);

						// Upload the file.
						if (errors.length < 1) {
							sails.log.info('File passed validation!');

							//Check to see if the file has a .blend, .gz, or .zip extension.
							//
							if(extension == '.blend'){
								sails.log.info('Blender file found. Zipping the file before uploading to S3.');

								//Process the file input
								brenda.processBlenderFile(req, fileStream, settings).then(
									function(jobRecord){
										req.flash('success', 'Spot instance job ' + jobRecord.name + ' created successfully!');
										res.redirect('job/submit/' + jobRecord.id);
									},
									function(err){
										if(typeof err.code !== 'undefined'){

											switch(err.code){

												case "UnknownEndpoint":
													req.flash('error', err.message);
													res.view('job/add_spot',{
														settings: settings
													});
													break;

												default:
													req.flash('error', err);
													return res.negotiate(err);
													break;
											}

										} else {
											req.flash('error', err);
											return res.negotiate(err);
										}
									}
								);

							} else if(allowedExtensions.indexOf(extension) > -1) {
								sails.log.info('Compressed file found. Uploading to S3.');

								//Process the file input
								brenda.processZipFile( req, settings ).then(
									function(fileRecord){
										req.flash('success', 'Spot instance job ' + jobRecord.name + ' created successfully!');
										res.redirect('job/submit/' + jobRecord.id);
									},
									function(err){
										req.flash('error', err);
										return res.negotiate(err);
									}
								);

							} else {
								req.flash('error', 'Unable to find the extension of the file.');
								res.view('job/add_spot',{
									settings: settings
								});
							}
						} else {
							req.flash('error', 'File validation failed.');
							res.view('job/add_spot',{
								settings: settings
							});
						}
					} else {
						req.flash('error', 'The file could not be found or was not uploaded.');
						res.view('job/add_spot',{
							settings: settings
						});
					}
				} else {
					res.view('job/add_spot',{
						settings: settings
					});
				}
			} else {
				//Other requests
				res.view('job/add_spot',{
					settings: settings,
					error: errors
				});

			}

		},
		function(err){
			sails.log.error(err);
			req.flash('error', err);
			return res.notFound();
		});

	},

	submit: function(req, res){
		if( typeof req.param('id') !== 'undefined' ){

			//Search for the job details
			Job.find({id: req.param('id'), owner: req.user.id}).populate('queue').exec( function(err, jobRecords){
				if(err){
					req.flash('error', err);
					res.serverError(err);
				}

				sails.log(jobRecords);

				res.view('job/submit', {
					job: jobRecords[0],
					textParams: req.params.all()
				});
			});

		} else {
			return res.notFound();
		}
	},

	/**
	*
	* Loads up the SQS queue and intiates a Amazon EC2 spot instance request.
	*
	**/
	start_spot: function(req, res){

		if( typeof req.param('type') === 'undefined'){
			req.flash('error', 'You must provide a valid job type e.g. spot.');
			res.notFound();
		}

		if( typeof req.param('id') !== 'undefined' ){

			Job.find({id: req.param('id'), owner: req.user.id})
				.populate('queue')
				.populate('uploads')
				.populate('renders')
				.exec(
					function(err, jobs){
						if(err){
							reject(err);
						}

						//Create a Render record.
						brenda.createRenderRecord( req.user.id, jobs[0] )
							.then(
								function(renderRecord){

									//Kick off the brenda work job
									BrendaWork.start( req.user.id, jobs[0] )
										.then(
											function(results){
												//Pass the user to the job overview page.
												//This will allow them to see the status of the spot instance request.
												//Spot instance status should show up in the job block
												//It might be more helpful to send them to a job status page. TBD on that.

												sails.log.info(renderRecord);

												if(typeof renderRecord === 'undefined'){
													req.flash('error', 'There are no renders associated with this job.');
													return res.notFound('There are no renders associated with this job.');
												}

												//The queue of tasks have been created
												BrendaRun.spot(jobs[0], renderRecord)
													.then(
														function(results){
															sails.log.info("Hooray! The spot instance request was successfully initiated.");
															sails.log(results);

															//Ensure the status of the Render is at waiting
															//This should be updated once the spot instance request status changes
															renderRecord.status = 'waiting';
															renderRecord.requests = results; //Add the requests to Render record for later usage
															renderRecord.save(function(err){
																if(err){
																	req.flash('error', 'There was an error updating the status of the render. Contact the support team.');
																	res.redirect('/job');
																} else {
																	//Now run the job with the desired spot instance price.
																	req.flash('success', 'The spot request has been initiated. Please see the job record for the status.');
																	res.redirect('/job');
																}
															});

														},
														function(err){
															req.flash('error', err);
															return res.negotiate(err);
														}
													);


											},
											function(err){
												req.flash('error', err);
												res.serverError(err);
											}
										);
								},
								function(err){
									req.flash('error', 'There was an error creating the render record.');
									res.serverError(err);
								}
						);
					}
				);

		} else {
			return res.notFound();
		}
	},

	/**
	*
	* Terminates all of the running instances for a particulate Job and all of its Renders
	* @param id: integer - The Job record id.
	* @return void
	*
	**/
	terminate_instances: function(req, res){

		if(typeof req.param('id') === 'undefined'){
			return res.notFound();
		}

		Job.find( { id: req.param('id') })
			.populate('renders')
			.exec(
				function(err, renderRecords){
					sails.log('Found a total of ' + renderRecords.length + ' renders for this job.');

					var errors = [];
					for(var i = 0; i<renderRecords.length; i++){
						//Only terminate running instances
						if(renderRecords[i].status === 'running'){
							if(typeof renderRecords[i].instances !== 'undefined'){
								BrendaRun.terminate(renderRecords[i].instances)
									.then(
										function(results){
											sails.log(results);
										},
										function(err){
											errors.push('Unable to terminate the instances for Render ' + renderRecords[i].name + '.');
										}
									);
							}
						}
					}
					if(errors.length > 0){
						req.flash('error', 'Unable to terminate instances. You will need to log in to the instance service provider to solve the issue.');
						res.serverError(err);
					} else {
						req.flash('success', 'Instances terminated successfully.');
						res.redirect('/job');
					}
				}
			);
	},

	/**
	*
	* Stops all of the running instances for a particulate Job and all of its Renders
	* @param id: integer - The Job record id.
	* @return void
	*
	**/
	stop_instances: function(req, res){

		if(typeof req.param('id') === 'undefined'){
			return res.notFound();
		}

		Job.find( { id: req.param('id') })
			.populate('renders')
			.exec(
				function(err, renderRecords){
					sails.log('Found a total of ' + renderRecords.length + ' renders for this job.');

					var errors = [];
					for(var i = 0; i<renderRecords.length; i++){
						//Only terminate running instances
						if(renderRecords[i].status === 'running'){
							if(typeof renderRecords[i].instances !== 'undefined'){
								BrendaRun.stop(renderRecords[i].instances)
									.then(
										function(results){
											sails.log(results);
										},
										function(err){
											errors.push('Unable to stop the instances for Render ' + renderRecords[i].name + '.');
										}
									);
							}
						}
					}
					if(errors.length > 0){
						req.flash('error', 'Unable to stop instances. You will need to log in to the instance service provider to solve the issue.');
						res.serverError(err);
					} else {
						req.flash('success', 'Instances stopped successfully.');
						res.redirect('/job');
					}
				}
			);
	},

	/**
	*
	* Cancels all of the spot instance requests for a particulate Job and all of its Renders
	* @param id: integer - The Job record id.
	* @return void
	*
	**/
	cancel_instance_requests: function(req, res){

		if(typeof req.param('id') === 'undefined'){
			return res.notFound();
		}

		Job.find( { id: req.param('id') })
			.populate('renders')
			.exec(
				function(err, renderRecords){
					sails.log('Found a total of ' + renderRecords.length + ' renders for this job.');

					var errors = [];
					for(var i = 0; i<renderRecords.length; i++){
						//Only terminate running instances
						if(renderRecords[i].status === 'waiting'){
							if(typeof renderRecords[i].requests !== 'undefined'){
								BrendaRun.cancel(renderRecords[i].requests)
									.then(
										function(results){
											sails.log(results);
										},
										function(err){
											errors.push('Unable to cancel the spot instance requests for Render ' + renderRecords[i].name + '.');
										}
									);
							}
						}
					}
					if(errors.length > 0){
						req.flash('error', 'Unable to terminate spot instance requests. You will need to log in to the instance service provider to solve the issue.');
						res.serverError(err);
					} else {
						req.flash('success', 'Spot instance requests cancelled successfully.');
						res.redirect('/job');
					}
				}
			);
	},

	create_spot: function (req, res){
		sails.log(req.params);
	},

	clone: function(req, res) {
		sails.log(req.params);
		res.view('job/add_spot',{
			todo: 'Not implemented yet!'
		});
	},

	existingS3Job: function (req, res) {
		res.view('job/add_spot',{
			todo: 'Not implemented yet!'
		});
	}
};

