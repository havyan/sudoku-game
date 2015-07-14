// Read system config from json
global.config = require('../../config.json');
// Initialize log
require('./log')();
var winston = require('winston');
winston.info("Starting sudoku game service");

var app = require('./app');
module.exports = function(cb) {
  app.init(function() {
    var server = require('http').Server(app);
    require('./event_center')(server);
    cb(server);
  });
}; 