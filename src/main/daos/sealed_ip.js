var mongoose = require('mongoose');
var winston = require('winston');
var _ = require('lodash');
var Schema = mongoose.Schema;

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

SealedIpSchema.statics.allIps = function(cb) {
  this.find({
    released: false
  }, function(error, all) {
    if (error) {
      cb(error);
    } else {
      cb(null, _.map(all, 'ip'));
    }
  });
};

SealedIpSchema.statics.findSealedOneByIp = function(ip, cb) {
  this.findOne({
    ip: ip,
    released: false
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

module.exports = mongoose.model('SealedIp', SealedIpSchema);
