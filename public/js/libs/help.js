(function() {
  $(document).ready(function() {
    $('.navigator .item').click(function(e) {
      var $e = $(e.target);
      $('.navigator .item').removeClass('active');
      $e.addClass('active');
      $('.help-container .item').removeClass('active').filter('.' + $(e.target).data('target')).addClass('active');
    });
  });
})();
