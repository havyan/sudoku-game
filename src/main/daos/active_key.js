var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var EXPIRES = '72h';

var ActiveKeySchema = new Schema({
  source : String,
  date : {
    type : Date,
    default : Date.now,
    expires : EXPIRES
  }
});

ActiveKeySchema.statics.createKey = function(source, cb) {
  this.create({
    source : source
  }, cb);
};

ActiveKeySchema.statics.removeKey = function(source, cb) {
  this.remove({
    source : source
  }, cb);
};

ActiveKeySchema.statics.findOneById = function(id, cb) {
  this.findOne({
    _id : ObjectId(id)
  }, cb);
};

ActiveKeySchema.statics.findOneBySource = function(source, cb) {
  this.findOne({
    source : source
  }, cb);
};

module.exports = mongoose.model('ActiveKey', ActiveKeySchema);
