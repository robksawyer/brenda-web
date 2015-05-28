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
			function(settings){

				var errors = [];

				if (req.method == 'POST'){

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

					if(errors.length < 1){
						//Check to see if a Blender file was uploaded
						if(typeof req.file('project_file') !== 'undefined'){
							//sails.log.info("==== File Found ====");
							//sails.log(req.file('project_file'));
							//sails.log.info("====================");

							var upload = req.file('project_file')._files[0].stream,
								headers = upload.headers,
								byteCount = upload.byteCount,
								filename = upload.filename,
								extension = path.extname(filename),
								validated = true,
								errorMessages = [],
								fileParams = {},
								settings = {
									allowedTypes: ['application/zip', 'application/octet-stream','application/x-gzip','multipart/x-gzip','multipart/x-zip','application/blender'],
									maxBytes: 100 * 1024 * 1024
								};

							// Check file type
							if (_.indexOf(settings.allowedTypes, headers['content-type']) === -1) {
								validated = false;
								errors.push({message: 'Wrong filetype (' + headers['content-type'] + ').'});
							}
							// Check file size
							if (byteCount > settings.maxBytes) {
								validated = false;
								errors.push({message: 'Filesize exceeded: ' + byteCount + '/' + settings.maxBytes + '.'});
							}

							// Upload the file.
							if (validated) {
								sails.log.info('File passed validation!');
								//Check to see if the file has a .blend, .gz, or .zip extension.
								//

								if(extension == '.blend'){
									//
									// Zip the file up and then send to S3
									//
									var tmpPath = sails.os.tmpdir();
									sails.log(tmpPath);
									req.file('project_file').upload({
										dirname: tmpPath //Send to the tmp directory
									}, function whenDone(err, uploadedFiles){
										if(err) return res.negotiate(err);
										/* Example output
										[ { fd: '/var/folders/95/20c5hsmx7nx2gndxgl8kgng40000gn/T/49286b83-f7ea-427e-8866-26fad3ddbd75.blend',
										    size: 5140540,
										    type: 'application/octet-stream',
										    filename: 'Chinchillax_YellowParticleMesh.blend',
										    status: 'bufferingOrWriting',
										    field: 'project_file',
										    extra: undefined
										 } ]
										 */
										sails.log(util.inspect(uploadedFiles));
										var destPath = path.join(tmpPath, uploadedFiles[0] + '.zip');
										brenda.createZip(uploadedFiles[0].fd, destPath,'Created with Brenda web app.').then(
											function(data){
												sails.log.error(data);

												res.view('jobs/add_spot',{
													error: errors,
													file: uploadedFiles[0]
												});
											},
											function(error){
												sails.log.error(error);
												if(err) return res.negotiate(error);
											}
										);
									});


								} else {
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

										sails.log(uploadedFiles);

										//TODO: Add the S3 URL path to the fileParams
										fileParams = {
											fileName: files[0].fd.split('/').pop().split('.').shift(),
											extension: files[0].fd.split('.').pop(),
											originalName: upload.filename,
											contentType: files[0].type,
											fileSize: files[0].size,
											uploadedBy: req.userID
										};

										// Create a File model.
										/*File.create(fileParams, function(err, newFile) {
											if (err) {
												return res.serverError(err);
											}
											res.view('jobs/add_spot',{
												info: [{message: files.length + ' file(s) uploaded successfully!'}],
												file: newFile
											});
										});*/

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
									res.view('jobs/add_spot',{
													error: errors,
													file: upload
												});
								}


							} else {
								res.view('jobs/add_spot',{
												error: errors,
												file: upload
											});
							}
						} else {
							errors.push({message: 'The file could not be found or uploaded.'});
							res.view('jobs/add_spot',{
												error: errors,
												file: upload
											});
						}
					}

				} //method check

				if(errors.length < 1){
					res.view('jobs/add_spot',{
						settings: settings
					});
				} else {
					res.view('jobs/add_spot',{
						settings: settings,
						errors: errors
					});
				}

			},
			function(error){
				sails.log.error(error);
				return res.notFound();
			});

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

