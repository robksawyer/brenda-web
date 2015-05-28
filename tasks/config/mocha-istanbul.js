/**
 * Instanbul handles mocha code coverage
 *
 * ---------------------------------------------------------------
 *
 * For usage docs see:
 *    https://github.com/pocesar/grunt-mocha-istanbul
 *
 */
module.exports = function(grunt) {

  grunt.config.set('mocha_istanbul', {
    coverage: {
      src: 'test', // the folder, not the files
      options: {
        coverageFolder: 'coverage',
        mask: '**/*.test.js',
        root: 'api/'
      }
    },
    coveralls: {
        src: 'test', // the folder, not the files
        options: {
            coverage: true,
            check: {
                lines: 75,
                statements: 75
            },
            root: 'api/', // define where the cover task should consider the root of libraries that are covered by tests
            reportFormats: ['html']
        }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-istanbul');
};

