/**
 * RenderController
 *
 * @description :: Server-side logic for managing renders
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var moment = require("moment");

module.exports = {

	index: function (req, res){

		return res.view({
			todo: "This needs to be setup."
		});
	},

	/**
	*
	* Finds the latest spot prices from Amazon
	* @parma req
	* @param res
	* @return void
	*
	**/

	price: function (req, res)
	{

		//if(localStoragePrices)
		//{

			var options = {
				mode: 'text',
				pythonPath: '/usr/local/bin/python', /* If installed with 'brew install python' */
				//pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				//args: ['']
			};
			sails.python.run('brenda-price', options, function (err, results) {
				if (err) throw err;
				// results is an array consisting of messages collected during execution
				//sails.log('results: %j', results);

				var jsonData = brenda.getPriceJSON(results);

				//sails.log.info(jsonData);

				res.view({
					results: JSON.parse(jsonData)
				});
			});

		/*}
		else
		{
			//yes: retrieve localstorage
			jsonData = localStoragePrices;
			res.view('render/price', {
				results: jsonData
			});
		}*/
	},

	/**
	*
	* Pulls the latest status from Brenda via the brenda-work tool
	* @param req
	* @param res
	* @return void
	*
	**/
	status: function (req, res)
	{
		BrendaWork.status().then(
			function(results){
				res.view({
					results: results
				});
			},
			function(err){
				FlashService.error(req, err);
				return res.negotiate(err);
			}
		);
	},

	/**
	*
	* Pulls the latest status from Brenda via the brenda-run tool
	* @param req
	* @param res
	* @return void
	*
	**/
	"run-status": function (req, res)
	{
		BrendaRun.runStatus().then(
			function(results){
				res.view({
					results: results
				});
			},
			function(err){
				FlashService.error(req, err);
				return res.negotiate(err);
			}
		);
	},

	/**
	*
	* Handles formatting a unix time stamp to something nicer
	* @param UNIX timestamp
	* @return string
	*
	**/

	formatTime: function(unixTimestamp) {
		var dt = new Date(unixTimestamp * 1000);

		var hours = dt.getHours();
		var minutes = dt.getMinutes();
		var seconds = dt.getSeconds();

		// the above dt.get...() functions return a single digit
		// so I prepend the zero here when needed
		if (hours < 10)
			hours = '0' + hours;

		if (minutes < 10)
			minutes = '0' + minutes;

		if (seconds < 10)
			seconds = '0' + seconds;

		return hours + ":" + minutes + ":" + seconds;
	}

};

