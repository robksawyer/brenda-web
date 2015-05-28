/**
 * Set up tests with Mocha
 *
 * ---------------------------------------------------------------
 *
 *
 * For usage docs see:
 *    http://mochajs.org/
 *
 */
module.exports = function(grunt) {

  grunt.config.set('mocha', {
    test: {
      options: {
        reporter: 'spec'
      },
      src: ['test/**/*.test.js']
    }
  });

  grunt.loadNpmTasks('grunt-mocha-test');
};