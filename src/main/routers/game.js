var Async = require('async');
var HttpError = require('../http_error');
var winston = require('winston');
var GameDAO = require('../daos/game');
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

  router.get('/game/:id/status', function(req, res, next) {
    var game = global.gameManager.findGame(req.params.id);
    if (game) {
      res.send({
        result: game.status
      });
    } else {
      winston.error('No game for id: ' + req.params.id);
      next(new HttpError('No game for id: ' + req.params.id, HttpError.NOT_FOUND));
    }
  });

  router.get('/game/:id/init_cell_values', function(req, res, next) {
    var game = global.gameManager.findGame(req.params.id);
    if (game) {
      res.send(game.initCellValues);
    } else {
      winston.error('No game for id: ' + req.params.id);
      next(new HttpError('No game for id: ' + req.params.id, HttpError.NOT_FOUND));
    }
  });

  router.put('/game/:id/status', function(req, res, next) {
    global.gameManager.switchGameStatus(req.session.account, req.params.id, req.body.status, function(error) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send({
          status: 'ok'
        });
      }
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

  router.post('/single_game', function(req, res, next) {
    var params = JSON.parse(req.body.params);
    global.gameManager.createSingleGame(req.session.account, params.playMode, function(error, result) {
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

  router.post('/game/:id/goahead', function(req, res, next) {
    global.gameManager.goahead(req.session.account, req.params.id);
    res.send({
      status: 'ok'
    });
  });

  router.post('/game/:id/quit', function(req, res, next) {
    global.gameManager.playerQuit(req.session.account, function(error) {
      if (error) {
        next(new HttpError(error));
      } else {
        winston.info(req.session.account + ' quits from game!!');
        res.send({
          status: 'ok'
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

  router.post('/game/:id/prop/:type', function(req, res, next) {
    var params = JSON.parse(req.body.params);
    global.gameManager.useProp(req.params.id, req.params.type, req.session.account, params, function(error, result) {
      if (error) {
        next(new HttpError(error, HttpError.UNAUTHORIZED));
      } else {
        res.send({
          status: 'ok',
          result: result
        });
      }
    });
  });

  router.get('/game/user/unfinished', function(req, res, next) {
    var account = req.session.account;
    Async.parallel({
      single: function(cb) {
        GameDAO.findUnfinishedSingleGame(account, cb);
      },
      robot: function(cb) {
        GameDAO.findUnfinishedRobotGame(account, cb);
      }
    }, function(error, result) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send({
          status: 'ok',
          result: {
            single: result.single ? result.single.id : null,
            robot: result.robot ? result.robot.id : null,
          }
        });
      }
    });
  });

  router.post('/game/restore/:id', function(req, res, next) {
    global.gameManager.restoreGame(req.params.id, function(error) {
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
