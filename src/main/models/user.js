var mongoose = require('mongoose');
var _ = require('lodash');
var async = require('async');
var Schema = mongoose.Schema;
var Rule = require('./rule');
var MONEY = 50000;
var GRADE_NAMES = {
  "0" : "新手",
  "1" : "一段",
  "2" : "二段",
  "3" : "三段",
  "4" : "四段",
  "5" : "五段",
  "6" : "六段",
  "7" : "七段",
  "8" : "八段",
  "9" : "九段"
};

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
        var ruleJSON = rule.toJSON();
        data.grade = _.findKey(ruleJSON.grade, function(value) {
          return value > data.points;
        });
        self.update({
          account : account
        }, data, cb);
      }
    });
  } else {
    this.update({
      account : account
    }, data, cb);
  }
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
  return GRADE_NAMES[this.grade];
});

UserSchema.set('toJSON', {
  getters : true,
  virtuals : true
});

module.exports = mongoose.model('User', UserSchema);
