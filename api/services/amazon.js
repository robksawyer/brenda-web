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
	moment = require('moment'),
	changeCase = require('change-case');

module.exports = {

	awsConfigFile: 'aws.js',

	/**
	*
	* Handles making an Amazon EC2 spot instance request.
	* @url http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#requestSpotInstances-property
	* @param jobRecord: object - Job record holding the details
	* @param spotPrice: float - The max price to pay for an instance
	* @param keepAlive: string ('one-time' | 'persistent') - Keep the instances alive or shut them off after completio of the queue tasks
	* @param dry: boolean - Whether or not to make a dry run
	* @param monitoring: boolean - Describes the monitoring for the instance. (TODO: Learn more about this.)
	* @return
	**/
	requestSpotInstances: function(jobRecord, spotPrice, keepAlive, dry, monitoring){
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			//Load the credentials and build configuration
			//@url http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html
			//AWS.config.loadFromPath( path.resolve('config', 'aws.json') );
			AWS.config.update(sails.config.aws.credentials);

			if(!keepAlive || keepAlive == false) {
				keepAlive = 'one-time';
			} else if(keepAlive == true){
				keepAlive = 'persistent';
			}
			if(!monitoring) monitoring = false;
			if(!dry) dry = false;

			/*
			var params = {
				SpotPrice: 'STRING_VALUE', //required
				AvailabilityZoneGroup: 'STRING_VALUE',
				ClientToken: 'STRING_VALUE',
				DryRun: true || false,
				InstanceCount: 0,
				LaunchGroup: 'STRING_VALUE',
				LaunchSpecification: {
				AddressingType: 'STRING_VALUE',
				BlockDeviceMappings: [
				  {
					DeviceName: 'STRING_VALUE',
					Ebs: {
					  DeleteOnTermination: true || false,
					  Encrypted: true || false,
					  Iops: 0,
					  SnapshotId: 'STRING_VALUE',
					  VolumeSize: 0,
					  VolumeType: 'standard | io1 | gp2'
					},
					NoDevice: 'STRING_VALUE',
					VirtualName: 'STRING_VALUE'
				  },
				],
				EbsOptimized: true || false,
				IamInstanceProfile: {
				  Arn: 'STRING_VALUE',
				  Name: 'STRING_VALUE'
				},
				ImageId: 'STRING_VALUE',
				InstanceType: 't1.micro | m1.small | m1.medium | m1.large | m1.xlarge | m3.medium | m3.large | m3.xlarge | m3.2xlarge | m4.large | m4.xlarge | m4.2xlarge | m4.4xlarge | m4.10xlarge | t2.micro | t2.small | t2.medium | m2.xlarge | m2.2xlarge | m2.4xlarge | cr1.8xlarge | i2.xlarge | i2.2xlarge | i2.4xlarge | i2.8xlarge | hi1.4xlarge | hs1.8xlarge | c1.medium | c1.xlarge | c3.large | c3.xlarge | c3.2xlarge | c3.4xlarge | c3.8xlarge | c4.large | c4.xlarge | c4.2xlarge | c4.4xlarge | c4.8xlarge | cc1.4xlarge | cc2.8xlarge | g2.2xlarge | cg1.4xlarge | r3.large | r3.xlarge | r3.2xlarge | r3.4xlarge | r3.8xlarge | d2.xlarge | d2.2xlarge | d2.4xlarge | d2.8xlarge',
				KernelId: 'STRING_VALUE',
				KeyName: 'STRING_VALUE',
				Monitoring: {
				  Enabled: true || false //required
				},
				NetworkInterfaces: [
				  {
					AssociatePublicIpAddress: true || false,
					DeleteOnTermination: true || false,
					Description: 'STRING_VALUE',
					DeviceIndex: 0,
					Groups: [
					  'STRING_VALUE',
					],
					NetworkInterfaceId: 'STRING_VALUE',
					PrivateIpAddress: 'STRING_VALUE',
					PrivateIpAddresses: [
					  {
						PrivateIpAddress: 'STRING_VALUE', //required
						Primary: true || false
					  },
					],
					SecondaryPrivateIpAddressCount: 0,
					SubnetId: 'STRING_VALUE'
				  },
				],
				Placement: {
				  AvailabilityZone: 'STRING_VALUE',
				  GroupName: 'STRING_VALUE'
				},
				RamdiskId: 'STRING_VALUE',
				SecurityGroupIds: [
				  'STRING_VALUE',
				],
				SecurityGroups: [
				  'STRING_VALUE',
				],
				SubnetId: 'STRING_VALUE',
				UserData: 'STRING_VALUE'
				},
				Type: 'one-time | persistent',
				ValidFrom: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
				ValidUntil: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789
				};
			*/

			//
			//Make some edits before sending the request
			//
			spotPrice = spotPrice.toString(); //Amazon likes it as a string

			//This will terminate the instance after a certain period
			//var validUntil = moment().add(5, 'minutes');
			//validUntil = moment(validUntil).toDate(); //Amazon likes it as Date object, ISO-8601 string, or a UNIX timestamp

			sails.log.info("-------------------------------------");
			sails.log.info("--- SPOT INSTANCE REQUEST DETAILS ---");
			sails.log.info("AMI ID:", jobRecord.ami_id);
			sails.log.info("Max bid price", spotPrice);
			sails.log.info("Request type:", keepAlive);
			sails.log.info("Instance type:", jobRecord.instance_type);
			sails.log.info("Instance count:", jobRecord.aws_ec2_instance_count);
			sails.log.info("SSH key name:", jobRecord.ssh_key_name);
			sails.log.info("Security groups:", jobRecord.sec_groups);
			sails.log.info("-------------------------------------");

			var params = {
				SpotPrice: spotPrice, //required
				//AvailabilityZoneGroup: 'STRING_VALUE', //The user-specified name for a logical grouping of bids.
				DryRun: dry,
				InstanceCount: jobRecord.aws_ec2_instance_count,
				// LaunchGroup: 'STRING_VALUE', //The instance launch group. Launch groups are Spot Instances that launch together and terminate together. (Default: Instances are launched and terminated individually)
				LaunchSpecification: {
					// AddressingType: 'STRING_VALUE',
					// EbsOptimized: true || false,
					ImageId: jobRecord.ami_id,
					InstanceType: jobRecord.instance_type, //'t1.micro | m1.small | m1.medium | m1.large | m1.xlarge | m3.medium | m3.large | m3.xlarge | m3.2xlarge | m4.large | m4.xlarge | m4.2xlarge | m4.4xlarge | m4.10xlarge | t2.micro | t2.small | t2.medium | m2.xlarge | m2.2xlarge | m2.4xlarge | cr1.8xlarge | i2.xlarge | i2.2xlarge | i2.4xlarge | i2.8xlarge | hi1.4xlarge | hs1.8xlarge | c1.medium | c1.xlarge | c3.large | c3.xlarge | c3.2xlarge | c3.4xlarge | c3.8xlarge | c4.large | c4.xlarge | c4.2xlarge | c4.4xlarge | c4.8xlarge | cc1.4xlarge | cc2.8xlarge | g2.2xlarge | cg1.4xlarge | r3.large | r3.xlarge | r3.2xlarge | r3.4xlarge | r3.8xlarge | d2.xlarge | d2.2xlarge | d2.4xlarge | d2.8xlarge',
					Monitoring: {
						Enabled: monitoring
					},
					SecurityGroupIds: [
						jobRecord.ssh_key_name
					],
					SecurityGroups: [
						jobRecord.sec_groups
					],
					UserData: '' //The startup script that runs the SQS queue goes here
				},
				Type: keepAlive, //'one-time | persistent'
				//ValidFrom: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789, //The start date of the request. If this is a one-time request, the request becomes active at this date and time and remains active until all instances launch, the request expires, or the request is canceled.
																								 //If the request is persistent, the request becomes active at this date and time and remains active until it expires or is canceled.
				//Make the request valid for 5 minutes
				//ValidUntil: validUntil //The end date of the request. If this is a one-time request, the request remains active until all instances launch, the request is canceled, or this date is reached.
																							   //If the request is persistent, it remains active until it is canceled or this date and time is reached.
				};

			var ec2 = new AWS.EC2();
			ec2.requestSpotInstances(params, function (err, data) {
				if (err) {
					reject(err, err.stack); // an error occurred
				}
				fulfill(data); // successful response
			});

		});
		return promise;
	},

	startupScript: function(){
		//def startup_script(opts, conf, istore_dev):
		var login_dir = "/root";

		var head = "#!/bin/bash\n";
		var script = "";

		// use EC2 instance store on render farm instance?
		//var use_istore = int(conf.get('USE_ISTORE', '1' if istore_dev else '0'))

		/*if use_istore{
				# script to start brenda-node running
				# on the EC2 instance store
				iswd = conf.get('WORK_DIR', '/mnt/brenda')
				if iswd != login_dir:
					head += """\
		# run Brenda on the EC2 instance store volume
		B="%s"
		if ! [ -d "$B" ]; then
		  for f in brenda.pid log task_count task_last DONE ; do
			ln -s "$B/$f" "%s/$f"
		  done
		fi
		export BRENDA_WORK_DIR="."
		mkdir -p "$B"
		cd "$B"
		""" % (iswd, login_dir)
				else:
					head += 'cd "%s"\n' % (login_dir,)
			else:
				head += 'cd "%s"\n' % (login_dir,)

			head += "/usr/local/bin/brenda-node --daemon <<EOF\n"
			tail = "EOF\n"
			keys = [
				'AWS_ACCESS_KEY',
				'AWS_SECRET_KEY',
				'BLENDER_PROJECT',
				'WORK_QUEUE',
				'RENDER_OUTPUT'
				]
			optional_keys = [
				"S3_REGION",
				"SQS_REGION",
				"CURL_MAX_THREADS",
				"CURL_N_RETRIES",
				"CURL_DEBUG",
				"VISIBILITY_TIMEOUT",
				"VISIBILITY_TIMEOUT_REASSERT",
				"N_RETRIES",
				"ERROR_PAUSE",
				"RESET_PERIOD",
				"BLENDER_PROJECT_ALWAYS_REFETCH",
				"WORK_DIR",
				"SHUTDOWN",
				"DONE"
				] + list(aws.additional_ebs_iterator(conf))

			script = head
			for k in keys:
				v = conf.get(k)
				if not v:
					raise ValueError("config key %r must be defined" % (k,))
				script += "%s=%s\n" % (k, v)
			for k in optional_keys:
				if k == "WORK_DIR" and use_istore:
					continue
				v = conf.get(k)
				if v:
					script += "%s=%s\n" % (k, v)
			script += tail*/
		return script
	},

	/**
	*
	* Returns information about a spot instance data feed.
	* @param
	* @return promise
	**/
	spotInstanceRequestStatus: function(){
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			//Load the credentials and build configuration
			//@url http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html
			//AWS.config.loadFromPath( path.resolve('config', 'aws.json') );
			AWS.config.update(sails.config.aws.credentials);

			var params = {
			  DryRun: false
			};
			var ec2 = new AWS.EC2();
			ec2.describeSpotDatafeedSubscription(params, function(err, data) {
				if (err) {
					reject(err, err.stack); // an error occurred
				} else {
					fulfill(data); // successful response
				}
			});
		});
		return promise;
	},


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
	pushSQSQueueTasklist: function(tasklist, queueURL, dry){
		if(!dry) dry = false;

		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			var errors = [];
			for (task in tasklist){
				sails.log(tasklist[task]);
				if(typeof queueURL !== 'undefined'){
					//Send the task/message
					amazon.writeSQSQueue(tasklist[task], queueURL, dry)
						.then(
							function(results){
								//sails.log.info(results);
							},
							function(err){
								sails.log.error(err);
								errors.push(err);
								reject(err);
							}
						);
				} else {
					reject("SQS queue URL not found.");
					errors.push("SQS queue URL not found.");
				}
			}
			if(errors.length < 1){
				fulfill(tasklist);
			} else {
				reject(errors);
			}
		});
		return promise;
	},


	/**
	*
	* Handles writing messages to the Amazon SQS queue.
	* This will basically replace the need to call brenda-work push via the Python script
	* @url http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#sendMessage-property
	* @param message: string
	* @param queueURL: string - The URL to the SQS queue
	* @param dry: bool - Dry run. Don't actually send the messages to the queue.
	* @return promise
	**/
	writeSQSQueue: function(message, queueURL, dry){
		/*
		# get work queue
		q = None
		if not opts.dry_run:
			q = aws.create_sqs_queue(conf)
		*/
		if(!dry) dry = false;
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {

			//Load the credentials and build configuration
			AWS.config.update(sails.config.aws.credentials);

			var sqs = new AWS.SQS({
				region: sails.config.aws.credentials.region
			});

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
				sails.log.info(data); // successful response
				fulfill(data);
			});
		});
		return promise;
	},

	/**
	* Handles building a task list of messages for the Amazon SQS Queue
	* @param task_script: string - Full path to the task script. These are by default located in lib/task-scripts
	* @param start: integer
	* @param end: integer
	* @param step: integer (default=1)
	* @param task_size: integer (default=1)
	* @return promise
	**/
	buildTaskList: function(task_script, start, end, step, task_size){
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {

			var tasklist = [];
			if(!step) step = 1;
			if(!task_size) task_size = 1;

			fs.readFile(task_script, 'utf8',
				function (err, data) {
					if (err) {
						reject(err);
					}

					sails.log.info(data);
					var taskFileData = data;

					//sails.log.info( xrange(start, end+1, task_size) );

					xrange(start, end+1, task_size).forEach(
						function(fnum) {

							script = taskFileData;
							start = fnum;
							end = Math.min(fnum + task_size - 1, end);

							var taskFileReplacements = {
														"$FRAME": "-s " + fnum + " -e " + fnum + " -j " + step,
														"$START": fnum,
														"$END": fnum,
														"$STEP": step
													};
							for (var key in taskFileReplacements){
								if (!taskFileReplacements.hasOwnProperty(key)) {
									continue;
								}
								sails.log("Key: " + key);
								script = script.replace(key, taskFileReplacements[key]);
							};

							sails.log.info(script);

							//Handle subframe task script
							//TODO: Figure this out later.
							var subframe_iterator_defined = false;
							//if subframe_iterator_defined(opts){
							if(subframe_iterator_defined) {
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
							} else {
								tasklist.push(script)
							}
						}
					);

					sails.log.info(tasklist);
					fulfill(tasklist);
				}
			);
		});
		return promise;
	},

	/**
	*
	* Handles stopping EC2 instances.
	* @param instances: array - The instances to stop
	* @param force
	* @return promise
	**/
	stopInstances: function(instances, force){

		if(typeof force === 'undefined') force = false;

		var promise = new sails.RSVP.Promise( function(fulfill, reject) {

			//Load the credentials and build configuration
			AWS.config.update(sails.config.aws.credentials);

			var params = {
				InstanceIds: renderRecord.instances,
				DryRun: false,
				Force: force
			};
			var ec2 = new AWS.EC2();
			ec2.stopInstances(params, function(err, data) {
				if (err) {
					reject(err, err.stack); // an error occurred
				}
				fulfill(data); // successful response
			});
		});
		return promise;
	},

	/**
	*
	* Handles terminating EC2 instances.
	* @param instances: array - Instances to terminate
	* @return promise
	**/
	terminateInstances: function(instances){

		var promise = new sails.RSVP.Promise( function(fulfill, reject) {

			//Load the credentials and build configuration
			AWS.config.update(sails.config.aws.credentials);

			var params = {
				InstanceIds: renderRecord.instances,
				DryRun: false
			};
			var ec2 = new AWS.EC2();
			ec2.terminateInstances(params, function(err, data) {
				if (err) {
					reject(err, err.stack); // an error occurred
				}
				fulfill(data); // successful response
			});
		});
		return promise;
	},

	/**
	*
	* Handles cancelling EC2 spot instance requests.
	* @param requests: array - Array of spot instance request ids of which to cancel
	* @return promise
	**/
	cancelSpotInstanceRequests: function(requests){

		var promise = new sails.RSVP.Promise( function(fulfill, reject) {

			//Load the credentials and build configuration
			AWS.config.update(sails.config.aws.credentials);

			var params = {
				SpotInstanceRequestIds: requests,
				DryRun: false
			};
			var ec2 = new AWS.EC2();
			ec2.cancelSpotInstanceRequests(params, function(err, data) {
				if (err) {
					reject(err, err.stack); // an error occurred
				}
				fulfill(data); // successful response
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