var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var common = require('./common');

var PropTypeSchema = new Schema(common({
  type : String,
  name : String,
  func : String,
  icon : String,
  price : Number
}));

PropTypeSchema.statics.findOneByType = function(type, cb) {
  this.findOne({
    type : type
  }, cb);
};

PropTypeSchema.statics.all = function(cb) {
  this.find({}, cb);
};

module.exports = mongoose.model('PropType', PropTypeSchema);
