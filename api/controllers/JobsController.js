/**
 * JobsController
 *
 * @description :: Server-side logic for managing jobs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	/**
	*
	* Handles adding a job to the Amazon SQS Queuing service.
	*
	**/

	add: function (req, res){
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
		sails.log(req.params);
		return res.json({
			todo: 'Not implemented yet!'
		});
	}
};

