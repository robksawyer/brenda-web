/**
 * RenderController
 *
 * @description :: Server-side logic for managing renders
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	function status(req, res)
	{
		sails.python.run('my_script.py', function (err) {
			if (err) throw err;
			console.log('finished');
		});
	}
};

