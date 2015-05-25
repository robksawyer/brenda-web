/**
 * SettingsController
 *
 * @description :: Server-side logic for managing settings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	index: function (req, res){

		sails.log(req.params);

		var results;
		//Get the version of Brenda that's being used.
		BrendaService.getBrendaVersion().then(
			function (data){
				results = data;
			},
			function (reason){
				sails.log(reason);
			}
		).then(function(){

			res.view({
				version: results
			});

		});

	}

};

