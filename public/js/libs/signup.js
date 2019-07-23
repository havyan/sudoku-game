(function() {
  $(document).ready(function() {
    can.Control('SignupPanel', {}, {
      init : function(element, options) {
        this.getVcode();
        this.validation = {};
      },

      getVcode : function() {
        Rest.User.getVcode(function(result) {
          $('.verify-image').attr('src', result.url);
          $('.vcode .signup-value').val('');
          $('.vcode .ok-sign').hide();
        }, function() {
        });
      },

      '.refresh-vcode click' : function(e) {
        this.getVcode();
      },

      '.account .signup-value blur' : function(e) {
        var self = this;
        var account = e.val();
        var $sign = e.siblings('.ok-sign');
        if (!_.isEmpty(account)) {
          var reg = /^\w{1,30}$/g;
          if (reg.test(account)) {
            Rest.User.checkAccount(account, function(result) {
              if (result.exist) {
                $sign.addClass('wrong');
                self.validation.account = false;
              } else {
                $sign.removeClass('wrong');
                self.validation.account = true;
                self.element.find('.signup-row.name .signup-value').val(account).blur();
              }
              $sign.css('display', 'inline-block');
            }, function() {
            });
          } else {
            $sign.addClass('wrong');
            self.validation.account = false;
            $sign.css('display', 'inline-block');
          }
        } else {
          $sign.hide();
          self.validation.account = false;
        }
      },

      '.name .signup-value blur' : function(e) {
        var name = e.val();
        var $sign = e.siblings('.ok-sign');
        if (!_.isEmpty(name)) {
          var reg = /^\S{1,30}$/g;
          if (reg.test(name)) {
            $sign.removeClass('wrong');
            this.validation.name = true;
          } else {
            $sign.addClass('wrong');
            this.validation.name = false;
          }
          $sign.css('display', 'inline-block');
        } else {
          $sign.hide();
          this.validation.name = false;
        }
      },

      '.password .signup-value blur' : function(e) {
        this.verifyPassword();
      },

      '.repeat-password .signup-value blur' : function(e) {
        this.verifyPassword();
      },

      verifyPassword : function() {
        var e = $('.password .signup-value');
        var self = this;
        var password = e.val();
        var $sign = e.siblings('.ok-sign');
        var reg = /^(?![0-9]+$)(?![a-zA-Z]+$)\S{6,16}$/;
        if (!_.isEmpty(password)) {
          if (reg.test(password)) {
            $sign.removeClass('wrong');
            self.validation.password = true;
          } else {
            $sign.addClass('wrong');
            self.validation.password = false;
          }
          $sign.css('display', 'inline-block');
        } else {
          $sign.hide();
          self.validation.password = false;
        }

        e = $('.repeat-password .signup-value');
        var repeatPassword = e.val();
        $sign = e.siblings('.ok-sign');
        if (!_.isEmpty(repeatPassword)) {
          if (password === repeatPassword) {
            $sign.removeClass('wrong');
            self.validation.repeatPassword = true;
          } else {
            $sign.addClass('wrong');
            self.validation.repeatPassword = false;
          }
          $sign.css('display', 'inline-block');
        } else {
          $sign.hide();
          self.validation.repeatPassword = false;
        }
      },

      '.email .signup-value blur' : function(e) {
        var self = this;
        var email = e.val();
        var $sign = e.siblings('.ok-sign');
        if (!_.isEmpty(email)) {
          var reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/;
          if (reg.test(email)) {
            Rest.User.checkEmail(email, function(result) {
              if (result.exist) {
                $sign.addClass('wrong');
                self.validation.email = false;
              } else {
                self.validation.email = true;
                $sign.removeClass('wrong');
              }
              $sign.css('display', 'inline-block');
            }, function() {
            });
          } else {
            $sign.addClass('wrong');
            self.validation.email = false;
          }
          $sign.css('display', 'inline-block');
        } else {
          $sign.hide();
          self.validation.email = false;
        }
      },

      '.citizen-id .signup-value blur' : function(e) {
        var self = this;
        var citizenId = e.val();
        var $sign = e.siblings('.ok-sign');
        if (!_.isEmpty(citizenId)) {
          var reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
          if (reg.test(citizenId)) {
            self.validation.citizenId = true;
            $sign.removeClass('wrong').css('display', 'inline-block');
          } else {
            $sign.addClass('wrong');
            self.validation.citizenId = false;
          }
          $sign.css('display', 'inline-block');
        } else {
          $sign.hide();
          self.validation.citizenId = false;
        }
      },

      '.vcode .signup-value blur' : function(e) {
        var self = this;
        var vcode = e.val();
        var $sign = e.siblings('.ok-sign');
        if (!_.isEmpty(vcode)) {
          Rest.User.checkVcode(vcode, function(result) {
            if (result.valid) {
              $sign.removeClass('wrong');
              self.validation.vcode = true;
            } else {
              $sign.addClass('wrong');
              self.validation.vcode = false;
            }
            $sign.css('display', 'inline-block');
          }, function() {
          });
        } else {
          $sign.hide();
          self.validation.vcode = false;
        }
      },

      '.signup-form submit' : function() {
        return false;
      },

      '.signup-submit click' : function() {
        var self = this;
        var validation = self.validation;
        if (validation.account && validation.name && validation.citizenId && validation.password && validation.repeatPassword && validation.email && validation.vcode) {
          $('.signup-form').ajaxSubmit({
            success : function(result) {
              if (result.success) {
                Dialog.message(T('page:signup.register_successful'), {
                  actions : [{
                    name : T('common:actions.close'),
                    dismiss : true,
                    userClass : 'btn-primary',
                    callback : function() {
                      window.location.href = '/';
                    }
                  }]
                });
              } else {
                Dialog.error(result.reason);
                self.getVcode();
              }
            }
          });
        } else {
          Dialog.message('数据不完整或者不合法，请更正');
        }
      },

      '.protocol-read input click' : function(e) {
        $('.signup-submit').attr('disabled', !e.is(':checked'));
      },

      '.protocol-read .protocol click' : function(e) {
        Agreement.showProtocol();
      },

      '.protocol-read .law click' : function(e) {
        Agreement.showLaw();
      },

      '.protocol-read .parents click' : function(e) {
        Agreement.showParents();
      },

      '.protocol-read .dispute click' : function(e) {
        Agreement.showDispute();
      }
    });

    new SignupPanel($('.common-container'));
  });
})();
