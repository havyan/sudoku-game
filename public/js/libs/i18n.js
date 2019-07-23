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
})();
