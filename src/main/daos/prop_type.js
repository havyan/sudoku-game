var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PropTypeSchema = new Schema({
  type : String,
  name : String,
  status : {
    type : String,
    default : '1'
  },
  order : Number,
  func : String,
  icon : String,
  price : Number,
  sales : {
    type : Number,
    default : 0
  }
});

PropTypeSchema.statics.findOneByType = function(type, cb) {
  this.findOne({
    type : type
  }, cb);
};

PropTypeSchema.statics.all = function(cb) {
  this.find({
    status : '1'
  }).sort('order').exec(cb);
};

PropTypeSchema.statics.addSales = function(type, add, cb) {
  this.findOneByType(type, function(error, propType) {
    if (error) {
      cb(error);
    } else {
      propType.sales = propType.sales + add;
      propType.save(cb);
    }
  });
};

module.exports = mongoose.model('PropType', PropTypeSchema);
