/**
*
* BrendaService
* @description Helps to manage Brenda tasks.
* @location api/services
* @author Rob Sawyer
*
**/

var fs = require('fs'),
	path = require('path'),
	util = require('util'),
	AWS = require('aws-sdk');

module.exports = {

	brendaConfigFile: 'brenda.js',

	brendaFileComment: '/**' + sails.EOL + ' * Brenda API Configuration' + sails.EOL + ' *' + sails.EOL + ' * This file contains the main Brenda settings used in the app.' + sails.EOL + ' * This is generated/updated by filling out the /settings/index data.' + sails.EOL + ' *' + sails.EOL + ' */' + sails.EOL + sails.EOL,

	brendaFileStart: 'module.exports.brenda = {' + sails.EOL + sails.EOL + 'settings: {' + sails.EOL,

	brendaFileEnd: sails.EOL + '}' + sails.EOL + sails.EOL + '}',

	/**
	*
	* Find the Brenda version by pulling the data from the setup.py file.
	*
	**/
	getBrendaVersion: function(){

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			var setupFileLocation = "";
			if ( !sails.config.brenda.settings.setupFileLocation || sails.config.brenda.settings.setupFileLocation == "" ) {
				setupFileLocation = sails.config.brenda.settings.setupFileLocation;
			} else {
				setupFileLocation = "lib/brenda/setup.py";
			}

			fs.exists(setupFileLocation, function (exists) {
				if (exists) {
					fs.readFile(setupFileLocation, {encoding: 'utf-8'}, function (err, data) {
						if (!err) {
							var match = data.match(/VERSION="([0-9].*)"/);
							if(match[1] != undefined && match[1] != ""){
								fullfill( match[1] );
							} else {
								reject( new Error("Unable to find the version in the file provided.") );
							}

						} else {
							reject( new Error(err) );
						}
					});
				} else {
					reject( new Error("Unable to find the Brenda setup file: " + setupFileLocation) );
				}
			});

		});

		return promise;
	},

	/**
	*
	* Read the settings file `/config/brenda.js`
	*
	**/
	getConfigFile: function(){
		if(!this.brendaConfigFile){
			throw new Error("Unable to find the config file.");
		}

		var configFile = this.brendaConfigFile;

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			var configFilePath = path.resolve('config', configFile);

			fs.readFile(configFilePath, {encoding: 'utf-8'}, function(err, obj){
				if(err){
					sails.log.error(err);
					reject(err);
				}
				fullfill(obj);
			});

		});

		return promise;
	},

	/**
	*
	* Retrieves and returns the settings for a user.
	*
	**/
	getUserSettings: function(req){
		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			if(!req || !req.user || !req.user.id){
				reject('User id not found.');
			}
			//Retrieve the settings
			User.findOne({id: req.user.id}).populate('settings').exec(
				function findSettings(err, userRecord){
					if(err){
						sails.log.error(err);
						reject(err);
					}
					if(userRecord.settings.length > 0){
						fullfill(userRecord.settings[0]);
					} else {
						reject('Settings not found.');
					}
				});
		});
		return promise;
	},

	/**
	*
	* Creates a setting record for a user.
	* @param user_id The logged in user.
	* @return promise
	**/
	createSettingsRecord: function(user_id){

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			if(!user_id) {
				reject('You need to provide a valid user id.');
			}

			//Start with record id 1
			Settings.create({owner: user_id}).exec(function(err, created){
				if(err){
					sails.log.error(err);
					reject(err);
				}

				sails.log("Created the settings record " + created.id);

				//Get the version of Brenda that's being used.
				brenda.getBrendaVersion().then(
					function (data){
						if(data){
							created.brenda_version = data;
							created.save(function(err, updatedRecord){
								if(err){
									reject("There was an error adding the Brenda version to the settings.");
								}
								sails.log.info("Brenda version " + updatedRecord.brenda_version + " added to settings.");
								fullfill(updatedRecord);
							});

						}else{
							reject("There was an error finding the Brenda version.");
						}
					},
					function (reason){
						sails.log.error(reason);
						reject(reason);
					}
				);

			});
		});
		return promise;
	},

	/**
	* @DEPRACATED
	* Writes a new brenda config file with the values from the /settings
	*
	**/
	writeBrendaConfigFile: function(userSettingValues){
		if(!this.brendaConfigFile){
			throw new Error("Unable to find the config file.");
		}

		var configFile = this.brendaConfigFile;

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {

			var configFilePath = path.resolve('config', configFile);

			fs.readFile(configFilePath, {encoding: 'utf-8'}, function(err, obj){
				if(err){
					sails.log.error(err);
					reject(err);
				}

				//Existing values are in obj. Append these as needed.
				//var jsonVersion = JSON.parse(obj);
				//sails.log.info(jsonVersion.ami_id);

				/*var configData = JSON.parse(this.defaultBrendaConfigFileData);
				var newJsonFile = configData.comment;
					newJsonFile += configData.start;
					newJsonFile += userSettingValues;
					//TODO: Append the existing and new data here.
					newJsonFile += configData.end;*/

				fullfill(newJsonFile);
			});

		});

		return promise;
	}

}