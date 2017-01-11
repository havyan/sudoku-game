var _ = require('lodash');
var async = require('async');
var PERMISSION = require('./permission.json');
var UserDAO = require('./daos/user');
var SealedIpDAO = require('./daos/sealed_ip');

var hasAction = function(actions, action) {
  return _.some(actions, function(e) {
    if (e.indexOf('[RE]') === 0) {
      return new RegExp('^' + e.replace('[RE]', '').trim() + '$').test(action);
    } else {
      return e === action;
    }
  });
};

var check = function(req, cb) {
  var account = req.session.account;
  var action = req.method + " " + req.path;
  if (account) {
    if (account !== 'SYSTEM' && hasAction(PERMISSION.admin, action)) {
      cb("No permission for action: " + action);
    } else {
      async.parallel([
        function(cb) {
          UserDAO.findOneByAccount(account, cb);
        },
        function(cb) {
          SealedIpDAO.findSealedOneByIp(Utils.clientIp(req), cb);
        }
      ], function(error, results) {
        if (error) {
          cb(error);
        } else {
          var user = results[0];
          var sealedIp = results[1];
          cb(null, !sealedIp && (user.status !== UserDAO.STATUS.FROZEN));
        }
      });
    }
  } else {
    cb(null, hasAction(PERMISSION.nologin, action));
  }
};

module.exports.check = check;
