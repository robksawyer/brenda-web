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
	},

	/**
	*
	* Emulates Python's range function
	* @url http://stackoverflow.com/questions/8273047/javascript-function-similar-to-python-range
	*
	**/
	range: function(start, stop, step) {
		if (typeof stop == 'undefined') {
			// one param defined
			stop = start;
			start = 0;
		}

		if (typeof step == 'undefined') {
			step = 1;
		}

		if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
			return [];
		}

		var result = [];
		for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
			result.push(i);
		}

		return result;
	}

}