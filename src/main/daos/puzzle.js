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
    name: {
      cn: '入门段',
      en: 'Entrance Level',
      jp: '开门段'
    }
  }, {
    code: 'CDD',
    name: {
      cn: '1段',
      en: 'Level 1',
      jp: '1段'
    }
  }, {
    code: 'CCD',
    name: {
      cn: '2段',
      en: 'Level 2',
      jp: '2段'
    }
  }, {
    code: 'CCC',
    name: {
      cn: '3段',
      en: 'Level 3',
      jp: '3段'
    }
  }, {
    code: 'BCC',
    name: {
      cn: '4段',
      en: 'Level 4',
      jp: '4段'
    }
  }, {
    code: 'BBC',
    name: {
      cn: '5段',
      en: 'Level 5',
      jp: '5段'
    }
  }, {
    code: 'BBB',
    name: {
      cn: '6段',
      en: 'Level 6',
      jp: '6段'
    }
  }, {
    code: 'ABB',
    name: {
      cn: '7段',
      en: 'Level 7',
      jp: '7段'
    }
  }, {
    code: 'AAB',
    name: {
      cn: '8段',
      en: 'Level 8',
      jp: '8段'
    }
  }, {
    code: 'AAA',
    name: {
      cn: '9段',
      en: 'Level 9',
      jp: '9段'
    }
  }, {
    code: 'AAAA',
    name: {
      cn: '10段',
      en: 'Level 10',
      jp: '10段'
    }
  }, {
    code: 'AAAAA',
    name: {
      cn: '11段',
      en: 'Level 11',
      jp: '11段'
    }
  }
];

module.exports = Puzzle;
