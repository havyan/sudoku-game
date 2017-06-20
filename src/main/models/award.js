var _ = require('lodash');
var winston = require('winston');
var Async = require('async');
var AwardDAO = require('../daos/award');
var UserDAO = require('../daos/user');
var PropTypeDAO = require('../daos/prop_type');
var PropDAO = require('../daos/prop');
var Message = require('./message');
var Template = require('./template');

var Award = {};

Award.perform = function(code, to, cb) {
  Async.parallel([
  function(cb) {
    AwardDAO.findOneByCode(code, cb);
  },
  function(cb) {
    UserDAO.findOneByAccount(to, cb);
  },
  function(cb) {
    PropTypeDAO.all(cb);
  },
  function(cb) {
    PropDAO.findOneByAccount(to, cb);
  }], function(error, results) {
    if (error) {
      cb(error);
    } else {
      var awardResult;
      var award = results[0];
      var user = results[1];
      var propTypes = results[2];
      var prop = results[3];
      var awardJson = award.toJSON();
      awardJson.props.forEach(function(e) {
        var propType = _.find(propTypes, {
          type : e.type
        });
        e.icon = propType.icon;
        e.name = propType.name;
      });
      Async.parallel([
      function(cb) {
        user.money = user.money + award.money;
        user.save(cb);
      },
      function(cb) {
        award.props.forEach(function(e) {
          prop[e.type] = prop[e.type] + e.count;
        });
        prop.save(cb);
      },
      function(cb) {
        awardResult = {
          currentMoney : user.money,
          currentProps : propTypes.map(function(propType) {
            return {
              type : propType.type,
              name : propType.name,
              icon : propType.icon,
              count : prop[propType.type]
            };
          }),
          award : awardJson
        };
        Async.waterfall([
        function(cb) {
          Template.generate('award', awardResult, cb);
        },
        function(content, cb) {
          Message.sendFromSystem([user.id], award.title, content, cb);
        }], cb);
      }], function(error) {
        if (error) {
          cb(error);
        } else {
          cb(null, awardResult);
        }
      });
    }
  });
};

module.exports = Award;
