var HttpError = require('../http_error');
var PropManager = require('../prop_manager');
var winston = require('winston');

module.exports = function(router) {
  router.post('/prop/buy', function(req, res, next) {
    PropManager.buy(req.session.account, req.body.type, parseInt(req.body.count), function(error, result) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send(result);
      }
    });
  });

  router.get('/prop/data', function(req, res, next) {
    PropManager.getPropData(req.session.account, function(error, data) {
      if (error) {
        next(new HttpError('Error when get prop data for account' + req.session.account + ': ' + error));
      } else {
        res.send(data);
      }
    });
  });

  router.post('/prop/reset', function(req, res, next) {
    PropManager.reset(function(error) {
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

