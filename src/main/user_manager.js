var _ = require('lodash');
var fs = require('fs');
var gm = require('gm');
var formidable = require('formidable');
var winston = require('winston');
var crypto = require('crypto');
var UserDAO = require('./daos/user');
var TMP_ICON_DIR = '/imgs/web/tmp';
var ICON_DIR = '/imgs/web/user_icons';

var removeFile = function(path) {
  fs.unlink(path, function(error) {
    if (error) {
      winston.error(error);
    }
  });
};

var UserManager = {};

UserManager.resetMoney = function(cb) {
  UserDAO.resetMoney(cb);
};

UserManager.updateByAccount = function(account, json, cb) {
  UserDAO.updateByAccount(account, json, cb);
};

UserManager.updateIconByAccount = function(account, icon, library, bound, cb) {
  if (library) {
    UserDAO.findOneByAccount(account, function(error, user) {
      if (error) {
        cb(error);
      } else {
        var oldIcon = user.icon;
        UserDAO.updateByAccount(account, {
          icon : icon
        }, function(error, result) {
          if (error) {
            cb(error);
          } else {
            cb(null, icon);
          }
        });
        if (oldIcon.indexOf('/imgs/default/user_icons') < 0) {
          removeFile('public' + oldIcon);
        }
      }
    });
  } else {
    var fileName = icon.substring(icon.lastIndexOf('/') + 1, icon.length);
    var iconPath = ICON_DIR + '/' + fileName;
    var source = 'public' + icon;
    var dest = 'public' + iconPath;
    gm(source).size(function(error, size) {
      if (error) {
        cb(error);
      } else {
        var width = size.width * bound.width;
        var height = size.height * bound.height;
        var x = size.width * bound.x;
        var y = size.height * bound.y;
        gm(source).crop(width, height, x, y).write(dest, function(error) {
          if (error) {
            cb(error);
          } else {
            UserDAO.findOneByAccount(account, function(error, user) {
              if (error) {
                cb(error);
              } else {
                var oldIcon = user.icon;
                UserDAO.updateByAccount(account, {
                  icon : iconPath
                }, function(error, result) {
                  if (error) {
                    cb(error);
                  } else {
                    cb(null, iconPath);
                  }
                });
                if (oldIcon.indexOf('/imgs/default/user_icons') < 0) {
                  removeFile('public' + oldIcon);
                }
              }
            });
          }
          setTimeout(function() {
            removeFile(source);
          }, 1000);
        });
      }
    });
  }
};

UserManager.uploadIcon = function(req, cb) {
  var form = new formidable.IncomingForm();
  form.uploadDir = 'public' + TMP_ICON_DIR;
  form.keepExtensions = true;
  form.parse(req, function(error, fields, files) {
    if (error) {
      cb(error);
    } else {
      var path = files['files[]'].path;
      setTimeout(function() {
        removeFile(path);
      }, 600000);
      cb(null, TMP_ICON_DIR + '/' + _.last(path.split(/[/\\]/)));
    }
  });
};

UserManager.checkAccount = function(account, cb) {
  if (account) {
    UserDAO.findOneByAccount(account, function(error, user) {
      if (error) {
        cb(error);
      } else {
        cb(null, {
          valid : user == null
        });
      }
    });
  } else {
    cb(null, {
      valid : false
    });
  }
};

UserManager.checkEmail = function(email, cb) {
  if (email) {
    UserDAO.findOne({
      email : email
    }, function(error, user) {
      if (error) {
        cb(error);
      } else {
        cb(null, {
          valid : user == null
        });
      }
    });
  } else {
    cb(null, {
      valid : false
    });
  }
};

UserManager.createUser = function(params, cb) {
  var self = this;
  this.checkAccount(params.account, function(error, result) {
    if (error) {
      cb(error);
    } else {
      if (result.valid) {
        self.checkEmail(params.email, function(error, result) {
          if (result.valid) {
            params.password = self.encryptPassword(params.password);
            UserDAO.create(params, function(error) {
              if (error) {
                cb(error);
              } else {
                cb(null, {
                  success : true
                });
              }
            });
          } else {
            cb(null, {
              success : false,
              reason : '邮箱不合法'
            });
          }
        });
      } else {
        cb(null, {
          success : false,
          reason : '账号不合法'
        });
      }
    }
  });
};

UserManager.encryptPassword = function(password) {
  var hasher = crypto.createHash("md5");
  hasher.update(password);
  return hasher.digest('hex');
};

module.exports = UserManager;
