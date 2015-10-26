var HttpError = require('../http_error');
var UserDAO = require('../daos/user');
var Recharge = require('../models/recharge');
var winston = require('winston');
var formatDate = require('dateformat');
var uuid = require('node-uuid');
var _ = require('lodash');
var async = require('async');
var request = require('request');

module.exports = function(router) {
  router.get('/recharge/data', function(req, res, next) {
    UserDAO.findOneByAccount(req.session.account, function(error, user) {
      if (error) {
        next(new HttpError(error));
      } else {
        var json = user.toJSON();
        json.ip = req.ip;
        res.send({
          user : json
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
        var pay = global.config.app.pay;
        var form = {
          money : Recharge.convertCost(recharge.purchase),
          banktype : req.body.banktype,
          notifyurl : pay.notifyurl,
          site : pay.site,
          resulturl : 'http://192.168.1.1:9191/recharge/result',
          type : '0',
          useruid : user._id.toString(),
          userip : req.ip,
          username : user.name,
          useremail : user.email
        };
        var url = pay.apipay.replace('{payuid}', recharge.payuid);
        request.post(url).form(form).pipe(res);
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
    Recharge.findByAccount(req.session.account, start, size, function(error, records) {
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

