Brenda Web Progress Report
------------------------------------------------------------

## June 9, 2015

- User register/login via [Passport](http://passportjs.org/)
- Customizable [Bootstrap 3](http://getbootstrap.com/) interface
- Pages are protected via Passport (You basically have to create an account to view anything in the system.)
- Updated jobs/index so that actual spot instance jobs pull into the page now.
- Add Spot Instance Job Page: http://localhost:1337/jobs/add_spot
	- After creating a spot instance job, the following happens:
		- Uploaded file is checked.
			- If it's a .blend file, the file is zipped up using gzip.
			- If it's a zip file, the file is passed to the api/services/brenda processZipFile method. This still needs to be updated.
		- File is uploaded to the S3 bucket that was specified on the add spot page.
		- A File record is created. Data is currently just being stored using the Sails localDisk adapter.
		- An Amazon SQS work queue is created
		- A Job record is created that contains all of these details.
		- All of this happens in api/services/brenda's processBlenderFile method.
- Submit Job Page: http://localhost:1337/jobs/submit/[job_id]
	- This page is a work in progress. I'm not to happy with the current look and feel.
	- The idea of this is to allow someone to start the job. By starting the job you will (see api/services/BrendaWork.js):
		- Create a Render record. Keeps up with details about a Job's actual Render.
		- Writes a brenda config file that the Python Brenda work and run scripts will use. (Need to get away from this.)
		- Run the command `brenda-work` with the Job specific settings. This is where it's currently failing.





------------------------------------------------------------
Documentation and examples can be found here:
https://github.com/robksawyer/brenda-web/wiki

