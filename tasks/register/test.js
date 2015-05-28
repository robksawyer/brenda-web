module.exports = function (grunt) {

  grunt.registerTask('test', [
    'mocha_istanbul:coverage'
  ]);

  // Code Coverage with Mocha and Istanbul (not Constantinople)
  //grunt.registerTask('coverage', ['mocha_istanbul:coverage']);
}