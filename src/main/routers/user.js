var _ = require('lodash');
var HttpError = require('../http_error');
var winston = require('winston');
var UserManager = require('../user_manager');

module.exports = function(router) {
  router.post('/user/reset_money', function(req, res, next) {
    UserManager.resetMoney(function(error) {
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
    UserManager.updateByAccount(req.session.account, {
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
    UserManager.updateByAccount(req.session.account, {
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

  router.put('/user/icon', function(req, res, next) {
    var account = req.session.account;
    var icon = req.body.icon;
    var library = JSON.parse(req.body.library);
    var bound = req.body.bound ? JSON.parse(req.body.bound) : {};
    UserManager.updateIconByAccount(account, icon, library, bound, function(error, path) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send({
          status : 'ok',
          path : path
        });
      }
    });
  });

  router.post('/user/icon', function(req, res, next) {
    UserManager.uploadIcon(req, function(error, path) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send({
          status : 'ok',
          path : path
        });
      }
    });
  });

  router.post('/user', function(req, res, next) {
    UserManager.createUser(_.cloneDeep(req.body), function(error, result) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send(result);
      }
    });
  });

  router.post('/user/check_account', function(req, res, next) {
    UserManager.checkAccount(req.body.account, function(error, result) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send(result);
      }
    });
  });

  router.post('/user/check_email', function(req, res, next) {
    UserManager.checkEmail(req.body.email, function(error, result) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send(result);
      }
    });
  });
};

