(function() {
  $(document).ready(function() {
    can.Control('ResetPasswordPanel', {}, {
      init : function(element, options) {
      },

      '.reset-btn.available click' : function(e) {
        if (this.verify()) {
          var key = $('body').data('key');
          var password = $('.password .reset-value').val();
          var account = $('body').data('account');
          Rest.User.resetPassword(account, password, key, function() {
            Dialog.message('重置密码成功!', {
              actions : [{
                name : '关闭',
                dismiss : true,
                userClass : 'btn-primary',
                callback : function() {
                  window.location.href = '/';
                }
              }]
            });
          }, function() {
          });
        } else {
          Dialog.message('邮件地址不对，请确认');
        }
      },
      '.password .reset-value blur' : function(e) {
        this.verify();
      },

      '.repeat-password .reset-value blur' : function(e) {
        this.verify();
      },

      verify : function() {
        var e = $('.password .reset-value');
        var self = this;
        var password = e.val();
        var validation = {};
        var $sign = e.siblings('.ok-sign');
        var $reset = $('.reset-btn');
        var reg = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[~!@#$%^&*()_+`\-={}:";'<>?,.\/]).{6,16}$/;
        if (!_.isEmpty(password)) {
          if (reg.test(password)) {
            $sign.removeClass('wrong');
            validation.password = true;
          } else {
            $sign.addClass('wrong');
            validation.password = false;
          }
          $sign.css('display', 'inline-block');
        } else {
          $sign.hide();
          validation.password = false;
        }

        e = $('.repeat-password  .reset-value');
        var repeatPassword = e.val();
        $sign = e.siblings('.ok-sign');
        if (!_.isEmpty(repeatPassword)) {
          if (password === repeatPassword) {
            $sign.removeClass('wrong');
            validation.repeatPassword = true;
          } else {
            $sign.addClass('wrong');
            validation.repeatPassword = false;
          }
          $sign.css('display', 'inline-block');
        } else {
          $sign.hide();
          validation.repeatPassword = false;
        }

        if (validation.password && validation.repeatPassword) {
          $reset.addClass('available').removeAttr('disabled');
          return true;
        } else {
          $reset.removeClass('available').attr('disabled', 'disabled');
          return false;
        }
      }
    });

    new ResetPasswordPanel($('.common-container'));
  });
})();
