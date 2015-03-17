var _ = require('lodash');
var User = require('./models/user');

var UserManager = function() {

};

UserManager.prototype.resetMoney = function(cb) {
  User.resetMoney(cb);
};

module.exports = UserManager;
