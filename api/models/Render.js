/**
* Render.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	attributes: {
		name: {
			type: 'string'
		},
		aws_s3_bucket: {
			type: 'string'
		},
		configFileName: {
			type: 'string'
		},
		price_per_instance: {
			type: 'float'
		},
		total_price: {
			type: 'float'
		},
		start_time:{
			type: 'datetime'
		},
		end_time: {
			type: 'datetime'
		},
		status:{
			type: 'string',
			enum: ['waiting', 'completed', 'failed']
		},
		job: {
			model: 'jobs'
		},
		owner:{
			model: 'user'
		}
	}
};

