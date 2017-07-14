var Async = require('async');
var _ = require('lodash');
var HttpError = require('../http_error');
var UserDAO = require('../daos/user');
var FeedbackDAO = require('../daos/feedback');
var winston = require('winston');

module.exports = function(router) {
  router.post('/feedback', function(req, res, next) {
    Async.waterfall([
      function(cb) {
        if (req.session.account) {
          UserDAO.findOneByAccount(req.session.account, cb);
        } else {
          cb(null, {});
        }
      },
      function(user, cb) {
        FeedbackDAO.createFeedback(user.id, req.body.content, cb);
      }
    ], function(error, result) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send({
          status: 'ok'
        });
      }
    });
  });
};
