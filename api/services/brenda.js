//
// BrendaService.js - in api/services
//

var fs = require('fs'),
	path = require('path'),
	util = require('util');

module.exports = {

	brendaConfigFile: 'brenda.js',
	awsConfigFile: 'aws.js',

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
	* Finds the data in the Amazon shared credential file (~/.aws/credential).
	* More details: http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html
	**/

	getAmazonS3ConfigFile: function(){

		var homedir = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			fs.readFile( path.resolve(homedir, '.aws', 'credentials'), 'utf8', function (err,data) {
				if (err) {
					return sails.log(err);
				}
				var aws_access_key_id = data.match(/aws_access_key_id\s*=\s*['"](.*)['"]/);
				if(aws_access_key_id[1] != undefined){
					aws_access_key_id = aws_access_key_id[1];
				}else{
					aws_access_key_id = undefined;
					reject( new Error("Unable to find the Amazon Access Key in the file provided. See http://amzn.to/1PIF3WB") );
				}
				var aws_secret_access_key = data.match(/aws_secret_access_key\s*=\s*['"](.*)['"]/);
				if(aws_secret_access_key[1] != undefined){
					aws_secret_access_key = aws_secret_access_key[1];
				}else{
					aws_secret_access_key = undefined;
					reject( new Error("Unable to find the Amazon Secret Key in the file provided. See http://amzn.to/1PIF3WB") );
				}

				if(aws_access_key_id != undefined && aws_secret_access_key != undefined){
					var results = {
						aws_access_key_id: aws_access_key_id,
						aws_secret_access_key: aws_secret_access_key
					};
					fullfill(results);
				}
			});
		});

		return promise;
	},

	//Read the settings file `/config/brenda.js`
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
	* Writes a new brenda config file with the values from the /settings
	*
	**/

	writeBrendaConfigFile: function(userSettingValues){
		if(!this.brendaConfigFile){
			throw new Error("Unable to find the config file.");
		}

		sails.log(userSettingValues);

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
	},


	/**
	*
	* Writes a new Amazon config file with the values from the /settings
	*
	**/

	writeAmazonConfigFile: function(userSettingValues){
		if(!this.awsConfigFile){
			throw new Error("Unable to find the config file.");
		}

		if(userSettingValues != undefined){
			var configFile = this.awsConfigFile;

			var localConfigVars = {
					comment: '/**' + sails.EOL + ' * Amazon AWS API Configuration' + sails.EOL + ' *' + sails.EOL + ' * This file contains the main Amazon settings used in the app.' + sails.EOL + ' * This is generated/updated by filling out the /settings/index data.' + sails.EOL + ' *' + sails.EOL + ' */' + sails.EOL + sails.EOL,
					start: 'module.exports.aws = {' + sails.EOL + sails.EOL + '\tsettings: {' + sails.EOL,
					end: sails.EOL + '\t}' + sails.EOL + '}'
				};

			var promise = new sails.RSVP.Promise( function(fullfill, reject) {

				var configFilePath = path.resolve('config', configFile);

				//Run through the existing variables and apply any that are different

				//Get the existing values in the file
				var configAttributes = Object.keys(Settings.attributes);
				var ignoreAttributes = ['email', 'createdAt','updatedAt','id','ec2_instance_count'];

				//sails.log.info(jsonVersion.ami_id);
				var newJsonFile = localConfigVars.comment;
					newJsonFile += localConfigVars.start;

				for(var i = 0; i < configAttributes.length; i++){
					if(ignoreAttributes.indexOf( configAttributes[i] ) === -1){
						//
						//Check the user settings (userSettingValues) against the existing ones
						//
						//newJsonFile += configAttributes[i] + ': "' + sails.config.aws.settings[configAttributes[i]] + '",' + sails.EOL;

						//Apply the user settings
						newJsonFile += '\t\t' + configAttributes[i] + ': "' + userSettingValues[configAttributes[i]] + '",' + sails.EOL;

						//newJsonFile += userSettingValues;
					}
				}

				//TODO: Append the existing and new data here.
				newJsonFile += localConfigVars.end;

				fs.writeFile(configFilePath, newJsonFile, function(err){
					if(err){
						sails.log.error(err);
						reject(err);
					} else {
						fullfill({ message: 'Amazon config file saved successfully!'});
					}
				});


			});

			return promise;
		}else{
			sails.log.error("No request parameters find.");
			return false;
		}
	},

	/**
	*
	* Create a unique id for the buckets if needed.
	*
	**/
	makeid: function(length) {
		if(!length) {
			length = 5;
		}
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for( var i=0; i < length; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	}
}