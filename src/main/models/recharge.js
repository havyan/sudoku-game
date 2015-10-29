var async = require('async');
var _ = require('lodash');
var request = require('request');
var winston = require('winston');
var UserDAO = require('../daos/user');
var RechargeDAO = require('../daos/recharge');

var Recharge = {};

// TODO algorithm to calculate cost
Recharge.convertCost = function(purchase) {
  return purchase / 10;
};

Recharge.create = function(params, cb) {
  params.cost = this.convertCost(params.purchase);
  RechargeDAO.createRecharge(params, cb);
};

Recharge.count = function(account, cb) {
  RechargeDAO.countByFrom(account, cb);
};

Recharge.findOneById = function(id, cb) {
  RechargeDAO.findOneById(id, cb);
};

Recharge.findByAccount = function(account, start, size, cb) {
  RechargeDAO.findByRange(account, start, size, cb);
};

Recharge.checkByPayuid = function(payuid, cb) {
  var self = this;
  async.waterfall([
  function(cb) {
    RechargeDAO.findOneByPayuid(payuid, cb);
  },
  function(recharge, cb) {
    self.check(recharge, cb);
  }], cb);
};

Recharge.check = function(recharge, cb) {
  async.waterfall([
  function(cb) {
    var url = global.config.app.pay.apiquery.replace('{payuid}', recharge.payuid);
    winston.debug('Call pay query api to get pay status of ' + recharge.payuid);
    request({
      url : url,
      qs : {
        site : global.config.app.pay.site
      }
    }, cb);
  },
  function(res, body, cb) {
    var result = JSON.parse(body);
    if (res.statusCode == 200) {
      var status = result.result.toString();
      if (_.contains(RechargeDAO.STATUS, status)) {
        recharge.status = status;
        async.waterfall([
        function(cb) {
          recharge.save(cb);
        },
        function(recharge, count, cb) {
          UserDAO.findOneByAccount(recharge.target, cb);
        },
        function(user, cb) {
          if (status === RechargeDAO.STATUS.SUCCESS) {
            user.money = user.money + recharge.purchase;
            user.save(cb);
          } else {
            cb(null, user, 0);
          }
        }], function(error, user) {
          if (error) {
            cb(error);
          } else {
            cb(null, {
              money : user.money,
              status : status
            });
          }
        });
      } else {
        winston.debug('Query pay status got: ' + status);
        cb(null, {
          status : status
        });
      }
    } else {
      cb('Get pay status error: ' + res.statusCode);
    }
  }], cb);
};

Recharge.checkAll = function(cb) {
  winston.info('Start to check recharge status');
  var self = this;
  async.waterfall([
  function(cb) {
    RechargeDAO.findUnfinished(cb);
  },
  function(recharges, cb) {
    async.each(recharges, function(recharge, cb) {
      self.check(recharge, cb);
    }, cb);
  }], cb);
};

module.exports = Recharge;
