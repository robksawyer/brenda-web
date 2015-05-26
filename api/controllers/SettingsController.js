/**
 * SettingsController
 *
 * @description :: Server-side logic for managing settings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	index: function (req, res){
		var results;
		//Get the version of Brenda that's being used.
		BrendaService.getBrendaVersion().then(
			function (data){
				results = data;
			},
			function (reason){
				sails.log(reason);
			}
		)
		.then(function(){
			res.view({
				version: results
			});
		});

	},

	amazon: function(req, res){

		if(req.method == 'POST'){
			//Handle updating the brenda config file.
			//
			var configData = "{}";
			BrendaService.writeAmazonConfigFile(req.params.all()).then(
				function(data){
					sails.log.info(data);
					//Redirect back to the settings page.
					return res.redirect('/settings');
				},
				function(reason){
					sails.log.error(reason);
				}
			);

		} else {
			return res.json({error: 'You are not permitted to update.'});
		}


	}

};

