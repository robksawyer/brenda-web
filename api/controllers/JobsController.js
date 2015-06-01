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
											req.flash('success', 'Spot instance job ' + jobRecord.name + ' created successfully!');
											res.redirect('jobs/submit/' + jobRecord.id);
										},
										function(err){
											return res.negotiate(err);
										}
									);

								} else if(allowedExtensions.indexOf(extension) > -1) {

									//Process the file input
									brenda.processZipFile( req, settings ).then(
										function(fileRecord){
											res.view('jobs/add_spot',{
												error: errors,
												settings: settings,
												file: fileRecord
											});
										},
										function(err){
											req.flash('message', reason);
											return res.negotiate(err);
										}
									);

								} else {
									req.flash('message', 'Unable to find the extension of the file.');
									errors.push([{message: 'Unable to find the extension of the file.'}]);
									res.view('jobs/add_spot',{
										settings: settings,
										error: errors
									});
								}
							} else {
								req.flash('message', 'File validation failed.');
								errors.push([{message: 'File validation failed.'}]);
								res.view('jobs/add_spot',{
									settings: settings,
									error: errors
								});
							}
						} else {
							req.flash('message', 'The file could not be found or was not uploaded.');
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

	submit: function(req, res){
		if( typeof req.param('id') !== 'undefined' ){
			//Search for the job details
			Jobs.find({id: req.param('id'), owner: req.user.id}).populate('queue').exec( function(err, jobRecords){
				if(err){
					req.flash('error', err);
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

