var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var common = require('./common');

var PropTypeSchema = new Schema(common({
  type : String,
  name : String,
  status : Number,
  order : Number,
  func : String,
  icon : String,
  price : Number,
  sales : Number
}));

PropTypeSchema.statics.findOneByType = function(type, cb) {
  this.findOne({
    type : type
  }, cb);
};

PropTypeSchema.statics.all = function(cb) {
  this.find({}).sort('order').exec(cb);
};

module.exports = mongoose.model('PropType', PropTypeSchema);
