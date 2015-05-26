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

		/*if(req){
			sails.log(req.file('inputProjectFile'));
		}*/

		sails.log( sails.config.aws.settings.s3_project_bucket );

		if (req.method == 'POST'){

			BrendaService.getAmazonS3ConfigFile().then(
				function(data){
					sails.log(data);
					sails.log(sails.config.aws.settings.s3_project_bucket);

					req.file('project_file').upload({
						adapter: require('skipper-s3'),
						key: data.aws_access_key_id,
						secret: data.aws_secret_access_key,
						bucket: sails.config.aws.settings.s3_project_bucket //Select the project bucket
					}, function (err, filesUploaded) {
						if (err) return res.negotiate(err);

						res.view('jobs/add_spot',{
							files: uploadedFiles,
							textParams: req.params.all()
						});
					});
				},
				function(reason){
					sails.log(reason);
				}
			);

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

