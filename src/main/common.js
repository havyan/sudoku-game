var dateFormat = require('dateformat');
var hbs = require('hbs');

hbs.registerHelper('formatDate', function(date) {
  return dateFormat(date, 'yyyy年mm月dd日 hh:MM:ss');
});
