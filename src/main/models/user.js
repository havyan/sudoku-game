var mongoose = require('mongoose');
var async = require('async');
var Schema = mongoose.Schema;
var MONEY = 50000;

var UserSchema = new Schema({
  account : String,
  name : String,
  grade : Number,
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
  this.update({
    account : account
  }, data, cb);
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

module.exports = mongoose.model('User', UserSchema);
