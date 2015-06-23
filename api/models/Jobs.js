/**
* Jobs.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	attributes: {
		name: {
			type: 'string',
		},
		animation_start_frame:{
			type: 'integer'
		},
		animation_end_frame:{
			type: 'integer'
		},
		animation_total_frames:{
			type: 'integer'
		},
		animation_jump_frames:{
			type: 'integer'
		},
		instance_type:{
			type: 'string'
		},
		ami_id: {
			type: 'string'
		},
		aws_ec2_region:{
			type: 'string'
		},
		aws_sqs_region:{
			type: 'string'
		},
		aws_ec2_instance_count: {
			type: 'integer'
		},
		aws_s3_render_bucket: {
			type: 'string'
		},
		max_spend_amount: {
			type: 'float'
		},
		ssh_key_name: {
			type: 'string'
		},
		sec_groups: {
			type: 'string'
		},
		type: {
			type: 'string'
		},
		queue: {
			model: 'Queue'
		},
		renders: {
			collection: 'Render',
			via: 'job'
		},
		uploads: {
			collection: 'Upload',
			via: 'job'
		},
		owner: {
			model: 'User',
			via: 'job'
		}
	}
};