/**
 * JobsController
 *
 * @description :: Server-side logic for managing jobs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var util = require('util'),
	path = require('path'),
	knox = require('knox'),
	MultiPartUpload = require('knox-mpu'),
	zipstream = require('zipstream');

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

							var upload = req.file('project_file')._files[0].stream,
								upload_headers = upload.headers,
								upload_byteCount = upload.byteCount,
								upload_filename = upload.filename,
								upload_extension = path.extname(filename),
								upload_validated = true,
								upload_errorMessages = [],
								upload_fileParams = {},
								upload_settings = {
									allowedTypes: ['application/zip', 'application/octet-stream','application/x-gzip','multipart/x-gzip','multipart/x-zip','application/blender'],
									maxBytes: 100 * 1024 * 1024
								};

							var allowedExtensions = ['.zip','.gz','.gzip'];

							var projectTmpFolder = path.join(process.cwd() , '.tmp', 'uploads');
							var tmpPath = sails.os.tmpdir();

							//var targetPathWithFilename = path.resolve( uploadedFiles[0].fd );
							var filenameWithoutExt = upload_filename.replace(extension, '');
							var destPathWithFilename = path.resolve( path.join(projectTmpFolder, filenameWithoutExt + '.zip') );
							var outputZipFilename = filenameWithoutExt + '.zip';
							//sails.log('Project tmp: ' + projectTmpFolder);
							//sails.log('OS tmp: ' + tmpPath);
							//sails.log("Filename w/o ext: " + filenameWithoutExt);
							//sails.log.info("Target path: " + targetPathWithFilename);
							//sails.log.info("Destination path: " + destPathWithFilename);

							// Check file type
							if (_.indexOf(upload_settings.allowedTypes, upload_headers['content-type']) === -1) {
								validated = false;
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

									//
									// Zip the file up and then send to S3
									//
									sails.log('AWS Configuration Information');
									sails.log(sails.config.aws.credentials.accessKeyId);
									sails.log(sails.config.aws.credentials.secretAccessKey);
									sails.log(settings.aws_s3_project_bucket);
									sails.log(settings.aws_s3_region);

									//Setup knox (our Amazon S3 client)
									//@url https://www.npmjs.com/package/knox
									var streamClient = knox.createClient({
										key: sails.config.aws.credentials.accessKeyId,
										secret: sails.config.aws.credentials.secretAccessKey,
										bucket: settings.aws_s3_project_bucket,
										region: settings.aws_s3_region
									});

									//Setup zipstream (Handles zipping the file as it's uploaded/streamed to S3.)
									//@url https://www.npmjs.com/package/zipstream
									var outputZipFile = fs.createWriteStream( outputZipFilename );
									sails.log(outputZipFile);
									var zip = zipstream.createZip({ level: 1 });
									sails.log(zip);

									//Listen to the stream
									zip.on('data', function(dataStream) {
										sails.log(dataStream);
										outputZipFile.write(dataStream);
									});

									//Add the original file (to be zipped)
									zip.addFile(upload, { name: filename }, function(data) {
										sails.log("zip.addFile");
										sails.log(data);

										//Let zipstream know that we're finished adding files.
										zip.finalize(function(bytes){
											sails.log("Bytes written:");
											sails.log(bytes);
										});
									});



									//Create the multipart upload client and pass along the zipstream
									var uploadClient = new MultiPartUpload({
										client: streamClient,
										objectName: outputZipFilename, // Amazon S3 object name
										stream: outputZipFile,
										partSize: 1000000 //1mb (default 5mb)
									}, function (err, body){
										if(err) {
											return res.negotiate(err);
										}
										// If successful, will return body, containing Location, Bucket, Key, ETag and size of the object
										/*
										  {
										      Location: 'http://Example-Bucket.s3.amazonaws.com/destination.txt',
										      Bucket: 'Example-Bucket',
										      Key: 'destination.txt',
										      ETag: '"3858f62230ac3c915f300c664312c11f-9"',
										      size: 7242880
										  }
										*/
										sails.log.info(body);
									});

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

										res.view('jobs/add_spot',{
													error: errors,
													file: upload
												});
									});
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

