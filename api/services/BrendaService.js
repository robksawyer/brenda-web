//
// BrendaService.js - in api/services
//

var fs = require('fs');
var path = require('path');

module.exports = {

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


	getAmazonS3ConfigFile: function(){

		var homedir = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;

		var promise = new sails.RSVP.Promise( function(fullfill, reject) {
			fs.readFile( path.resolve(homedir, '.aws', 'credentials'), 'utf8', function (err,data) {
				if (err) {
					return sails.log(err);
				}
				var aws_access_key_id = data.match(/aws_access_key_id\s*=\s*(.*)/);
				if(aws_access_key_id[1] != undefined){
					aws_access_key_id = aws_access_key_id[1];
				}else{
					reject( new Error("Unable to find the Amazon Access Key in the file provided. See http://amzn.to/1PIF3WB") );
				}
				sails.log(aws_access_key_id)
				var aws_secret_access_key = data.match(/aws_secret_access_key\s*=\s*(.*)/);
				if(aws_secret_access_key[1] != undefined){
					aws_secret_access_key = aws_secret_access_key[1];
				}else{
					reject( new Error("Unable to find the Amazon Secret Key in the file provided. See http://amzn.to/1PIF3WB") );
				}
			});
		});

		return promise;
	}
}