var _ = require('lodash');
var mongoose = require('mongoose');
var commonPlugin = require('./daos/common');

module.exports.init = function(cb) {
  // init mongo connection
  var mongoConfig = global.config.mongodb;
  mongoose.plugin(commonPlugin);
  mongoose.Promise = global.Promise;
  mongoose.connect(mongoConfig.url + '/' + mongoConfig.database);
  cb && cb();
};
