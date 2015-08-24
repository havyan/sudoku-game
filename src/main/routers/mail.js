var HttpError = require('../http_error');
var Mail = require('../models/mail');
var winston = require('winston');

module.exports = function(router) {
  router.get('/mails', function(req, res, next) {
    Mail.findByAccount(req.session.account, function(error, mails) {
      if (error) {
        next(new HttpError('Error when get mails for account' + req.session.account + ': ' + error));
      } else {
        res.send(mails.map(function(mail) {
          return mail.toJSON();
        }));
      }
    });
  });
};
