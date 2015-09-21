var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var common = require('./common');

var SealedIpSchema = new Schema(common({
  ip : String,
  reason : String
}));

module.exports = mongoose.model('SealedIp', SealedIpSchema);
