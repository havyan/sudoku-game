var readline = require('readline');
var fs = require('fs');
var _ = require('lodash');
var winston = require('winston');
var mongoose = require('mongoose');
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
  this.aggregate([
    {
      $match: {
        level: level
      }
    }, {
      $sample: {
        size: 1
      }
    }
  ], function(error, puzzles) {
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
  var rl = readline.createInterface({input: fs.createReadStream(file), output: process.stdout, terminal: false});

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

var Puzzle = mongoose.model('Puzzle', PuzzleSchema);
Puzzle.LEVELS = [
  {
    code: 'DDD',
    name: L('app:puzzle.beginner')
  }, {
    code: 'CDD',
    name: L('app:puzzle.level1')
  }, {
    code: 'CCD',
    name: L('app:puzzle.level2')
  }, {
    code: 'CCC',
    name: L('app:puzzle.level3')
  }, {
    code: 'BCC',
    name: L('app:puzzle.level4')
  }, {
    code: 'BBC',
    name: L('app:puzzle.level5')
  }, {
    code: 'BBB',
    name: L('app:puzzle.level6')
  }, {
    code: 'ABB',
    name: L('app:puzzle.level7')
  }, {
    code: 'AAB',
    name: L('app:puzzle.level8')
  }, {
    code: 'AAA',
    name: L('app:puzzle.level9')
  }, {
    code: 'AAAA',
    name: L('app:puzzle.level10')
  }, {
    code: 'AAAAA',
    name: L('app:puzzle.level11')
  }
];

module.exports = Puzzle;
