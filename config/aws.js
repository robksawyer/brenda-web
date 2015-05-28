/**
 * Amazon AWS API Configuration
 *
 * This file contains the main Amazon api configuration details.
 * @url http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html
 */

module.exports.aws = {

	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		region: process.env.AWS_DEFAULT_REGION
	}

}