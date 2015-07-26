var mongoose = require('mongoose');
var _ = require('lodash');
var crypto = require('crypto');
var winston = require('winston');
var async = require('async');
var Schema = mongoose.Schema;
var RuleDAO = require('./rule');
var PropDAO = require('./prop');
var MONEY = 50000;

var UserSchema = new Schema({
  account : String,
  name : String,
  password : String,
  email : String,
  create_at : {
    type : Date,
    default : Date.now
  },
  icon : {
    type : String,
    default : '/imgs/default/user_icons/default.png'
  },
  grade : {
    type : String,
    default : '0'
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
  money : {
    type : Number,
    default : 5000
  }
});

UserSchema.statics.createUser = function(params, cb) {
  params = _.merge({
    password : params.account,
    email : params.account + '@supergenius.cn'
  }, params);
  params.password = this.encryptPassword(params.password);
  this.create(params, function(error) {
    if (error) {
      cb(error);
    } else {
      PropDAO.findOneByAccount(params.account, function(error, find) {
        if (error) {
          winston.error('Error happens when getting prop from db: ' + error);
          cb(error);
        } else {
          if (!find) {
            winston.info('Create prop for account [' + params.account + '] from predefined');
            PropDAO.createDefault(params.account, cb);
          } else {
            cb();
          }
        }
      });
    }
  });
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

UserSchema.statics.updateByAccount = function(account, data, cb) {
  var self = this;
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
        async.each(users, function(user, cb) {
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
      async.eachSeries(users, function(user, cb) {
        user.money = MONEY;
        user.save(cb);
      }, cb);
    }
  });
};

UserSchema.statics.encryptPassword = function(password) {
  var hasher = crypto.createHash("md5");
  hasher.update(password);
  return hasher.digest('hex');
};

UserSchema.virtual('winrate').get(function() {
  return this.rounds > 0 ? Math.round(this.wintimes / this.rounds * 100) : 0;
});

UserSchema.virtual('grade_name').get(function() {
  return RuleDAO.GRADE_NAMES[this.grade];
});

UserSchema.set('toJSON', {
  getters : true,
  virtuals : true
});

module.exports = mongoose.model('User', UserSchema);
