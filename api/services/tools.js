/**
*
* Tools
* @description Simple code tools that help out.
* @location api/services
* @author Rob Sawyer
*
**/

module.exports = {

	/**
	*
	* Creates a unique id
	* @param length: integer The length to make the id.
	* @return string
	**/
	makeid: function(length) {
		if(!length) {
			length = 5;
		}
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for( var i=0; i < length; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	}

}