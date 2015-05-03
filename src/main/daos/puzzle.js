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
Puzzle.LEVELS = ['DDD', 'CDD', 'CCD', 'CCC', 'BCC', 'BBC', 'BBB', 'ABB', 'AAB', 'AAA', 'AAAA', 'AAAAA', 'EEE'];

module.exports = Puzzle;
