var mongoose = require('mongoose');
var _ = require('lodash');
var ObjectId = mongoose.Types.ObjectId;
var async = require('async');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
  from : {
    type : ObjectId,
    ref : 'User'
  },
  to : {
    type : ObjectId,
    ref : 'User'
  },
  title : String,
  when : {
    type : Date,
    default : Date.now
  },
  read : Boolean
});

MessageSchema.statics.findOneByAccount = function(account, cb) {
  this.findOne({
    account : account
  }, cb);
};

module.exports = mongoose.model('Message', MessageSchema);
