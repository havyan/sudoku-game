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
      },

      '.password .signup-value blur' : function(e) {
        var password = e.val();
        var $sign = e.siblings('.ok-sign');
        var reg = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[~!@#$%^&*()_+`\-={}:";'<>?,.\/]).{4,16}$/;
        if (!_.isEmpty(password)) {
          if (reg.test(password)) {
            $sign.removeClass('wrong');
          } else {
            $sign.addClass('wrong');
          }
          $sign.css('display', 'inline-block');
        } else {
          $sign.hide();
        }
      },

      '.repeat-password .signup-value blur' : function(e) {
        var repeatPassword = e.val();
        var password = $('.password .signup-value').val();
        var $sign = e.siblings('.ok-sign');
        if (!_.isEmpty(repeatPassword)) {
          if (password === repeatPassword) {
            $sign.removeClass('wrong');
          } else {
            $sign.addClass('wrong');
          }
          $sign.css('display', 'inline-block');
        } else {
          $sign.hide();
        }
      },

      '.email .signup-value blur' : function(e) {
        var email = e.val();
        var $sign = e.siblings('.ok-sign');
        if (!_.isEmpty(email)) {
          var reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/;
          if (reg.test(email)) {
            Rest.User.checkEmail(email, function(result) {
              if (result.valid) {
                $sign.removeClass('wrong');
              } else {
                $sign.addClass('wrong');
              }
              $sign.css('display', 'inline-block');
            }, function() {
            });
          } else {
            $sign.addClass('wrong');
          }
          $sign.css('display', 'inline-block');
        } else {
          $sign.hide();
        }
      }
    });

    new SignupPanel($('.signup-container'));
  });
})();
