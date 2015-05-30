/**
* Settings.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	attributes: {
		brenda_version: {
			type: 'string',
			defaultsTo: ''
		},
		ami_id: {
			type: 'string',
			defaultsTo: ''
		},
		aws_s3_region: {
			type: 'string',
			defaultsTo: 'us-west-2'
		},
		aws_ec2_region: {
			type: 'string',
			defaultsTo: 'us-west-2'
		},
		aws_sqs_region: {
			type: 'string',
			defaultsTo: 'us-west-2'
		},
		default_instance_type: {
			type: 'string',
			defaultsTo: 'c3.2xlarge'
		},
		aws_ec2_instance_count: {
			type: 'integer',
			defaultsTo: 1
		},
		aws_s3_project_bucket: {
			type: 'string',
			defaultsTo: ''
		},
		aws_s3_render_bucket: {
			type: 'string',
			defaultsTo: ''
		},
		owner:{
			model: 'user',
			via: 'settings'
		}
	}
};

