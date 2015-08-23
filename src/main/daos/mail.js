var mongoose = require('mongoose');
var _ = require('lodash');
var ObjectId = mongoose.Types.ObjectId;
var async = require('async');
var Schema = mongoose.Schema;

var MailSchema = new Schema({
  from : {
    type : Schema.Types.ObjectId,
    ref : 'User'
  },
  to : {
    type : Schema.Types.ObjectId,
    ref : 'User'
  },
  title : String,
  content : String,
  date : {
    type : Date,
    default : Date.now
  },
  read : {
    type : Boolean,
    default : false
  }
});

MailSchema.statics.createMail = function(from, to, title, content, cb) {
  this.create({
    from : ObjectId(from),
    to : ObjectId(to),
    title : title,
    content : content
  }, cb);
};

MailSchema.statics.findByFrom = function(from, cb) {
  this.find({
    from : ObjectId(from)
  }).sort('-date').populate('from').populate('to').exec(cb);
};

module.exports = mongoose.model('Mail', MailSchema);
