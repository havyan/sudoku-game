var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var common = require('./common');

var RechargeRecordSchema = new Schema({
  trans_code : String,
  status : String,
  from_account : String,
  to_account : String,
  cost : Number,
  channel : String
});

RechargeRecordSchema.plugin(common);

module.exports = mongoose.model('RechargeRecord', RechargeRecordSchema);
