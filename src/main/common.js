var formatDate = require('dateformat');
var hbs = require('hbs');
var _ = require('lodash');
var Socketio = require('socket.io');
var uuid = require('uuid');

var RE_IPV4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
var RE_IPV6 = /^[\w:]+$/;
var RE_IPV64 = /^[\w:]+:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;

uuid.v10 = function() {
  return uuid.v1().replace(/-/g, '');
};

Socketio.prototype.removeOf = function(name) {
  delete this.nsps[name];
};

_.ip = function(ip) {
  var match;
  ip = ip.trim();
  if(ip.match(RE_IPV4) || ip.match(RE_IPV6)) {
    return ip;
  } else if (match = ip.match(RE_IPV64)) {
    return match[1];
  } else {
    return ip;
  }
};

hbs.registerHelper('formatDate', function(date) {
  return formatDate(date, 'yyyy年mm月dd日 hh:MM:ss');
});
