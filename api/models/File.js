/**
* File.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	attributes: {
		fileName: {
			type: 'string'
		},
		extension: {
			type: 'string'
		},
		originalName: {
			type: 'string'
		},
		contentType: {
			type: 'string'
		},
		fileSize: {
			type: 'integer'
		},
		uploadedBy: {
			model: 'User'
		},
		job: {
			model: 'Jobs'
		}
	}
};

