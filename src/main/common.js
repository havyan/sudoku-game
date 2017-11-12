var i18next = require('i18next');
var formatDate = require('dateformat');
var hbs = require('hbs');
var _ = require('lodash');
var Socketio = require('socket.io');
var uuid = require('uuid');
var args = require('./args');

global.Utils = require('./utils');

uuid.v10 = function() {
  return uuid.v1().replace(/-/g, '');
};

Socketio.prototype.removeOf = function(name) {
  delete this.nsps[name];
};

hbs.registerHelper('formatDate', function(date) {
  return formatDate(date, 'yyyy年mm月dd日 hh:MM:ss');
});

hbs.registerHelper('statsScript', function() {
  if (args.env === 'production') {
    return '<script src="' + global.config.app.locals.basejs + '/libs/stats.js"></script>'
  }
});

hbs.registerHelper('T', function() {
  var arg0 = arguments[0];
  var arg1 = arguments[1];
  var arg2 = arguments[2];
  var key = arg0;
  var options = arg1;
  if (_.isString(arg1)) {
    key = arg0 + '.' + arg1;
    options = arg2;
  }
  return i18next.getFixedT(options.data.root.$lang)(key, options.data.root);
});
