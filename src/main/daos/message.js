var mongoose = require('mongoose');
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
  type : String
});

var InboxSchema = new Schema({
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
  },
  date : {
    type : Date,
    default : Date.now
  }
});

var Inbox = mongoose.model('Inbox', InboxSchema);

MessageSchema.statics.send = function(from, to, title, content, cb) {
  var self = this;
  to = _.isArray(to) ? to.map(function(e) {
    return ObjectId(e);
  }) : [ObjectId(to)];
  async.waterfall([
  function(cb) {
    self.create({
      from : ObjectId(from),
      to : to,
      title : title,
      content : content
    }, cb);
  },
  function(message, cb) {
    async.eachSeries(to, function(to, cb) {
      Inbox.create({
        to : to,
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

MessageSchema.statics.findByTo = function(to, start, size, cb) {
  var self = this;
  Inbox.find({
    to : ObjectId(to)
  }).skip(start).limit(size).populate('message').sort('-date').exec(function(error, results) {
    if (error) {
      cb(error);
    } else {
      async.eachSeries(results, function(result, cb) {
        self.populate(result.message, {
          path : 'from',
          select : 'account name'
        }, cb);
      }, function(error) {
        if (error) {
          cb(error);
        } else {
          cb(null, results);
        }
      });
    }
  });
};

MessageSchema.statics.countByTo = function(to, cb) {
  Inbox.count({
    to : ObjectId(to)
  }, cb);
};

module.exports = mongoose.model('Message', MessageSchema);
