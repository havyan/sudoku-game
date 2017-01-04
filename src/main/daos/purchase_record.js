var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var common = require('./common');

var PurchaseRecordSchema = new Schema({
  user : {
    type : Schema.Types.ObjectId,
    ref : 'User'
  },
  prop_type : String,
  count : {
    type : Number,
    default : 0
  },
  cost : {
    type : Number,
    default : 0
  }
});

PurchaseRecordSchema.statics.createRecord = function(user, prop_type, count, cost, cb) {
  this.create({
    user : ObjectId(user),
    prop_type : prop_type,
    count : count,
    cost : cost
  }, cb);
};

PurchaseRecordSchema.plugin(common);

module.exports = mongoose.model('PurchaseRecord', PurchaseRecordSchema);
