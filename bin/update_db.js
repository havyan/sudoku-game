var init = require('../src/main/init');
var winston = require('winston');
var Async = require('async');
var mongoose = require('mongoose');

var done = function(error) {
  if (error) {
    winston.error('Error when updating database: ' + error);
  } else {
    winston.info('Successfully updated databse!');
  }
  mongoose.connection.close();
};

Async.waterfall([
  init,
  function(cb) {
    var PropDAO = require('../src/main/daos/prop.js');
    PropDAO.all(cb);
  },
  function(props, cb) {
    var UserDAO = require('../src/main/daos/user.js');
    if (props) {
      Async.each(props, function(prop, cb) {
        if (prop.user) {
          cb();
        } else {
          Async.waterfall([
            function(cb) {
              UserDAO.findOneByAccount(prop.account, cb);
            },
            function(user, cb) {
              prop.user = user
                ? user.id
                : null;
              prop.save(cb);
            }
          ], cb);
        }
      }, cb);
    }
  }
], done);
