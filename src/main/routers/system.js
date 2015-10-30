var HttpError = require('../http_error');
var winston = require('winston');
var GameManager = require('../game_manager');

module.exports = function(router) {
  router.post('/system/reload', function(req, res, next) {
    if (global.config.admin === req.ip) {
      if (global.gameManager.hasLiveGame()) {
        res.send({
          success : false,
          reason : '有游戏在进行中，无法重置。'
        });
      } else {
        global.gameManager.reload(function(error) {
          if (error) {
            next(new HttpError('Error when init  game manager: ' + error));
          } else {
            res.send({
              success : true
            });
          }
        });
      }
    } else {
      next(new HttpError('Only administrator has the authorization.'));
    }
  });
};
