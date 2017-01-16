require('../src/main/init');
var winston = require('winston');
var mongoose = require('mongoose');

var PuzzleDAO = require('../src/main/daos/puzzle.js');

var file = global.config.args.file;

if (file) {
  winston.info('Try to import puzzles from file: ' + file);
  PuzzleDAO.importData(file, function(error) {
    if (error) {
      winston.error('Error when importing puzzles from file: ' + file);
    } else {
      winston.info('Successfully imported puzzles from file: ' + file);
    }
    mongoose.connection.close();
  });
} else {
  winston.error('No file to be imported!');
}
