var fs = require('fs');
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
      var readStream = fs.createReadStream('public' + req.body.icon);
      var writeStream = fs.createWriteStream('public' + iconPath);
      readStream.pipe(writeStream);
      readStream.on('end', function() {
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
        });
      });
      readStream.on('error', function() {
        next(new HttpError('Error happen when copy icon file.'));
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
      }
    });
  });
};

