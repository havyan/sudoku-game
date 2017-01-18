var HttpError = require('../http_error');
var winston = require('winston');
var _ = require('lodash');
var SealedIpDAO = require('../daos/sealed_ip')
var GameManager = require('../game_manager');

module.exports = function(router) {
  router.post('/system/reload', function(req, res, next) {
    if (global.config.admin === Utils.clientIp(req)) {
      if (global.gameManager.hasLiveGame()) {
        res.send({
          success : false,
          reason : '有游戏在进行中，无法重置。'
        });
      } else {
        global.gameManager.reload(function(error) {
          if (error) {
            next(new HttpError('Error when init game manager: ' + error));
          } else {
            res.send({
              success : true
            });
          }
        });
      }
    } else {
      next(new HttpError('Only administrator has the authorization.', HttpError.UNAUTHORIZED));
    }
  });
  router.post('/system/seal/:ip', function(req, res, next) {
    var ip = req.params.ip;
    SealedIpDAO.seal(ip, function(error) {
      if (error) {
        next(new HttpError('Error when sealing ip [' + ip + ']: ' + error));
      } else {
        res.send({
          success : true
        });
      }
    });
  });
  router.post('/system/release/:ip', function(req, res, next) {
    var ip = req.params.ip;
    SealedIpDAO.release(ip, function(error) {
      if (error) {
        next(new HttpError('Error when sealing ip [' + ip + ']: ' + error));
      } else {
        res.send({
          success : true
        });
      }
    });
  });
};
