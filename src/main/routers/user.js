var HttpError = require('../http_error');
var winston = require('winston');
var User = require('../models/user');

module.exports = function(router) {
  router.post('/user/reset_money', function(req, res, next) {
    User.resetMoney(function(error) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send({
          status : 'ok'
        });
      }
    });
  });

  router.put('/user/points', function(req, res, next) {
    User.updateByAccount(req.session.account, {
      points : req.body.points
    }, function(error, result) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send( result ? result : {
          status : 'ok'
        });
      }
    });
  });

  router.put('/user/money', function(req, res, next) {
    User.updateByAccount(req.session.account, {
      money : req.body.money
    }, function(error, result) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send({
          status : 'ok'
        });
      }
    });
  });
};

