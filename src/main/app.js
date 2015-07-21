var _ = require('lodash');
var winston = require('winston');
var express = require('express');
var async = require('async');
var app = express();
var path = require('path');
var hbs = require('hbs');
// 加载hbs模块
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var HttpError = require('./http_error');
var config = require('./config');
var route = require('./route');
var migrate = require('../migrate');
var GameManager = require('./game_manager');
var IGNORED_CHECK_ACTIONS = ['GET /', 'GET /login', 'POST /login',
                             'GET /signup', 'POST /user', 'POST /user/check_account',
                             'POST /user/check_email', 'GET /user/vcode', 'GET /contact',
                             'POST /user/check_vcode'];

hbs.localsAsTemplateData(app);
config.initialize(app);

global.gameManager = new GameManager();

app.use(favicon(app.get('conf.path.favicon')));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended : false
}));
app.use(bodyParser.json());
app.use(session({
  secret : 'keyboard cat',
  resave : false,
  saveUninitialized : true
}));

app.use(express.static(app.get('conf.path.public')));
app.set('views', app.get('conf.path.views'));

//hbs.registerHelper('helper_name', function(...) { ... });
hbs.registerPartials(app.get('conf.path.viewlibs'));
app.set('view engine', 'html');
// 指定模板文件的后缀名为html
app.engine('html', hbs.__express);
// 运行hbs模块

// authority handler
app.use(function(req, res, next) {
  var action = req.method + " " + req.path;
  winston.info("Start " + action);
  if (!_.contains(IGNORED_CHECK_ACTIONS, action) && !req.session.account) {
    req.params.error = true;
    res.redirect('/login');
  } else {
    next();
  }
});

route.initialize(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(new HttpError(req.method + ' ' + req.url + ' Not Found', HttpError.NOT_FOUND));
});

var env = app.get('env');
app.use(function(err, req, res, next) {
  res.status(err.status || HttpError.SERVER_ERROR);
  winston.error(err.message);
  res.render('error', {
    message : err.message,
    error : env === 'development' ? (err.error || err) : {}
  });
});

app.init = function(cb) {
  async.series([
  function(cb) {
    // Initialize db
    migrate(cb);
  },
  function(cb) {
    global.gameManager.init(cb);
  }], cb);
};

module.exports = app;
