require('./common');
var _ = require('lodash');
var winston = require('winston');
var express = require('express');
var Async = require('async');
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
var Permission = require('./permission');

process.on('uncaughtException', function(error) {
  winston.error("UncaughtException Message: ", error.message || "Unknow error.");
  winston.error("UncaughtException stack:", error.stack || "Unknow error.");
});

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
hbs.registerPartials(app.get('conf.path.partials'));
app.set('view engine', 'html');
// 指定模板文件的后缀名为html
app.engine('html', hbs.__express);
// 运行hbs模块

// Permission handler
app.use(function(req, res, next) {
  winston.info("Start " + req.method + " " + req.path);
  Permission.check(req, function(error, proceed, page) {
    if (error) {
      next(new HttpError(error, HttpError.UNAUTHORIZED));
    } else if (proceed) {
      next();
    } else {
      page = page || '/login';
      req.session.account = undefined;
      req.params.error = true;
      res.redirect(page);
    }
  });
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
  if (err.responseType === 'json') {
    res.send(err.toJSON());
  } else {
    var error = err.error || err;
    if (error && error.stack) {
      winston.error(error.stack);
    }
    res.render('error', {
      message : err.message,
      error : error
    });
  }
});

app.init = function(cb) {
  Async.series([
  function(cb) {
    // Initialize db
    migrate(cb);
  },
  function(cb) {
    global.gameManager.init(cb);
  }], cb);
};

// Worker to process data
require('./worker');

module.exports = app;
