var path = require('path');
var mongoose = require('mongoose');

if (!global.config.server.port) {
  global.config.server.port = 80;
}

var Config = function() {
};

Config.prototype.initialize = function(app) {
  var config = global.config;
  for (var name in config.app.params) {
    app.set(name, path.resolve(__dirname, '../../', config.app.params[name]));
  }
  for (var name in config.app.locals) {
    app.locals[name] = config.app.locals[name];
  }

  mongoose.connect(config.mongodb.url + '/' + config.mongodb.database);
};

module.exports = new Config();
