var HttpError = require('../http_error');
var winston = require('winston');
var EVENTS = require('../events.json');

module.exports = function(router) {
  router.get('/events/system', function(req, res, next) {
    res.send(EVENTS.SYSTEM);
  });

  router.get('/events/game', function(req, res, next) {
    res.send(EVENTS.GAME);
  });
};
