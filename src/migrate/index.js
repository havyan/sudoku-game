var readline = require('readline');
var fs = require('fs');
var _ = require('lodash');
var winston = require('winston');
var Rule = require('../main/models/rule');
var User = require('../main/models/user');
var Puzzle = require('../main/models/puzzle');
var GameMode = require('../main/models/game_mode');

module.exports = function() {
	winston.info('Start to do db migration');
	Rule.getRule(function(error, rule) {
		if (error) {
			winston.error('Error happens when getting rule from db: ' + error);
		}
		if (!rule) {
			winston.info('Create rule from predefined');
			Rule.create(require('./predefined/rule.json'));
		}
	});

	var users = require('./predefined/users.json');
	users.forEach(function(user) {
		User.findOneByAccount(user.account, function(error, find) {
			if (error) {
				winston.error('Error happens when getting user from db: ' + error);
			}
			if (!find) {
				winston.info('Create user [' + user.name + '] from predefined');
				User.create(user);
			}
		});
	});

	var rl = readline.createInterface({
		input : fs.createReadStream('src/migrate/predefined/puzzles.txt'),
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
				rl.pause();
				var newPuzzle = _.cloneDeep(puzzle);
				Puzzle.findOneBySource(newPuzzle.source, function(error, find) {
					if (!find) {
						winston.info('Create new puzzle: ' + JSON.stringify(newPuzzle));
						Puzzle.create(newPuzzle, function(error) {
							if (error) {
								winston.error("initialize puzzle error: " + error);
							}
							rl.resume();
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
};
