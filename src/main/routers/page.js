var fs = require('fs');
var HttpError = require('../http_error');
var PropManager = require('../prop_manager');
var UserManager = require('../user_manager');
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
  router.get('/login', function(req, res, next) {
    if (req.session.account) {
      res.redirect('/main');
    } else {
      if (req.cookies.account && req.cookies.password) {
        UserDAO.findOne({
          account : req.cookies.account,
          password : req.cookies.password
        }, function(error, user) {
          if (error) {
            next(new HttpError('Error when processing auto login: ' + error));
            return;
          } else {
            req.session.account = req.cookies.account;
            res.redirect('/main');
          }
        });
      } else {
        res.render('index', {
          error : req.query.error === 'true'
        });
      }
    }
  });

  router.post('/login', function(req, res, next) {
    var password = UserDAO.encryptPassword(req.body.password);
    UserDAO.findOne({
      account : req.body.account,
      password : password
    }, function(error, user) {
      if (error) {
        next(new HttpError('Error when finding user by account ' + req.body.account + ': ' + error));
        return;
      }
      if (user) {
        if (req.body.remember_me) {
          res.cookie('account', user.account, {
            maxAge : 3600000 * 24 * 30
          });
          res.cookie('password', password, {
            maxAge : 3600000 * 24 * 30
          });
        }
        req.session.account = user.account;
        res.redirect('/main');
      } else {
        res.redirect('/login?error=true');
      }
    });
  });

  router.get('/logout', function(req, res) {
    req.session.account = undefined;
    res.clearCookie('account');
    res.clearCookie('password');
    res.redirect('/');
  });

  router.get('/main', function(req, res, next) {
    var game = global.gameManager.findGameByUser(req.session.account);
    if (game && (game.isOngoing() || game.isWaiting())) {
      res.redirect('/table/' + game.id);
    } else {
      UserDAO.findOneByAccount(req.session.account, function(error, user) {
        if (error) {
          next(new HttpError('Error when finding user by account ' + req.session.account + ': ' + error));
          return;
        }
        if (user) {
          res.render('lobby', {
            userName : user.name,
            userIcon : user.icon,
            money : user.money
          });
        } else {
          req.session.account = undefined;
          res.clearCookie('account');
          res.clearCookie('password');
          res.redirect('/');
        }
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
  router.get('/table/:id', function(req, res) {
    res.render('table', {});
  });

  router.get('/propstore', function(req, res, next) {
    PropManager.getPropData(req.session.account, function(error, data) {
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
        fs.readdir('public/imgs/default/user_icons', function(error, files) {
          if (error) {
            next(new HttpError('Error when finding user by account ' + req.body.account + ': ' + error));
          } else {
            res.render('user', {
              user : user,
              defaultIcons : files.map(function(file) {
                return '/imgs/default/user_icons/' + file;
              })
            });
          }
        });
      } else {
        next(new HttpError('No user found for account ' + req.body.account, HttpError.NOT_FOUND));
      }
    });
  });

  router.get('/signup', function(req, res, next) {
    res.render('signup', {
    });
  });

  router.get('/contact', function(req, res, next) {
    res.render('contact', {
    });
  });

  router.get('/retrieve_password', function(req, res, next) {
    res.render('retrieve_password', {
    });
  });

  router.get('/reset_password', function(req, res, next) {
    UserManager.checkResetKey(req.query.key, function(error, available, source) {
      res.render('reset_password', {
        available : available,
        key : req.query.key,
        account : source
      });
    });
  });
};

