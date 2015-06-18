/**
*
* BrendaRun Service
* @description Helps to manage `brenda-run` tasks.
* @location api/services
* @author Rob Sawyer
*
**/

var fs = require('fs'),
	path = require('path'),
	util = require('util'),
	changeCase = require('change-case');

module.exports = {

	/**
	*
	* Starts an EC2 Spot Instance request. The spot instance reads messages from
	* the Job's Amazon SQS queue.
	* @param
	* @return promise
	*
	**/
	spot: function(instanceCount, price){
		/*
		 ami_id = utils.get_opt(opts.ami, conf, 'AMI_ID', default=AMI_ID, must_exist=True)
	    price = utils.get_opt(opts.price, conf, 'BID_PRICE', must_exist=True)
	    reqtype = 'persistent' if opts.persistent else 'one-time'
	    itype = brenda_instance_type(opts, conf)
	    snapshots = aws.get_snapshots(conf)
	    bdm, snap_description, istore_dev = aws.blk_dev_map(opts, conf, itype, snapshots)
	    script = startup_script(opts, conf, istore_dev)
	    user_data = None
	    if not opts.idle:
	        user_data = script
	    ssh_key_name = conf.get("SSH_KEY_NAME", "brenda")
	    sec_groups = (conf.get("SECURITY_GROUP", "brenda"),)
	    run_args = {
	        'image_id'      : ami_id,
	        'price'         : price,
	        'type'          : reqtype,
	        'count'         : opts.n_instances,
	        'instance_type' : itype,
	        'user_data'     : user_data,
	        'key_name'      : ssh_key_name,
	        'security_groups' : sec_groups,
	        'block_device_map' : bdm,
	        }

	    print "----------------------------"
	    print "AMI ID:", ami_id
	    print "Max bid price", price
	    print "Request type:", reqtype
	    print "Instance type:", itype
	    print "Instance count:", opts.n_instances
	    if snap_description:
	        print "Project EBS snapshot:", snap_description
	    if istore_dev:
	        print "Instance store device:", istore_dev
	    print "SSH key name:", ssh_key_name
	    print "Security groups:", sec_groups
	    print_script(opts, conf, script)
	    aws.get_done(opts, conf) # sanity check on DONE var
	    if not opts.dry_run:
	        ec2 = aws.get_ec2_conn(conf)
	        reservation = ec2.request_spot_instances(**run_args)
	        print reservation
        */
		//brenda-run -N 4 -p 0.07 spot
		amazon.makeSpotInstanceRequest()
			.then(
				function(){

				},
				function(){

				}
			);
	},

	/**
	*
	* Pulls the latest status from Brenda via the brenda-run tool
	* @param void
	* @return promise
	*
	**/
	status: function ()
	{
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: sails.config.brenda.settings.pythonPath,
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['status']
			};
			sails.python.run('brenda-run', options, function (err, results) {
				if (err) reject(err);
				// results is an array consisting of messages collected during execution
				sails.log('results: %j', results);
				fulfill(results);
			});
		});
		return promise;
	},

	/**
	*
	* Stops all running EC2 instances (less fine-grained than "brenda-tool prune").
	*
	**/
	stop: function(){
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: sails.config.brenda.settings.pythonPath,
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['stop']
			};
			sails.python.run('brenda-run', options, function (err, results) {
				if (err) reject(err);
				// results is an array consisting of messages collected during execution
				sails.log('results: %j', results);
				fulfill(results);
			});
		});
		return promise;
	},

	/**
	*
	* Handles cancel all spot requests.
	*
	**/
	cancel: function(){
		var promise = new sails.RSVP.Promise( function(fulfill, reject) {
			var options = {
				mode: 'binary',
				pythonPath: sails.config.brenda.settings.pythonPath,
				pythonOptions: ['-u'],
				scriptPath: 'lib/brenda/',
				args: ['cancel']
			};
			sails.python.run('brenda-run', options, function (err, results) {
				if (err) reject(err);
				// results is an array consisting of messages collected during execution
				sails.log('results: %j', results);
				fulfill(results);
			});
		});
		return promise;
	}

}