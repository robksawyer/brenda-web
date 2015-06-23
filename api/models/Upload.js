/**
* Upload.js
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
		aws_s3_region:{
			type: 'string'
		},
		aws_s3_location: {
			type: 'string'
		},
		aws_s3_bucket: {
			type: 'string'
		},
		aws_s3_etag: {
			type: 'string'
		},
		uploadedBy: {
			model: 'User'
		},
		job: {
			model: 'Jobs'
		}
	}
};

