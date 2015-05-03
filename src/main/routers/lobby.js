var HttpError = require('../http_error');
var winston = require('winston');

module.exports = function(router) {
  router.get('/lobby/data', function(req, res, next) {
    res.send(global.gameManager.getLobbyData());
  });
};

