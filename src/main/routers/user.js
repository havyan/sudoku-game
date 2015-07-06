var fs = require('fs');
var gm = require('gm');
var formidable = require('formidable');
var HttpError = require('../http_error');
var winston = require('winston');
var UserDAO = require('../daos/user');
var TMP_ICON_DIR = '/imgs/web/tmp';
var ICON_DIR = '/imgs/web/user_icons';

module.exports = function(router) {
  router.post('/user/reset_money', function(req, res, next) {
    UserDAO.resetMoney(function(error) {
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
    UserDAO.updateByAccount(req.session.account, {
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
    UserDAO.updateByAccount(req.session.account, {
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
    if (JSON.parse(req.body.library)) {
      UserDAO.updateByAccount(req.session.account, {
        icon : req.body.icon
      }, function(error, result) {
        if (error) {
          next(new HttpError(error));
        } else {
          res.send({
            status : 'ok',
            path : req.body.icon
          });
        }
      });
    } else {
      var fileName = req.body.icon.substring(req.body.icon.lastIndexOf('/') + 1, req.body.icon.length);
      var iconPath = ICON_DIR + '/' + fileName;
      var source = 'public' + req.body.icon;
      var dest = 'public' + iconPath;
      gm(source).size(function(error, size) {
        if (error) {
          next(new HttpError(error));
        } else {
          var bound = JSON.parse(req.body.bound);
          var width = size.width * bound.width;
          var height = size.height * bound.height;
          var x = size.width * bound.x;
          var y = size.height * bound.y;
          gm(source).crop(width, height, x, y).write(dest, function(error) {
            if (error) {
              next(new HttpError(error));
            } else {
              UserDAO.updateByAccount(req.session.account, {
                icon : iconPath
              }, function(error, result) {
                if (error) {
                  next(new HttpError(error));
                } else {
                  res.send({
                    status : 'ok',
                    path : iconPath
                  });
                }
                setTimeout(function() {
                  fs.unlink(source, function(error) {
                    if (error) {
                      winston.error(error);
                    }
                  });
                }, 1000);
              });
            }
          });
        }
      });
    }
  });

  router.post('/user/icon', function(req, res, next) {
    var form = new formidable.IncomingForm();
    form.uploadDir = 'public' + TMP_ICON_DIR;
    form.keepExtensions = true;
    form.parse(req, function(error, fields, files) {
      if (error) {
        next(new HttpError(error));
      } else {
        var path = files['files[]'].path;
        res.send({
          status : 'ok',
          path : TMP_ICON_DIR + path.substring(path.lastIndexOf('/'), path.length)
        });
        setTimeout(function() {
          fs.unlink(path, function(error) {
            if (error) {
              winston.error(error);
            }
          });
        }, 600000);
      }
    });
  });
};

