var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PropTypeSchema = new Schema({
  type : String,
  name : String,
  func : String,
  price : Number
});

PropTypeSchema.statics.findOneByType = function(type, cb) {
  this.findOne({
    type : type
  }, cb);
};

PropTypeSchema.statics.all = function(cb) {
  this.find({}, cb);
};

module.exports = mongoose.model('PropType', PropTypeSchema);
