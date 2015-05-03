var readline = require('readline');
var fs = require('fs');
var _ = require('lodash');
var async = require('async');
var winston = require('winston');
var RuleDAO = require('../main/daos/rule');
var UserDAO = require('../main/daos/user');
var PuzzleDAO = require('../main/daos/puzzle');
var PropDAO = require('../main/daos/prop');
var RoomDAO = require('../main/daos/room');
var GameMode = require('../main/models/game_mode');

module.exports = function() {
  winston.info('Start to do db migration');
  RuleDAO.getRule(function(error, rule) {
    if (error) {
      winston.error('Error happens when getting rule from db: ' + error);
    }
    if (!rule) {
      winston.info('Create rule from predefined');
      RuleDAO.create(require('./predefined/rule.json'));
    }
  });

  var rooms = require('./predefined/rooms.json');
  async.eachSeries(rooms, function(room, cb) {
    RoomDAO.findOneByName(room.name, function(error, find) {
      if (!find) {
        winston.info('Create room from predefined');
        RoomDAO.create(room, cb);
      } else {
        cb();
      }
    });
  }, function(error) {
    if (error) {
      winston.error('Error happens when initialize rooms: ' + error);
    }
  });

  var users = require('./predefined/users.json');
  async.eachSeries(users, function(user, cb) {
    async.series([
    function(cb) {
      UserDAO.findOneByAccount(user.account, function(error, find) {
        if (error) {
          winston.error('Error happens when getting user from db: ' + error);
          cb(error);
        } else {
          if (!find) {
            winston.info('Create user [' + user.name + '] from predefined');
            UserDAO.create(user, cb);
          } else {
            cb();
          }
        }
      });
    },
    function(cb) {
      PropDAO.findOneByAccount(user.account, function(error, find) {
        if (error) {
          winston.error('Error happens when getting prop from db: ' + error);
          cb(error);
        } else {
          if (!find) {
            winston.info('Create prop for account [' + user.account + '] from predefined');
            PropDAO.createDefault(user.account, cb);
          } else {
            cb();
          }
        }
      });
    }], function(error) {
      cb(error);
    });
  }, function(error) {
    if (error) {
      winston.error('Error happens when initialize users: ' + error);
    }
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
        PuzzleDAO.findOneBySource(newPuzzle.source, function(error, find) {
          if (!find) {
            winston.info('Create new puzzle: ' + JSON.stringify(newPuzzle));
            PuzzleDAO.create(newPuzzle, function(error) {
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
