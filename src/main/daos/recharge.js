var mongoose = require('mongoose');
var formatDate = require('dateformat');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var uuid = require('uuid');

var STATUS = {
  INIT: '9',
  PAYING: '0',
  SUCCESS: '1',
  WAITING: '2',
  FAIL: '-1'
};

var RechargeSchema = new Schema({
  trans_code: String,
  status: {
    type: String,
    default: STATUS.INIT
  },
  from: String,
  target: String,
  payuid: {
    type: String,
    default: uuid.v10
  },
  purchase: Number,
  cost: Number,
  bank: String,
  used: {
    type: Boolean,
    default: false
  }
});

RechargeSchema.statics.createRecharge = function(params, cb) {
  params.trans_code = this.genTransCode();
  this.create(params, cb);
};

RechargeSchema.statics.countByAccount = function(account, cb) {
  this.count().or([{
    from: account
  }, {
    target: account
  }]).exec(cb);
};

RechargeSchema.statics.findOneByPayuid = function(payuid, cb) {
  this.findOne({
    payuid: payuid
  }, cb);
};

RechargeSchema.statics.findOneById = function(id, cb) {
  this.findOne({
    _id: ObjectId(id)
  }, cb);
};

RechargeSchema.statics.findByRange = function(account, start, size, cb) {
  this.find().or([{
    from: account
  }, {
    target: account
  }]).skip(start).limit(size).sort('-createtime').exec(cb);
};

RechargeSchema.statics.findUnfinished = function(cb) {
  this.find({
    status: {
      $in: [STATUS.INIT, STATUS.PAYING, STATUS.WAITING]
    }
  }, cb);
};

RechargeSchema.statics.genTransCode = function() {
  var date = new Date();
  var ms = date.getMilliseconds().toString();
  for (var i = 0; i < 3 - ms.length; i++) {
    ms = '0' + ms;
  }
  var random = Math.ceil(Math.random() * 1000).toString();
  for (var i = 0; i < 3 - random.length; i++) {
    random = '0' + random;
  }
  return formatDate(date, 'yyyymmddHHMMss') + ms + random;
};

var Recharge = mongoose.model('Recharge', RechargeSchema);
Recharge.STATUS = STATUS;

module.exports = Recharge;
