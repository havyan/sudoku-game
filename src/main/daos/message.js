var mongoose = require('mongoose');
var common = require('./common');
var _ = require('lodash');
var ObjectId = mongoose.Types.ObjectId;
var async = require('async');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
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
  deleted : {
    type : Boolean,
    default : false
  }
});

var InboxSchema = new Schema({
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
  read : {
    type : Boolean,
    default : false
  }
});

InboxSchema.plugin(common);

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
      createtime : date,
      title : title,
      content : content
    }, cb);
  },
  function(message, cb) {
    async.eachSeries(to, function(to, cb) {
      Inbox.create({
        from : ObjectId(from),
        to : to,
        createtime : date,
        message : message,
      }, cb);
    }, cb);
  }], cb);
};

MessageSchema.statics.findByFrom = function(from, cb) {
  this.find({
    from : ObjectId(from)
  }).populate('from', 'account name').populate('to', 'account name').sort('-createtime').exec(cb);
};

MessageSchema.statics.read = function(messageId, to, cb) {
  var self = this;
  Inbox.findOneAndUpdate({
    to : ObjectId(to),
    message : ObjectId(messageId)
  }, {
    read : true
  }, function(error) {
    if (error) {
      cb(error);
    } else {
      self.findOne({
        _id : ObjectId(messageId)
      }).populate('from', 'account name').populate('to', 'account name').exec(cb);
    }
  });
};

MessageSchema.statics.inbox = function(to, start, size, cb) {
  Inbox.find({
    to : ObjectId(to)
  }).skip(start).limit(size).populate('from', 'account name').populate('message', 'title').sort('-createtime').exec(cb);
};

MessageSchema.statics.inboxCount = function(to, cb) {
  Inbox.count({
    to : ObjectId(to)
  }, cb);
};

MessageSchema.statics.removeInbox = function(ids, cb) {
  var self = this;
  async.each(ids, function(id, cb) {
    async.waterfall([
    function(cb) {
      Inbox.findOneAndRemove({
        _id : ObjectId(id)
      }, cb);
    },
    function(inbox, cb) {
      Inbox.findOne({
        message : inbox.message
      }, function(error, find) {
        if (error) {
          cb(error);
        } else {
          if (find) {
            cb();
          } else {
            self.findOneAndRemove({
              _id : inbox.message,
              deleted : true
            }, cb);
          }
        }
      });
    }], cb);
  }, cb);
};

MessageSchema.plugin(common);

module.exports = mongoose.model('Message', MessageSchema);
