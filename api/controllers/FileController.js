/**
 * FileController
 *
 * @description :: Server-side logic for managing files
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var path = require('path');
module.exports = {



	/**
	 * `FileController.upload()`
	 *
	 * Upload file(s) to the server's disk.
	 */
	upload: function (req, res) {

		// e.g.
		// 0 => infinite
		// 240000 => 4 minutes (240,000 miliseconds)
		// etc.
		//
		// Node defaults to 2 minutes.
		res.setTimeout(0);
		req.file('files[]')
		.upload({

			// You can apply a file upload limit (in bytes)
			maxBytes: 1000000,

			dirname: path.resolve('', 'files/projects')
		}, function whenDone(err, uploadedFiles) {
			var filenameContainer = uploadedFiles[0].fd.split('/')
					filename          = filenameContainer[filenameContainer.length - 1 ];
					filelocation      = '/projects/' + filename;
			console.log(filename);
			var temp = {};
			temp.files = [
				{
					"name": uploadedFiles.filename,
					"size": uploadedFiles.size,
					"url": filelocation,
					"thumbnailUrl": filelocation
				}
			];

			console.log(uploadedFiles);
			if (err) return res.serverError(err);
			else return res.send(temp);
		});
	},

	/**
	 * `FileController.s3upload()`
	 *
	 * Upload file(s) to an S3 bucket.
	 *
	 * NOTE:
	 * If this is a really big file, you'll want to change
	 * the TCP connection timeout.  This is demonstrated as the
	 * first line of the action below.
	 */
	s3upload: function (req, res) {

		console.log(req.file('filedata'));
		// e.g.
		// 0 => infinite
		// 240000 => 4 minutes (240,000 miliseconds)
		// etc.
		//
		// Node defaults to 2 minutes.
		res.setTimeout(0);

		req.file('filedata').upload({
			adapter: require('skipper-s3-alt'),
			fileACL: 'public-read',
			bucket: '',
			key: '',
			secret: ''
		}, function whenDone(err, uploadedFiles) {
			if (err) return res.send(err);
			else return res.json({
				files: uploadedFiles,
				textParams: req.params.all()
			});
		});
	},


	/**
	 * FileController.download()
	 *
	 * Download a file from the server's disk.
	 */
	download: function (req, res) {
		require('fs').createReadStream(req.param('path'))
		.on('error', function (err) {
			return res.serverError(err);
		})
		.pipe(res);
	}
};