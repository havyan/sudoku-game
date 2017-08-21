var mongoose = require('mongoose');
var _ = require('lodash');
var Async = require('async');
var Schema = mongoose.Schema;
var Mixed = Schema.Types.Mixed;
var PROP = require('./prop.json');

var PropSchema = new Schema({
  account : String,
  magnifier : Number,
  impunity : Number,
  delay : Number,
  glasses : Number,
  options_once : Number,
  options_always : Number,
  purchases : {
    type: Mixed,
    default: {
      magnifier : 0,
      impunity : 0,
      delay : 0,
      glasses : 0,
      options_once : 0,
      options_always : 0
    }
  }
});

PropSchema.statics.findOneByAccount = function(account, cb) {
  this.findOne({
    account : account
  }, cb);
};

PropSchema.statics.createDefault = function(account, predefined, cb) {
  var prop = _.cloneDeep(predefined ? PROP.predefined : PROP.normal);
  prop.account = account;
  this.create(prop, cb);
};

PropSchema.statics.reset = function(cb) {
  // this.update({}, PROP, cb);
  this.find(function(error, props) {
    if (error) {
      cb(error);
    } else {
      Async.eachSeries(props, function(prop, cb) {
        prop.update(PROP, cb);
      }, cb);
    }
  });
};

module.exports = mongoose.model('Prop', PropSchema);
