var _ = require('lodash');
var async = require('async');
var winston = require('winston');
var User = require('./models/user');
var Recharge = require('./models/recharge');
var SealedIpDAO = require('./daos/sealed_ip');

var CLEAR_USER_INTERVAL = 30 * 60 * 1000;
var CHECK_RECHARGE_INTERVAL = 10 * 60 * 1000;
var UPDATE_SEALEDIPS_INTERVAL = 5 * 1000;

winston.info('Start worker');

setInterval(function() {
  User.clearInactiveUsers(function(error) {
    if (error) {
      winston.error('Error when clearing inactive users: ' + error);
    } else {
      winston.debug('Finished clearing inactive users');
    }
  });
}, CLEAR_USER_INTERVAL);

setInterval(function() {
  Recharge.checkAll(function(error) {
    if (error) {
      winston.error('Error when checking recharge status: ' + error);
    } else {
      winston.debug('Finished checking recharge status');
    }
  });
}, CHECK_RECHARGE_INTERVAL);

setInterval(function() {
  SealedIpDAO.allIps(function(error, sealedIps) {
    if (error) {
      winston.error('Error when updating sealed ips: ' + error);
    } else {
      winston.info('Sealed ips are: ' + JSON.stringify(sealedIps));
      global.sealedIps = sealedIps;
    }
  });
}, UPDATE_SEALEDIPS_INTERVAL);
