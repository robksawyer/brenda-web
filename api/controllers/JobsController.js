/**
 * JobsController
 *
 * @description :: Server-side logic for managing jobs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var zip = require('adm-zip')

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

					if(errors.length < 1){
						//Check to see if a Blender file was uploaded
						if(req.file('project_file')){
							//sails.log.info("==== File Found ====");
							//sails.log(req.file('project_file'));
							//sails.log.info("====================");

							var upload = req.file('project_file')._files[0].stream,
								headers = upload.headers,
								byteCount = upload.byteCount,
								validated = true,
								errorMessages = [],
								fileParams = {},
								settings = {
									allowedTypes: ['application/zip', 'application/octet-stream','application/x-gzip','multipart/x-gzip','multipart/x-zip','application/blender'],
									maxBytes: 100 * 1024 * 1024
								};

							sails.log(headers['content-type']);

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
								//Check to see if the file has a .blend, .gz, or .zip extension.
								req.file('project_file').upload({
										adapter: require('skipper-s3-alt'),
										fileACL: 'public-read',
										key: sails.config.aws.credentials.accessKeyId,
										secret: sails.config.aws.credentials.secretAccessKey,
										bucket: settings.aws_s3_project_bucket
									}, function whenDone(err, uploadedFiles){
										if(err) return res.negotiate(err);

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
							}
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
	},

	/**
	*
	* Converts a file into a zip file.
	*	More details:
	*		https://github.com/cthackers/adm-zip/wiki/ADM-ZIP-Introduction
	*
	* @param targetFile: string - Must include the file path and name e.g. /home/me/some_picture.png
	* @param destPath: string - Must include the destination file path and name e.g. /home/me/mynew.zip
	*
	**/

	createZip: function (targetFile, destPath, comment){
		if(!comment) comment = "entry comment goes here";
		if(!targetFile) sails.log.error("createZip: Target file was not provided.");
		if(!destPath) sails.log.error("createZip: Destination file and path was provided.");

		// creating archives
		var zip = new AdmZip();

		// add file directly
		//zip.addFile(filename, new Buffer("inner content of the file"), comment);

		// add local file
		zip.addLocalFile(targetFile);

		// get everything as a buffer
		var willSendthis = zip.toBuffer();

		// or write everything to disk
		var promise = new sails.RSVP.Promise(function(fullfill, reject) {

			fullfill(zip.writeZip(/*target file name*/destPath));

		});
		return promise;
	}
};

