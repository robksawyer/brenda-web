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
    username : {
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
    passports : {
      collection: 'Passport',
      via: 'user'
    },
    email_on_render_complete : {
      type: 'boolean',
      defaultsTo: 0
    },
    email_on_instance_idle : {
      type: 'boolean',
      defaultsTo: 0
    },
    settings: {
      collection: 'settings',
      via: 'owner'
    },
    jobs: {
      collection: 'jobs',
      via: 'owner'
    },
    files: {
      collection: 'file',
      via: 'uploadedBy'
    },
    queues: {
      collection: 'queue',
      via: 'owner'
    },
    renders: {
      collection: 'render',
      via: 'owner'
    }
  }
};

module.exports = User;
