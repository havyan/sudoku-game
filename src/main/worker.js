var _ = require('lodash');
var async = require('async');
var winston = require('winston');
var User = require('./models/user');
var Recharge = require('./models/recharge');

var CLEAR_USER_INTERVAL = 30 * 60 * 1000;
var CHECK_RECHARGE_INTERVAL = 10 * 1000;

winston.info('Start worker');

setInterval(function() {
  User.clearInactiveUsers(function(error) {
    if (error) {
      winston.error('Error when clearing inactive users: ' + error);
    } else {
      winston.info('Finished clearing inactive users');
    }
  });
}, CLEAR_USER_INTERVAL);

setInterval(function() {
  Recharge.checkAll(function(error) {
    if (error) {
      winston.error('Error when checking recharge status: ' + error);
    } else {
      winston.info('Finished clearing inactive users');
    }
  });
}, CHECK_RECHARGE_INTERVAL);
