/*
 * Location: /test/helpers/theLifter.js
 *
 * @description :: Provides 'lift' and 'lower' methods to set up
 *   and tear down a Sails instance (for use in tests)
 */
'use strict';
var SailsApp = require('sails').Sails,
    async = require('async'),
    lifted = false,
    Barrels = require('barrels'),
    loginHelper = require('./login'),
    sailsprocess,
    clear = require('cli-clear');

global.fixtures = undefined;

var theLifter = {
 
  /* Starts the Sails server, or if already started, stops and then starts it
   *
   * @param {function} done Callback function
   * @usage 
   * before('bootstrap', function (done) {
   *    theLifter.lift(done);
   * });
   */
  lift: function (next, cb) {
    //Clear the terminal window
    clear();
    
    async.waterfall(
      [
        // Check whether the Sails server is already running, and stop it if so
        function (next) {
          if (lifted) {
            //Clear the terminal window
            clear();
            return theLifter.lower(next);
          }
          next();
        },
 
        // Start the Sails server
        function (next) {
          sailsprocess = new SailsApp();
          sailsprocess.log.warn('Lifting sails...');
          sailsprocess.log('Loading models from ' +  require('path').join(process.cwd(), 'test/fixtures/models') );
          sailsprocess.lift({
            log: {
              level: 'debug'
            },
            /*paths: {
              models: require('path').join(process.cwd(), 'api/models')
            },*/
            connections: {
              test: {
                adapter: 'sails-memory'
              }
            },
            loadHooks: [
              'blueprints',
              'controllers',
              'http',
              'moduleloader',
              'orm',
              'policies',
              'request',
              'responses',
              'session',
              'userconfig',
              'views'
            ],
            models: {
              // Use in-memory database for tests
              connection: 'test',
              migrate: 'drop'
            },
            hooks: {
              grunt: false
            },
            liftTimeout: 100000
          }, function (err, app) {
            if (err) {
              sails.log.error(err);
              return next(err);
            }
            // Load fixtures
            var barrels = new Barrels();

            lifted = true;
            global.sails = app;
            sailsprocess = app;

            // Populate the DB
            barrels.populate([
                'user',
                'auth',
                'resetToken',
                'jwt',
                'use',
                'attempt',
                'post',
                'comment',
                'like',
                'secret',
                'purchase',
                'flag'
              ],function(err) {
              if(err){
                sails.log.error(err);
                return next(err);
              }
              sails.log('--- Populated the database. ---');
              // Save original objects in `fixtures` variable and return it to the callback
              global.fixtures = barrels.data;
              if(cb){
                cb(global.fixtures);
              }
              next();
            }, false);
            
          });
        },
        function (next){
          loginHelper.init(next);
        }
      ], next);
  },

  /* Stops the Sails server
   *
   * @param {function} done Callback function
   * @usage 
   * after('bootstrap', function (done) {
   *    theLifter.lower(done);
   * });
   */
  lower: function (next) {
    sailsprocess.log.warn('Lowering sails...');
    sailsprocess.lower(function (err) {
      lifted = false;
      next(err);
    });
  }
};

/**
 * Expose should to external world.
 */
exports = module.exports = theLifter;