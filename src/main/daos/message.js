var mongoose = require('mongoose');
var common = require('./common');
var _ = require('lodash');
var ObjectId = mongoose.Types.ObjectId;
var async = require('async');
var Schema = mongoose.Schema;

var MessageSchema = new Schema(common({
  from : {
    type : Schema.Types.ObjectId,
    ref : 'User'
  },
  to : [{
    type : Schema.Types.ObjectId,
    ref : 'User'
  }],
  title : String,
  content : String,
  date : {
    type : Date,
    default : Date.now
  },
  type : String,
  to_type : String,
  deleted : {
    type : Boolean,
    default : false
  }
}));

var InboxSchema = new Schema(common({
  from : {
    type : Schema.Types.ObjectId,
    ref : 'User'
  },
  to : {
    type : Schema.Types.ObjectId,
    ref : 'User'
  },
  message : {
    type : Schema.Types.ObjectId,
    ref : 'Message'
  },
  title : String,
  read : {
    type : Boolean,
    default : false
  },
  date : {
    type : Date,
    default : Date.now
  }
}));

var Inbox = mongoose.model('Inbox', InboxSchema);

MessageSchema.statics.send = function(from, to, title, content, cb) {
  var self = this;
  var date = new Date();
  to = _.isArray(to) ? to.map(function(e) {
    return ObjectId(e);
  }) : [ObjectId(to)];
  async.waterfall([
  function(cb) {
    self.create({
      from : ObjectId(from),
      to : to,
      date : date,
      title : title,
      content : content
    }, cb);
  },
  function(message, cb) {
    async.eachSeries(to, function(to, cb) {
      Inbox.create({
        from : ObjectId(from),
        to : to,
        date : date,
        title : title,
        message : message,
      }, cb);
    }, cb);
  }], cb);
};

MessageSchema.statics.findByFrom = function(from, cb) {
  this.find({
    from : ObjectId(from)
  }).sort('-date').populate('from', 'account name').populate('to', 'account name').exec(cb);
};

MessageSchema.statics.inbox = function(to, start, size, cb) {
  var self = this;
  Inbox.find({
    to : ObjectId(to)
  }).skip(start).limit(size).populate('from').sort('-date').exec(cb);
};

MessageSchema.statics.inboxCount = function(to, cb) {
  Inbox.count({
    to : ObjectId(to)
  }, cb);
};

module.exports = mongoose.model('Message', MessageSchema);
