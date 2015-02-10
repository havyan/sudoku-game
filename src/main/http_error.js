var HttpError = function(message, status) {
	this.status = status || HttpError.SERVER_ERROR;
	this.error = new Error(message);
};

HttpError.NOT_FOUND = 404;
HttpError.SERVER_ERROR = 500;

HttpError.prototype.__defineGetter__('message', function() {
	return this.error.message;
});

HttpError.prototype.__defineGetter__('name', function() {
	return this.error.name;
});

HttpError.prototype.__defineGetter__('stack', function() {
	return this.error.stack;
});

module.exports = HttpError;
