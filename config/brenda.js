/**
 * Brenda API Configuration
 *
 * This file contains the main Brenda settings used in the app
 *
 */

module.exports.brenda = {

	init: {
		//This method looks for the local ~/.brenda.conf file and reads the data from it.
		/*fs = require('fs');
		fs.readFile('/etc/hosts', 'utf8', function (err,data) {
			if (err) {
				return console.log(err);
			}
			console.log(data);
		});*/
	},

	//TODO: Make it so that this is pulled from a database or read in from a file on the hard drive.
	settings: {
		ami_id: 'ami-6988ba59',
		ec2_region: 'us-west-2',
		sqs_region: 'us-west-2',
		default_instance_type: 'c3.2xlarge'
	}

}