var HttpError = require('../http_error');
var winston = require('winston');
var Game = require('../models/game');

module.exports = function(router) {
  /* GET Game. */
  router.get('/game/:id', function(req, res, next) {
    var game = global.gameManager.findGame(req.params.id);
    if (game) {
      game = game.toJSON(req.session.account);
      res.send(game);
    } else {
      winston.error('No game for id: ' + req.params.id);
      next(new HttpError('No game for id: ' + req.params.id, HttpError.NOT_FOUND));
    }
  });

  router.put('/game/:id/status', function(req, res) {
    global.gameManager.setGameStatus(req.session.account, req.params.id, req.body.status);
    res.send({
      status : 'ok'
    });
  });

  router.post('/game/:id/message', function(req, res, next) {
    res.send(global.gameManager.addMessage(req.params.id, req.session.account, req.body.message));
  });

  router.post('/game/:id/player', function(req, res, next) {
    var index = parseInt(req.body.index);
    var params = JSON.parse(req.body.params);
    global.gameManager.playerJoin(req.params.id, req.session.account, index, params, function(error, result) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send(result);
      }
    });
  });

  router.post('/game/:id/submit', function(req, res, next) {
    global.gameManager.submit(req.params.id, req.session.account, req.body.xy, req.body.value, function(error, result) {
      if (error) {
        next(new HttpError(error, HttpError.UNAUTHORIZED));
      } else {
        res.send(result);
      }
    });
  });

  router.post('/game/:id/auto_submit', function(req, res, next) {
    global.gameManager.autoSubmit(req.params.id, req.session.account, req.body.xy, function(error, result) {
      if (error) {
        next(new HttpError(error, HttpError.UNAUTHORIZED));
      } else {
        res.send(result);
      }
    });
  });

  router.post('/game/:id/impunity', function(req, res, next) {
    global.gameManager.impunish(req.params.id, req.body.account, function(error) {
      if (error) {
        next(new HttpError(error, HttpError.UNAUTHORIZED));
      } else {
        res.send({
          status : 'ok'
        });
      }
    });
  });

  router.post('/game/:id/peep', function(req, res, next) {
    global.gameManager.peep(req.params.id, req.session.account, req.body.xy, function(error, result) {
      if (error) {
        next(new HttpError(error, HttpError.UNAUTHORIZED));
      } else {
        res.send({
          status : 'ok',
          result : result
        });
      }
    });
  });

  router.post('/game/:id/goahead', function(req, res, next) {
    global.gameManager.goahead(req.session.account, req.params.id);
    res.send({
      status : 'ok'
    });
  });

  router.post('/game/:id/quit', function(req, res, next) {
    global.gameManager.playerQuit(req.session.account, function(error) {
      if (error) {
        next(new HttpError(error));
      } else {
        winston.info(req.session.account + ' quits from game!!');
        res.send({
          status : 'ok'
        });
      }
    });
  });

  router.post('/game/:id/pass', function(req, res, next) {
    global.gameManager.pass(req.params.id, req.session.account, function(error, result) {
      if (error) {
        next(new HttpError(error, HttpError.UNAUTHORIZED));
      } else {
        res.send(result);
      }
    });
  });

  router.post('/game/:id/delay', function(req, res, next) {
    global.gameManager.delay(req.params.id, req.session.account, function(error) {
      if (error) {
        next(new HttpError(error, HttpError.UNAUTHORIZED));
      } else {
        res.send({
          status : 'ok'
        });
      }
    });
  });

  router.post('/game/:id/options_once', function(req, res, next) {
    global.gameManager.setOptionsOnce(req.params.id, req.session.account, function(error) {
      if (error) {
        next(new HttpError(error, HttpError.UNAUTHORIZED));
      } else {
        res.send({
          status : 'ok'
        });
      }
    });
  });

  router.post('/game/:id/options_always', function(req, res, next) {
    global.gameManager.setOptionsAlways(req.params.id, req.session.account, function(error) {
      if (error) {
        next(new HttpError(error, HttpError.UNAUTHORIZED));
      } else {
        res.send({
          status : 'ok'
        });
      }
    });
  });
};

