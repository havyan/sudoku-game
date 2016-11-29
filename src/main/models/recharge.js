var async = require('async');
var _ = require('lodash');
var request = require('request');
var winston = require('winston');
var UserDAO = require('../daos/user');
var RuleDAO = require('../daos/rule');
var RechargeDAO = require('../daos/recharge');

var Recharge = {};

Recharge.convertCost = function(purchase, cb) {
  RuleDAO.getRule(function(error, rule) {
    if (error) {
      cb(error);
    } else {
      cb(null, (purchase / rule.exchange.rate).toFixed(2));
    }
  });
};

Recharge.create = function(params, cb) {
  this.convertCost(params.purchase, function(error, cost) {
    if (error) {
      cb(error);
    } else {
      params.cost = cost;
      RechargeDAO.createRecharge(params, cb);
    }
  });
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
      if (_.includes(RechargeDAO.STATUS, status)) {
        recharge.status = status;
        async.waterfall([
        function(cb) {
          recharge.save(cb);
        },
        function(recharge, count, cb) {
          UserDAO.findOneByAccount(recharge.target, cb);
        },
        function(user, cb) {
          if (status === RechargeDAO.STATUS.WAITING && !recharge.used) {
            user.money = user.money + recharge.purchase;
            user.save(function(error) {
              if (error) {
                cb(error);
              } else {
                recharge.used = true;
                recharge.save(function(error) {
                  if (error) {
                    cb(error);
                  } else {
                    cb(null, user);
                  }
                });
              }
            });
          } else {
            cb(null, user);
          }
        }], function(error, user) {
          if (error) {
            cb(error);
          } else {
            cb(null, {
              account : user.account,
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
  winston.debug('Start to check recharge status');
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
