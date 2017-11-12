(function() {
  var lang = Cookies.get('lang') || 'cn';

  $('.i18n-area .i18n-lang').click(function(e) {
    var lang = $(e.target).data('lang');
    Cookies.set('lang', lang, {
      expires: 365
    });
    i18next.changeLanguage(lang);
    window.location.reload();
  });

  i18next.use(i18nextXHRBackend).init({
    lng: lang,
    fallbackLng: lang,
    preload: ['cn', 'en', 'jp'],
    ns: ['page', 'common'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}'
    }
  });

  can.mustache.registerHelper('T', function() {
    var key = arguments[0];
    var options = arguments[arguments.length - 1];
    for (var i = 1; i < arguments.length - 1; i++) {
      var arg = arguments[i];
      key = key + '.' + (_.isFunction(arg) ? arg() : arg.toString());
    }
    return i18next.t(key, options.context);
  });

  window.it = i18next.t.bind(i18next);
})();
