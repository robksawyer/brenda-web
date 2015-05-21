/**
 * Copy files and folders.
 *
 * ---------------------------------------------------------------
 *
 * # dev task config
 * Copies all directories and files, exept coffescript and less fiels, from the sails
 * assets folder into the .tmp/public directory.
 *
 * # build task config
 * Copies all directories nd files from the .tmp/public directory into a www directory.
 *
 * For usage docs see:
 * 		https://github.com/gruntjs/grunt-contrib-copy
 */
module.exports = function(grunt) {

	grunt.config.set('copy', {
		dev: {
			files: [{
				expand: true,
				cwd: './assets',
				src: ['**/*.!(coffee|less)'],
				dest: '.tmp/public'
			}]
		},
		build: {
			files: [{
				expand: true,
				cwd: '.tmp/public',
				src: ['**/*'],
				dest: 'www'
			}]
		},
		bower: {
			files: [{
				//for bootstrap fonts
				expand: true,
				dot: true,
				cwd: 'bower_components/bootstrap/dist',
				src: ['fonts/*.*'],
				dest: '.tmp/public/styles'
			}, {
				//for font-awesome
				expand: true,
				dot: true,
				cwd: 'bower_components/fontawesome',
				src: ['fonts/*.*'],
				dest: '.tmp/public/styles'
			}]
		}
	});

	grunt.loadNpmTasks('grunt-contrib-copy');
};
