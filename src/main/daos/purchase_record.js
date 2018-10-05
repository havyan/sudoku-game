var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var PurchaseRecordSchema = new Schema({
  account: String,
  prop_type: String,
  count: {
    type: Number,
    default: 0
  },
  cost: {
    type: Number,
    default: 0
  }
});

PurchaseRecordSchema.statics.createRecord = function(account, prop_type, count, cost, cb) {
  this.create({
    account: account,
    prop_type: prop_type,
    count: count,
    cost: cost
  }, cb);
};

module.exports = mongoose.model('PurchaseRecord', PurchaseRecordSchema);
