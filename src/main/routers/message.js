var HttpError = require('../http_error');
var Message = require('../models/message');
var winston = require('winston');
var formatDate = require('dateformat');

module.exports = function(router) {
  router.get('/messages', function(req, res, next) {
    var start = parseInt(req.query.start || 0);
    var size = parseInt(req.query.size || 10);
    Message.findByAccount(req.session.account, start, size, function(error, messages) {
      if (error) {
        next(new HttpError('Error when get messages for account' + req.session.account + ': ' + error));
      } else {
        res.send(messages.map(function(message) {
          var json = message.toJSON();
          json.date = formatDate(json.createtime, 'yyyy年mm月dd日 hh:MM:ss');
          return json;
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

  router.get('/messages/unread/count', function(req, res, next) {
    Message.unreadCount(req.session.account, function(error, count) {
      if (error) {
        next(new HttpError('Error when get messages for account' + req.session.account + ': ' + error));
      } else {
        res.send({
          count : count
        });
      }
    });
  });

  router.delete('/messages/inbox', function(req, res, next) {
    Message.removeInbox(JSON.parse(req.body.ids), function(error) {
      if (error) {
        next(new HttpError('Error when deleting inbox: ' + error));
      } else {
        res.send({
          status : 'ok'
        });
      }
    });
  });

  router.get('/message/:id', function(req, res, next) {
    Message.read(req.session.account, req.params.id, function(error, message) {
      if (error) {
        next(new HttpError('Error when read message: ' + error));
      } else {
        var json = message.toJSON();
        json.date = formatDate(json.createtime, 'yyyy年mm月dd日 hh:MM:ss');
        res.send(json);
      }
    });
  });
};
