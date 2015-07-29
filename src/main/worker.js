var _ = require('lodash');
var async = require('async');
var winston = require('winston');
var UserDAO = require('./daos/user');
var ActiveKeyDAO = require('./daos/active_key');

var INTERVAL = 30 * 60 * 1000;

setInterval(function() {
  winston.info('Start worker');
  winston.info('Start to clear inactive users');
  async.waterfall([
  function(cb) {
    UserDAO.findInactive(cb);
  },
  function(users, cb) {
    if (users && users.length > 0) {
      async.eachSeries(users, function(user, cb) {
        ActiveKeyDAO.findOneBySource(user.account, function(error, key) {
          if (error) {
            cb(error);
          } else {
            if (!key) {
              winston.info('Remove inactive user [' + user.account + '].');
              user.remove(cb);
            } else {
              cb();
            }
          }
        });
      }, cb);
    } else {
      cb();
    }
  }], function(error) {
    if (error) {
      winston.error('Error when clearing inactive users: ' + error);
    } else {
      winston.info('Finished clearing inactive users');
    }
  });
}, INTERVAL);
