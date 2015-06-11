/**
 * AmazonService
 *
 * @description :: A service that helps with basic Amazon SDK tasks
 * @help        :: See SDK docs http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/
 * @location api/services
 * @author Rob Sawyer
 */

var path = require('path'),
	util = require('util'),
	fs = require('fs'),
	AWS = require('aws-sdk'),
	xrange = require('xrange'),
	changeCase = require('change-case');

module.exports = {

	awsConfigFile: 'aws.js',

	/**
	*
	* Creates a bucket on Amazon S3.
	* @param id integer The setting id to update
	* @param bucketName string A name for the bucket
	* @param region string The region to create the bucket in
	* @param type string The database attribute to update with the bucket name
	* @return RSVP.Promise
	**/
	createS3Bucket: function(id, bucketName, region, type){

		var promise = new sails.RSVP.Promise( function(fulfill, reject) {

			if(!bucketName){
				sails.log.error('You must provide a name before you can create a bucket.');
				reject({message: 'You must provide a name before you can create a bucket.'});
			}
			if(!region){
				sails.log.error('You must provide a region before you can create a bucket.');
				reject({message: 'You must provide a region before you can create a bucket.'});
			}
			var params = {
				Bucket: bucketName, /* required */
				ACL: 'authenticated-read', //'private | public-read | public-read-write | authenticated-read',
				//GrantFullControl: 'STRING_VALUE',
				//GrantRead: 'STRING_VALUE',
				//GrantReadACP: 'STRING_VALUE',
				//GrantWrite: 'STRING_VALUE',
				//GrantWriteACP: 'STRING_VALUE'
			};

			//Load the credentials and build configuration
			//@url http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html
			//AWS.config.loadFromPath( path.resolve('config', 'aws.json') );
			AWS.config.update(sails.config.aws.credentials);

			var s3 = new AWS.S3({
				region: region
			});

			s3.createBucket(params, function(err, data) {
				if (err) {
					//sails.log.error(err, err.stack); // an error occurred
					sails.log.error(err.code);
					if(err.code == "BucketAlreadyOwnedByYou"){
						//Associate the bucket with the database variable
						Settings.findOne({id: id}).exec( function(err, found){
							if(err){
								sails.log.error(err);
								reject({message: "Unable to find the settings record." });
							}
							if(!type){
								reject({message: "The attribute type was not found."});
							}

							found[type] = bucketName;
							found.save(function(err, s){
								if(err){
									sails.log.error(err);
									reject({message: "Unable to save the bucket association."});
								}
								sails.log.info('Updated settings property ' + type + ' with ' + bucketName + '.');
								fulfill({
									bucket_name: bucketName,
									location: data
								});
							});

						});
					}else {
						reject(err);
					}
				} else {
					//sails.log(data); // successful response
					fulfill({
							bucket_name: bucketName,
							location: data.Location
						});
				}
			});
		});

		return promise;
	},

	/**
	*
	* Removes a bucket on Amazon S3.
	* @param bucketName string The name of the bucket
	* @param type string (aws_s3_project_bucket | aws_s3_render_bucket)
	* @return promise
	**/
	removeS3Bucket: function(id, bucketName, region, type){

		var promise = new sails.RSVP.Promise( function(fulfill, reject) {

			if(!bucketName){
				sails.log.error('You must provide a name before you can remove a bucket.');
				reject('You must provide a name before you can remove a bucket.');
			}
			if(!region){
				if(typeof sails.config.aws.credentials.region !== 'undefined'){
					region = sails.config.aws.credentials.region;
				} else {
					sails.log.error('You must provide a AWS region.');
					reject('You must provide a AWS region.');
				}
			}

			var params = {
				Bucket: bucketName
			};

			//Load the credentials and build configuration
			AWS.config.update(sails.config.aws.credentials);

			var s3 = new AWS.S3({
				region: region
			});

			s3.deleteBucket(params, function(err, data) {
				if (err) {
					sails.log.error(err, err.stack); // an error occurred
					reject(err);
				}

				sails.log(data); // successful response

				//Delete the name in the database
				Settings.findOne({ id: id }).exec(function(err, found) {
					if(err){
						sails.log.error(err);
						reject(err);
					}
					found[type] = "";
					found.save(function(err, s){
						if(err){
							sails.log.error(err);
							reject(err);
						}
						fulfill(bucketName);
					});
				});

			});
		});

		return promise;
	},

	/**
	*
	* Creates an SQS work queue
	* @param userId: integer Current logged in user.
	* @param jobName: string Used to build the queue name
	* @param s3BucketEndpoint: string The endpoint bucket to deliver files to.
	* @param region: string The region to produce the queue in.
	* @return promise
	**/
	createSQSWorkQueue: function(userId, jobName, s3BucketEndpoint, region){
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {

			//Load the credentials and build configuration
			AWS.config.update(sails.config.aws.credentials);

			if(!jobName){
				sails.log.error('You must provide the Job name.');
				reject('You must provide the Job name.');
			} else {
				//Clean up the name and get it ready to become the queue name
				//Add dashes in place of spaces
				jobName = changeCase.paramCase(jobName);

				//Generate a random hash and append it to the name.
				var randString = tools.makeid(6);
				jobName += '-' + randString;

				//Cover to lowercase
				jobName = changeCase.lowerCase(jobName);
			}

			if(!region){
				if(typeof sails.config.aws.credentials.region !== 'undefined'){
					region = sails.config.aws.credentials.region;
				} else {
					sails.log.error('You must provide a AWS region.');
					reject('You must provide a AWS region.');
				}
			}

			if(!s3BucketEndpoint){
				sails.log.error('You must provide a AWS s3BucketEndpoint.');
				reject('You must provide a AWS s3BucketEndpoint.');
			}

			var sqs = new AWS.SQS({
				region: sails.config.aws.credentials.region,
				s3BucketEndpoint: s3BucketEndpoint
			});
			//TODO: Add the brenda permission? How can I create this if it doesn't already exist?
			/*sqs.addPermission(params, function (err, data) {
				if (err) {
					sails.log.error(err, err.stack); // an error occurred
					reject(err);
				} else {
					sails.log(data); // successful response
					fulfill(data);
				}
			});*/
			var params = {
				QueueName: jobName, /* required */
			};
			sqs.createQueue(params, function(err, data) {
				if (err) {
					sails.log.error(err, err.stack); // an error occurred
					reject(err);
				} else {
					/*
					Example response:
					{
						ResponseMetadata: {
							RequestId: '8738b6b7-17db-5fd4-900b-fb5536348ace'
						},
						QueueUrl: 'https://sqs.us-west-2.amazonaws.com/987044710008/chinchillax-qm7a0h'
					}*/

					//Create a new Queue database record
					Queue.create({
						name: jobName,
						url: data.QueueUrl,
						requestId: data.ResponseMetadata.RequestId,
						owner: userId
					}, function(err, queueRecord){
						if(err){
							reject(err);
						}
						fulfill(queueRecord);
					});
				}
			});

		});
		return promise;
	},

	/**
	*
	* Helper to remove SQS work queues
	* @parma queue_id: integer
	* @return promise
	*
	**/
	deleteSQSWorkQueue: function(queue_id){
		sails.log.info("Deleting the associated Amazon SQS work queue...");

		var promise = new sails.RSVP.Promise( function(fulfill, reject) {

			if(!queue_id) reject("You must provide a valid queue id value.");

			Queue.find({ id: queue_id })
				.exec( function(err, queue) {
					if(err) {
						reject(err);
					}

					sails.log(queue);

					if(typeof queue.url === 'undefined') {
						reject('There was an error finding the queue url.');
					}

					//Load the credentials and build configuration
					AWS.config.update(sails.config.aws.credentials);

					var params = {
						QueueUrl: queue.url /* required */
					};
					sqs.deleteQueue(params, function(err, data) {
						if (err) {
							sails.log.error(err, err.stack); // an error occurred
							reject(err);
						}

						sails.log(data); // successful response

						fulfill(data);
					});
				});
		});
		return promise;
	},

	/**
	*
	* Processes a tasklist array and pushes individual tasks to an SQS queue.
	* @param tasklist: array
	* @return promise
	**/
	pushSQSQueueTasklist: function(tasklist, queueURL){
		/*
		# push work queue to sqs
		for task in tasklist:
			print task,
			if q is not None:
				aws.write_sqs_queue(task, q)
		*/

	},


	/**
	*
	* Handles writing messages to the Amazon SQS queue.
	* This will basically replace the need to call brenda-work push via the Python script
	* @url http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#sendMessage-property
	* @param message: string
	* @param queueURL: string - The URL to the SQS queue
	* @return promise
	**/
	writeSQSQueue: function(message, queueURL){
		/*
		# get work queue
		q = None
		if not opts.dry_run:
			q = aws.create_sqs_queue(conf)

		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			var params = {
							MessageBody: message, /* required */
							QueueUrl: queueURL, /* required */
							DelaySeconds: 0
						};
			sqs.sendMessage(params, function(err, data) {
				if (err){
					sails.log.error(err, err.stack); // an error occurred
					reject(err);
				}
				sails.log(data); // successful response
				fulfill(data);
			});
		});
		return promise;
	},

	/**
	* WARNING: This doesn't work yet.
	* Handles building a task list of messages for the Amazon SQS Queue
	* @param task_script: string - Full path to the task script. These are by default located in lib/task-scripts
	* @param start: integer
	* @param end: integer
	* @param step: integer (default=1)
	* @param task_size: integer (default=1)
	* @return promise
	**/
	buildTaskList: function(task_script, start, end, step, task_size){
		/*
		* From lib/brenda/brenda/work.py def push
		# get task script
		with open(opts.task_script) as f:
			task_script = f.read()

		# build tasklist
			tasklist = []
			for fnum in xrange(opts.start, opts.end+1, opts.task_size):
				script = task_script
				start = fnum
				end = min(fnum + opts.task_size - 1, opts.end)
				step = 1
				for key, value in (
					  ("$FRAME", "-s %d -e %d -j %d" % (start, end, step)),
					  ("$START", "%d" % (start,)),
					  ("$END", "%d" % (end,)),
					  ("$STEP", "%d" % (step,))
					  ):
					script = script.replace(key, value)

				#Handle subframe task script
				if subframe_iterator_defined(opts):
					for macro_list in subframe_iterator(opts):
						sf_script = script
						for key, value in macro_list:
							sf_script = sf_script.replace(key, value)
						tasklist.append(sf_script)
				else:
					tasklist.append(script)
		*/
		/*
		Output should look something like...
		blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 1 -e 1 -j 1 -t 0 -a
		blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 2 -e 2 -j 1 -t 0 -a
		blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 3 -e 3 -j 1 -t 0 -a
		blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 4 -e 4 -j 1 -t 0 -a
		blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 5 -e 5 -j 1 -t 0 -a
		blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 6 -e 6 -j 1 -t 0 -a
		blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 7 -e 7 -j 1 -t 0 -a
		blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 8 -e 8 -j 1 -t 0 -a
		blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 9 -e 9 -j 1 -t 0 -a
		blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 10 -e 10 -j 1 -t 0 -a
		*/

		var promise = new sails.RSVP.Promise( function(fulfill, reject) {

			var tasklist = [];
			if(!step) step = 1;
			if(!task_size) task_size = 1;

			fs.readFile(task_script, 'utf8', function (err, data) {
				if (err) {
					reject(err);
				}

				sails.log.info(data);
				var taskFile = data;

				sails.log.info( xrange(start, end+1, task_size) );

				for (fnum in xrange(start, end+1, task_size) ){
					script = task_script;
					start = fnum;
					end = min(fnum + task_size - 1, end);

					for (key as value in (
											("$FRAME", "-s %d -e %d -j %d" % (start, end, step)),
											("$START", "%d" % (start,)),
											("$END", "%d" % (end,)),
											("$STEP", "%d" % (step,))
										)
					{

						sails.log("Key: " + key);
						sails.log("Value: " + value);
						script = script.replace(key, value);
						sails.log.info(script);
					}

					//Handle subframe task script
					//TODO: Figure this out later.
					var subframe_iterator_defined = false;
					//if subframe_iterator_defined(opts){
					if(subframe_iterator_defined){
						//Probably going to need to use the for ( let n of function()) here.
						//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of
						/*for macro_list in subframe_iterator(opts){
							sf_script = script;
							for key, value in macro_list{
								sf_script = sf_script.replace(key, value);
							}
							tasklist.push(sf_script);
						}*/
						reject("Subframe rendering not supported at this time.");
					}else{
						tasklist.push(script)
					}
				}

				fulfill(tasklist);
			});

		});
		return promise;
	},

	/**
	* WARNING: This doesn't work yet.
	* TODO: Convert this method to nodejs. Not sure what currently exists is going to work.
	*
	**/
	/*subframe_iterator_defined: function(opts){
		return opts.subdiv_x > 0 and opts.subdiv_y > 0;
	},*/

	/**
	* WARNING: This doesn't work yet.
	* TODO: Convert this method to nodejs. Not sure what currently exists is going to work.
	*
	**/
	/*subframe_iterator: function(opts){
		if subframe_iterator_defined(opts){
			xfrac = 1.0 / opts.subdiv_x;
			yfrac = 1.0 / opts.subdiv_y;
			for x in xrange(opts.subdiv_x){
				min_x = x * xfrac;
				max_x = (x+1) * xfrac;
				for y in xrange(opts.subdiv_y){
					min_y = y * yfrac;
					max_y = (y+1) * yfrac;
					yield (
						('$SF_MIN_X', str(min_x)),
						('$SF_MAX_X', str(max_x)),
						('$SF_MIN_Y', str(min_y)),
						('$SF_MAX_Y', str(max_y)),
						);
				}
			}
		}
	},*/

	/**
	*
	* Finds the data in the Amazon shared credential file (~/.aws/credential).
	* More details: http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html
	**/
	getAmazonS3ConfigFile: function(){

		var homedir = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;

		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			fs.readFile( path.resolve(homedir, '.aws', 'credentials'), 'utf8', function (err,data) {
				if (err) {
					return sails.log(err);
				}
				var aws_access_key_id = data.match(/aws_access_key_id\s*=\s*['"](.*)['"]/);
				if(aws_access_key_id[1] != undefined){
					aws_access_key_id = aws_access_key_id[1];
				}else{
					aws_access_key_id = undefined;
					reject( new Error("Unable to find the Amazon Access Key in the file provided. See http://amzn.to/1PIF3WB") );
				}
				var aws_secret_access_key = data.match(/aws_secret_access_key\s*=\s*['"](.*)['"]/);
				if(aws_secret_access_key[1] != undefined){
					aws_secret_access_key = aws_secret_access_key[1];
				}else{
					aws_secret_access_key = undefined;
					reject( new Error("Unable to find the Amazon Secret Key in the file provided. See http://amzn.to/1PIF3WB") );
				}

				if(aws_access_key_id != undefined && aws_secret_access_key != undefined){
					var results = {
						aws_access_key_id: aws_access_key_id,
						aws_secret_access_key: aws_secret_access_key
					};
					fulfill(results);
				}
			});
		});

		return promise;
	},

	/**
	* @DEPRECATED
	* Writes a new Amazon config file with the values from the /settings
	*
	**/
	writeAmazonConfigFile: function(userSettingValues){
		if(!this.awsConfigFile){
			throw new Error("Unable to find the config file.");
		}

		if(userSettingValues != undefined){
			var configFile = this.awsConfigFile;

			var localConfigVars = {
					comment: '/**' + sails.EOL + ' * Amazon AWS API Configuration' + sails.EOL + ' *' + sails.EOL + ' * This file contains the main Amazon settings used in the app.' + sails.EOL + ' * This is generated/updated by filling out the /settings/index data.' + sails.EOL + ' *' + sails.EOL + ' */' + sails.EOL + sails.EOL,
					start: 'module.exports.aws = {' + sails.EOL + sails.EOL + '\tsettings: {' + sails.EOL,
					end: sails.EOL + '\t}' + sails.EOL + '}'
				};

			var promise = new sails.RSVP.Promise( function(fulfill, reject) {

				var configFilePath = path.resolve('config', configFile);

				//Run through the existing variables and apply any that are different

				//Get the existing values in the file
				var configAttributes = Object.keys(Settings.attributes);
				var ignoreAttributes = ['email', 'createdAt','updatedAt','id','ec2_instance_count'];

				//sails.log.info(jsonVersion.ami_id);
				var newJsonFile = localConfigVars.comment;
					newJsonFile += localConfigVars.start;

				for(var i = 0; i < configAttributes.length; i++){
					if(ignoreAttributes.indexOf( configAttributes[i] ) === -1){
						//
						//Check the user settings (userSettingValues) against the existing ones
						//
						//newJsonFile += configAttributes[i] + ': "' + sails.config.aws.settings[configAttributes[i]] + '",' + sails.EOL;

						//Apply the user settings
						newJsonFile += '\t\t' + configAttributes[i] + ': "' + userSettingValues[configAttributes[i]] + '",' + sails.EOL;

						//newJsonFile += userSettingValues;
					}
				}

				//TODO: Append the existing and new data here.
				newJsonFile += localConfigVars.end;

				fs.writeFile(configFilePath, newJsonFile, function(err){
					if(err){
						sails.log.error(err);
						reject(err);
					} else {
						fulfill({ message: 'Amazon config file saved successfully!'});
					}
				});


			});

			return promise;
		}else{
			sails.log.error("No request parameters find.");
			return false;
		}
	}

}