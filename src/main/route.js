var fs = require('fs');
var winston = require('winston');
var express = require('express');

var router = express.Router();

var Instance = function() {
};

Instance.prototype.initialize = function(app) {
	// Initialize routes dynamically
	fs.readdirSync('src/main/routers').forEach(function(fileName) {
		if (fileName.match(/^.*\.js$/g)) {
			winston.info("initialize route from " + fileName);
			var configRouter = require('./routers/' + fileName);
			if (configRouter.prefix) {
				var newRouter = express.Router();
				configRouter(newRouter);
				app.use(configRouter.prefix, router);
			} else {
				configRouter(router);
			}
		}
	});
	app.use('/', router);
};

module.exports = new Instance();
