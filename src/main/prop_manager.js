var _ = require('lodash');
var PropDAO = require('./daos/prop');
var UserDAO = require('./daos/user');

var PROP_TYPES = require('./models/prop_types.json');

var PropManager = {};

PropManager.getPropData = function(account, cb) {
  UserDAO.findOneByAccount(account, function(error, user) {
    if (error) {
      cb(error);
    } else {
      PropDAO.findOneByAccount(account, function(error, prop) {
        if (error) {
          cb(error);
        } else {
          var data = {
            userName : user.name,
            money : user.money,
            types : _.cloneDeep(PROP_TYPES),
            props : PROP_TYPES.map(function(type) {
              return {
                type : type.type,
                name : type.name,
                func : type.func,
                value : prop[type.type]
              };
            })
          };
          cb(null, data);
        }
      });
    }
  });
};

PropManager.buy = function(account, type, count, cb) {
  var game = global.gameManager.findGameByUser(account);
  if (game && !game.isOver()) {
    cb(null, {
      success : false,
      reason : '游戏进行中，不能购买。',
      gameId : game.id
    });
  } else {
    UserDAO.findOneByAccount(account, function(error, user) {
      if (error) {
        cb(error);
      } else {
        PropDAO.findOneByAccount(account, function(error, prop) {
          if (error) {
            cb(error);
          } else {
            var propType = _.find(PROP_TYPES, {
              type : type
            });
            if (propType.price * count > user.money) {
              cb(null, {
                success : false,
                reason : '天才币余额不足，请充值。'
              });
            } else {
              prop.set(type, prop[type] + count);
              user.money = user.money - propType.price * count;
              user.save(function(error) {
                if (error) {
                  cb(error);
                } else {
                  prop.save(function(error) {
                    if (error) {
                      cb(error);
                    } else {
                      cb(null, {
                        success : true,
                        money : user.money,
                        type : type,
                        count : prop[type]
                      });
                    }
                  });
                }
              });
            }
          }
        });
      }
    });
  }
};

PropManager.reset = function(cb) {
  PropDAO.reset(cb);
};

module.exports = PropManager;
