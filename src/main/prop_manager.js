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
          	userName: user.name,
            money : prop.money,
            types : PROP_TYPES,
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

module.exports = PropManager;
