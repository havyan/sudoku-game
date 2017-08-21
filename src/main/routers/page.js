var fs = require('fs');
var Async = require('async');
var _ = require('lodash');
var HttpError = require('../http_error');
var Prop = require('../models/prop');
var User = require('../models/user');
var winston = require('winston');
var RoomDAO = require('../daos/room');
var UserDAO = require('../daos/user');
var RuleDAO = require('../daos/rule');
var RechargeDAO = require('../daos/recharge');
var ReferrerDAO = require('../daos/referrer');
var LoginHistoryDAO = require('../daos/login_history');
var User = require('../models/user');
var Guest = require('../models/guest');
var Message = require('../models/message');
var NewsDAO = require('../daos/news');

module.exports = function(router) {
  var login = function(req, account, password, cb) {
    var ip = Utils.clientIp(req);
    winston.info("User logged in from IP: " + ip);
    Async.waterfall([
      function(cb) {
        UserDAO.findOne({
          account: account,
          password: password,
          status: UserDAO.STATUS.ACTIVE
        }, cb);
      },
      function(user, cb) {
        if (user) {
          user.logintime = new Date();
          user.login_ip = ip;
          user.save(cb);
        } else {
          cb(null, null, 0);
        }
      },
      function(user, count, cb) {
        if (user) {
          LoginHistoryDAO.createHistory(user.id, Utils.clientIp(req), function(error) {
            if (error) {
              cb(error);
            } else {
              cb(null, user);
            }
          });
        } else {
          cb(null, null);
        }
      }
    ], cb);
  };

  var autoLogin = function(req, res, next) {
    RoomDAO.allVirtuals(function(error, rooms) {
      var render = function(user) {
        res.render('index', {
          rooms: rooms,
          user: user,
          error: req.query.error === 'true'
        });
      };
      if (req.session.account) {
        User.findOneByAccount(req.session.account, function(error, user) {
          if (error) {
            next(new HttpError('Error when processing auto login: ' + error));
            return;
          } else {
            render(user);
          }
        });
      } else {
        if (req.cookies.account && req.cookies.password) {
          login(req, req.cookies.account, req.cookies.password, function(error, user) {
            if (error) {
              next(new HttpError('Error when login by account ' + req.body.account + ': ' + error));
            } else {
              if (user) {
                req.session.account = req.cookies.account;
                render(user);
              } else {
                res.redirect('/login?error=true');
              }
            }
          });
        } else {
          render();
        }
      }
    });
  };

  var handleCommon = function(req, res, next, template) {
    User.findOneByAccount(req.session.account, function(error, user) {
      if (error) {
        next(new HttpError('Error when finding user by account ' + req.session.account + ': ' + error));
      } else {
        res.render(template, {
          account: user.account,
          userName: user.name,
          userIcon: user.icon,
          money: user.money
        });
      }
    });
  };

  /* GET home page. */
  router.get('/', function(req, res, next) {
    var referrer = req.header('Referrer');
    if (referrer) {
      if (!referrer.trim().startsWith(global.config.server.domain)) {
        winston.info('Access sudoku game from ' + referrer);
        ReferrerDAO.createReferrer(req.header('Referrer'), function(error) {
          if (error) {
            winston.error('Saving referrer with url ' + referrer + ' error: ' + error);
          }
        });
      }
    }
    res.render('welcome');
  });

  /* GET login page. */
  router.get('/login', function(req, res, next) {
    autoLogin(req, res, next);
  });

  router.post('/login', function(req, res, next) {
    var password = UserDAO.encryptPassword(req.body.password);
    login(req, req.body.account, password, function(error, user) {
      if (error) {
        next(new HttpError('Error when login by account ' + req.body.account + ': ' + error));
      } else {
        if (user) {
          if (req.body.remember_me) {
            res.cookie('account', user.account, {
              maxAge: 3600000 * 24 * 30
            });
            res.cookie('password', password, {
              maxAge: 3600000 * 24 * 30
            });
          }
          req.session.account = user.account;
          res.redirect('/main');
        } else {
          res.redirect('/login?error=true');
        }
      }
    });
  });

  router.get('/guest_pass', function(req, res, next) {
    if (!req.session.account) {
      req.session.account = Guest.genid();
    }
    res.redirect('/main');
  });

  var logout = function(req, res) {
    var account = req.session.account;
    if (account) {
      winston.info('Try to quit ongoing game before logout');
      global.gameManager.playerQuit(account, function(error) {
        if (error) {
          winston.error('Error when quiting game before logout with account: ' + account);
        }
      });
      req.session.account = undefined;
    }
    res.clearCookie('account');
    res.clearCookie('password');
  };

  router.get('/logout', function(req, res) {
    logout(req, res);
    res.redirect('/login');
  });

  router.get('/logout_signup', function(req, res) {
    logout(req, res);
    res.redirect('/signup');
  });

  router.get('/main', function(req, res, next) {
    Async.parallel([
      function(cb) {
        User.findOneByAccount(req.session.account, cb);
      },
      function(cb) {
        if (Guest.isGuest(req.session.account)) {
          cb(null, 0);
        } else {
          Message.unreadCount(req.session.account, cb);
        }
      }
    ], function(error, results) {
      if (error) {
        next(new HttpError('Error when init main by account ' + req.session.account + ': ' + error));
        return;
      }
      var user = results[0];
      if (user) {
        res.render('lobby', {
          account: user.account,
          isGuest: user.isGuest,
          userName: user.name,
          isAdmin: user.account === 'SYSTEM',
          userIcon: user.icon,
          money: user.money,
          unreadMessagesCount: results[1]
        });
      } else {
        req.session.account = undefined;
        res.clearCookie('account');
        res.clearCookie('password');
        res.redirect('/');
      }
    });
  });

  /* GET Setting page. */
  router.get('/setting', function(req, res, next) {
    handleCommon(req, res, next, 'setting');
  });

  /* GET Game page. */
  router.get('/table/:id', function(req, res) {
    res.render('table', {});
  });

  router.get('/view/props', function(req, res, next) {
    Prop.getPropData(req.session.account, function(error, data) {
      if (error) {
        next(new HttpError('Error when get prop data for account' + req.session.account + ': ' + error));
      } else {
        res.render('props', data);
      }
    });
  });

  router.get('/view/user', function(req, res, next) {
    User.findOneByAccount(req.session.account, function(error, user) {
      if (error) {
        next(new HttpError('Error when finding user by account ' + req.body.account + ': ' + error));
      } else if (user) {
        fs.readdir('public/imgs/default/user_icons', function(error, files) {
          if (error) {
            next(new HttpError('Error when finding user by account ' + req.body.account + ': ' + error));
          } else {
            files = files.filter(function(file) {
              return file !== 'robot.png';
            });
            res.render('user', {
              user: user,
              isAdmin: user.account === 'SYSTEM',
              defaultIcons: files.map(function(file) {
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
    res.render('signup', {});
  });

  router.get('/contact', function(req, res, next) {
    res.render('contact', {});
  });

  router.get('/retrieve_password', function(req, res, next) {
    res.render('retrieve_password', {});
  });

  router.get('/reset_password', function(req, res, next) {
    User.checkResetKey(req.query.key, function(error, available, source) {
      res.render('reset_password', {
        available: available,
        key: req.query.key,
        account: source
      });
    });
  });

  router.get('/active_user', function(req, res, next) {
    User.checkActiveKey(req.query.key, function(error, available, source) {
      res.render('active_user', {
        available: available
      });
    });
  });

  router.get('/view/messages', function(req, res, next) {
    handleCommon(req, res, next, 'messages');
  });

  router.get('/view/recharge', function(req, res, next) {
    handleCommon(req, res, next, 'recharge');
  });

  router.get('/help', function(req, res, next) {
    Async.parallel([
      function(cb) {
        if (req.session.account) {
          User.findOneByAccount(req.session.account, cb);
        } else {
          cb(null, {});
        }
      },
      function(cb) {
        RuleDAO.getRule(cb);
      }
    ], function(error, results) {
      if (error) {
        next(new HttpError('Error when finding user by account ' + req.session.account + ': ' + error));
      } else {
        var user = results[0],
          rule = results[1];
        res.render('help', {
          loggedin: req.session.account != null,
          userName: user.name,
          userIcon: user.icon,
          isAdmin: user.account === 'SYSTEM',
          money: user.money,
          grade: rule.grade,
          score: _.merge({
            stepDuration: _.find(rule.score.add, {
              selected: true
            }).total
          }, rule.score),
          exchange: rule.exchange
        });
      }
    });
  });

  router.get('/video', function(req, res, next) {
    res.render('video', {});
  });

  router.get('/view/recharge/pay/:id', function(req, res, next) {
    Async.parallel([
      function(cb) {
        User.findOneByAccount(req.session.account, cb);
      },
      function(cb) {
        RechargeDAO.findOneByPayuid(req.params.id, cb);
      }
    ], function(error, results) {
      if (error) {
        next(new HttpError('Error when finding user or recharge: ' + error));
      } else {
        var user = results[0];
        var recharge = results[1];
        res.render('pay_result', {
          userName: user.name,
          userIcon: user.icon,
          money: user.money
        });
      }
    });
  });

  router.get('/about', function(req, res, next) {
    res.render('about', {});
  });

  router.get('/operation', function(req, res, next) {
    res.render('operation', {});
  });

  router.get('/guide', function(req, res, next) {
    res.render('guide', {});
  });

  router.get('/news', function(req, res, next) {
        NewsDAO.find({},function(error, results) {
          if (error) {
            next(new HttpError('Error when finding user or recharge: ' + error));
          } else {
            var news = results;
                res.render('news', {
                  news : news,
                });
          }
        }
      ).sort({'createtime':-1});
  });

  router.get('/news/:id', function(req, res, next) {
    Async.parallel([
      function(cb) {
        NewsDAO.findOneById(req.params.id, cb);
      }
    ], function(error, results) {
      if (error) {
        next(new HttpError('Error when finding user or recharge: ' + error));
      } else {
        var news = results[0];
        res.render('newsdetails', {
          newsTitle: news.title,
          newsAuthor: news.author,
          newsCreatetime: news.createtime,
          newsContent: news.content,
        });
      }
    });
  });

};
