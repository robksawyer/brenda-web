/**
*
* BrendaWork Service
* @description Helps to manage `brenda-work` tasks.
* @location api/services
* @author Rob Sawyer
*
**/


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
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
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
				fullfill(results);
			});
		});
		return promise;
	},

	/**
	*
	* Responsible for submitting the commands that will push tasks to SQS queue to be executed by render farm.
	*
	* @parma job_record_id: integer - The job record id to pull
	* @param user_id: integer - The logged in user to ensure they have permission to start the job
	* @return promise
	*
	**/
	start: function(job_record_id, user_id)
	{
		//
		//brenda-work -c [config file location] -T './lib/task-scripts/frame' -s [animation_start_frame] -e [animation_end_frame] push
		//
		//TODO: Figure out if I can target a specific queue. Right now it appears to just pull from a single queue.
		//
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			Jobs.find({id: job_record_id, owner: user_id}).populate('queue').exec( function(err, result){
				if(err){
					reject(err);
				}

				sails.log(result);

				var configFilePath = path.join(sails.config.brenda.jobConfigFolderName, result.config_file_name);
				var taskFilePath = path.join('lib','task-scripts','frame');
				sails.log(configFilePath);
				sails.log(taskFilePath);

				var options = {
					mode: 'binary',
					pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
					pythonOptions: ['-u'],
					scriptPath: 'lib/brenda/',
					args: ['-c "' + configFilePath + '" -T "' + taskFilePath + '" -s ' + result.animation_start_frame + ' -e ' + result.animation_end_frame + ' push']
				};

				sails.python.run('brenda-work', options, function (err, results) {
					if (err) reject(err);
					// results is an array consisting of messages collected during execution
					sails.log('results: %j', results);
					fullfill(results);
				});

			});


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
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
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
				fullfill(results);
			});
		});
		return promise;
	}

}