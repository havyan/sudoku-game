require('../src/main/init');
var winston = require('winston');
var fs = require('fs');
var async = require('async');
var mongoose = require('mongoose');

var PuzzleDAO = require('../src/main/daos/puzzle.js');

var target = global.config.args.target;
var done = function(error) {
  if (error) {
    winston.error('Error when importing puzzles from target: ' + target);
  } else {
    winston.info('Successfully imported puzzles from target: ' + target);
  }
  mongoose.connection.close();
};

if (target) {
  winston.info('Try to import puzzles from target: ' + target);
  async.waterfall([
    function(cb) {
      fs.stat(target, cb);
    },
    function(stats, cb) {
      if (stats.isDirectory()) {
        async.waterfall([
          function(cb) {
            fs.readdir(target, cb);
          },
          function(files, cb) {
            async.eachSeries(files, function(file, cb) {
              file = target + '/' + file;
              winston.info('Start to import puzzles from file: ' + file);
              PuzzleDAO.importData(file, cb);
            }, cb);
          }
        ], cb);
      } else {
        PuzzleDAO.importData(target, cb);
      }
    }
  ], done);
} else {
  winston.error('No puzzles to be imported!');
}
