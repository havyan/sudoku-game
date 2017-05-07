var mongoose = require('mongoose');
var args = require('./args');
// Read system config from json
var configFile = args.env === 'production' ? 'production-config.json' : 'config.json';
global.config = require('../../' + configFile);
global.config.args = args;
// Initialize log
require('./log')();
var winston = require('winston');

winston.info("Start args are: " + JSON.stringify(args));

// init mongo connection
var mongoConfig = global.config.mongodb;
mongoose.Promise = global.Promise;
mongoose.connect(mongoConfig.url + '/' + mongoConfig.database);
