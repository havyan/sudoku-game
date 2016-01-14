var HttpError = require('../http_error');
var UserDAO = require('../daos/user');
var RuleDAO = require('../daos/rule');
var Recharge = require('../models/recharge');
var winston = require('winston');
var formatDate = require('dateformat');
var uuid = require('node-uuid');
var _ = require('lodash');
var async = require('async');
var request = require('request');

module.exports = function(router) {
  router.get('/recharge/data', function(req, res, next) {
    async.parallel([
    function(cb) {
      UserDAO.findOneByAccount(req.session.account, cb);
    },
    function(cb) {
      RuleDAO.getRule(cb);
    }], function(error, results) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send({
          user : results[0],
          rule : results[1]
        });
      }
    });
  });

  router.post('/recharge', function(req, res, next) {
    var data = JSON.parse(req.body.data);
    Recharge.create(data, function(error, recharge) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send(recharge.toJSON());
      }
    });
  });

  router.get('/recharge/pay/:id/status', function(req, res, next) {
    Recharge.checkByPayuid(req.params.id, function(error, result) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send(result);
      }
    });
  });

  router.get('/recharge/pay/:id/result', function(req, res, next) {
    Recharge.checkByPayuid(req.params.id, function(error, result) {
      if (error) {
        next(new HttpError(error));
      } else {
        if (result.status === '1' || result.status === '2') {
          res.send({
            result : 0
          });
        } else {
          res.send({
            result : 1
          });
        }
      }
    });
  });

  router.post('/recharge/:id/pay', function(req, res, next) {
    async.parallel([
    function(cb) {
      UserDAO.findOneByAccount(req.session.account, cb);
    },
    function(cb) {
      Recharge.findOneById(req.params.id, cb);
    }], function(error, results) {
      if (error) {
        next(new HttpError(error));
      } else {
        var user = results[0];
        var recharge = results[1];
        recharge.bank = req.body.banktype;
        recharge.save(function(error) {
          if (error) {
            next(new HttpError(error));
          } else {
            var pay = global.config.app.pay;
            var form = {
              money : recharge.cost, // TODO need to recaculate for security
              banktype : req.body.banktype,
              notifyurl : global.domain + pay.notifyurl.replace('{payuid}', recharge.payuid),
              site : pay.site,
              resulturl : global.domain + pay.resulturl.replace('{payuid}', recharge.payuid),
              type : '0',
              useruid : user._id.toString(),
              userip : _.ip(req.ip),
              username : user.name,
              useremail : user.email
            };
            var url = pay.apipay.replace('{payuid}', recharge.payuid);
            request.post(url).form(form).pipe(res);
          }
        });
      }
    });
  });

  router.get('/recharge/records/total', function(req, res, next) {
    Recharge.count(req.session.account, function(error, count) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send({
          total : count
        });
      }
    });
  });

  router.get('/recharge/records', function(req, res, next) {
    var start = parseInt(req.query.start || 0);
    var size = parseInt(req.query.size || 10);
    async.waterfall([
    function(cb) {
      Recharge.checkAll(cb);
    },
    function(cb) {
      Recharge.findByAccount(req.session.account, start, size, cb);
    }], function(error, records) {
      if (error) {
        next(new HttpError('Error when get recharge records for account' + req.session.account + ': ' + error));
      } else {
        res.send(records.map(function(record) {
          var json = record.toJSON();
          json.date = formatDate(json.createtime, 'yyyy年mm月dd日 hh:MM:ss');
          return json;
        }));
      }
    });
  });
};

