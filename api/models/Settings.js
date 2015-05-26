/**
* Settings.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	attributes: {
		brenda_version: {
			type: 'string'
		},
		ami_id: {
			type: 'string'
		},
		ec2_region: {
			type: 'string'
		},
		sqs_region: {
			type: 'string'
		},
		default_instance_type: {
			type: 'string'
		},
		ec2_instance_count: {
			type: 'integer'
		},
		aws_access_key_id: {
			type: 'string'
		},
		aws_secret_access_key_id: {
			type: 'string'
		},
		aws_s3_project_bucket: {
			type: 'string'
		},
		aws_s3_render_bucket: {
			type: 'string'
		}
	}
};

