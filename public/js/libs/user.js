(function() {
  $(document).ready(function() {
    can.Control('UserPanel', {}, {
      init : function(element, options) {

      },

      '.modify-button click' : function(element) {
        element.siblings('.value-field').val(element.siblings('.value').text());
        element.closest('.info-row').addClass('edit');
      },

      '.value-field keydown' : function(element, event) {
        if (!element.closest('.info-row').hasClass('name-row')) {
          return Utils.isIntKey(event.keyCode);
        }
      },

      '.info-row .cancel click' : function(element) {
        element.closest('.info-row').removeClass('edit');
      },

      '.points-row .confirm click' : function(element) {
        Dialog.confirm('您确定要修改积分吗？', function() {
          this.hide();
          var value = parseInt(element.siblings('.value-field').val());
          Rest.User.setPoints(value, function(result) {
            Dialog.message('修改积分成功!!!');
            element.siblings('.value').html(value);
            element.closest('.info-row').removeClass('edit');
            if (result && result.grade_name) {
              element.closest('.info').find('.info-row.grade .value').html(result.grade_name);
            }
          }, function() {
          });
        });
      },

      '.name-row .confirm click' : function(element) {
        var value = element.siblings('.value-field').val();
        if (!_.isEmpty(value)) {
          Dialog.confirm('您确定要修改您的昵称为[' + value + ']吗？', function() {
            this.hide();
            Rest.User.setName(value, function(result) {
              Dialog.message('修改昵称成功!!!');
              element.siblings('.value').html(value);
              element.closest('.info-row').removeClass('edit');
              $('.welcome .user-name').html(value);
            }, function() {
            });
          });
        }
      },

      '.money-row .confirm click' : function(element) {
        Dialog.confirm('您确定要修改天才币吗？', function() {
          this.hide();
          var value = parseInt(element.siblings('.value-field').val());
          Rest.User.setMoney(value, function(result) {
            Dialog.message('修改天才币成功!!!');
            element.siblings('.value').html(value);
            element.closest('.info-row').removeClass('edit');
          }, function() {
          });
        });
      },

      '.change-icon-action click' : function(element) {
        var $icons = this.element.find('.default-icons');
        if (!$icons.hasClass('show')) {
          var value = element.closest('.icon').data('value');
          $icons.find('img').removeClass('selected');
          $icons.find('[src="' + value + '"]').addClass('selected');
        }
        $icons.toggleClass('show');
      },

      '.default-icons img click' : function(element) {
        var $icons = this.element.find('.default-icons');
        var $icon = this.element.find('.icon-img');
        var icon = element.attr('src');
        Rest.User.setIcon(icon, true, {}, function(result) {
          $icon.attr('src', icon);
          $icons.find('img').removeClass('selected');
          $icons.find('[src="' + icon + '"]').addClass('selected');
        }, function() {
        });
      },

      '.upload-icon-action click' : function(element) {
        var $icons = this.element.find('.default-icons');
        var $icon = this.element.find('.icon-img');
        Dialog.show({
          title : '上传头像',
          control : UploadIconPanel,
          autoClose : false,
          actions : [Dialog.CANCEL_ACTION, {
            name : '确认',
            userClass : 'btn-primary',
            callback : function(element) {
              var bound = this.control.getCutterBound();
              Rest.User.setIcon(this.control.iconFile, false, bound, function(result) {
                $icon.attr('src', result.path);
                $icons.find('img').removeClass('selected');
              }, function() {
              });
              this.hide();
            }
          }]
        });
      },

      '.close-button click' : function() {
        window.location.href = "/main";
      }
    });

    new UserPanel($('body'), {});
  });
})();
