var mongoose = require('mongoose');
var common = require('./common');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var EXPIRES = 30 * 60; 

var ResetKeySchema = new Schema(common({
  source : String,
  date : {
    type : Date,
    default : Date.now,
    expires: EXPIRES
  }
}));

ResetKeySchema.statics.createKey = function(source, cb) {
  this.create({
    source : source
  }, cb);
};

ResetKeySchema.statics.removeKey = function(source, cb) {
  this.remove({
    source : source
  }, cb);
};

ResetKeySchema.statics.findOneById = function(id, cb) {
  this.findOne({
    _id : ObjectId(id)
  }, cb);
};

module.exports = mongoose.model('ResetKey', ResetKeySchema);
