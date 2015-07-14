var mongoose = require('mongoose');
var _ = require('lodash');
var async = require('async');
var Schema = mongoose.Schema;
var PROP = require('./prop.json');

var PropSchema = new Schema({
  account : String,
  magnifier : Number,
  impunity : Number,
  delay : Number,
  glasses : Number,
  options_once : Number,
  options_always : Number
});

PropSchema.statics.findOneByAccount = function(account, cb) {
  this.findOne({
    account : account
  }, cb);
};

PropSchema.statics.createDefault = function(account, cb) {
  var prop = _.cloneDeep(PROP);
  prop.account = account;
  this.create(prop, cb);
};

PropSchema.statics.reset = function(cb) {
  // this.update({}, PROP, cb);
  this.find(function(error, props) {
    if (error) {
      cb(error);
    } else {
      async.eachSeries(props, function(prop, cb) {
        prop.update(PROP, cb);
      }, cb);
    }
  });
};

module.exports = mongoose.model('Prop', PropSchema);
