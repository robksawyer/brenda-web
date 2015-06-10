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
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
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
	*
	* @parma jobRecord_id: integer - The job record id to pull
	* @param user_id: integer - The logged in user to ensure they have permission to start the job
	* @return promise
	*
	**/
	start: function(user_id, jobRecord_id)
	{
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			//
			//brenda-work -c [config file location] -T './lib/task-scripts/frame' -s [animation_start_frame] -e [animation_end_frame] push
			//
			//TODO: Figure out if I can target a specific queue. Right now it appears to just pull from a single queue.
			//

			if(!user_id) reject("You must provide a valid user id.");
			if(!jobRecord_id) reject("You must provide a valid job record id.");

			Jobs.find({id: jobRecord_id, owner: user_id})
				.populate('queue')
				.exec(
					function(err, jobs){
						if(err){
							reject(err);
						}

						/*if(typeof jobs[0].aws_s3_render_bucket === 'undefined'){
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

						//Create a Render record.
						brenda.createRenderRecord( user_id, jobs[0].id, jobs[0].name, jobs[0].aws_s3_render_bucket )
							.then(
								function(renderRecord){

									//Build a unique config file for the render
									brenda.writeBrendaConfigFile( user_id, jobs[0].id, renderRecord.id, jobs[0].aws_s3_render_bucket )
										.then(
											function(configFilePath){

												var taskFilePath = path.join('lib','brenda','task-scripts','frame');
												taskFilePath = path.resolve(taskFilePath);

												sails.log(configFilePath);
												sails.log(taskFilePath);
												sails.log(jobs[0]);

												if(typeof taskFilePath === 'undefined'){
													reject("Unable to find the task file.");
												}
												if(typeof configFilePath === 'undefined'){
													reject("Unable to find the Brenda config file.");
												}
												if(typeof jobs[0].animation_start_frame === 'undefined'){
													reject("Unable to find the animation start frame.");
												}
												if(typeof jobs[0].animation_end_frame === 'undefined'){
													reject("Unable to find the animation end frame.");
												}

												var arguments = [
													'-c', configFilePath,
													'-T', taskFilePath,
													'-s', jobs[0].animation_start_frame,
													'-e', jobs[0].animation_end_frame,
													'push'
												];
												sails.log('Running `brenda-work` with arguments: ');
												sails.log(arguments);

												var options = {
													mode: 'binary',
													pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
													pythonOptions: ['-u'],
													scriptPath: 'lib/brenda/',
													args: arguments
												};
												sails.python.run('brenda-work', options,
													function (err, results) {
														if (err) {
															sails.log.error(err);
															reject(err);
														}
														// results is an array consisting of messages collected during execution
														sails.log('results: %j', results);
														fulfill(results);
													}
												);
											},
											function(err){
												reject(err)
											}
										);

								},
								function(err){
									reject(err);
								}
							);
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
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['reset']
			};
			sails.python.run('brenda-work', options, function (err, results) {
				if (err) reject(err);
				// results is an array consisting of messages collected during execution
				sails.log('results: %j', results);
				fulfill(results);
			});
		});
		return promise;
	}

}