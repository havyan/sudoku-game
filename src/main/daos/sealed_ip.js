var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var common = require('./common');

var SealedIpSchema = new Schema({
  ip : String,
  reason : String,
  sealtime : {
    type : Date,
    default : Date.now
  },
  freetime : Date
});

SealedIpSchema.plugin(common);

module.exports = mongoose.model('SealedIp', SealedIpSchema);