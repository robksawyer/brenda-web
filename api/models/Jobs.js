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
		max_spend_amount: {
			type: 'float'
		},
		work_queue: {
			type: 'string', //AMS SQS work queue name
		},
		queue: {
			model: 'Queue',
			via: 'job'
		},
		owner: {
			model: 'User',
			via: 'jobs'
		},
		files: {
			model: 'File',
			via: 'job'
		}
	}
};