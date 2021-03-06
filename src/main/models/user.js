var _ = require('lodash');
var fs = require('fs');
var gm = require('gm');
var Async = require('async');
var winston = require('winston');
var vcode = require('verify-code');
var emailer = require('../emailer');
var UserDAO = require('../daos/user');
var ResetKeyDAO = require('../daos/reset_key');
var ActiveKeyDAO = require('../daos/active_key');
var Guest = require('./guest');
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

User.findOneByAccount = function(account, cb) {
  if (Guest.isGuest(account)) {
    cb(null, new Guest(account));
  } else {
    UserDAO.findOneByAccount(account, cb);
  }
};

User.resetMoney = function(cb) {
  UserDAO.resetMoney(cb);
};

User.updateByAccount = function(account, json, cb) {
  UserDAO.updateByAccount(account, json, cb);
};

User.updateIconByAccount = function(account, icon, library, bound, cb) {
  if (library) {
    Async.waterfall([
    function(cb) {
      User.findOneByAccount(account, cb);
    },
    function(user, cb) {
      var oldIcon = user.icon;
      UserDAO.updateByAccount(account, {
        icon : icon
      }, cb);
      if (oldIcon.indexOf('/imgs/default/user_icons') < 0) {
        removeFile('public' + oldIcon);
      }
    },
    function(result, cb) {
      cb(null, icon);
    }], cb);
  } else {
    var fileName = icon.substring(icon.lastIndexOf('/') + 1, icon.length);
    var iconPath = ICON_DIR + '/' + fileName;
    var source = icon;
    var dest = 'public' + iconPath;
    Async.waterfall([
    function(cb) {
      gm(source).size(cb);
    },
    function(size, cb) {
      var width = size.width * bound.width;
      var height = size.height * bound.height;
      var x = size.width * bound.x;
      var y = size.height * bound.y;
      gm(source).crop(width, height, x, y).write(dest, cb);
    },
    function() {
      removeFile(source);
      User.findOneByAccount(account, _.last(arguments));
    },
    function(user, cb) {
      var oldIcon = user.icon;
      UserDAO.updateByAccount(account, {
        icon : iconPath
      }, cb);
      if (oldIcon.indexOf('/imgs/default/user_icons') < 0) {
        removeFile('public' + oldIcon);
      }
    },
    function(result, cb) {
      cb(null, iconPath);
    }], cb);
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
    User.findOneByAccount(account, function(error, user) {
      if (error) {
        cb(error);
      } else {
        cb(null, {
          exist : user != null
        });
      }
    });
  } else {
    cb('account can not be null.');
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
          exist : user != null
        });
      }
    });
  } else {
    cb('email can not be null');
  }
};

User.createUser = function(params, cb) {
  var self = this;
  Async.waterfall([
  function(cb) {
    self.checkAccount(params.account, cb);
  },
  function(result, cb) {
    if (result.exist) {
      cb('账号不合法');
    } else {
      self.checkEmail(params.email, cb);
    }
  },
  function(result, cb) {
    if (result.exist) {
      cb('邮箱不合法');
    } else {
      UserDAO.createUser(params, cb);
    }
  }], function(error) {
    if (error) {
      winston.error('Error happened when create new user: ' + error);
      cb(null, {
        success : false,
        reason : error
      });
    } else {
      cb(null, {
        success : true
      });
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
  Async.waterfall([
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
    var link = global.domain + '/reset_password?key=' + key.id;
    emailer.send({
      to : email,
      subject : '重置天才数独游戏登录密码',
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

User.clearInactiveUsers = function(cb) {
  winston.debug('Start to clear inactive users');
  Async.waterfall([
  function(cb) {
    UserDAO.findInactive(cb);
  },
  function(users, cb) {
    if (users && users.length > 0) {
      Async.eachSeries(users, function(user, cb) {
        ActiveKeyDAO.findOneBySource(user.account, function(error, key) {
          if (error) {
            cb(error);
          } else {
            if (!key) {
              winston.info('Remove inactive user [' + user.account + '].');
              user.remove(cb);
            } else {
              cb();
            }
          }
        });
      }, cb);
    } else {
      cb();
    }
  }], cb);
};

module.exports = User;
