(function() {
  $('.i18n-area .i18n-lang').click(function(e) {
    Cookies.set('lang', $(e.target).data('lang'), {expires: 365});
    window.location.reload();
  });
})();
