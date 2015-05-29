/**
 * FileController
 *
 * @description :: Server-side logic for managing files
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var path = require('path'),
	os = require('os'),
	fs = require('fs'),
	AWS = require('aws-sdk'),
	zlib = require('zlib'),
	s3Stream = require('s3-upload-stream')(new AWS.S3());

module.exports = {

	/**
	*
	* Handles validating the files uploaded
	* @param fileStream: object - File stream from the upload
	* @param allowedExtensions: array - An array of extensions to validated based on. Be sure to include the '.' e.g, .blend in the extension.
	* @param maxBytes: integer - The maximum number of bytes to allow
	* @return object
	**/

	validate: function(fileStream, allowedExtensions, maxBytes){

		if(!allowedExtensions) {
			allowedExtensions = ['.zip','.gz','.gzip'];
		}

		var upload = fileStream,
			headers = upload.headers,
			byteCount = upload.byteCount,
			filename = upload.filename,
			extension = path.extname(filename),
			validated = true,
			fileParams = {},
			settings = {
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

		if(maxBytes){
			settings.maxBytes = maxBytes;
		}

		var errors = [];

		var projectTmpFolder = path.join(process.cwd() , '.tmp', 'uploads');
		var tmpPath = os.tmpdir();

		var filenameWithoutExt = filename.replace(extension, '');
		var destPath = path.join(projectTmpFolder);
		var destPathWithFilename = path.join(projectTmpFolder, filenameWithoutExt + '.zip');
		var outputZipFilename = filenameWithoutExt + '.zip';

		sails.log('Project tmp: ' + projectTmpFolder);
		sails.log('OS tmp: ' + tmpPath);
		sails.log("Filename w/o ext: " + filenameWithoutExt);
		sails.log.info("Destination path w/Filename: " + destPathWithFilename);
		sails.log.info("Destination path: " + destPath);

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

		return errors;
	},

	/**
	*
	* Creates a zip file and uploads the file to Amazon S3
	* @param fileStream: object - The upload file stream
	* @return promise
	**/
	createZipAndUploadToS3: function(fileStream){
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			var filename = fileStream.filename,
				extension = path.extname(filename),
				filenameNoExt = filename.replace(extension, '');

			var readStream = fs.createReadStream(fileStream);
			sails.log('readStream');
			sails.log(readStream);

			var s3Stream = require('s3-upload-stream')(new AWS.S3());

			//Update the credentials with the local ones
			AWS.config.update(sails.config.aws.credentials);

			var s3UploadStream = s3Stream.upload({
							Bucket: settings.aws_s3_project_bucket,
							Key: filenameNoExt + '.zip', //filename
							ACL: "authenticated-read",
							StorageClass: "REDUCED_REDUNDANCY"
						});

			var compress = zlib.createGzip();

			// Optional configuration
			//s3UploadStream.maxPartSize(20971520); // 20 MB
			//s3UploadStream.concurrentParts(5);

			// Handle errors.
			s3UploadStream.on('error', function (error) {
				sails.log(error);
				reject(error);
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
				//Fullfill the promise
				fullfill(details);
			});

			//Kick off the process
			readStream.pipe(compress).pipe(s3UploadStream);

		});
		return promise;
	},

	/**
	 * `FileController.upload()`
	 *
	 * Upload file(s) to the server's disk.
	 */
	upload: function (req, res) {

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			// e.g.
			// 0 => infinite
			// 240000 => 4 minutes (240,000 miliseconds)
			// etc.
			//
			// Node defaults to 2 minutes.
			res.setTimeout(0);
			req.file('files[]')
			.upload({
				// You can apply a file upload limit (in bytes)
				maxBytes: 1000000,
				dirname: path.resolve('', 'files/projects')
			}, function whenDone(err, uploadedFiles) {

				var filenameContainer = uploadedFiles[0].fd.split('/')
							 filename = filenameContainer[filenameContainer.length - 1 ];
						 filelocation = '/projects/' + filename;

				sails.log(filename);
				var temp = {};
				temp.files = [{
						"name": uploadedFiles.filename,
						"size": uploadedFiles.size,
						"url": filelocation,
						"thumbnailUrl": filelocation
					}];

				sails.log(uploadedFiles);
				if (err) {
					reject(err);
				} else {
					fullfill(temp);
				}
			});
		});
		return promise;
	},

	/**
	 * `FileController.s3upload()`
	 *
	 * Upload file(s) to an S3 bucket.
	 *
	 * NOTE:
	 * If this is a really big file, you'll want to change
	 * the TCP connection timeout.  This is demonstrated as the
	 * first line of the action below.
	 */
	s3upload: function (req, res, bucket, acl) {

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			if(!acl) acl = 'public-read';

			console.log(req.file('filedata'));
			// e.g.
			// 0 => infinite
			// 240000 => 4 minutes (240,000 miliseconds)
			// etc.
			//
			// Node defaults to 2 minutes.
			res.setTimeout(0);

			var errors = [];
			if(!sails.config.aws.credentials.accessKeyId){
				errors.push({message: 'You must provide a valid AWS access key.'});
			}
			if(!sails.config.aws.credentials.secretAccessKey){
				errors.push({message: 'You must provide a valid AWS secret access key.'});
			}
			if(!settings.aws_s3_project_bucket){
				errors.push({message: 'You have not configured an AWS S3 project bucket. Do this on the <a href="/settings">settings page</a>.'});
			}
			if(errors.length > 0){
				reject(errors);
			}

			req.file('filedata').upload({
				adapter: require('skipper-s3-alt'),
				fileACL: acl,
				bucket: bucket,
				key: sails.config.aws.credentials.accessKeyId,
				secret: sails.config.aws.credentials.secretAccessKey
			}, function whenDone(err, uploadedFiles) {
				if (err) {
					reject(err);
				} else {
					fullfill(uploadedFiles);
				}
			});
		});
		return promise;
	},


	/**
	 * FileController.download()
	 *
	 * Download a file from the server's disk.
	 */
	download: function (req, res) {
		require('fs').createReadStream(req.param('path'))
		.on('error', function (err) {
			return res.serverError(err);
		})
		.pipe(res);
	}
};