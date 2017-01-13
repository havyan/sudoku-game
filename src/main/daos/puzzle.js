var readline = require('readline');
var fs = require('fs');
var _ = require('lodash');
var winston = require('winston');
var mongoose = require('mongoose');
var common = require('./common');
var Schema = mongoose.Schema;
var Mixed = Schema.Types.Mixed;
var GameMode = require('../models/game_mode');

var PuzzleSchema = new Schema({
  level : String,
  mode : String,
  source : String,
  question : Mixed,
  answer : Mixed
});

PuzzleSchema.statics.findOneBySource = function(source, cb) {
  this.findOne({
    source : source
  }, cb);
};

PuzzleSchema.statics.findOneByLevel = function(level, cb) {
  this.findOne({
    level : level
  }, cb);
};

PuzzleSchema.statics.findRandomOneByLevel = function(level, cb) {
  this.find({
    level : level
  }, function(error, puzzles) {
    if (error) {
      cb(error);
    } else {
      if (puzzles.length > 0) {
        cb(null, puzzles[Math.round((puzzles.length - 1) * Math.random())]);
      } else {
        cb('No puzzle found for level [' + level + ']');
      }
    }
  });
};

PuzzleSchema.statics.importData = function(file, cb) {
  var self = this;
  var rl = readline.createInterface({
    input : fs.createReadStream(file),
    output : process.stdout,
    terminal : false
  });

  var source,
      puzzle,
      lineNumber = 0,
      questionlineNumber = 0,
      answerLineNumber = 0,
      mode = GameMode.MODE9;
  rl.on('line', function(line) {
    line = line.trim();
    var sourceSymbol = line.match(/^[\w\d]+-([ABCDE]+)-[\w\d-\.]*$/);
    if (sourceSymbol) {
      if (puzzle && !(_.isEmpty(puzzle.question)) && !(_.isEmpty(puzzle.answer))) {
        var newPuzzle = _.cloneDeep(puzzle);
        self.findOneBySource(newPuzzle.source, function(error, find) {
          if (!find) {
            winston.info('Create new puzzle: ' + JSON.stringify(newPuzzle));
            self.create(newPuzzle, function(error) {
              if (error) {
                winston.error("initialize puzzle error: " + error);
              }
            });
          }
        });
      }
      puzzle = {
        question : {},
        answer : {}
      };
      puzzle.source = sourceSymbol[0];
      puzzle.level = sourceSymbol[1];
      puzzle.mode = "MODE9";
      lineNumber = 0;
      questionlineNumber = 0;
      answerLineNumber = 0;
    } else {
      var parseLine = function(data, modeIndex) {
        var grid = mode[modeIndex];
        if (grid) {
          for (var i = 0; i < line.length; i++) {
            var x = (i - Math.floor(i / 9) * 9) + grid.x;
            var y = Math.floor(i / 9) + grid.y;
            if (line[i] !== '.') {
              data[x + ',' + y] = parseInt(line[i]);
            }
          }
        }
      };
      if (lineNumber < 13) {
        if (lineNumber !== 0 && lineNumber !== 2 && lineNumber !== 10 && lineNumber !== 12) {
          parseLine(puzzle.question, questionlineNumber);
          questionlineNumber++;
        }
      } else {
        if (lineNumber !== 13 && lineNumber !== 15 && lineNumber !== 23 && lineNumber !== 25) {
          parseLine(puzzle.answer, answerLineNumber);
          answerLineNumber++;
        }
      }
      lineNumber++;
    }
  });
  rl.on('close', function() {
    cb();
  });
};

PuzzleSchema.plugin(common);

var Puzzle = mongoose.model('Puzzle', PuzzleSchema);
Puzzle.LEVELS = [{
  code : 'EEE',
  name : '入门段'
}, {
  code : 'DDD',
  name : '1段'
}, {
  code : 'CDD',
  name : '2段'
}, {
  code : 'CCD',
  name : '3段'
}, {
  code : 'CCC',
  name : '4段'
}, {
  code : 'BCC',
  name : '5段'
}, {
  code : 'BBC',
  name : '6段'
}, {
  code : 'BBB',
  name : '7段'
}, {
  code : 'ABB',
  name : '8段'
}, {
  code : 'AAB',
  name : '9段'
}, {
  code : 'AAA',
  name : '10段'
}, {
  code : 'AAAA',
  name : '11段'
}, {
  code : 'AAAAA',
  name : '12段'
}];

module.exports = Puzzle;
