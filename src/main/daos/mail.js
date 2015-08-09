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
  content : String,
  when : {
    type : Date,
    default : Date.now
  },
  read : Boolean
});

MessageSchema.statics.createBy = function(from, to, title, content, cb) {
  this.create({
    from : ObjectId(from),
    to : ObjectId(to),
    title : title,
    content : content
  }, cb);
};

module.exports = mongoose.model('Message', MessageSchema);
