var _ = require('lodash');
var fs = require('fs');
var gm = require('gm');
var async = require('async');
var formidable = require('formidable');
var winston = require('winston');
var vcode = require('verify-code');
var emailer = require('../emailer');
var UserDAO = require('../daos/user');
var ResetKeyDAO = require('../daos/reset_key');
var ActiveKeyDAO = require('../daos/active_key');
var TMP_ICON_DIR = '/imgs/web/tmp';
var ICON_DIR = '/imgs/web/user_icons';
var RESET_PASSWORD_EXPIRED = 30;

var removeFile = function(path) {
  fs.unlink(path, function(error) {
    if (error) {
      winston.error(error);
    }
  });
};

var User = {};

User.resetMoney = function(cb) {
  UserDAO.resetMoney(cb);
};

User.updateByAccount = function(account, json, cb) {
  UserDAO.updateByAccount(account, json, cb);
};

User.updateIconByAccount = function(account, icon, library, bound, cb) {
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

User.uploadIcon = function(req, cb) {
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

User.checkAccount = function(account, cb) {
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

User.checkEmail = function(email, cb) {
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

User.createUser = function(params, cb) {
  var self = this;
  this.checkAccount(params.account, function(error, result) {
    if (error) {
      cb(error);
    } else {
      if (result.valid) {
        self.checkEmail(params.email, function(error, result) {
          if (result.valid) {
            UserDAO.createUser(params, function(error) {
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

User.generateVcode = function() {
  return vcode.Generate();
};

User.resetPassword = function(account, password, key, cb) {
  var self = this;
  this.checkResetKey(key, function(error, available, source) {
    if (source === account) {
      self.updateByAccount(account, {
        password : UserDAO.encryptPassword(password)
      }, cb);
    } else {
      cb('No permission');
    }
  });
};

User.sendResetMail = function(email, cb) {
  async.waterfall([
  function(cb) {
    UserDAO.findOne({
      email : email
    }, cb);
  },
  function(user, cb) {
    if (user) {
      ResetKeyDAO.removeKey(user.account, function(error) {
        if (error) {
          cb(error);
        } else {
          ResetKeyDAO.createKey(user.account, cb);
        }
      });
    } else {
      cb('No user found for email: ' + email);
    }
  },
  function(key, cb) {
    var link = global.config.server.domain + ':' + global.config.server.port + '/reset_password?key=' + key.id;
    emailer.send({
      to : email,
      subject : '重置超天才数独游戏登录密码',
      html : '<p>请点击重置链接来重置密码: <a href="' + link + '">重置</a></p>'
    }, cb);
  }], cb);
};

User.checkResetKey = function(key, cb) {
  ResetKeyDAO.findOneById(key, function(error, resetKey) {
    if (error) {
      cb(error);
    } else {
      if (resetKey) {
        cb(null, true, resetKey.source);
      } else {
        cb(null, false);
      }
    }
  });
};

User.checkActiveKey = function(key, cb) {
  ActiveKeyDAO.findOneById(key, function(error, activeKey) {
    if (error) {
      cb(error);
    } else {
      if (activeKey) {
        UserDAO.activeUser(activeKey.source, function(error) {
          if (error) {
            cb(error);
          } else {
            cb(null, true, activeKey.source);
          }
        });
      } else {
        cb(null, false);
      }
    }
  });
};

module.exports = User;
