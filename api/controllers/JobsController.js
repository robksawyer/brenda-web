/**
 * JobsController
 *
 * @description :: Server-side logic for managing jobs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	index: function (req, res){

		return res.view({
			todo: "This needs to be setup."
		});
	},

	/**
	*
	* Handles adding a job to the Amazon SQS Queuing service.
	*
	**/

	add_spot: function (req, res){
		/*Job.create({
			project_name: "Test Project",
			project_filename: "blah.gz.zip",
			work_queue: 'grootfarm-queue'
		}).exec(function createJob(err, created){
			if(err){
				sails.log.error(err);
			}
			sails.log('Created a job with the name ' + created.name);
		});*/
		if(req.params != undefined){
			sails.log(req.params);
		}

		res.view({
			todo: 'Not implemented yet!'
		});
	}
};

