var HttpError = require('../http_error');
var winston = require('winston');
var RuleDAO = require('../daos/rule');
var UserDAO = require('../daos/user');

module.exports = function(router) {
  /* GET System Rule. */
  router.get('/rule', function(req, res, next) {
    RuleDAO.getRule(function(error, rule) {
      if (error) {
        next(new HttpError(error));
        return;
      }
      res.send(rule);
    });
  });

  /* GET System Rule. */
  router.put('/rule', function(req, res, next) {
    if (global.gameManager.hasLiveGame()) {
      res.send({
        success : false,
        reason : '有游戏正在进行中，请等待游戏结束再做修改。'
      });
    } else {
      RuleDAO.updateRule(JSON.parse(req.body.data), function(error) {
        if (error) {
          next(new HttpError(error));
        } else {
          UserDAO.updateAllGrades(function(error) {
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

