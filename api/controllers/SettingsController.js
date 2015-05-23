/**
 * SettingsController
 *
 * @description :: Server-side logic for managing settings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	index: function (req, res){

		var results;
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

