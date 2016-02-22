var readline = require('readline');
var fs = require('fs');
var _ = require('lodash');
var async = require('async');
var winston = require('winston');
var RuleDAO = require('../main/daos/rule');
var PropTypeDAO = require('../main/daos/prop_type');
var UserDAO = require('../main/daos/user');
var PuzzleDAO = require('../main/daos/puzzle');
var PropDAO = require('../main/daos/prop');
var RoomDAO = require('../main/daos/room');
var TemplateDAO = require('../main/daos/template');
var AwardDAO = require('../main/daos/award');
var GameMode = require('../main/models/game_mode');

module.exports = function(cb) {
  winston.info('Start to do db migration');
  async.series([
  function(cb) {
    RuleDAO.getRule(function(error, rule) {
      if (error) {
        winston.error('Error happens when getting rule from db: ' + error);
        cb(error);
      } else {
        if (!rule) {
          winston.info('Create rule from predefined');
          RuleDAO.create(require('./predefined/rule.json'), cb);
        } else {
          cb();
        }
      }
    });
  },
  function(cb) {
    var propTypes = require('./predefined/prop_types.json');
    async.eachSeries(propTypes, function(propType, cb) {
      PropTypeDAO.findOneByType(propType.type, function(error, find) {
        if (!find) {
          winston.info('Create prop type [' + propType.name + '] from predefined');
          PropTypeDAO.create(propType, cb);
        } else {
          cb();
        }
      });
    }, cb);
  },
  function(cb) {
    var rooms = require('./predefined/rooms.json');
    async.eachSeries(rooms.parents, function(room, cb) {
      RoomDAO.findOneByName(room.name, function(error, find) {
        if (!find) {
          winston.info('Create room [' + room.name + '] from predefined');
          RoomDAO.create(room, function(error, room) {
            if (error) {
              cb(error);
            } {
              var children = _.cloneDeep(rooms.children);
              children.forEach(function(child) {
                child.parent = room.id;
              });
              winston.info('Create child rooms [' + JSON.stringify(children) + '] from predefined');
              RoomDAO.create(children, cb);
            }
          });
        } else {
          cb();
        }
      });
    }, cb);
  },
  function(cb) {
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
              UserDAO.createUser(user, cb);
            } else {
              cb();
            }
          }
        });
      }], function(error) {
        cb(error);
      });
    }, cb);
  },
  function(cb) {
    var templateDir = 'src/migrate/predefined/templates';
    var files = fs.readdirSync(templateDir);
    async.eachSeries(files, function(file, cb) {
      var code = file.substr(0, file.lastIndexOf('.'));
      TemplateDAO.findOneByCode(code, function(error, find) {
        if (error) {
          cb(error);
        } else {
          if (find) {
            cb();
          } else {
            var content = fs.readFileSync(templateDir + '/' + file, "utf-8");
            winston.info('Create template [' + code + '] from predefined.');
            TemplateDAO.create({
              code : code,
              content : content
            }, cb);
          }
        }
      });
    }, cb);
  },
  function(cb) {
    var awards = require('./predefined/awards.json');
    async.eachSeries(awards, function(award, cb) {
      async.series([
      function(cb) {
        AwardDAO.findOneByCode(award.code, function(error, find) {
          if (error) {
            winston.error('Error happens when getting award from db: ' + error);
            cb(error);
          } else {
            if (!find) {
              winston.info('Create Award [' + award.code + '] from predefined');
              AwardDAO.create(award, cb);
            } else {
              cb();
            }
          }
        });
      }], function(error) {
        cb(error);
      });
    }, cb);
  },
  function(cb) {
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
          var newPuzzle = _.cloneDeep(puzzle);
          PuzzleDAO.findOneBySource(newPuzzle.source, function(error, find) {
            if (!find) {
              winston.info('Create new puzzle: ' + JSON.stringify(newPuzzle));
              PuzzleDAO.create(newPuzzle, function(error) {
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
  }], cb);
};
