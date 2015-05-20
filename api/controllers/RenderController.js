/**
 * RenderController
 *
 * @description :: Server-side logic for managing renders
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	price: function (req, res)
	{
		if (typeof localStorage === "undefined" || localStorage === null)
		{
			var LocalStorage = sails.localStorage;
			var localStorage = new LocalStorage('./brenda');
		}

		var jsonData = "";
		var localStoragePrices = localStorage.getItem('AWSPrices');
		sails.log.info(localStoragePrices);

		if(localStoragePrices)
		{

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

				//Build a JSON array of the price data
				jsonData = '{ "prices": {';
				var cleanTitle;
				var counter = 0;
				for(var i=0;i<results.length;i++){
					counter++;
					if(results[i].indexOf("Spot price data for instance") > -1){
						//Found a title
						var tTitle = results[i];
						cleanTitle = tTitle.replace(/Spot\sprice\sdata\sfor\sinstance\s/gi,'');
						cleanTitle = cleanTitle.replace(/\./gi,'_');
						if(i == results.length-1){
							jsonData += '}';
						}else if(i > 0){
							jsonData += '},';
						}
						jsonData += '"'+ cleanTitle +'": {';
					} else {
						//Found a price
						var tPriceData = results[i].split(' ');

						tPriceData[0] = tPriceData[0].replace(/-/gi,'_');
						jsonData += '"' + tPriceData[0] +'": {'; //Add the region as the node
						if(tPriceData.length > 1){
							jsonData += '"timestamp": "' + tPriceData[1] + '",';
							jsonData += '"price": "' + tPriceData[2] + '"';
						}
						if(i == results.length-1 || counter > 3){
							jsonData += '}';
							counter = 0;
						}else{
							jsonData += '},';
						}
					}
				}
				jsonData += "}}}"; //close the json block

				// no: set a new local storage
				localStorage.setItem('AWSPrices', jsonData);
				sails.log.info('Localstorage created successfully.');
				sails.log.info(jsonData);

				res.view('render/price', {
					results: JSON.parse(jsonData)
				});
			});

		}
		else
		{
			//yes: retrieve localstorage
			jsonData = localStoragePrices;
			res.view('render/price', {
				results: jsonData
			});
		}
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

