var _ = require('lodash');
var async = require('async');
var PropDAO = require('../daos/prop');
var UserDAO = require('../daos/user');
var PropTypeDAO = require('../daos/prop_type');

var Prop = {};

Prop.getPropData = function(account, cb) {
  async.parallel([
  function(cb) {
    PropTypeDAO.all(cb);
  },
  function(cb) {
    UserDAO.findOneByAccount(account, cb);
  },
  function(cb) {
    PropDAO.findOneByAccount(account, cb);
  }], function(error, results) {
    if (error) {
      cb(error);
    } else {
      var propTypes = results[0];
      var user = results[1];
      var prop = results[2];
      var data = {
        userName : user.name,
        money : user.money,
        types : propTypes.map(function(type) {
          return type.toJSON();
        }),
        props : propTypes.map(function(type) {
          return {
            type : type.type,
            name : type.name,
            func : type.func,
            icon : type.icon,
            count : prop[type.type]
          };
        })
      };
      cb(null, data);
    }
  });
};

Prop.buy = function(account, type, count, cb) {
  var game = global.gameManager.findGameByUser(account);
  if (game && !game.isOver()) {
    cb(null, {
      success : false,
      reason : '游戏进行中，不能购买。',
      gameId : game.id
    });
  } else {
    async.parallel([
    function(cb) {
      PropTypeDAO.all(cb);
    },
    function(cb) {
      UserDAO.findOneByAccount(account, cb);
    },
    function(cb) {
      PropDAO.findOneByAccount(account, cb);
    }], function(error, results) {
      if (error) {
        cb(error);
      } else {
        var propTypes = results[0];
        var user = results[1];
        var prop = results[2];
        var propType = _.find(propTypes, {
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
};

Prop.reset = function(cb) {
  PropDAO.reset(cb);
};

module.exports = Prop;
