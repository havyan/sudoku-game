var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CATEGORY = {
  SUDOKU: 'sudoku',
  TREASURE: 'treasure'
};

var PropTypeSchema = new Schema({
  type: String,
  name: {
    cn: String,
    en: String,
    jp: String
  },
  status: {
    type: String,
    default: '1'
  },
  category: {
    type: String,
    default: CATEGORY.SUDOKU
  },
  order: Number,
  func: {
    cn: String,
    en: String,
    jp: String
  },
  icon: String,
  price: Number,
  sales: {
    type: Number,
    default: 0
  }
});

PropTypeSchema.statics.findOneByType = function(type, cb) {
  this.findOne({
    type: type
  }, cb);
};

PropTypeSchema.statics.all = function(cb) {
  this.find({
    status: '1'
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
