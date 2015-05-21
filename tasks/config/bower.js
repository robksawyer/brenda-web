module.exports = function(grunt) {

	grunt.config.set('bower', {
		dev: {
			dest: '.tmp/public',
			js_dest: '.tmp/public/js',
			css_dest: '.tmp/public/styles',
			//eot_dest: '.tmp/public/styles/fonts',
			//svg_dest: '.tmp/public/styles/fonts',
			//woff_dest: '.tmp/public/styles/fonts',
			//woff2_dest: '.tmp/public/styles/fonts',
			//otf_dest: '.tmp/public/styles/fonts',
			//ttf_dest: '.tmp/public/styles/fonts',
		}
	});

	grunt.loadNpmTasks('grunt-bower');

};
