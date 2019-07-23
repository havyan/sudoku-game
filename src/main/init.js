var _ = require('lodash');
var Async = require('async');
var args = require('./args');
var log = require('./log');
var db = require('./db');
var i18n = require('./i18n');
// Read system config from json
var configFile = args.env === 'production'
  ? 'production-config.json'
  : 'config.json';

global.config = require('../../' + configFile);
global.config.args = args;

// Initialize log
log.init();
var winston = require('winston');

winston.info("Start args are: " + JSON.stringify(args));

module.exports = function(cb) {
  Async.series([i18n.init.bind(i18n), db.init.bind(db)], function(error) {
    if (error) {
      winston.error("Error when initializing: " + error);
    } else {
      cb();
    }
  });
};
