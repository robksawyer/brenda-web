/**
*
* BrendaTool Service
* @description Helps to manage `brenda-tool` tasks.
* @location api/services
* @author Rob Sawyer
*
**/


module.exports = {

	/**
	*
	* Kills running demand instances such that only N_remaining instances will be retained.
	* Brenda uses a smart algorithm to decide which instances to kill (if N_remaining > 0)
	* by selecting instances that have most recently finished a task to minimize the amount of lost work.
	*
	* Use case:
	* Suppose that you are running a render on 64 instances, the render is almost (but not quite) complete,
	* and the instances are about to begin their next billable hour of operation. 64 instances running over
	* the next hour would be overkill to finish the render job, so you want to scale back the number of
	* instances to 16.
	*
	* You'd then run:
	* BrendaTool.prune(16)
	*
	**/

	prune: function (N_remaining)
	{
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['prune ' + N_remaining]
			};
			sails.python.run('brenda-tool', options, function (err, results) {
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
	* Kills running spot instances such that only N_remaining instances will be retained.
	* Brenda uses a smart algorithm to decide which instances to kill (if N_remaining > 0)
	* by selecting instances that have most recently finished a task to minimize the amount of lost work.
	*
	* Use case:
	* Suppose that you are running a render on 64 instances, the render is almost (but not quite) complete,
	* and the instances are about to begin their next billable hour of operation. 64 instances running over
	* the next hour would be overkill to finish the render job, so you want to scale back the number of
	* instances to 16.
	*
	* You'd then run:
	* BrendaTool.pruneSpot(16)
	*
	* For spot instances, you have to terminate them instead of stopping them.
	**/

	pruneSpot: function (N_remaining)
	{
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['prune -T ' + N_remaining]
			};
			sails.python.run('brenda-tool', options, function (err, results) {
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
	* Returns performance/cost statistics
	* @param void
	* @return promise
	**/
	perf: function(){
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['perf']
			};
			sails.python.run('brenda-tool', options, function (err, results) {
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
	* Returns all instances and their uptime.
	* @param void
	* @return promise
	**/
	instances: function(){
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['instances']
			};
			sails.python.run('brenda-tool', options, function (err, results) {
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
	* Rsync file(s) to/from all instances, use "HOST" as a macro for instance hostname.
	* @param void
	* @return promise
	**/
	rsync: function(args){
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['rsync ' + args]
			};
			sails.python.run('brenda-tool', options, function (err, results) {
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
	* Run ssh command on all instances and show the output.
	* @param void
	* @return promise
	**/
	ssh: function(args){
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['ssh ' + args]
			};
			sails.python.run('brenda-tool', options, function (err, results) {
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
	* Copy Brenda configuration file to all running instances
	* brenda-tool rsync ~/.brenda.conf HOST
	**/
	copyConfigToAllIstances: function(configFilePath){
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['rsync ' + configFilePath + ' HOST']
			};
			sails.python.run('brenda-tool', options, function (err, results) {
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
	* View the tail of the log file on each instance
	* brenda-tool ssh tail log
	**/
	getTailLogForEachInstance: function(){
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['ssh tail log']
			};
			sails.python.run('brenda-tool', options, function (err, results) {
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
	* Run the 'uptime' command on each instance to view CPU utilization
	* brenda-tool ssh uptime
	**/
	getUptime: function(){
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['ssh uptime']
			};
			sails.python.run('brenda-tool', options, function (err, results) {
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
	* Enumerate active EC2 instances
	* brenda-tool instances
	**/
	getInstances: function(){
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['instances']
			};
			sails.python.run('brenda-tool', options, function (err, results) {
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
	* Stop the brenda-node script on all instances, but don't shut down the instances.
	* brenda-tool ssh 'kill $(cat brenda.pid)'
	**/
	stopBrendaScripts: function(){
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['instances']
			};
			sails.python.run('brenda-tool', options, function (err, results) {
				if (err) reject(err);
				// results is an array consisting of messages collected during execution
				sails.log('results: %j', results);
				fullfill(results);
			});
		});
		return promise;
	},

}