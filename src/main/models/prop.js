var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PropSchema = new Schema({
  account : String,
  magnifier : Number,
  impunity : Number,
  delay : Number,
  money : Number
});

PropSchema.statics.findOneByAccount = function(account, cb) {
  this.findOne({
    account : account
  }, cb);
};

module.exports = mongoose.model('Prop', PropSchema);
