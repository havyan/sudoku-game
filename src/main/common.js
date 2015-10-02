var formatDate = require('dateformat');
var hbs = require('hbs');

hbs.registerHelper('formatDate', function(date) {
  return formatDate(date, 'yyyy年mm月dd日 hh:MM:ss');
});
