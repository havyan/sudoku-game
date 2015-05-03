var HttpError = require('../http_error');
var winston = require('winston');
var UserDAO = require('../daos/user');

module.exports = function(router) {
  /* GET home page. */
  router.get('/', function(req, res) {
    if (req.cookies.account) {
      req.session.account = req.cookies.account;
      res.redirect('/main');
    } else if (req.session.account) {
      res.redirect('/main');
    } else {
      res.render('index', {
        error : false
      });
    }
  });

  /* GET login page. */
  router.get('/login', function(req, res) {
    if (req.session.account) {
      res.redirect('/main');
    } else {
      if (req.cookies.account) {
        req.session.account = req.cookies.account;
        res.redirect('/main');
      } else {
        res.render('index', {
          error : req.query.nouser === 'true'
        });
      }
    }
  });

  router.post('/login', function(req, res, next) {
    UserDAO.findOneByAccount(req.body.account, function(error, user) {
      if (error) {
        next(new HttpError('Error when finding user by account ' + req.body.account + ': ' + error));
        return;
      }
      if (user) {
        if (req.body.remember_me) {
          res.cookie('account', user.account, {
            maxAge : 3600000 * 24 * 30
          });
        }
        req.session.account = user.account;
        res.redirect('/main');
      } else {
        res.redirect('/login?nouser=true');
      }
    });
  });

  router.get('/logout', function(req, res) {
    req.session.account = undefined;
    res.clearCookie('account');
    res.redirect('/');
  });

  router.get('/main', function(req, res, next) {
    var game = global.gameManager.findGameByUser(req.session.account);
    if (game && game.isOngoing()) {
      res.redirect('/table/' + game.id);
    } else {
      UserDAO.findOneByAccount(req.session.account, function(error, user) {
        if (error) {
          next(new HttpError('Error when finding user by account ' + req.session.account + ': ' + error));
          return;
        }
        res.render('lobby', {
          userName : user.name,
          money : user.money
        });
      });
    }
  });

  /* GET Setting page. */
  router.get('/setting', function(req, res) {
    res.render('setting', {
      account : req.session.account
    });
  });

  /* GET Game page. */
  router.get('/table', function(req, res, next) {
    global.gameManager.playerJoin(req.session.account, function(error, game) {
      if (error) {
        next(new HttpError('Error when adding account' + req.session.account + ' to game: ' + error));
        return;
      }
      res.redirect('/table/' + game.id);
    });
  });

  /* GET Game page. */
  router.get('/table/:id', function(req, res) {
    res.render('table', {});
  });

  router.get('/propstore', function(req, res, next) {
    global.propManager.getPropData(req.session.account, function(error, data) {
      if (error) {
        next(new HttpError('Error when get prop data for account' + req.session.account + ': ' + error));
      } else {
        res.render('propstore', data);
      }
    });
  });

  router.get('/user', function(req, res, next) {
    UserDAO.findOneByAccount(req.session.account, function(error, user) {
      if (error) {
        next(new HttpError('Error when finding user by account ' + req.body.account + ': ' + error));
      } else if (user) {
        res.render('user', user);
      } else {
        next(new HttpError('No user found for account ' + req.body.account, HttpError.NOT_FOUND));
      }
    });
  });
};

