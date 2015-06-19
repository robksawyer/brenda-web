/**
*
* BrendaRun Service
* @description Helps to manage `brenda-run` tasks.
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
	* Starts an EC2 Spot Instance request. The spot instance reads messages from
	* the Job's Amazon SQS queue.
	* @param jobRecord
	* @param renderRecord
	* @return promise
	*
	**/
	spot: function(jobRecord, renderRecord){
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			//brenda-run -N 4 -p 0.07 spot
			amazon.requestSpotInstances(jobRecord, renderRecord)
				.then(
					function(results){
						fulfill(results);
					},
					function(err){
						reject(err);
					}
				);
		});
		return promise;
	},

	/**
	*
	* Pulls the latest status from Brenda via the brenda-run tool
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
			sails.python.run('brenda-run', options, function (err, results) {
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
	* Requires a data feed to be created via S3. You then have to check the data feed.
	* @param
	* @return
	**/

	spotInstanceRequestStatus: function(){
		amazon.spotInstanceRequestStatus()
			.then(
				function(data){

				},
				function(err){
					reject(err);
				}
			);
	},

	/**
	*
	* Handles terminating all of the instances for a particular Render.
	* @param renderRecord: object
	* @return promise
	**/
	terminate: function(renderRecord){
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			if(typeof renderRecord.instances === 'undefined'){
				reject('Unable to find any instances for the Render.');
			}
			var params = {
				InstanceIds: renderRecord.instances,
				DryRun: false
			};
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
	* Stops all running EC2 instances (less fine-grained than "brenda-tool prune").
	* @param renderRecord: object
	* @param force: boolean - Forces the instances to stop. The instances do not have an opportunity to flush file system caches or file system metadata.
	*						  If you use this option, you must perform file system check and repair procedures.
	*						  This option is not recommended for Windows instances.
	* @return promise
	**/
	stop: function(instances, force){
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {

			if(typeof instances === 'undefined'){
				reject('Unable to find any instances for the Render.');
			}
			if(typeof force === 'undefined'){
				force = false;
			}

			amazon.stopInstances(instances, force)
				.then(
					function(results){
						fulfill(results);
					},
					function(err){
						reject(err);
					}
				);
		});
		return promise;
	},

	/**
	*
	* Handles cancelling all of the spot instance requests for a particular Render.
	* @param requests: array - Spot instance requests to cancel
	* @return promise
	**/
	cancel: function(requests){
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {

			if(typeof requests === 'undefined'){
				reject('Unable to find any spot instance requests for the Render.');
			}
			amazon.cancelSpotInstanceRequests(requests)
				.then(
					function(results){
						fulfill(results);
					},
					function(err){
						reject(err);
					}
				);
		});
		return promise;
	}

}