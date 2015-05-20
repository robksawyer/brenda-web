/**
* Jobs.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	attributes: {
		project_name: 'string',
		project_filename: 'string',
		work_queue: 'string', //AMS SQS work queue name
	}
};