var formatDate = require('dateformat');
var hbs = require('hbs');
var EventEmitter = require('events').EventEmitter;
var Socketio = require('socket.io');
var uuid = require('node-uuid');

uuid.v10 = function() {
  return uuid.v1().replace(/-/g, '');
};

Socketio.prototype.removeOf = function(name) {
  delete this.nsps[name];
};

hbs.registerHelper('formatDate', function(date) {
  return formatDate(date, 'yyyy年mm月dd日 hh:MM:ss');
});
