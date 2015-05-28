/**
 * Mocha bootstrap file for backend application tests.
 */
'use strict';

var theLifter = require('./helpers/theLifter');

/**
 * Mocha bootstrap before function, that is run before any tests are being processed. This will lift sails.js with
 * test configuration.
 *
 * Note! Tests will use localDiskDb connection and this _removes_ possible existing disk store file from .tmp folder!
 *
 * @param   {Function}  next    Callback function
 */
before(function (done) {
  theLifter.lift(done);
});

/**
 * Mocha bootstrap after function, that is run after all tests are processed. Main purpose of this is just to
 * lower sails test instance.
 *
 * @param   {Function}  next    Callback function
 */
after(function (done) {
  console.log(); // Skip a line before displaying Sails lowering logs
  theLifter.lower(done);
});