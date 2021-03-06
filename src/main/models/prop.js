var _ = require('lodash');
var Async = require('async');
var PropDAO = require('../daos/prop');
var UserDAO = require('../daos/user');
var User = require('./user');
var Guest = require('./guest');
var Robot = require('./robot');
var PurchaseRecordDAO = require('../daos/purchase_record');
var PropTypeDAO = require('../daos/prop_type');

var Prop = {};

Prop.findOneByAccount = function(account, cb) {
  if (Robot.isRobot(account)) {
    cb(null, null);
  } else if (Guest.isGuest(account)) {
    cb(null, Guest.createProp(account));
  } else {
    PropDAO.findOneByAccount(account, cb);
  }
};

Prop.getPropData = function(account, cb) {
  Async.parallel([
  function(cb) {
    PropTypeDAO.all(cb);
  },
  function(cb) {
    User.findOneByAccount(account, cb);
  },
  function(cb) {
    Prop.findOneByAccount(account, cb);
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
          type = type.toJSON();
          type.purchase = prop.purchases[type.type];
          return type;
        }),
        props : propTypes.map(function(type) {
          return {
            type : type.type,
            name : type.name,
            category: type.category,
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
    Async.parallel([
    function(cb) {
      PropTypeDAO.all(cb);
    },
    function(cb) {
      User.findOneByAccount(account, cb);
    },
    function(cb) {
      Prop.findOneByAccount(account, cb);
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
          var cost = propType.price * count;
          Async.series([
          function(cb) {
            user.money = user.money - cost;
            user.save(cb);
          },
          function(cb) {
            prop.set(type, prop[type] + count);
            prop.set('purchases.' + type, prop.purchases[type] + count);
            prop.save(cb);
          },
          function(cb) {
            PropTypeDAO.addSales(type, count, cb);
          },
          function(cb) {
            PurchaseRecordDAO.createRecord(user.account, type, count, cost, cb);
          }], function(error) {
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
      }
    });
  }
};

Prop.reset = function(cb) {
  PropDAO.reset(cb);
};

module.exports = Prop;
