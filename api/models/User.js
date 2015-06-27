var User = {
	// Enforce model schema in the case of schemaless databases
	schema: true,

	attributes: {
		username  : { type: 'string', unique: true },
		email     : { type: 'email',  unique: true },
		passports : { collection: 'Passport', via: 'user' },

		fullname : {
			type: 'string'
		},
		email_on_end_date: {
			type: 'boolean',
			defaultsTo: false
		},
		online: {
			type: 'boolean',
			defaultsTo: false
		},
		admin: {
			type: 'boolean',
			defaultsTo: false
		},
		uploads: {
			collection: 'Upload',
			via: 'uploadedBy'
		},
		settings: {
			model: 'Setting',
			via: 'owner'
		}
	}
};

module.exports = User;
