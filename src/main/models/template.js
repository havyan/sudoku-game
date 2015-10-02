var hbs = require('hbs');
var TemplateDAO = require('../daos/template');

var Template = {};

Template.generate = function(code, data, cb) {
  TemplateDAO.findOneByCode(code, function(error, template) {
    if (error) {
      cb(error);
    } else {
      if (template) {
        cb(null, hbs.compile(template.content)(data));
      } else {
        cb(null, '');
      }
    }
  });
};

module.exports = Template;
