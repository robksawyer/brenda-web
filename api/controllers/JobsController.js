/**
 * JobsController
 *
 * @description :: Server-side logic for managing jobs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var util = require('util'),
	path = require('path');

module.exports = {

	index: function (req, res){

		return res.view({
			todo: "This needs to be setup."
		});
	},

	/**
	*
	* Handles adding a job to the Amazon SQS Queuing service.
	*
	**/

	add_spot: function (req, res){

		//Pull the user's settings from the database
		brenda.getUserSettings(req).then(
			function(settings) {

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
								allowedExtensions = ['.zip','.gz','.gzip'];

							errors = uploader.validate(fileStream);

							// Upload the file.
							if (errors.length < 1) {
								sails.log.info('File passed validation!');

								//Check to see if the file has a .blend, .gz, or .zip extension.
								//
								if(extension == '.blend'){
									sails.log.info('Blender file found. Zipping the file before uploading to S3.');

									//Create the zip
									uploader.createZipAndUploadToS3(fileStream, settings.aws_s3_project_bucket).then(
										function(fileData){
											sails.log('Promised fullfilled.');
											sails.log.info(fileData);

											//Create the file record to store details about the file
											uploader.createFileRecord(req.user.id, fileStream, fileData).then(
												function(fileRecord){
													sails.log('File record saved.');
													sails.log(fileRecord.id);

													//Create a work queue and retrieve the name to pass along to the job record.
													amazon.createSQSWorkQueue(req.user.id, req.param('name'), settings.aws_s3_render_bucket).then(
														function(queueRecord){
															sails.log('Amazon SQS work queue created!');
															sails.log(queue);

															//Create and save the job to the database
															Jobs.create({
																name: req.param('name'),
																files: [fileRecord.id],
																owner: req.user.id,
																animation_start_frame: req.param('animation_start_frame'),
																animation_end_frame: req.param('animation_end_frame'),
																ami_id: req.param('ami_id'),
																instance_type: req.param('instance_type'),
																aws_ec2_region: req.param('aws_ec2_region'),
																aws_sqs_region: req.param('aws_sqs_region'),
																aws_ec2_instance_count: req.param('aws_ec2_instance_count'),
																max_spend_amount: req.param('max_spend_amount'),
																queue: queueRecord.id
															}).exec(function createJob(err, jobData){
																if(err){
																	sails.log.error(err);
																	return res.negotiate(err);
																}
																sails.log('Created a job with the name ' + jobData.name);
																res.view('jobs/add_spot',{
																	error: errors,
																	success: [{message: 'Created a job with the name ' + jobData.name }],
																	settings: settings,
																	job: jobData,
																	file: fileData
																});
															});
														},
														function(err){

														});

												},
												function(err) {
													sails.log.error(err);
													return res.negotiate(err);
												}
											);
										},
										function(err){
											sails.log.error(err);
											return res.negotiate(err);
										});

								} else if(allowedExtensions.indexOf(extension) > -1) {
									//
									//Just upload the zip to S3
									//
									req.file('project_file').upload({
										adapter: require('skipper-s3-alt'),
										fileACL: 'public-read',
										key: sails.config.aws.credentials.accessKeyId,
										secret: sails.config.aws.credentials.secretAccessKey,
										bucket: settings.aws_s3_project_bucket,
										region: settings.aws_s3_region
									}, function whenDone(err, uploadedFiles){
										if(err) return res.negotiate(err);

										uploader.createFileRecord(uploadedFiles, settings.aws_s3_project_bucket).then(
											function(fileRecord){
												res.view('jobs/add_spot',{
													error: errors,
													settings: settings,
													file: fileRecord
												});
											}, function(reason){
												return res.negotiate(reason);
											});

										/*Job.create({
											project_name: "Test Project",
											project_filename: "blah.gz.zip",
											work_queue: 'grootfarm-queue'
										}).exec(function createJob(err, created){
											if(err){
												sails.log.error(err);
											}
											sails.log('Created a job with the name ' + created.name);
										});*/

									});

								} else {
									errors.push([{message: 'Unable to find the extension of the file.'}]);
									res.view('jobs/add_spot',{
										settings: settings,
										error: errors
									});
								}
							} else {
								errors.push([{message: 'File validation failed.'}]);
								res.view('jobs/add_spot',{
									settings: settings,
									error: errors
								});
							}
						} else {
							errors.push({message: 'The file could not be found or was not uploaded.'});
							res.view('jobs/add_spot',{
								settings: settings,
								error: errors
							});
						}
					} else {

						res.view('jobs/add_spot',{
							settings: settings,
							error: errors
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
			function(error){
				sails.log.error(error);
				return res.notFound();
			});

	},

	created: function(req, res){

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

