/**
*
* BrendaRun Service
* @description Helps to manage `brenda-run` tasks.
* @location api/services
* @author Rob Sawyer
*
**/


module.exports = {

	/**
	*
	* Pulls the latest status from Brenda via the brenda-run tool
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
			sails.python.run('brenda-run', options, function (err, results) {
				if (err) reject(err);
				// results is an array consisting of messages collected during execution
				sails.log('results: %j', results);
				fullfill(results);
			});
		});
		return promise;
	}

}