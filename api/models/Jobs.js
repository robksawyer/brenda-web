/**
* Jobs.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	attributes: {
		ami_id:{
			type: 'string'
		},
		project_name: {
			type: 'string',
		},
		project_filename: {
			type: 'string'
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
		ec2_region:{
			type: 'string'
		},
		sqs_region:{
			type: 'string'
		},
		ec2_instance_count: {
			type: 'integer'
		},
		max_spend_amount: {
			type: 'float'
		},
		work_queue: {
			type: 'string', //AMS SQS work queue name
		}
	}
};