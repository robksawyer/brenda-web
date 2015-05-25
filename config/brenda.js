/**
 * Brenda API Configuration
 *
 * This file contains the main Brenda settings used in the app
 *
 */

module.exports.brenda = {

	//TODO: Make it so that this is pulled from a database or read in from a file on the hard drive.
	settings: {
		ami_id: 'ami-6988ba59',
		ec2_region: 'us-west-2',
		sqs_region: 'us-west-2',
		default_instance_type: 'c3.2xlarge',
		setupFileLocation: 'lib/brenda/setup.py' //Used to get version
	}

}