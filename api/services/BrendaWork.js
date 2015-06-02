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
	* Responsible for submitting the commands that will add frames to the project queue.
	* @parma job_record_id: integer - The job record id to pull
	* @return
	*
	**/

	start: function(job_record_id){
		//
		//brenda-work -c [config file location] -T './lib/task-scripts/frame' -s [animation_start_frame] -e [animation_end_frame] push
		//
		//TODO: Figure out if I can target a specific queue. Right now it appears to just pull from a single queue.
		//
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			//Find the job via the record id
			Job.findOne({id: job_record_id}, function(err, result){
				if(err) reject(err);

				sails.log(result);

				var options = {
					mode: 'binary',
					pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
					pythonOptions: ['-u'],
					scriptPath: 'lib/brenda/',
					args: ['-c "" -T "./lib/task-scripts/frame" -s ' + result.animation_start_frame + ' -e ' + result.animation_end_frame + ' push']
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
	}

}