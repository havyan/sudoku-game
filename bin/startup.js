var winston = require('winston');
var start = require('../src/main/server');
start(function(server) {
  var host = config.server.host || '0.0.0.0';
  var port = config.server.port || 9191;
  server.listen(port, host);
  winston.info("Sudoku game is working on " + host + ':' + port);
});
