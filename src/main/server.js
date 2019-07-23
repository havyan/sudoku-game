var Async = require('async');
var init = require('./init');
var winston = require('winston');

winston.info("Starting sudoku game service");

module.exports = function(cb) {
  var app;
  Async.series([
    init,
    function(cb) {
      app = require('./app');
      app.init(cb);
    }
  ], function(error) {
    if (error) {
      winston.error('Error when initializing app: ' + error);
    } else {
      var server = require('http').Server(app);
      require('./event_center')(server);
      cb(server);
    }
  });
};
