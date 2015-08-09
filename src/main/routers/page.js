var fs = require('fs');
var HttpError = require('../http_error');
var Prop = require('../models/prop');
var User = require('../models/user');
var winston = require('winston');
var RoomDAO = require('../daos/room');
var UserDAO = require('../daos/user');

module.exports = function(router) {
  var autoLogin = function(req, res, next) {
    RoomDAO.allVirtuals(function(error, rooms) {
      var render = function(user) {
        res.render('index', {
          rooms : rooms,
          user : user,
          error : req.query.error === 'true'
        });
      };
      if (req.session.account) {
        UserDAO.findOneByAccount(req.session.account, function(error, user) {
          if (error) {
            next(new HttpError('Error when processing auto login: ' + error));
            return;
          } else {
            render(user);
          }
        });
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
              render(user);
            }
          });
        } else {
          render();
        }
      }
    });
  };

  /* GET home page. */
  router.get('/', function(req, res, next) {
    autoLogin(req, res, next);
  });

  /* GET login page. */
  router.get('/login', function(req, res, next) {
    autoLogin(req, res, next);
  });

  router.post('/login', function(req, res, next) {
    var password = UserDAO.encryptPassword(req.body.password);
    UserDAO.findOne({
      account : req.body.account,
      password : password,
      state : 'active'
    }, function(error, user) {
      if (error) {
        next(new HttpError('Error when finding user by account ' + req.body.account + ': ' + error));
        return;
      }
      if (user) {
        user.login_at = new Date();
        user.login_ip = req.ip;
        user.save(function(error) {
          if (error) {
            next(new HttpError('Error when finding user by account ' + req.body.account + ': ' + error));
          } else {
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
          }
        });
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
    Prop.getPropData(req.session.account, function(error, data) {
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
    User.checkResetKey(req.query.key, function(error, available, source) {
      res.render('reset_password', {
        available : available,
        key : req.query.key,
        account : source
      });
    });
  });

  router.get('/active_user', function(req, res, next) {
    User.checkActiveKey(req.query.key, function(error, available, source) {
      res.render('active_user', {
        available : available
      });
    });
  });
};

