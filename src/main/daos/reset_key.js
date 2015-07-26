var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var ResetKeySchema = new Schema({
  source : String,
  date : {
    type : Date,
    default : Date.now
  }
});

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
