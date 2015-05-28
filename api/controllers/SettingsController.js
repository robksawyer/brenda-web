/**
 * SettingsController
 *
 * @description :: Server-side logic for managing settings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var util = require('util');

module.exports = {

	index: function (req, res){

		//Retrieve the settings
		User.findOne({id: req.user.id}).populate('settings').exec(
			function findSettings(err, userRecord){
				if(err){
					sails.log.error(err);
					res.view('settings/index',{
							error: [{ message: err }]
						});
				}

				if(userRecord.settings.length < 1){

					//Generate a settings record
					sails.log.info('Settings have not been established. Creating a settings record for user '+ req.user.username +' ('+req.user.id+').');
					brenda.createSettingsRecord(req.user.id).then(
						function(data){
							sails.log("SettingsController then()");
							sails.log(data);
							res.view('settings/index', {
								settings: data,
								info: [{message: "Generated a settings record."}]
							});
						},
						function(reason){
							sails.log.error(reason);
							return res.serverError(err);
						});

				} else {
					//Check to see if the user has a settings record
					//

					res.view({
						//version: results,
						settings: userRecord.settings[0]
					});
				}

			}
		);

	},

	/**
	*
	* Pulls the current Brenda version from the database
	*
	**/

	getBrendaVersion: function(){
		Settings.query('SELECT settings.brenda_version FROM settings', function(err, results){
			if(err){
				return res.serverError(err);
			}
			return results;
		});
	},

	/**
	*
	* Pulls the Brenda version from the setup.py file and updates the database
	*
	**/

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

	/**
	*
	* Handles updating the User's profile settings
	*
	**/
	profile: function(req, res){

		if(req.method == 'POST'){

			User.findOne({id: req.user.id}, function(err, userRecord){
				if(err){
					return res.serverError(err);
				}

				var ignoreAttributes = ['id', 'createdAt','updatedAt'];
				var settingAttributes = Object.keys(User.attributes);
				for(var i=0; i < settingAttributes.length; i++){
					if(ignoreAttributes.indexOf( settingAttributes[i] ) === -1){
						//sails.log(settingAttributes[i]);
						if( req.param(settingAttributes[i]) != undefined || req.param(settingAttributes[i]) != "" ){
							userRecord[settingAttributes[i]] = req.param(settingAttributes[i]);
						}
					}
				}

				userRecord.save(function(err, savedRecord){
					if(err){
						return res.serverError(err);
					}
					res.redirect('settings/');
				});

			});
		}
	},

	/**
	*
	* Handles updating the Amazon settings
	*
	**/
	amazon: function(req, res){

		if(req.method == 'POST'){

			//Find the user record with settings
			User.findOne({id: req.user.id}).populate('settings').exec(function(err, userRecord){
				if(err){
					sails.log.error(err);
				}

				Settings.findOne({id: userRecord.settings[0].id}, function(err, settingRecord){
					if(err){
						return res.serverError(err);
					}

					if(!settingRecord){
						return res.notFound();
					}
					var ignoreAttributes = ['id','brenda_version','aws_s3_project_bucket','aws_s3_render_bucket','owner'];
					var settingAttributes = Object.keys(Settings.attributes);
					for(var i=0; i < settingAttributes.length; i++){
						if(ignoreAttributes.indexOf( settingAttributes[i] ) === -1){
							//sails.log(settingAttributes[i]);
							if( req.param(settingAttributes[i]) != undefined || req.param(settingAttributes[i]) != "" ){
								settingRecord[settingAttributes[i]] = req.param(settingAttributes[i]);
							}
						}
					}

					//Ensure the id and user id are the same
					settingRecord.id = userRecord.settings[0].id;
					settingRecord.owner = userRecord.id;
					settingRecord.save(function(err, savedRecord){
						if(err){
							return res.serverError(err);
						}

						res.redirect('settings/');
					});
				});

			});
		}
	},

	getUserSettings: function(req, res){
		User.findOne({id: req.user.id}).populate('settings').exec(function(err, userRecord){
			if(err){
				return res.serverError(err);
			}

			if(userRecord.settings.length < 1){
				return res.notFound();
			}
			sails.log(userRecord[0].settings);
			return res.json(200, userRecord[0].settings);
		});
	},

	/**
	*
	* Creates a bucket from Amazon S3
	* @param req (id | name | type) Needs id of setting record, name of bucket and attribute that points to db bucket type
	* @param res
	**/

	createBucket: function(req, res){
		if(typeof req.param('id') === 'undefined' ){
			return res.notFound();
		}
		if(typeof req.param('type') === 'undefined' ){
			return res.notFound();
		}

		User.findOne({id: req.user.id}).populate('settings').exec(function(err, userRecord){
			if(err){
				sails.log.error(err);
				return res.serverError(err);
			}

			if(userRecord.settings.length < 1){
				sails.log.error('The setting record for the user was not found.');
				return res.notFound(err);
			}

			Settings.findOne({ id: userRecord.settings[0].id }).exec(function(err, settingRecord) {
				if(err){
					sails.log.error(err);
					return res.serverError(err);
				}

				var model_attr = req.param('type');
				if(req.param(model_attr) == undefined || req.param(model_attr) == ""){
					sails.log.error("You must provide a bucket name before you can create a bucket.");
					return res.notFound();
				}

				brenda.createS3Bucket(
					settingRecord.id, req.param(model_attr), settingRecord.aws_s3_region, req.param('type')
				).then(
					function(data){
						sails.log.info('S3 render bucket ' + data.bucket_name + ' saved successfully!');
						settingRecord[req.param('type')] = req.param(model_attr);
						settingRecord.save( function(err, savedRecord){
							if(err) {
								sails.log.error('Unable to save the Amazon settings for ' + req.param('type') + '.');
								return res.serverError(err);
							}

							/*res.view('settings/index',{
									success: [
										{ message: "Bucket " + data.bucket_name + " created." },
										{ message: "You can find your new bucket at <a href='" + data.location + "' target='_blank'>" + data.location  + "</a>." }
									]
								});*/
							res.redirect('settings/');
							//return res.ok();
						});
					},
					function(reason){
						sails.log.error(reason);
						return res.serverError(reason);
					}
				);
			});
		});

	},

	/**
	*
	* Removes a bucket from Amazon S3
	* @param req (id | type) Needs id of setting record and attribute that points to db bucket type
	* @param res
	**/

	removeBucket: function(req, res){
		if(typeof req.param('id') === 'undefined' ){
			return res.notFound();
		}

		if(typeof req.param('type') === 'undefined' ){
			return res.notFound();
		}

		User.findOne({id: req.user.id}).populate('settings').exec(function(err, userRecord){
			if(err){
				sails.log.error(err);
				return res.serverError(err);
			}

			if(userRecord.settings.length < 1){
				sails.log.error('The setting record for the user was not found.');
				return res.notFound(err);
			}

			//Check to ensure the id exists in the database
			//TODO: Add the logged in user id here to ensure the user has permissions to this id.
			Settings.findOne({ id: userRecord.settings[0].id }).exec(function(err, found) {
				if(err){
					sails.log.error(err);
					return res.serverError(reason);
				}

				brenda.removeS3Bucket(
					found.id, found[req.param('type')], found.aws_s3_region, req.param('type')
				)
				.then(
					function(data){
						sails.log('S3 render bucket ' + data + ' removed successfully!');
						/*res.view('settings/index',{
									info: [{
										message: 'Amazon S3 bucket ' + data + ' removed successfully!'
									}]
								});*/
						res.redirect('settings/');
						//return res.ok();
					},
					function(reason){
						sails.log.error(reason);
						return res.serverError(reason);
					}
				);

			});

		});
	}
};

