var _ = require('lodash');
var Async = require('async');
var Guest = require('./models/guest');
var PERMISSION = require('./permission.json');

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
  var ip = Utils.clientIp(req);
  var action = req.method + " " + req.path;
  if (account) {
    if (account !== 'SYSTEM' && hasAction(PERMISSION.admin, action)) {
      cb("No permission for action: " + action);
    } else {
      if (Guest.isGuest(account)) {
        cb(null, hasAction(PERMISSION.nologin, action) || hasAction(PERMISSION.guest, action));
      } else {
        cb(null, !_.includes(global.sealedIps, ip));
      }
    }
  } else {
    cb(null, hasAction(PERMISSION.nologin, action));
  }
};

module.exports.check = check;
