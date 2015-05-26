/**
 * Amazon AWS API Configuration
 *
 * This file contains the main Brenda settings used in the app
 *
 */

module.exports.aws = {

	//TODO: Make it so that this is pulled from a database or read in from a file on the hard drive.
	settings: {
		accessKeyId: "YOUR_ACCESS_KEY",
		secretAccessKey: 'YOUR_SECRET_KEY',
		ami_id: 'ami-6988ba59',
		ec2_region: 'us-west-2',
		sqs_region: 'us-west-2',
		s3_project_bucket: '',
		s3_render_bucket: '',
		default_instance_type: 'c3.2xlarge'
	}

}