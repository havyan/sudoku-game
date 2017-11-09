var _ = require('lodash');
var express = require('express');
var mongoose = require('mongoose');
var i18next = require('i18next');
var i18nextBackend = require('i18next-node-fs-backend');
var args = require('./args');
var commonPlugin = require('./daos/common');
// Read system config from json
var configFile = args.env === 'production' ? 'production-config.json' : 'config.json';
global.config = require('../../' + configFile);
global.config.args = args;
// Initialize log
require('./log')();
var winston = require('winston');

winston.info("Start args are: " + JSON.stringify(args));

var superRender = express.response.render;
express.response.render = function(view, options, callback) {
  var lang = this.req.cookies.lang || 'cn';
  var newArgs = [];
  options = options || {};
  options.$lang = lang;
  for (var i = 0; i < arguments.length; i++) {
    newArgs.push(arguments[i]);
  }
  if (newArgs.length > 1) {
    newArgs[1] = options;
  } else {
    if (newArgs.length === 0) {
      newArgs.push(null);
    }
    newArgs.push(options);
  }
  superRender.apply(this, newArgs);
};

i18next.use(i18nextBackend).init({
  lng: 'cn',
  preload: ['cn', 'en', 'jp'],
  ns: ['page'],
  backend: {
    loadPath: 'locales/{{lng}}/{{ns}}.json',
    addPath: 'locales/{{lng}}/{{ns}}.add.json',
    jsonIndent: 2
  }
});

// init mongo connection
var mongoConfig = global.config.mongodb;
mongoose.plugin(commonPlugin);
mongoose.Promise = global.Promise;
mongoose.connect(mongoConfig.url + '/' + mongoConfig.database);
