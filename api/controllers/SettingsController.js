/**
 * SettingsController
 *
 * @description :: Server-side logic for managing settings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	index: function (req, res){

		if(req.method == "GET"){
			//Retrieve the settings
			Settings.findOne({id:1}).exec(
				function findSettings(err, found){
					if(err){
						sails.log.error(err);
					}

					if(found == undefined){
						sails.log.info('Settings have not been established. Creating a settings record.');
						var defaultSettings = {
							id: 1,
							ami_id: "",
							ec2_region: "us-west-2",
							sqs_region: "us-west-2",
							default_instance_type: "c3.2xlarge",
							aws_access_key_id: "",
							aws_secret_access_key_id: "",
							aws_s3_project_bucket: "",
							aws_s3_render_bucket: ""
						};

						Settings.create(defaultSettings).exec(function(err, created){
							if(err){
								sails.log.error(err);
							}

							sails.log("Created the settings record " + created.id);

							//Get the version of Brenda that's being used.
							brenda.getBrendaVersion().then(
								function (data){
									if(data){

										created.brenda_version = data;
										created.save(function(err, s){
											if(err){
												sails.log.error("There was an error adding the Brenda version to the settings.");
											}
											sails.log.info("Brenda version " + s.brenda_version + " added to settings.");
										});

										/*Settings.find({id: 1}, function(err, settingRecord){
											if(err){
												sails.log.error("Unable to find the setting record in order to save Brenda version.");
											}
											created.brenda_version = data;
											created.save(function(err, s){
												if(err){
													sails.log.error("There was an error adding the Brenda version to the settings.");
												}
												sails.log.info("Brenda version " + s.brenda_version + " added to settings.");
											});
										});*/

									}else{
										sails.log.error("There was an error finding the Brenda version.");
									}
								},
								function (reason){
									sails.log.error(reason);

								}
							).then(function(){
								res.view({
									//version: results,
									settings: created
								});
							});

						});
					} else {

						res.view({
							//version: results,
							settings: found
						});
					}

				}
			);
		} else {
			res.view({
				message: "Only GET requests allowed."
			});
		}
	},

	getBrendaVersion: function(){
		Settings.query('SELECT settings.brenda_version FROM settings', function(err, results){
			if(err){
				return res.serverError(err);
			}
			return results;
		});
	},

	reloadBrendaVersion: function(){
		//Get the version of Brenda that's being used.
		brenda.getBrendaVersion().then(
			function (data){
				Settings.save({brenda_version: data}, function(err, created){
					if(err){
						sails.log.error("There was an error adding the Brenda version to the settings.");
					}
					sails.log.info("Brenda version " + created.brenda_version + " added to settings.");
				});
			},
			function (reason){
				sails.log(reason);
				return reason;
			}
		);
	},

	amazon: function(req, res){

		if(req.method == 'POST'){
			Settings.findOne({id: req.param('id')}, function(err, settingRecord){
				if(err){
					sails.log.error(err);
				}

				var ignoreAttributes = ['id','brenda_version'];
				var settingAttributes = Object.keys(settingRecord);
				for(var i=0; i < settingAttributes.length; i++){
					if(ignoreAttributes.indexOf( settingAttributes[i] ) === -1){
						//sails.log(req.param(settingAttributes[i]));
						if( req.param(settingAttributes[i]) != undefined || req.param(settingAttributes[i]) != "" ){
							settingRecord[settingAttributes[i]] = req.param(settingAttributes[i]);
						}
					}
				}

				settingRecord.save(
					function(err, s){
						if(err) {
							sails.log.error('Not able to find save the Amazon settings');
						}else{
							sails.log.info("Amazon settings saved.");
						}
						return res.redirect('/settings');
					});
			});
		} else {
			return res.json({error: 'You are not permitted to update.'});
		}


	}

};

