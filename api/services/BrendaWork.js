/**
*
* BrendaWork Service
* @description Helps to manage `brenda-work` tasks.
* @location api/services
* @author Rob Sawyer
*
**/

var fs = require('fs'),
	path = require('path'),
	util = require('util'),
	changeCase = require('change-case');

module.exports = {

	/**
	*
	* Pulls the latest status from Brenda via the brenda-work tool
	* @param void
	* @return promise
	*
	**/
	status: function ()
	{
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: sails.config.brenda.settings.pythonPath,
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['status']
			};
			sails.python.run('brenda-work', options, function (err, results) {
				if (err) reject(err);
				// results is an array consisting of messages collected during execution
				sails.log('results: %j', results);
				fulfill(results);
			});
		});
		return promise;
	},

	/**
	*
	* Responsible for submitting the commands that will push tasks to SQS queue to be executed by render farm.
	* @param userId: integer - The logged in user to ensure they have permission to start the job
	* @parma jobRecord: object
	* @return promise
	*
	**/
	start: function(userId, jobRecord)
	{
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			//
			//brenda-work -c [config file location] -T './lib/task-scripts/frame' -s [animation_start_frame] -e [animation_end_frame] push
			//
			//TODO: Figure out if I can target a specific queue. Right now it appears to just pull from a single queue.
			//

			if(!userId) reject("You must provide a valid user id.");
			if(!jobRecord) reject("You must provide a valid job record id.");

			if(!jobRecord.queue) reject("The job record does not contain a queue.");

			/*if(typeof jobRecord.aws_s3_render_bucket === 'undefined'){
				var applyDefaultRenderBucket = new sails.RSVP.Promise( function(fulfill, reject) {
					//Add the default from Settings
					Setting.find({owner: req.user.id}).exec(
						function(err, settings){
							if(err){
								reject(err);
							}
							fulfill(settings[0].aws_s3_render_bucket);
						}
					);
				});
			}*/

			var step = 1; //brenda default
			var task_size = 1; //brenda default

			var taskFilePath = path.join('lib','brenda','task-scripts','frame');
			taskFilePath = path.resolve(taskFilePath);

			if(typeof taskFilePath === 'undefined'){
				reject("Unable to find the task file.");
			}
			if(typeof jobRecord.animation_start_frame === 'undefined'){
				reject("Unable to find the animation start frame.");
			}
			if(typeof jobRecord.animation_end_frame === 'undefined'){
				reject("Unable to find the animation end frame.");
			}

			sails.log(taskFilePath);

			//Build a task list and push the messages to the Amazon SQS queue
			amazon.buildTaskList(taskFilePath, jobRecord.animation_start_frame, jobRecord.animation_end_frame, step, task_size)
				.then(
					function(tasklist){
						if(tasklist){
							amazon.pushSQSQueueTasklist(tasklist, jobRecord.queue.url)
								.then(
									function(results){
										sails.log("Pushed the tasklist to the SQS queue sucessfully!");
										sails.log(results);
										//Return the render record that was created
										fulfill(results);
									},
									function(err){
										sails.log.error("Error pushing to SQS queue.");
										sails.log.error(err);
										reject(err);
									}
								);
						} else {
							sails.log.error("Error with returned tasklist.");
							reject("Error with returned tasklist.");
						}
					},
					function(err){
						sails.log.error("Error building SQS queue tasklist.");
						sails.log.error(err);
						reject(err);
					}
				);


		});

		return promise;
	},

	/**
	*
	* Responsible for clearing all of the tasks in SQS queue.
	*
	**/
	reset: function()
	{
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: sails.config.brenda.settings.pythonPath,
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['reset']
			};
			sails.python.run('brenda-work', options, function (err, results) {
				if (err) {
					sails.log.error(err);
					reject(err);
				}
				// results is an array consisting of messages collected during execution
				sails.log('results: %j', results);
				fulfill(results);
			});
		});
		return promise;
	}

}