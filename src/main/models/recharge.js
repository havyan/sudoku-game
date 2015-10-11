var RechargeDAO = require('../daos/recharge');
var async = require('async');

var Recharge = {};

Recharge.create = function(params, cb) {
  RechargeDAO.createRecharge(params, cb);
};

Recharge.count = function(account, cb) {
  RechargeDAO.countByFrom(account, cb);
};

Recharge.findByAccount = function(account, start, size, cb) {
  RechargeDAO.findByRange(account, start, size, cb);
};

module.exports = Recharge;
