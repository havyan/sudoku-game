var UserDAO = require('../daos/user');
var MailDAO = require('../daos/mail');
var async = require('async');

var Mail = {};

Mail.create = function(from, to, title, content, cb) {
  MailDAO.createMail(from, to, title, content, cb);
};

Mail.createBySystem = function(to, title, content, cb) {
  async.waterfall([
  function(cb) {
    UserDAO.findOneByAccount('SYSTEM', cb);
  },
  function(system, cb) {
    MailDAO.createMail(system.id, to, title, content, cb);
  }], cb);
};

Mail.findByAccount = function(account, cb) {
  async.waterfall([
  function(cb) {
    UserDAO.findOneByAccount(account, cb);
  },
  function(user, cb) {
    MailDAO.findByFrom(user.id, cb);
  }], cb);
};

module.exports = Mail;
