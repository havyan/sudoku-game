var mongoose = require('mongoose');
var _ = require('lodash');
var Async = require('async');
var Schema = mongoose.Schema;
var Mixed = Schema.Types.Mixed;
var PROP = require('./prop.json');

var PropSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  account: String,
  magnifier: Number,
  impunity: Number,
  delay: Number,
  glasses: Number,
  options_once: Number,
  options_always: Number,
  scope_instrument: Number,
  nerve_gas_instrument: Number,
  asphyxiant_gas_instrument: Number,
  irritant_gas_instrument: Number,
  scope_paper: Number,
  nerve_gas_paper: Number,
  asphyxiant_gas_paper: Number,
  irritant_gas_paper: Number,
  cough_syrup: Number,
  sober_potion: Number,
  invincible_bomb: Number,
  purchases: {
    type: Mixed,
    default: {
      magnifier: 0,
      impunity: 0,
      delay: 0,
      glasses: 0,
      options_once: 0,
      options_always: 0,
      scope_instrument: 0,
      nerve_gas_instrument: 0,
      asphyxiant_gas_instrument: 0,
      irritant_gas_instrument: 0,
      scope_paper: 0,
      nerve_gas_paper: 0,
      asphyxiant_gas_paper: 0,
      irritant_gas_paper: 0,
      cough_syrup: 0,
      sober_potion: 0,
      invincible_bomb: 0
    }
  }
});

PropSchema.statics.all = function(cb) {
  this.find({}, cb);
};

PropSchema.statics.findOneByAccount = function(account, cb) {
  this.findOne({
    account: account
  }, cb);
};

PropSchema.statics.createDefault = function(user, account, predefined, cb) {
  var prop = _.cloneDeep(predefined ? PROP.predefined : PROP.normal);
  prop.user = user;
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
