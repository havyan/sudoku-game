var mongoose = require('mongoose');
var formatDate = require('dateformat');
var Schema = mongoose.Schema;
var common = require('./common');
var uuid = require('node-uuid');

var RechargeSchema = new Schema({
  trans_code : String,
  status : String,
  from : String,
  target : String,
  payuid : {
    type : String,
    default : uuid.v10
  },
  purchase : Number,
  cost : Number,
  channel : String
});

RechargeSchema.statics.createRecharge = function(params, cb) {
  params.trans_code = this.genTransCode();
  // TODO algorithm to calculate cost
  params.cost = params.purchase / 10;
  this.create(params, cb);
};

RechargeSchema.statics.countByFrom = function(from, cb) {
  this.count({
    from : from
  }, cb);
};

RechargeSchema.statics.findByRange = function(from, start, size, cb) {
  this.find({
    from : from
  }).skip(start).limit(size).sort('-createtime').exec(cb);
};

RechargeSchema.statics.genTransCode = function() {
  var date = new Date();
  var ms = date.getMilliseconds().toString();
  for (var i = 0; i < 3 - ms.length; i++) {
    ms = '0' + ms;
  }
  var random = Math.ceil(Math.random() * 1000).toString();
  for (var i = 0; i < 3 - random.length; i++) {
    random = '0' + random;
  }
  return formatDate(date, 'yyyymmddHHMMss') + ms + random;
};

RechargeSchema.plugin(common);

module.exports = mongoose.model('Recharge', RechargeSchema);
