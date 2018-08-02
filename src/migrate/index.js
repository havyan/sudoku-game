var readline = require('readline');
var fs = require('fs');
var _ = require('lodash');
var Async = require('async');
var winston = require('winston');
var RuleDAO = require('../main/daos/rule');
var PropTypeDAO = require('../main/daos/prop_type');
var PropDAO = require('../main/daos/prop');
var UserDAO = require('../main/daos/user');
var PuzzleDAO = require('../main/daos/puzzle');
var PropDAO = require('../main/daos/prop');
var RoomDAO = require('../main/daos/room');
var TemplateDAO = require('../main/daos/template');
var AwardDAO = require('../main/daos/award');

module.exports = function(cb) {
  winston.info('Start to do db migration');
  Async.series([
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
    Async.eachSeries(propTypes, function(propType, cb) {
      PropTypeDAO.findOneByType(propType.type, function(error, find) {
        if (!find) {
          winston.info('Create prop type [' + propType.name + '] from predefined');
          PropTypeDAO.create(propType, cb);
        } else {
          if (!find.category) {
            find.category = 'sudoku';
          }
          find.save(function(error) {
            if (error) {
              winston.error('Error when update prop types: ' + error);
            }
            cb();
          });
        }
      });
    }, cb);
  },
  function(cb) {
    var initProp = require('../main/daos/prop.json').normal;
    PropDAO.find({}).exec(function(error, props) {
      if (error) {
        winston.error('Error when fetching props: ' + error);
        cb();
      } else {
        Async.eachSeries(props, function(prop, cb) {
          if (!prop.purchases) {
            prop.purchases = {};
          }
          var purchases = prop.purchases;
          for(var key in initProp) {
            if (prop[key] == undefined) {
              prop[key] = initProp[key];
            }
            if (purchases[key] == undefined) {
              purchases[key] = 0;
            }
          }
          prop.save(cb);
        }, cb);
      }
    });
  },
  function(cb) {
    var rooms = require('./predefined/rooms.json');
    Async.eachSeries(rooms.parents, function(room, cb) {
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
    Async.eachSeries(users, function(user, cb) {
      Async.series([
      function(cb) {
        UserDAO.findOneByAccount(user.account, function(error, find) {
          if (error) {
            winston.error('Error happens when getting user from db: ' + error);
            cb(error);
          } else {
            if (!find) {
              user.predefined = true;
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
    Async.eachSeries(files, function(file, cb) {
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
    Async.eachSeries(awards, function(award, cb) {
      Async.series([
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
    PuzzleDAO.importData('src/migrate/predefined/puzzles.txt', cb);
  }], cb);
};
