/**
*
* flash.js
* @location api/services
* @url http://stackoverflow.com/questions/25350841/sails-js-flash-message-for-user-registration
**/
module.exports = {
  success: function(req, message) {
  	message = message.trim();
    req.session.messages['success'].push(message);
  },
  warning: function(req, message) {
  	message = message.trim();
    req.session.messages['warning'].push(message);
  },
  error: function(req, message) {
  	message = message.trim();
    req.session.messages['error'].push(message);
  }
}