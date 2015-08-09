var MailDAO = require('../daos/mail');

var Mail = {};

Mail.create = function(from, to, title, content, cb) {
  MailDAO.createBy(from, to, title, content, cb);
};
