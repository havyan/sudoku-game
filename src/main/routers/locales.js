var Async = require('async');
var _ = require('lodash');
var HttpError = require('../http_error');
var winston = require('winston');

var locales = {};
var localesDir = "../../../locales/";

module.exports = function(router) {
  router.get('/locales/:lang/:ns', function(req, res, next) {
    var lang = req.params.lang;
    var ns = req.params.ns;
    var resource = locales[lang] && locales[lang][ns];
    if (!resource) {
      resource = require(localesDir + lang + '/' + ns + '.json');
      if (!locales[lang]) {
        locales[lang] = {};
      }
      locales[lang][ns] = resource;
    }
    res.send(resource);
  });
};
