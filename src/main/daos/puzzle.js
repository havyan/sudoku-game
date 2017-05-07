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
  level: String,
  mode: String,
  source: {
    type: String,
    unique: true
  },
  question: Mixed,
  answer: Mixed
});

PuzzleSchema.statics.findOneBySource = function(source, cb) {
  this.findOne({
    source: source
  }, cb);
};

PuzzleSchema.statics.findOneByLevel = function(level, cb) {
  this.findOne({
    level: level
  }, cb);
};

PuzzleSchema.statics.findRandomOneByLevel = function(level, cb) {
  this.aggregate([{
    $match: {
      level: level
    }
  }, {
    $sample: {
      size: 1
    }
  }], function(error, puzzles) {
    if (error) {
      cb(error);
    } else {
      if (puzzles.length > 0) {
        cb(null, puzzles[0]);
      } else {
        cb('No puzzle found for level [' + level + ']');
      }
    }
  });
};

PuzzleSchema.statics.importData = function(file, cb) {
  var self = this;
  var creations = {};
  var seed = 0;
  var rl = readline.createInterface({
    input: fs.createReadStream(file),
    output: process.stdout,
    terminal: false
  });

  var source,
    puzzle,
    lineNumber = 0,
    questionlineNumber = 0,
    answerLineNumber = 0,
    mode = GameMode.MODE9;
  var createPuzzle = function(puzzle) {
    if (puzzle && !(_.isEmpty(puzzle.question)) && !(_.isEmpty(puzzle.answer))) {
      self.findOneBySource(puzzle.source, function(error, find) {
        if (!find) {
          var key = 'puzzle' + seed++;
          winston.info('Create new puzzle: ' + JSON.stringify(puzzle));
          creations[key] = false;
          self.create(puzzle, function(error) {
            if (error) {
              winston.error("initialize puzzle error: " + error);
            }
            creations[key] = true;
          });
        }
      });
    }
  };
  rl.on('line', function(line) {
    line = line.trim();
    var sourceSymbol = line.match(/^[\w\d]+-([ABCDE]+)-[\w\d-\.]*$/);
    if (sourceSymbol) {
      createPuzzle(_.cloneDeep(puzzle));
      puzzle = {
        question: {},
        answer: {}
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
      if (lineNumber < 9) {
        parseLine(puzzle.question, lineNumber);
      } else {
        parseLine(puzzle.answer, lineNumber - 9);
      }
      lineNumber++;
    }
  });
  rl.on('close', function() {
    createPuzzle(puzzle);
    var timer = setInterval(function() {
      if (_.isEmpty(creations) || _.every(creations)) {
        clearInterval(timer);
        cb();
      }
    }, 1000);
  });
};

PuzzleSchema.plugin(common);

var Puzzle = mongoose.model('Puzzle', PuzzleSchema);
Puzzle.LEVELS = [{
  code: 'DDD',
  name: '入门段'
}, {
  code: 'CDD',
  name: '1段'
}, {
  code: 'CCD',
  name: '2段'
}, {
  code: 'CCC',
  name: '3段'
}, {
  code: 'BCC',
  name: '4段'
}, {
  code: 'BBC',
  name: '5段'
}, {
  code: 'BBB',
  name: '6段'
}, {
  code: 'ABB',
  name: '7段'
}, {
  code: 'AAB',
  name: '8段'
}, {
  code: 'AAA',
  name: '9段'
}, {
  code: 'AAAA',
  name: '10段'
}, {
  code: 'AAAAA',
  name: '11段'
}];

module.exports = Puzzle;
