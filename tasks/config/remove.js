/**
 * Remove files and folders.
 *
 * ---------------------------------------------------------------
 *
 * This grunt task is configured to remove the contents that aren't needed in the .tmp/public of your
 * sails project. This is mostly to fix bower component issues.
 *
 * For usage docs see:
 * 		https://www.npmjs.com/package/grunt-remove
 */
module.exports = function(grunt) {

	grunt.config.set('remove', {
		bower: {
			options: {},
			dirList: [
				'.tmp/public/dist', //bootstrap
				'.tmp/public/fonts' //fontawesome
			]
		}
	});

	grunt.loadNpmTasks('grunt-remove');
};

