var UserDAO = require('../daos/user');
var MessageDAO = require('../daos/message');
var async = require('async');

var Message = {};

Message.send = function(from, to, title, content, cb) {
  MessageDAO.send(from, to, title, content, cb);
};

Message.sendFromSystem = function(to, title, content, cb) {
  async.waterfall([
  function(cb) {
    UserDAO.findSystem(cb);
  },
  function(system, cb) {
    MessageDAO.send(system.id, to, title, content, cb);
  }], cb);
};

Message.findByAccount = function(account, start, size, cb) {
  async.waterfall([
  function(cb) {
    UserDAO.findOneByAccount(account, cb);
  },
  function(user, cb) {
    MessageDAO.inbox(user.id, start, size, cb);
  }], cb);
};

Message.read = function(account, messageId, cb) {
  async.waterfall([
  function(cb) {
    UserDAO.findOneByAccount(account, cb);
  },
  function(user, cb) {
    MessageDAO.read(messageId, user.id, cb);
  }], cb);
};

Message.count = function(account, cb) {
  async.waterfall([
  function(cb) {
    UserDAO.findOneByAccount(account, cb);
  },
  function(user, cb) {
    MessageDAO.inboxCount(user.id, cb);
  }], cb);
};

Message.unreadCount = function(account, cb) {
  async.waterfall([
  function(cb) {
    UserDAO.findOneByAccount(account, cb);
  },
  function(user, cb) {
    MessageDAO.unreadCount(user.id, cb);
  }], cb);
};

Message.removeInbox = function(ids, cb) {
  MessageDAO.removeInbox(ids, cb);
};

module.exports = Message;
