var _ = require('lodash');
var Prop = require('./models/prop');
var User = require('./models/user');

var PROP_TYPES = require('./models/prop_types.json');

var PropManager = function() {

};

PropManager.prototype.getPropData = function(account, cb) {
  User.findOneByAccount(account, function(error, user) {
    if (error) {
      cb(error);
    } else {
      Prop.findOneByAccount(account, function(error, prop) {
        if (error) {
          cb(error);
        } else {
          var data = {
            userName : user.name,
            money : prop.money,
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

PropManager.prototype.buy = function(account, type, count, cb) {
  var game = global.gameManager.findGameByUser(account);
  if (game && !game.isOver()) {
    cb(null, {
      success : false,
      reason : '游戏进行中，不能购买。',
      gameId : game.id
    });
  } else {
    Prop.findOneByAccount(account, function(error, prop) {
      if (error) {
        cb(error);
      } else {
        var propType = _.find(PROP_TYPES, {
          type : type
        });
        if (propType.price * count > prop.money) {
          cb(null, {
            success : false,
            reason : '天才币余额不足，请充值。'
          });
        } else {
          prop.set(type, prop[type] + count);
          prop.money = prop.money - propType.price * count;
          prop.save(function(error) {
            if (error) {
              cb(error);
            } else {
              cb(null, {
                success : true,
                money : prop.money,
                type : type,
                count : prop[type]
              });
            }
          });
        }
      }
    });
  }
};

PropManager.prototype.reset = function(cb) {
  Prop.reset(cb);
};

module.exports = PropManager;
