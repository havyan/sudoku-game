var winston = require('winston');
var start = require('../src/main/server');
start(function(server) {
  var port = config.server.port || 9191;
  server.listen(port);
  winston.info("Sudoku game is working on port " + port);
});
