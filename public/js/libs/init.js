(function() {
  var lang = Cookies.get('lang') || 'cn';
  i18next.use(i18nextXHRBackend).init({
    lng: lang,
    fallbackLng: lang,
    preload: [
      'cn', 'en', 'jp'
    ],
    ns: [
      'page', 'common'
    ],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}'
    },
    initImmediate: false
  });

  can.mustache.registerHelper('T', function() {
    var key = arguments[0];
    var options = arguments[arguments.length - 1];
    for (var i = 1; i < arguments.length - 1; i++) {
      var arg = arguments[i];
      key = key + '.' + (
        _.isFunction(arg)
        ? arg()
        : arg.toString());
    }
    return i18next.t(key, options.context);
  });


  can.mustache.registerHelper('L', function() {
    var value = arguments[0];
    if (_.isFunction(value)) {
      value = value();
    }
    if (_.isObject(value)) {
      value = (value.attr && value.attr(lang)) || value[lang];
    }
    return value;
  });

  window.T = i18next.t.bind(i18next);
  window.L = function(value) {
    if (_.isObject(value)) {
      value = (value.attr && value.attr(lang)) || value[lang];
    }
    return value;
  };
})();
