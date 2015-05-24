var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Mixed = Schema.Types.Mixed;

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
