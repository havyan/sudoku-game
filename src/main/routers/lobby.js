var HttpError = require('../http_error');
var winston = require('winston');

module.exports = function(router) {
  router.get('/lobby/data', function(req, res, next) {
    global.gameManager.getLobbyData(req.session.account, function(error, data) {
      if (error) {
        next(new HttpError(error, HttpError.SERVER_ERROR));
      } else {
        res.send(data);
      }
    });
  });
};
