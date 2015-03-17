var HttpError = require('../http_error');
var winston = require('winston');

module.exports = function(router) {
  router.post('/user/reset_money', function(req, res, next) {
    global.userManager.resetMoney(function(error) {
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

