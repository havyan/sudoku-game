var HttpError = require('../http_error');
var Message = require('../models/message');
var winston = require('winston');

module.exports = function(router) {
  router.get('/messages', function(req, res, next) {
    var start = req.body.start || 0;
    var size = req.body.size || 10;
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

  router.get('/messages/count', function(req, res, next) {
    Message.count(req.session.account, function(error, count) {
      if (error) {
        next(new HttpError('Error when get messages for account' + req.session.account + ': ' + error));
      } else {
        res.send({
          count : count
        });
      }
    });
  });
};
