var User = {
	// Enforce model schema in the case of schemaless databases
	schema: true,

	attributes: {
		id: {
			type: 'integer',
			unique: true,
			primaryKey: true,
			required: true
		},
		username: {
			type: 'string',
			unique: true
		},
		fullname : {
			type: 'string'
		},
		email: {
			type: 'email',
			unique: true
		},
		passports: {
			collection: 'Passport',
			via: 'user'
		},
		email_on_render_complete: {
			type: 'boolean',
			defaultsTo: false
		},
		email_on_instance_idle: {
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
		settings: {
			model: 'Settings',
			via: 'owner'
		},
		jobs: {
			collection: 'Jobs',
			via: 'owner'
		},
		uploads: {
			collection: 'Upload',
			via: 'uploadedBy'
		},
		queues: {
			collection: 'Queue',
			via: 'owner'
		},
		renders: {
			collection: 'Render',
			via: 'owner'
		}
	}
};

module.exports = User;
