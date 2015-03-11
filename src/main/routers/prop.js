var HttpError = require('../http_error');
var winston = require('winston');
var Rule = require('../models/rule');

module.exports = function(router) {
  router.post('/prop/buy', function(req, res, next) {
    global.propManager.buy(req.session.account, req.body.type, parseInt(req.body.count), function(error, result) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send(result);
      }
    });
  });

  router.get('/prop/data', function(req, res, next) {
    global.propManager.getPropData(req.session.account, function(error, data) {
      if (error) {
        next(new HttpError('Error when get prop data for account' + req.session.account + ': ' + error));
      } else {
        res.send(data);
      }
    });
  });

  router.post('/prop/reset', function(req, res, next) {
    global.propManager.reset(function(error) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send({
          status : 'ok'
        });
      }
    });
  });
};

