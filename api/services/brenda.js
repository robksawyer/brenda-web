/**
*
* BrendaService
* @description Helps to manage Brenda tasks.
* @location api/services
* @author Rob Sawyer
*
**/

var fs = require('fs'),
	path = require('path'),
	util = require('util'),
	AWS = require('aws-sdk');

module.exports = {

	brendaConfigFile: 'brenda.js',

	brendaFileComment: '/**' + sails.EOL + ' * Brenda API Configuration' + sails.EOL + ' *' + sails.EOL + ' * This file contains the main Brenda settings used in the app.' + sails.EOL + ' * This is generated/updated by filling out the /settings/index data.' + sails.EOL + ' *' + sails.EOL + ' */' + sails.EOL + sails.EOL,

	brendaFileStart: 'module.exports.brenda = {' + sails.EOL + sails.EOL + 'settings: {' + sails.EOL,

	brendaFileEnd: sails.EOL + '}' + sails.EOL + sails.EOL + '}',

	/**
	*
	* Handles processing a .blend file when it's uploaded.
	* @param req
	* @param fileStream
	* @param settings
	* @return promise
	**/
	processBlenderFile: function(req, fileStream, settings){
		sails.log("Processing Blender File...");

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			if(typeof req === 'undefined'){
				reject("Request value not found");
			}

			if(typeof settings === 'undefined'){
				reject("Settings value not found");
			}

			if(typeof fileStream === 'undefined'){
				reject("File stream value not found");
			}

			//Create the zip
			uploader.createZipAndUploadToS3(fileStream, settings.aws_s3_project_bucket).then(
				function(fileData){
					sails.log('Zip created and uploaded to Amazon S3.');

					//Create the file record to store details about the file
					uploader.createFileRecord(req.user.id, fileStream, fileData).then(
						function(fileRecord){
							sails.log('File record ' + fileRecord.id + ' created and saved.');
							//sails.log(fileRecord);

							//Create a work queue and retrieve the name to pass along to the job record.
							amazon.createSQSWorkQueue(req.user.id, req.param('name'), settings.aws_s3_render_bucket).then(
								function(queueRecord){
									sails.log('Amazon SQS work queue and Queue record created and saved.');
									//sails.log(queueRecord);

									//Finally! Create the Job Record.
									brenda.createJobRecord(req.user.id, req.params.all(), fileRecord.id, queueRecord.id)
										.then(function(jobRecord){
											sails.log('Job record with the name ' + jobRecord.name + ' created.');
											//sails.log(jobRecord);

											fullfill(jobRecord);
										},
										function(err){
											reject(err);
										});
								},
								function(err){
									sails.log.error(err);
									reject(err);
								}
							);
						},
						function(err) {
							sails.log.error(err);
							reject(err);
						}
					);
				},
				function(err){
					sails.log.error(err);
					reject(err);
				}
			);
		});
		return promise;
	},

	/**
	*
	* Handles processing a zip file that is uploaded.
	* @param req: object The request object
	* @param settings: Settings A settings record
	* @return promise
	*
	**/
	processZipFile: function(req, settings){

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			//
			//Just upload the zip to S3
			//
			req.file('project_file').upload({

				adapter: require('skipper-s3-alt'),
				fileACL: 'authenticated-read',
				key: sails.config.aws.credentials.accessKeyId,
				secret: sails.config.aws.credentials.secretAccessKey,
				bucket: settings.aws_s3_project_bucket,
				region: settings.aws_s3_region

			}, function whenDone(err, uploadedFiles){
				if(err) {
					reject(err);
				}

				//TODO: Check the uploadedFiles and then ensure that createFileRecord can handle this type of object.
				sails.log(uploadedFiles);
				//fileData = the Amazon S3 response data

				return false;

				//Create the file record to store details about the file
				uploader.createFileRecord(req.user.id, uploadedFiles, fileData).then(
					function(fileRecord){
						sails.log('File record ' + fileRecord.id + ' created and saved.');
						//sails.log(fileRecord);

						//Create a work queue and retrieve the name to pass along to the job record.
						amazon.createSQSWorkQueue(req.user.id, req.param('name'), settings.aws_s3_render_bucket).then(
							function(queueRecord){
								sails.log('Amazon SQS work queue and Queue record created and saved.');
								//sails.log(queueRecord);

								//Finally! Create the Job Record.
								brenda.createJobRecord(req.user.id, req.params.all(), fileRecord.id, queueRecord.id)
									.then(function(jobRecord){
										sails.log('Job record with the name ' + jobRecord.name + ' created.');
										//sails.log(jobRecord);

										fullfill(jobRecord);
									},
									function(err){
										reject(err);
									});
							},
							function(err){
								sails.log.error(err);
								reject(err);
							}
						);
					},
					function(err) {
						sails.log.error(err);
						reject(err);
					}
				);

			});
		});
		return promise;
	},

	/**
	*
	* Handles creating a job record
	* @param user_id: integer The logged in user
	* @param params: object
	* @param fileRecord_id: File record id
	* @param queueRecord_id: Queue record id
	* @return promise
	**/
	createJobRecord: function(user_id, params, fileRecord_id, queueRecord_id){
		sails.log('Creating Job Record...');

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			//Create and save the job to the database
			Jobs.create({
				name: params.name,
				files: [fileRecord_id],
				owner: user_id,
				animation_start_frame: params.animation_start_frame,
				animation_end_frame: params.animation_end_frame,
				animation_total_frames: params.animation_end_frame - params.animation_start_frame + 1,
				ami_id: params.ami_id,
				instance_type: params.instance_type,
				aws_ec2_region: params.aws_ec2_region,
				aws_sqs_region: params.aws_sqs_region,
				aws_ec2_instance_count: params.aws_ec2_instance_count,
				max_spend_amount: params.max_spend_amount,
				queue: queueRecord_id
			}).exec(function createJob(err, jobData){
				if(err){
					sails.log.error(err);
					reject(err);
				}
				fullfill(jobData);
			});
		});
		return promise;
	},

	/**
	*
	* Find the Brenda version by pulling the data from the setup.py file.
	*
	**/
	getBrendaVersion: function(){

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			var setupFileLocation = "";
			if ( !sails.config.brenda.settings.setupFileLocation || sails.config.brenda.settings.setupFileLocation == "" ) {
				setupFileLocation = sails.config.brenda.settings.setupFileLocation;
			} else {
				setupFileLocation = "lib/brenda/setup.py";
			}

			fs.exists(setupFileLocation, function (exists) {
				if (exists) {
					fs.readFile(setupFileLocation, {encoding: 'utf-8'}, function (err, data) {
						if (!err) {
							var match = data.match(/VERSION="([0-9].*)"/);
							if(match[1] != undefined && match[1] != ""){
								fullfill( match[1] );
							} else {
								reject( new Error("Unable to find the version in the file provided.") );
							}

						} else {
							reject( new Error(err) );
						}
					});
				} else {
					reject( new Error("Unable to find the Brenda setup file: " + setupFileLocation) );
				}
			});

		});

		return promise;
	},

	/**
	*
	* Read the settings file `/config/brenda.js`
	*
	**/
	getConfigFile: function(){
		if(!this.brendaConfigFile){
			throw new Error("Unable to find the config file.");
		}

		var configFile = this.brendaConfigFile;

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			var configFilePath = path.resolve('config', configFile);

			fs.readFile(configFilePath, {encoding: 'utf-8'}, function(err, obj){
				if(err){
					sails.log.error(err);
					reject(err);
				}
				fullfill(obj);
			});

		});

		return promise;
	},

	/**
	*
	* Retrieves and returns the settings for a user.
	*
	**/
	getUserSettings: function(req){
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			if(!req || !req.user || !req.user.id){
				reject('User id not found.');
			}
			//Retrieve the settings
			User.findOne({id: req.user.id}).populate('settings').exec(
				function findSettings(err, userRecord){
					if(err){
						sails.log.error(err);
						reject(err);
					}
					if(userRecord.settings.length > 0){
						fullfill(userRecord.settings[0]);
					} else {
						reject('Settings not found.');
					}
				});
		});
		return promise;
	},

	/**
	*
	* Creates a setting record for a user.
	* @param user_id The logged in user.
	* @return promise
	**/
	createSettingsRecord: function(user_id){

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			if(!user_id) {
				reject('You need to provide a valid user id.');
			}

			//Start with record id 1
			Settings.create({owner: user_id}).exec(function(err, created){
				if(err){
					sails.log.error(err);
					reject(err);
				}

				sails.log("Created the settings record " + created.id);

				//Get the version of Brenda that's being used.
				brenda.getBrendaVersion().then(
					function (data){
						if(data){
							created.brenda_version = data;
							created.save(function(err, updatedRecord){
								if(err){
									reject("There was an error adding the Brenda version to the settings.");
								}
								sails.log.info("Brenda version " + updatedRecord.brenda_version + " added to settings.");
								fullfill(updatedRecord);
							});

						}else{
							reject("There was an error finding the Brenda version.");
						}
					},
					function (reason){
						sails.log.error(reason);
						reject(reason);
					}
				);

			});
		});
		return promise;
	},

	/**
	* @DEPRACATED
	* Writes a new brenda config file with the values from the /settings
	*
	**/
	writeBrendaConfigFile: function(userSettingValues){
		if(!this.brendaConfigFile){
			throw new Error("Unable to find the config file.");
		}

		var configFile = this.brendaConfigFile;

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			var configFilePath = path.resolve('config', configFile);

			fs.readFile(configFilePath, {encoding: 'utf-8'}, function(err, obj){
				if(err){
					sails.log.error(err);
					reject(err);
				}

				//Existing values are in obj. Append these as needed.
				//var jsonVersion = JSON.parse(obj);
				//sails.log.info(jsonVersion.ami_id);

				/*var configData = JSON.parse(this.defaultBrendaConfigFileData);
				var newJsonFile = configData.comment;
					newJsonFile += configData.start;
					newJsonFile += userSettingValues;
					//TODO: Append the existing and new data here.
					newJsonFile += configData.end;*/

				fullfill(newJsonFile);
			});

		});

		return promise;
	}

}