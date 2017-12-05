var _ = require('lodash');
var express = require('express');
var i18next = require('i18next');
var i18nextBackend = require('i18next-node-fs-backend');
var hbs = require('hbs');

var I18N_RE = /^i18n\((\S+:\S+)\)$/g;
var handleI18n = function(lang, json, handled) {
  handled = handled || [];
  for (var key in json) {
    var value = json[key];
    if (_.isString(value)) {
      var matches = I18N_RE.exec(value);
      if (matches) {
        json[key] = i18next.getFixedT(lang)(matches[1]);
      }
    } else if (_.isObject(value)) {
      if (handled.indexOf(value) < 0) {
        handleI18n(lang, value, handled);
      }
    } else if (_.isArray(value)) {
      value.forEach(function(e) {
        if (_.isObject(e) && handled.indexOf(e) < 0) {
          handleI18n(lang, e, handled);
        }
      });
    }
  }
  handled.push(json);
};

var superRender = express.response.render;
express.response.render = function(view, options, callback) {
  var lang = this.req.cookies.lang || 'cn';
  var newArgs = [];
  options = options || {};
  options.$lang = lang;
  for (var i = 0; i < arguments.length; i++) {
    newArgs.push(arguments[i]);
  }
  if (newArgs.length > 1) {
    newArgs[1] = options;
  } else {
    if (newArgs.length === 0) {
      newArgs.push(null);
    }
    newArgs.push(options);
  }
  superRender.apply(this, newArgs);
};

express.response.sendI18n = function() {
  var lang = this.req.cookies.lang || 'cn';
  var arg0 = arguments[0];
  if (_.isObject(arg0)) {
    handleI18n(lang, arg0);
  }
  this.send.apply(this, arguments);
};

var localize = function(options, lang) {
  var result = {};
  for(var key in options) {
    var value = options[key];
    if (value && value[lang]) {
      value = value[lang];
    }
    // TODO multiple layers
    result[key] = value;
  }
  return result;
};

global.L = function(key, options) {
  var langs = i18next.options.preload;
  var result = {};
  langs.forEach(function(lang) {
    result[lang] = i18next.getFixedT(lang)(key, localize(options, lang));
  });
  return result;
};

hbs.registerHelper('T', function() {
  var key = arguments[0];
  var options = arguments[arguments.length - 1];
  for (var i = 1; i < arguments.length - 1; i++) {
    key = key + '.' + arguments[i].toString();
  }
  return i18next.getFixedT(options.data.root.$lang)(key, options.data.root);
});

hbs.registerHelper('L', function(value, options) {
  return _.isObject(value) ? value[options.data.root.$lang] : value;
});

module.exports.init = function(cb) {
  i18next.use(i18nextBackend).init({
    lng: 'cn',
    fallbackLng: 'cn',
    preload: ['cn', 'en', 'jp'],
    ns: ['page', 'common', 'app'],
    backend: {
      loadPath: 'locales/{{lng}}/{{ns}}.json',
      addPath: 'locales/{{lng}}/{{ns}}.add.json',
      jsonIndent: 2
    }
  }, cb);
};
