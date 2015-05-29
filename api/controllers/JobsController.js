/**
 * JobsController
 *
 * @description :: Server-side logic for managing jobs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var util = require('util'),
	path = require('path'),
	fs = require('fs'),
	AWS = require('aws-sdk'),
	zlib = require('zlib');

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

				sails.log(req.method);
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

							var upload = req.file('project_file')._files[0].stream,
								upload_headers = upload.headers,
								upload_byteCount = upload.byteCount,
								upload_filename = upload.filename,
								upload_extension = path.extname(upload_filename),
								upload_validated = true,
								upload_fileParams = {},
								upload_settings = {
									allowedTypes: [
										'application/zip',
										'application/octet-stream',
										'application/x-gzip',
										'multipart/x-gzip',
										'multipart/x-zip',
										'application/blender'
									],
									maxBytes: 100 * 1024 * 1024
								};

							var allowedExtensions = ['.zip','.gz','.gzip'];

							var projectTmpFolder = path.join(process.cwd() , '.tmp', 'uploads');
							var tmpPath = sails.os.tmpdir();

							//var targetPathWithFilename = path.resolve( uploadedFiles[0].fd );
							var filenameWithoutExt = upload_filename.replace(upload_extension, '');
							var destPath = path.join(projectTmpFolder);
							var destPathWithFilename = path.join(projectTmpFolder, filenameWithoutExt + '.zip');
							var outputZipFilename = filenameWithoutExt + '.zip';

							sails.log('Project tmp: ' + projectTmpFolder);
							sails.log('OS tmp: ' + tmpPath);
							sails.log("Filename w/o ext: " + filenameWithoutExt);
							//sails.log.info("Target path: " + targetPathWithFilename);
							sails.log.info("Destination path w/Filename: " + destPathWithFilename);
							sails.log.info("Destination path: " + destPath);

							// Check file type
							if (_.indexOf(upload_settings.allowedTypes, upload_headers['content-type']) === -1) {
								upload_validated = false;
								errors.push({message: 'Wrong filetype (' + upload_headers['content-type'] + ').'});
							}
							// Check file size
							if (upload_byteCount > upload_settings.maxBytes) {
								upload_validated = false;
								errors.push({message: 'Filesize exceeded: ' + upload_byteCount + '/' + upload_settings.maxBytes + '.'});
							}

							// Upload the file.
							if (upload_validated) {
								sails.log.info('File passed validation!');

								//Check to see if the file has a .blend, .gz, or .zip extension.
								//
								if(upload_extension == '.blend'){
									sails.log.info('Blender file found. Zipping the file before uploading to S3.');

									req.file('project_file').upload({
										dirname: destPath,
										//saveAs: upload_filename
									}, function whenDone(err, uploadedFiles){
										if(err) return res.negotiate(err);

										var uploadedFileLocalPath = uploadedFiles[0].fd;
										//
										// Zip the file up and then send to S3
										//
										// sails.log('AWS Configuration Information');
										// sails.log(sails.config.aws.credentials.accessKeyId);
										// sails.log(sails.config.aws.credentials.secretAccessKey);
										// sails.log(settings.aws_s3_project_bucket);
										// sails.log(settings.aws_s3_region);

										//Setup knox (our Amazon S3 client)
										//@url https://www.npmjs.com/package/knox
										/*var streamClient = knox.createClient({
											key: sails.config.aws.credentials.accessKeyId,
											secret: sails.config.aws.credentials.secretAccessKey,
											bucket: settings.aws_s3_project_bucket,
											region: settings.aws_s3_region
										});*/

										AWS.config.update(sails.config.aws.credentials);

										var readStream = fs.createReadStream(uploadedFileLocalPath);
										var s3Stream = require('s3-upload-stream')(new AWS.S3());
										var s3UploadStream = s3Stream.upload({
														Bucket: settings.aws_s3_project_bucket,
														Key: filenameWithoutExt + '.gz', //The filename
														ACL: "authenticated-read",
														StorageClass: "REDUCED_REDUNDANCY",
														//ContentType: upload_headers['content-type']
													});

										var compress = zlib.createGzip();

										// Optional configuration
										//s3UploadStream.maxPartSize(20971520); // 20 MB
										//s3UploadStream.concurrentParts(5);

										// Handle errors.
										s3UploadStream.on('error', function (error) {
											sails.log(error);
										});

										/* Handle progress. Example details object:
										   { ETag: '"f9ef956c83756a80ad62f54ae5e7d34b"',
										     PartNumber: 5,
										     receivedSize: 29671068,
										     uploadedSize: 29671068 }
										*/
										s3UploadStream.on('part', function (details) {
											sails.log(details);
										});

										/* Handle upload completion. Example details object:
										   { Location: 'https://bucketName.s3.amazonaws.com/filename.ext',
										     Bucket: 'bucketName',
										     Key: 'filename.ext',
										     ETag: '"bf2acbedf84207d696c8da7dbb205b9f-5"' }
										*/
										s3UploadStream.on('uploaded', function (details) {
											sails.log(details);
										});

										readStream.pipe(compress).pipe(s3UploadStream);

										/*var streamReq = streamClient.put(, {
											'Content-Length': headers['content-length'],
											'Content-Type': headers['content-type'],
											'x-amz-acl': 'public-read'
										});*/

										/*streamReq.on('response', function(res){
											if (200 == res.statusCode) {
												sails.log('saved to %s', req.url);
											}
										});*/

										//Create the zip
										/*brenda.createZip(res, filenameWithoutExt, targetPathWithFilename, destPathWithFilename,'Created with Brenda web app.').then(
											function(data){
												sails.log.info(data);

												res.view('jobs/add_spot',{
													error: errors,
													file: data
												});
											},
											function(error){
												sails.log.error(error);
												if(err) return res.negotiate(error);
											}
										);*/
									});

								} else if(allowedExtensions.indexOf(extension) > -1) {
									//
									//Just upload the zip to S3
									//
									/*req.file('project_file').upload({
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
										File.create(fileParams, function(err, newFile) {
											if (err) {
												return res.serverError(err);
											}
											res.view('jobs/add_spot',{
												info: [{message: files.length + ' file(s) uploaded successfully!'}],
												file: newFile
											});
										});

										Job.create({
											project_name: "Test Project",
											project_filename: "blah.gz.zip",
											work_queue: 'grootfarm-queue'
										}).exec(function createJob(err, created){
											if(err){
												sails.log.error(err);
											}
											sails.log('Created a job with the name ' + created.name);
										});

										return;
									});*/
									return res.ok();
								} else {
									errors.push([{message: 'Unable to find the extension of the file.'}]);
								}
							} else {
								errors.push([{message: 'File validation failed.'}]);
							}
						} else {
							errors.push({message: 'The file could not be found or was not uploaded.'});
						}
					}

				} //method check

				if(errors.length < 1){
					res.view('jobs/add_spot',{
						settings: settings,
						error: errors
					});
				} else {
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

