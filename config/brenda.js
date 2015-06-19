/**
 * Brenda API Configuration
 *
 * This file contains the main Brenda settings used in the app.
 *
 */

module.exports.brenda = {

	//TODO: Make it so that this is pulled from a database or read in from a file on the hard drive.
	settings: {
		pythonPath: '/usr/local/bin/python',
		workDir: '$HOME/src/brenda/test/work',
		useIStore: false, //Need to figure out what this actually does.
		setupFileLocation: 'lib/brenda/setup.py', //Used to get version
		jobConfigFolderName: 'jobs' //This must be placed at the root of the app
	}

}