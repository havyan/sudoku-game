var HttpError = require('../http_error');
var UserDAO = require('../daos/user');
var Recharge = require('../models/recharge');
var winston = require('winston');
var formatDate = require('dateformat');
var uuid = require('node-uuid');

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
        var json = recharge.toJSON();
        var pay = global.config.app.pay;
        var payuid = uuid.v1().replace(/-/g, '');
        json.apiuid = pay.apiuid;
        json.payuid = payuid;
        json.notifyurl = pay.notifyurl;
        json.apipay = pay.apipay.replace('{apiuid}', pay.apiuid).replace('{payuid}', payuid);
        json.apiquery = pay.apiquery.replace('{apiuid}', pay.apiuid).replace('{payuid}', payuid);
        res.send(json);
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

