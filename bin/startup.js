var winston = require('winston');
var server = require('../src/main/server');
var port = config.server.port || 9191;
server.listen(port);
winston.info("Sudoku game is working on port " + port);
