var HttpError = require('../http_error');
var Message = require('../models/message');
var winston = require('winston');

module.exports = function(router) {
  router.get('/messages', function(req, res, next) {
    Message.findByAccount(req.session.account, function(error, messages) {
      if (error) {
        next(new HttpError('Error when get messages for account' + req.session.account + ': ' + error));
      } else {
        res.send(messages.map(function(message) {
          return message.toJSON();
        }));
      }
    });
  });
};
