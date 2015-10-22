var formatDate = require('dateformat');
var hbs = require('hbs');
var uuid = require('node-uuid');

uuid.v10 = function() {
  return uuid.v1().replace(/-/g, '');
};

hbs.registerHelper('formatDate', function(date) {
  return formatDate(date, 'yyyy年mm月dd日 hh:MM:ss');
});
