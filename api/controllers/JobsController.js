/**
 * JobsController
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

		Jobs.find({owner: req.user.id }).populate('queue').exec(
			function(err, results){
				if(err){
					return res.negotiate(err);
				}

				sails.log(results);

				res.view('jobs/index',{
					jobs: results
				});
			}
		);

	},

	/**
	*
	* Responsible for destroying a job along with associated files, queue and renders.
	*
	**/
	destroy: function(req, res){
		//Check to see if the job is active via the Job.status.
		//If active:
		//	Kill the job and destroy any running instances
		//If not:
		//	Just remove the job record along with associated file records.
		Jobs.update({ id: req.param('id'), owner: req.user.id }, { deleted: true }).exec(
			function (err, job) {
				if (err) {
					FlashService.error(req, 'You are not allowed to perform this action.');
					return res.negotiate(err);
				}

				var promises = [];

				sails.log('files:');
				sails.log(job[0].files);

				if(typeof job[0].files !== 'undefined'){
					//Delete associations
					var deleteFiles = new sails.RSVP.Promise( function(fullfill, reject) {
						File.update({ id: job[0].files }, { deleted: true }).exec(
							function(err, file){
								if(err){
									reject(err);
								}

								fullfill(file);
							}
						);
					});
					promises.push(deleteFiles);
				}

				sails.log('queue:');
				sails.log(job[0].queue);

				if(typeof job[0].queue !== 'undefined'){
					var deleteQueue = new sails.RSVP.Promise( function(fullfill, reject) {
						Queue.update({ id: job[0].queue }, { deleted: true }).exec(
							function(err, queue){
								if(err){
									reject(err);
								}

								fullfill(queue);
							}
						);
					});
					promises.push(deleteQueue);
				}

				if(promises.length > 0){

					//Run the promise queue
					sails.RSVP.allSettled(promises).then(
						function(array){
							var errors = [];
							for(var i=0;i<array.length;i++){
								if(array[i].state == 'rejected'){
									errors.push(array[i].reason);
									FlashService.error(req, array[i].reason);
								}
							}
							if(errors.length > 0){
								FlashService.error(req, '<br><br>Please file a bug report at <a href="https://github.com/robksawyer/brenda-web/issues/new?labels=bug">github.com/robksawyer/brenda-web/issues/new?labels=bug</a>.');
							} else {
								FlashService.success(req, 'Job ' + job[0].name + ' destroyed successfully!');
							}
						},
						function(err){
							FlashService.error(req, 'There was an server error.<br>Please file a bug report at <a href="https://github.com/robksawyer/brenda-web/issues/new?labels=bug">github.com/robksawyer/brenda-web/issues/new?labels=bug</a>.');
							return res.negotiate(err);
						}
					);

				} else {
					FlashService.success(req, 'Job ' + job[0].name + ' destroyed successfully!');
				}

				return res.redirect('/jobs');
			}
		);
	},

	/**
	*
	* Handles adding a job to the Amazon SQS Queuing service.
	*
	**/

	add_spot: function (req, res){

		//Pull the user's settings from the database
		brenda.getUserSettings(req).then( function(settings) {

			sails.log(req.params.all());

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
										FlashService.success(req, 'Spot instance job ' + jobRecord.name + ' created successfully!');
										res.redirect('jobs/submit/' + jobRecord.id);
									},
									function(err){
										if(typeof err.code !== 'undefined'){

											switch(err.code){

												case "UnknownEndpoint":
													FlashService.error(req, err.message);
													res.view('jobs/add_spot',{
														settings: settings,
														messages: {error: [err.message]}
													});
													break;

												default:
													FlashService.error(req, err);
													return res.negotiate(err);
													break;
											}

										} else {
											FlashService.error(req, err);
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
										res.redirect('jobs/submit/' + jobRecord.id);
									},
									function(err){
										FlashService.error(req, err);
										return res.negotiate(err);
									}
								);

							} else {
								FlashService.error(req, 'Unable to find the extension of the file.');
								res.view('jobs/add_spot',{
									settings: settings
								});
							}
						} else {
							FlashService.error(req, 'File validation failed.');
							res.view('jobs/add_spot',{
								settings: settings
							});
						}
					} else {
						FlashService.error(req, 'The file could not be found or was not uploaded.');
						res.view('jobs/add_spot',{
							settings: settings
						});
					}
				} else {
					res.view('jobs/add_spot',{
						settings: settings
					});
				}
			} else {
				//Other requests
				res.view('jobs/add_spot',{
					settings: settings,
					error: errors
				});

			}

		},
		function(err){
			sails.log.error(err);
			FlashService.error(req, err);
			return res.notFound();
		});

	},

	submit: function(req, res){
		if( typeof req.param('id') !== 'undefined' ){
			//Search for the job details
			Jobs.find({id: req.param('id'), owner: req.user.id}).populate('queue').exec( function(err, jobRecords){
				if(err){
					FlashService.error(req, err);
					res.serverError(err);
				}

				sails.log(jobRecords);

				res.view('jobs/submit', {
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

	start: function(req, res){

		if( typeof req.param('type') === 'undefined'){
			FlashService.error(req, 'You must provide a valid job type e.g. spot.');
			res.notFound();
		}

		if( typeof req.param('id') !== 'undefined' ){

			//Kick off the brenda work job
			BrendaWork.start( req.param('id'), req.user.id ).then(
				function(){
					//Pass the user to the job overview page.
					//This will allow them to see the status of the spot instance request.
					//Spot instance status should show up in the job block
					//It might be more helpful to send them to a job status page. TBD on that.
					FlashService.success(req, 'The spot request has been initiated. Please see the job record for the status.');
					res.redirect('/jobs');
				},
				function(err){
					FlashService.error(req, err);
					res.serverError(err);
				}
			);

		} else {
			return res.notFound();
		}
	},

	create_spot: function (req, res){
		sails.log(req.params);
	},

	clone: function(req, res) {
		sails.log(req.params);
		res.view('jobs/add_spot',{
			todo: 'Not implemented yet!'
		});
	},

	existingS3Job: function (req, res) {
		res.view('jobs/add_spot',{
			todo: 'Not implemented yet!'
		});
	}
};

