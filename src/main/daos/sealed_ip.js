var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var common = require('./common');

var SealedIpSchema = new Schema({
  ip: String,
  reason: String,
  sealtime: {
    type: Date,
    default: Date.now
  },
  released: {
    type: Boolean,
    default: false
  },
  release_time: Date
});

SealedIpSchema.statics.findSealedOneByIp = function(ip, cb) {
  this.findOne({
    ip: ip
  }, cb);
};

SealedIpSchema.statics.seal = function(ip, cb) {
  this.create({
    ip: ip
  }, cb);
};

SealedIpSchema.statics.release = function(ip, cb) {
  this.update({
    ip: ip
  }, {
    released: true
  }, cb);
};

SealedIpSchema.plugin(common);

module.exports = mongoose.model('SealedIp', SealedIpSchema);
