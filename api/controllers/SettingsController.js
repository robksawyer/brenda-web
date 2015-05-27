/**
 * SettingsController
 *
 * @description :: Server-side logic for managing settings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	index: function (req, res){

		//Retrieve the settings
		Settings.findOne({id:1}).exec(
			function findSettings(err, found){
				if(err){
					sails.log.error(err);
					res.view('settings/index',{
							error: [{ message: err }]
						});
				}

				if(!found){

					//Generate a settings record
					sails.log.info('Settings have not been established. Creating a settings record.');
					brenda.createSettingsRecord(1).then(
						function(data){
							res.view('settings/index', {
								settings: data,
								info: [{message: "Generated a settings record."}]
							});
						},
						function(reason){
							res.view('settings/index', {
								settings: undefined,
								error: [{message: reason}]
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

			User.findOne({id: req.param('id')}, function(err, userRecord){
				if(err){
					return res.serverError(err);
				}

				if(!userRecord){

					//Generate a new user
					User.create(req.params.all()).exec(function createUser(err, created){
						if(err){
							return res.serverError(err);
						}
						sails.log.info(savedRecord);
						res.redirect('settings/');
					});

				}else {

					var ignoreAttributes = [];
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
						sails.log.info(savedRecord);
						res.redirect('settings/');
					});

				}

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
			Settings.findOne({id: req.param('id')}, function(err, settingRecord){
				if(err){
					return res.serverError(err);
				}

				if(!settingRecord){
					return res.notFound();
				}
				var ignoreAttributes = ['id','brenda_version','aws_s3_project_bucket','aws_s3_render_bucket'];
				var settingAttributes = Object.keys(Settings.attributes);
				for(var i=0; i < settingAttributes.length; i++){
					if(ignoreAttributes.indexOf( settingAttributes[i] ) === -1){
						//sails.log(settingAttributes[i]);
						if( req.param(settingAttributes[i]) != undefined || req.param(settingAttributes[i]) != "" ){
							settingRecord[settingAttributes[i]] = req.param(settingAttributes[i]);
						}
					}
				}

				settingRecord.save(function(err, savedRecord){
					if(err){
						return res.serverError(err);
					}

					res.redirect('settings/');
				});
			});
		}
	},

	getSettings: function(req, res){
		Settings.findOne({id: req.param('id')}, function(err, settingRecord){
			if(err){
				return res.serverError(err);
			}

			if(!settingRecord){
				return res.notFound();
			}
			sails.log(settingRecord);
			return res.json(200, settingRecord);
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

		Settings.findOne({ id: req.param('id') }).exec(function(err, found) {
			if(err){
				sails.log.error(err);
				return res.serverError(err);
			}

			var model_attr = req.param('type');
			sails.log.info(req.param(req.param('type')));
			sails.log.info(req.param(model_attr));

			if(req.param(model_attr) == undefined || req.param(model_attr) == ""){
				sails.log.error("You must provide a bucket name before you can create a bucket.");
				return res.notFound();
			}

			brenda.createS3Bucket(
				req.param('id'), req.param(model_attr), found.aws_s3_region, req.param('type')
			).then(
				function(data){
					sails.log.info('S3 render bucket ' + data.bucket_name + ' saved successfully!');
					found[req.param('type')] = req.param(model_attr);
					found.save( function(err, s){
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

		//Check to ensure the id exists in the database
		//TODO: Add the logged in user id here to ensure the user has permissions to this id.
		Settings.findOne({ id: req.param('id') }).exec(function(err, found) {
			if(err){
				sails.log.error(err);
				return res.serverError(reason);
			}

			brenda.removeS3Bucket(
				req.param('id'), found[req.param('type')], found.aws_s3_region, req.param('type')
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
	}
};

