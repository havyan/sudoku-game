(function() {
  $(document).ready(function() {
    can.Control('SignupPanel', {}, {
      init : function(element, options) {

      },

      '.account .signup-value blur' : function(e) {
        var account = e.val();
        var $sign = e.siblings('.ok-sign');
        if (!_.isEmpty(account)) {
          Rest.User.checkAccount(account, function(result) {
            if (result.valid) {
              $sign.removeClass('wrong');
            } else {
              $sign.addClass('wrong');
            }
            $sign.css('display', 'inline-block');
          }, function() {
          });
        } else {
          $sign.hide();
        }
      }
    });

    new SignupPanel($('.signup-container'));
  });
})();
