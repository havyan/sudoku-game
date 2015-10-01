var HttpError = require('../http_error');
var Message = require('../models/message');
var winston = require('winston');

module.exports = function(router) {
  router.get('/messages', function(req, res, next) {
    var start = parseInt(req.query.start || 0);
    var size = parseInt(req.query.size || 10);
    Message.findByAccount(req.session.account, start, size, function(error, messages) {
      if (error) {
        next(new HttpError('Error when get messages for account' + req.session.account + ': ' + error));
      } else {
        res.send(messages.map(function(message) {
          return message.toJSON();
        }));
      }
    });
  });

  router.get('/messages/total', function(req, res, next) {
    Message.count(req.session.account, function(error, count) {
      if (error) {
        next(new HttpError('Error when get messages for account' + req.session.account + ': ' + error));
      } else {
        res.send({
          total : count
        });
      }
    });
  });
};
