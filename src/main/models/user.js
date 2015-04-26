var mongoose = require('mongoose');
var _ = require('lodash');
var async = require('async');
var Schema = mongoose.Schema;
var Rule = require('./rule');
var MONEY = 50000;

var UserSchema = new Schema({
  account : String,
  name : String,
  grade : String,
  points : Number,
  rounds : Number,
  wintimes : Number,
  money : Number
});

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
    Rule.getRule(function(error, rule) {
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
              grade_name : Rule.GRADE_NAMES[data.grade]
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
  Rule.getRule(function(error, rule) {
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

UserSchema.virtual('winrate').get(function() {
  return this.rounds > 0 ? Math.round(this.wintimes / this.rounds * 100) : 0;
});

UserSchema.virtual('grade_name').get(function() {
  return Rule.GRADE_NAMES[this.grade];
});

UserSchema.set('toJSON', {
  getters : true,
  virtuals : true
});

module.exports = mongoose.model('User', UserSchema);
