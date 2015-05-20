/**
 * RenderController
 *
 * @description :: Server-side logic for managing renders
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	price: function (req, res)
	{
		var options = {
			mode: 'binary',
			pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
			pythonOptions: ['-u'],
			scriptPath: 'lib/brenda/',
			args: ['']
		};
		sails.python.run('brenda-price', options, function (err, results) {
			if (err) throw err;
			// results is an array consisting of messages collected during execution
			sails.log('results: %j', results);
			res.view({
				results: results
			});
		});
	},

	status: function (req, res)
	{
		var options = {
			mode: 'binary',
			pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
			pythonOptions: ['-u'],
			scriptPath: 'lib/brenda/',
			args: ['status']
		};
		sails.python.run('brenda-work', options, function (err, results) {
			if (err) throw err;
			// results is an array consisting of messages collected during execution
			sails.log('results: %j', results);
			res.view({
				results: results
			});
		});
	}
};

