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
  name : '入门级'
}, {
  code : 'DDD',
  name : '1级'
}, {
  code : 'CDD',
  name : '2级'
}, {
  code : 'CCD',
  name : '3级'
}, {
  code : 'CCC',
  name : '4级'
}, {
  code : 'BCC',
  name : '5级'
}, {
  code : 'BBC',
  name : '6级'
}, {
  code : 'BBB',
  name : '7级'
}, {
  code : 'ABB',
  name : '8级'
}, {
  code : 'AAB',
  name : '9级'
}, {
  code : 'AAA',
  name : '10级'
}, {
  code : 'AAAA',
  name : '11级'
}, {
  code : 'AAAAA',
  name : '12级'
}];

module.exports = Puzzle;
