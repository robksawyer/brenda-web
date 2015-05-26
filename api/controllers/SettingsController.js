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

						Settings.create({id: 1}).exec(function(err, created){
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

									}else{
										sails.log.error("There was an error finding the Brenda version.");
									}
								},
								function (reason){
									sails.log.error(reason);

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

				if(!settingRecord){
					sails.log.error('Unable to find settings record.');
					return res.redirect('/settings');
				}
				var ignoreAttributes = ['id','brenda_version'];
				var buildS3ProjectBucket = false;
				var buildS3RenderBucket = false;
				var settingAttributes = Object.keys(settingRecord);
				for(var i=0; i < settingAttributes.length; i++){
					if(ignoreAttributes.indexOf( settingAttributes[i] ) === -1){
						//sails.log(req.param(settingAttributes[i]));
						if( req.param(settingAttributes[i]) != undefined || req.param(settingAttributes[i]) != "" ){

							if(settingAttributes[i] == 'aws_s3_project_bucket' && req.param(settingAttributes[i]) != settingRecord.aws_s3_project_bucket){

								//if(settingRecord.aws_s3_region != undefined && settingRecord.aws_s3_region != ""){
									buildS3ProjectBucket = true;
								//}

							}else if(settingAttributes[i] == 'aws_s3_render_bucket'  && req.param(settingAttributes[i]) != settingRecord.aws_s3_render_bucket){

								//if(settingRecord.aws_s3_region != undefined && settingRecord.aws_s3_region != ""){
									buildS3RenderBucket = true;
								//}

							}else{
								settingRecord[settingAttributes[i]] = req.param(settingAttributes[i]);
							}

						}
					}
				}

				return res.redirect('/settings');

				/*if(buildS3ProjectBucket){
					brenda.createS3Bucket(
						req.param('id'), req.param('aws_s3_project_bucket'), settingRecord.aws_s3_region, 'aws_s3_project_bucket'
					).then(
						function(data){
							sails.log('S3 project bucket ' + data + ' saved successfully!');
							settingRecord['aws_s3_project_bucket'] = req.param('aws_s3_project_bucket');

							settingRecord.save( function(err, s){
								if(err) {
									sails.log.error('Unable to save the Amazon settings for project bucket.');
								}
								sails.log.info("Amazon settings saved for project bucket.");
							});
						},
						function(reason){
							sails.log.error(reason);
						}
					);
				}*/

				/*if(buildS3RenderBucket){
					brenda.createS3Bucket(
						req.param('id'), req.param('aws_s3_render_bucket'), settingRecord.aws_s3_region, 'aws_s3_render_bucket'
					).then(
						function(data){
							sails.log('S3 render bucket ' + data + ' saved successfully!');
							settingRecord['aws_s3_render_bucket'] = req.param('aws_s3_render_bucket');

							settingRecord.save( function(err, s){
								if(err) {
									sails.log.error('Unable to save the Amazon settings for render bucket.');
									return res.redirect('/settings');
								}
								sails.log.info("Amazon settings saved for render bucket.");

								return res.redirect('/settings');
							});
						},
						function(reason){
							sails.log.error(reason);
						}
					);

				} else {
					//Return to the settings page.
					return res.redirect('/settings');
				}*/

			});

		} else {
			return res.json({error: 'You are not permitted to update.'});
		}

	},

	/**
	*
	* Creates a bucket from Amazon S3
	* @param req (id | name | type) Needs id of setting record, name of bucket and attribute that points to db bucket type
	* @param res
	**/

	createBucket: function(req, res){

		Settings.findOne({ id: req.param('id') }).exec(function(err, found) {
			if(err){
				sails.log.error(err);
				return res.redirect('/settings');
			}

			if(req.param('name') == undefined || req.param('name') == ""){
				sails.log.error("You must provide a bucket name before you can create a bucket.");
				return res.redirect('/settings');
			}

			brenda.createS3Bucket(
				req.param('id'), req.param('name'), found.aws_s3_region, req.param('type')
			).then(
				function(data){
					sails.log('S3 render bucket ' + data + ' saved successfully!');
					found[req.param('type')] = req.param('name');
					found.save( function(err, s){
						if(err) {
							sails.log.error('Unable to save the Amazon settings for ' + req.param('type') + '.');
							return res.redirect('/settings');
						}
						sails.log.info("Amazon settings saved for " + req.param('type') + ".");

						return res.redirect('/settings');
					});
				},
				function(reason){
					sails.log.error(reason);
					return res.redirect('/settings');
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

		sails.log(req.param('id'));

		Settings.findOne({ id: req.param('id') }).exec(function(err, found) {
			if(err){
				sails.log.error(err);
				return res.redirect('/settings');
			}

			brenda.removeS3Bucket(
				req.param('id'), found[req.param('type')], found.aws_s3_region, req.param('type')
			)
			.then(
				function(data){
					sails.log('S3 render bucket ' + data + ' removed successfully!');
					return res.redirect('/settings');
				},
				function(reason){
					sails.log.error(reason);
					return res.redirect('/settings');
				}
			);

		});
	}
};

