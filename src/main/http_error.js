var winston = require('winston');

var HttpError = function(message, status, responseType) {
  this.status = status || HttpError.SERVER_ERROR;
  this.responseType = responseType || 'json';
  this.error = new Error(message);
  winston.error(this.error.stack);
};

HttpError.NOT_FOUND = 404;
HttpError.SERVER_ERROR = 500;
HttpError.UNAUTHORIZED = 401;

HttpError.prototype.__defineGetter__('message', function() {
  return this.error.message;
});

HttpError.prototype.__defineGetter__('name', function() {
  return this.error.name;
});

HttpError.prototype.__defineGetter__('stack', function() {
  return this.error.stack;
});

HttpError.prototype.toJSON = function() {
  return {
    status : this.status,
    name : this.error.name,
    message : this.error.message,
    stack : this.error.stack
  };
};

module.exports = HttpError;
