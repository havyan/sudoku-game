(function() {
  $(document).ready(function() {
    can.Control('RetrievePasswordPanel', {}, {
      init : function(element, options) {
      },

      '.send.available click' : function(e) {
        var email = $('.email').val();
        Rest.User.sendResetMail(email, function() {
          Dialog.message('重置邮件已发送至您的邮箱，请在30分钟内重置密码，过期无效');
        }, function() {
        });
      },

      '.email blur' : function(e) {
        var self = this;
        var email = e.val();
        var $sign = e.siblings('.ok-sign');
        var $send = $('.send');
        if (!_.isEmpty(email)) {
          var reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/;
          if (reg.test(email)) {
            Rest.User.checkEmail(email, function(result) {
              if (!result.valid) {
                $send.addClass('available').removeAttr('disabled');
                $sign.removeClass('wrong');
              } else {
                $sign.addClass('wrong');
                $send.removeClass('available').attr('disabled', 'disabled');
              }
              $sign.css('display', 'inline-block');
            }, function() {
            });
          } else {
            $sign.addClass('wrong');
            $send.removeClass('available').attr('disabled', 'disabled');
          }
          $sign.css('display', 'inline-block');
        } else {
          $sign.hide();
          $send.removeClass('available').attr('disabled', 'disabled');
        }
      }
    });

    new RetrievePasswordPanel($('.common-container'));
  });
})();
