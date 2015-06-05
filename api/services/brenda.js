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
	AWS = require('aws-sdk'),
	changeCase = require('change-case');

module.exports = {

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
	processBlenderFile: function(req, fileStream, settings)
	{
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
	processZipFile: function(req, settings)
	{

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
	createJobRecord: function(user_id, params, fileRecord_id, queueRecord_id)
	{
		sails.log('Creating Job Record...');

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			//Create and save the job to the database
			Jobs.create(
				{
					name: params.name,
					files: [fileRecord_id],
					owner: user_id,
					animation_start_frame: params.animation_start_frame,
					animation_end_frame: params.animation_end_frame,
					animation_total_frames: params.animation_end_frame - params.animation_start_frame + 1,
					ami_id: params.ami_id,
					instance_type: params.instance_type,
					aws_ec2_region: params.aws_ec2_region,
					aws_s3_render_bucket: params.aws_s3_render_bucket,
					aws_sqs_region: params.aws_sqs_region,
					aws_ec2_instance_count: params.aws_ec2_instance_count,
					max_spend_amount: params.max_spend_amount,
					queue: queueRecord_id
				}
			).exec(
				function createJob(err, jobData){
					if(err){
						sails.log.error(err);
						reject(err);
					}

					fullfill(jobData);
				}
			);
		});
		return promise;
	},


	/**
	*
	* Creates a Render record.
	* Render records handle specifics for an individual render. In the future, others beside the job owner
	* may be allowed to push a render. Or, maybe the AWS S3 render frame bucket needs to change. These
	* should also be duplicated. And will hold time and cost information for a particular run.
	* @param user_id: integer
	* @param job_record_id: integer
	* @param jobName: The name of the job. A unique render name is produced from this.
	* @param s3RenderBucket: S3 bucket that frames will be rendered to.
	* @return promise
	*
	**/
	createRenderRecord: function(user_id, jobRecord_id, jobName, s3RenderBucket)
	{
		sails.log('Creating Render Record...');

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			var renderName = "";
			var configFile = "";

			//Clean up the name and get it ready to become the queue name
			//Add dashes in place of spaces
			configFile = changeCase.snakeCase(jobName);
			renderName = changeCase.paramCase(jobName);


			//Generate a random hash and append it to the name.
			var randString = tools.makeid(6);
			configFile += '_' + randString;
			renderName += '-' + randString;

			//Cover to lowercase
			configFile = changeCase.lowerCase(configFile);
			renderName = changeCase.lowerCase(renderName);

			//Append file extension
			configFile += configFile + ".conf";

			sails.log(configFile);

			//Create and save the job to the database
			Render.create(
				{
					name: renderName,
					aws_s3_bucket: s3RenderBucket,
					configFileName: configFile,
					job: jobRecord_id
				}
			)
			.exec(
				function createRender(err, renderData){
					if(err){
						sails.log.error(err);
						reject(err);
					}
					fullfill(renderData);
				}
			);
		});
		return promise;
	},

	/**
	*
	* Find the Brenda version by pulling the data from the setup.py file.
	*
	**/
	getBrendaVersion: function()
	{

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
	getConfigFile: function()
	{
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
	getUserSettings: function(req)
	{
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
	createSettingsRecord: function(user_id)
	{

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
	*
	* Builds a JSON object of the price data.
	* @param results: array The price data
	* @retun JSON object
	*
	**/
	getPriceJSON: function(results)
	{
		//Build a JSON array of the price data
		var jsonData = '{ "prices": {';
		var cleanTitle;
		var counter = 0;
		for(var i=0;i<results.length;i++){
			counter++;
			if(results[i].indexOf("Spot price data for instance") > -1){
				//Found a title
				var tTitle = results[i];
				cleanTitleDots = tTitle.replace(/Spot\sprice\sdata\sfor\sinstance\s/gi,'');
				cleanTitle = cleanTitleDots.replace(/\./gi,'_');
				if(i == results.length-1){
					jsonData += ']';
				}else if(i > 0){
					jsonData += '],';
				}
				jsonData += '"' + cleanTitle + '": [';
			} else {
				//Found a price
				var tPriceData = results[i].split(' ');
				tPriceData[0] = tPriceData[0].replace(/-/gi,'_');
				jsonData += '{'; //Add the instance name as the node
				if(tPriceData.length > 1){
					jsonData += '"name" : "' + cleanTitleDots + '",';
					jsonData += '"region" : "' + tPriceData[0] + '",';
					jsonData += '"timestamp": "' + moment(tPriceData[1]).format("MM-DD-YYYY HH:mm Z") + '",';
					jsonData += '"price": "' + tPriceData[2] + '"';
				}
				if(i == results.length-1 || counter > 3){
					jsonData += '}';
					counter = 0;
				}else{
					jsonData += '},';
				}
			}
		}
		jsonData += "]";

		jsonData += "}}"; //close the json block

		return jsonData;
	},


	/**
	*
	* Writes a new brenda job config file with the values from the Job record.
	* @param user_id: integer - The user that owns the job
	* @param jobRecord_id: integer - The Job record id to pull config data from.
	* @param renderRecord_id: integer - The Render record id to pull config data from.
	* @param s3RenderBucket: string
	* @return promise
	*
	* INSTANCE_TYPE=m3.xlarge
	* BLENDER_PROJECT=s3://PROJECT_BUCKET/myproject.tar.gz
	* WORK_QUEUE=sqs://FRAME_BUCKET
	* RENDER_OUTPUT=s3://FRAME_BUCKET
	* DONE=shutdown
	*
	* To explain the above configuration settings in detail:
	*
	* __INSTANCE_TYPE__ describes the type of EC2 instance (i.e. virtual machine)
	* that will make up the render farm.  Different instance types offer
	* different levels of performance and cost.
 	*
	* __BLENDER_PROJECT__ is the name of our project file on S3.  It
	* can be an s3:// or file:// URL.
	*
	* __WORK_QUEUE__ is the name of an SQS queue that we will create for the
	* purpose of staging and sequencing the tasks in our render.
	*
	* __RENDER_OUTPUT__ is the name of an S3 bucket that will contain our
	* rendered frames.
	*
	* __DONE=shutdown__ tells the render farm instances that they should
	* automatically shut themselves down after the render is complete.
	*
	**/
	writeBrendaConfigFile: function(user_id, jobRecord_id, renderRecord_id, s3RenderBucket)
	{
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			if(!sails.config.jobConfigFolderName){
				reject("Unable to find the job config folder.");
			}

			//Check the owner here?
			Jobs.find({ id: job_record_id })
				.populate('queue')
				.populate('files')
				.exec(
					function(err, jobs){
						if(err) reject(err);

						//Build the config based on the job record information
						var brendaConfigFileData = "";
						brendaConfigFileData += "INSTANCE_TYPE=" + jobs[0].instance_type + sails.EOL; //m3.xlarge

						var blenderProjectFile = jobs[0].files[0];
						var blenderProjectQueue = jobs[0].queue;
						brendaConfigFileData += "BLENDER_PROJECT=" + blenderProjectFile.aws_s3_location + sails.EOL; //PROJECT_BUCKET/myproject.tar.gz
						brendaConfigFileData += "WORK_QUEUE=" + blenderProjectQueue.url + sails.EOL;
						//Right now pull this from settings. But in the future tie it to Render model.
						brendaConfigFileData += "RENDER_OUTPUT=" + "s3://" + s3RenderBucket + sails.EOL; //s3://FRAME_BUCKET
						brendaConfigFileData += "DONE=shutdown";

						//Folder that all config files live in.
						var configFile = path.resolve(sails.config.jobConfigFolderName);
						sails.log.info(configFile);

						//Create the directory if it does not exist
						if (!fs.existsSync(configFile)){
							fs.mkdirSync(configFile);
						}

						//Pull the config file name from the Render record
						Render.find({id: renderRecord_id}).exec(
							function(err, renderRecords){
								if(err) reject(err);

								var configFileName = renderRecords[0].configFileName;
								var configFilePath = path.join(configFile, configFileName);

								sails.log("Writing Brenda config file for the job.");
								sails.log("Brenda config file location:" + configFilePath);
								sails.log(brendaConfigFileData);

								fs.writeFile(configFilePath, brendaConfigFileData, { encoding: 'utf-8' }, function(err, obj) {
									if(err){
										sails.log.error(err);
										reject(err);
									}
									sails.log("Brenda config file written successfully!");
									fullfill(brendaConfigFileData);
								});
							}
						);

					}
				);
		});
		return promise;
	}

}