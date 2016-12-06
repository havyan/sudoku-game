var _ = require('lodash');
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

var check = function(account, action, cb) {
  if (account) {
    if (account !== 'SYSTEM' && hasAction(PERMISSION.admin, action)) {
      cb("No permission for action: " + action);
    } else {
      cb(null, true);
    }
  } else {
    cb(null, hasAction(PERMISSION.nologin, action));
  }
};

module.exports.check = check;
