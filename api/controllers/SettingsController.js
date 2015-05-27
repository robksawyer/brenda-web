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

				if(found == undefined){
					sails.log.info('Settings have not been established. Creating a settings record.');

					Settings.create({id: 1}).exec(function(err, created){
						if(err){
							sails.log.error(err);
							res.view('settings/index',{
								error: [{message: err}]
							});
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

								}else{
									sails.log.error("There was an error finding the Brenda version.");
								}
							},
							function (reason){
								sails.log.error(reason);
								res.view('settings/index',{
									error: [{message: reason}]
								});
							}
						)
						//Debating about keeping this or just having the user add these to the aws file.
						/*.then(function(){
							brenda.getAmazonS3ConfigFile().then(
								function(data){
									if(data.aws_access_key_id != undefined){
										created.aws_access_key_id = data.aws_access_key_id;
									}
									if(data.aws_secret_access_key != undefined){
										created.aws_secret_access_key = data.aws_secret_access_key;
									}

									created.save(function(err, s){
										if(err){
											sails.log.error("There was an error adding the AWS keys to the settings.");
										}
										sails.log.info("Had success saving AWS keys from ~/.aws/credentials to the settings.");
									});
								},
								function(reason){
									sails.log.error(reason);
								}
							);
						})*/
						.then(function(){
							res.view('settings/index', {
								//version: results,
								settings: created,
								info: [{message: "Generated a settings record."}]
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
					return res.serverError(err);
				}

				if(!settingRecord){
					return res.notFound();
				}
				var ignoreAttributes = ['id','brenda_version','aws_s3_project_bucket','aws_s3_render_bucket'];
				var buildS3ProjectBucket = false;
				var buildS3RenderBucket = false;
				var settingAttributes = Object.keys(settingRecord);
				for(var i=0; i < settingAttributes.length; i++){
					if(ignoreAttributes.indexOf( settingAttributes[i] ) === -1){
						//sails.log(req.param(settingAttributes[i]));
						if( req.param(settingAttributes[i]) != undefined || req.param(settingAttributes[i]) != "" ){
							settingRecord[settingAttributes[i]] = req.param(settingAttributes[i]);
						}
					}
				}

				settingRecord.save(function(err, savedRecord){
					if(err){
						return res.serverError(err);
					}
					return res.ok();
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
			res.view('settings/index',{
								error: [{
									message: 'You must provide a setting record id.'
								}]
							});
		}
		if(typeof req.param('type') === 'undefined' ){
			res.view('settings/index',{
								error: [{
									message: 'You must provide a setting model type attribute.'
								}]
							});
		}

		Settings.findOne({ id: req.param('id') }).exec(function(err, found) {
			if(err){
				sails.log.error(err);
				res.view('settings/index',{
								error: [{
									message: err
								}]
							});
			}

			var model_attr = req.param('type');
			sails.log.info(req.param(req.param('type')));
			sails.log.info(req.param(model_attr));

			if(req.param(model_attr) == undefined || req.param(model_attr) == ""){
				sails.log.error("You must provide a bucket name before you can create a bucket.");
				res.view('settings/index',{
								error: [{
									message: "You must provide a bucket name before you can create a bucket."
								}]
							});
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
							res.view('settings/index',{
								error: [{
									message: 'Unable to save the Amazon settings for ' + req.param('type') + '.'
								}]
							});
						}

						res.view('settings/index',{
								success: [
									{ message: "Bucket " + data.bucket_name + " created." },
									{ message: "You can find your new bucket at <a href='" + data.location + "' target='_blank'>" + data.location  + "</a>." }
								]
							});
					});
				},
				function(reason){
					sails.log.error(reason);
					res.view('settings/index',{
								error: [{
									message: reason
								}]
							});
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
			res.view('settings/index',{
								error: [{
									message: 'You must provide a setting record id.'
								}]
							});
		}

		if(typeof req.param('type') === 'undefined' ){
			res.view('settings/index',{
								error: [{
									message: 'You must provide a setting model type attribute.'
								}]
							});
		}

		//Check to ensure the id exists in the database
		//TODO: Add the logged in user id here to ensure the user has permissions to this id.
		Settings.findOne({ id: req.param('id') }).exec(function(err, found) {
			if(err){
				sails.log.error(err);
				res.view('settings/index',{
								error: [{
									message: err
								}]
							});
			}

			brenda.removeS3Bucket(
				req.param('id'), found[req.param('type')], found.aws_s3_region, req.param('type')
			)
			.then(
				function(data){
					sails.log('S3 render bucket ' + data + ' removed successfully!');
					res.view('settings/index',{
								info: [{
									message: 'Amazon S3 bucket ' + data + ' removed successfully!'
								}]
							});
				},
				function(reason){
					sails.log.error(reason);
					res.view('settings/index',{
								error: [{
									message: reason
								}]
							});
				}
			);

		});
	}
};

