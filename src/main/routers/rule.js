var HttpError = require('../http_error');
var winston = require('winston');
var Rule = require('../models/rule');
var User = require('../models/user');

module.exports = function(router) {
  /* GET System Rule. */
  router.get('/rule', function(req, res, next) {
    Rule.getRule(function(error, rule) {
      if (error) {
        next(new HttpError(error));
        return;
      }
      res.send(rule);
    });
  });

  /* GET System Rule. */
  router.put('/rule', function(req, res, next) {
    if (global.gameManager.existsGame()) {
      res.send({
        success : false,
        reason : '有游戏正在进行中，请等待游戏结束再做修改。'
      });
    } else {
      Rule.updateRule(JSON.parse(req.body.data), function(error) {
        if (error) {
          next(new HttpError(error));
        } else {
          User.updateAllGrades(function(error) {
            if (error) {
              next(new HttpError(error));
            } else {
              res.send({
                success : true
              });
            }
          });
        }
      });
    }
  });
};

