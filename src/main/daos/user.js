var mongoose = require('mongoose');
var _ = require('lodash');
var crypto = require('crypto');
var winston = require('winston');
var Async = require('async');
var emailer = require('../emailer');
var Schema = mongoose.Schema;
var RuleDAO = require('./rule');
var PropDAO = require('./prop');
var ActiveKeyDAO = require('./active_key');
var MONEY = 50000;
var STATUS = {
  NEW : '10',
  ACTIVE : '1',
  FROZEN : '0'
};

var UserSchema = new Schema({
  account : {
    type : String,
    unique : true
  },
  name : String,
  password : String,
  status : {
    type : String,
    default : STATUS.NEW
  },
  predefined : {
    type : Boolean,
    default : false
  },
  email : String,
  create_ip : String,
  logintime : Date,
  login_ip : String,
  icon : {
    type : String,
    default : '/imgs/default/user_icons/default.png'
  },
  grade : {
    type : Number,
    default : 0
  },
  points : {
    type : Number,
    default : 0
  },
  rounds : {
    type : Number,
    default : 0
  },
  wintimes : {
    type : Number,
    default : 0
  },
  recharge : {
    type : Boolean,
    default : false
  },
  money : {
    type : Number,
    default : 0
  }
});

UserSchema.statics.createUser = function(params, cb) {
  var self = this;
  params = _.merge({
    password : params.account,
    email : params.account + '@supergenius.cn'
  }, params);
  params.password = this.encryptPassword(params.password);
  Async.waterfall([
  function(cb) {
    self.create(params, cb);
  },
  function(user, cb) {
    PropDAO.findOneByAccount(params.account, cb);
  },
  function(find, cb) {
    if (!find) {
      winston.info('Create prop for account [' + params.account + '] from predefined');
      PropDAO.createDefault(params.account, params.predefined, cb);
    } else {
      cb(null, null);
    }
  },
  function(prop, cb) {
    if (params.status !== STATUS.ACTIVE) {
      ActiveKeyDAO.createKey(params.account, cb);
    } else {
      cb(null, null);
    }
  },
  function(key, cb) {
    if (params.status !== STATUS.ACTIVE) {
      var link = global.domain + '/active_user?key=' + key.id;
      emailer.send({
        to : params.email,
        subject : ' 激活天才数独棋账户',
        html : '<p>请点击激活来激活天才数独棋账户: <a href="' + link + '">激活</a></p>'
      }, cb);
    } else {
      cb();
    }
  }], cb);
};

UserSchema.statics.findInactive = function(cb) {
  this.find({
    status : STATUS.NEW
  }, cb);
};

UserSchema.statics.findOneByName = function(name, cb) {
  this.findOne({
    name : name
  }, cb);
};

UserSchema.statics.findOneByAccount = function(account, cb) {
  this.findOne({
    account : account
  }, cb);
};

UserSchema.statics.findSystem = function(cb) {
  this.findOneByAccount('SYSTEM', cb);
};

UserSchema.statics.updateByAccount = function(account, data, cb) {
  var self = this;
  data.updatetime = new Date();
  if (data.points !== undefined) {
    RuleDAO.getRule(function(error, rule) {
      if (error) {
        cb(error);
      } else {
        var ceilingIndex = _.findIndex(rule.grade, function(e) {
          return e.floor > data.points;
        });
        data.grade = rule.grade[ceilingIndex - 1].code;
        self.update({
          account : account
        }, data, function(error) {
          if (error) {
            cb(error);
          } else {
            cb(null, {
              status : 'ok',
              grade : data.grade,
              grade_name : RuleDAO.GRADE_NAMES[data.grade]
            });
          }
        });
      }
    });
  } else {
    this.update({
      account : account
    }, data, cb);
  }
};

UserSchema.statics.updateAllGrades = function(cb) {
  var self = this;
  RuleDAO.getRule(function(error, rule) {
    if (error) {
      cb(error);
    } else {
      self.find({}, function(error, users) {
        Async.each(users, function(user, cb) {
          var ceilingIndex = _.findIndex(rule.grade, function(e) {
            return e.floor > user.points;
          });
          user.grade = rule.grade[ceilingIndex - 1].code;
          user.save(cb);
        }, cb);
      });
    }
  });
};

UserSchema.statics.resetMoney = function(cb) {
  this.find(function(error, users) {
    if (error) {
      cb(error);
    } else {
      Async.eachSeries(users, function(user, cb) {
        user.money = MONEY;
        user.save(cb);
      }, cb);
    }
  });
};

UserSchema.statics.activeUser = function(account, cb) {
  this.update({
    account : account
  }, {
    status : STATUS.ACTIVE,
    updatetime : new Date()
  }, cb);
};

UserSchema.statics.encryptPassword = function(password) {
  var hasher = crypto.createHash("md5");
  hasher.update(password);
  return hasher.digest('hex');
};

UserSchema.virtual('winrate').get(function() {
  return this.rounds > 0 ? Math.round(this.wintimes / this.rounds * 100) : 0;
});

UserSchema.virtual('losetimes').get(function() {
  return this.rounds - this.wintimes;
});

UserSchema.virtual('grade_name').get(function() {
  return RuleDAO.GRADE_NAMES[this.grade];
});

UserSchema.set('toJSON', {
  getters : true,
  virtuals : true
});

var User = mongoose.model('User', UserSchema);
User.STATUS = STATUS;

module.exports = User;
