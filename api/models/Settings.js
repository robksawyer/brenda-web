/**
* Settings.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	attributes: {
		email: 'string', //Update this later and move to a user model
		ami_id: 'string',
		ec2_region: 'string',
		sqs_region: 'string',
		default_instance_type: 'string'
	}
};

