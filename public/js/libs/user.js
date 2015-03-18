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
        return (event.keyCode > 47 && event.keyCode < 58) || (event.keyCode > 95 && event.keyCode < 106) || event.keyCode === 8;
      },

      '.info-row .cancel click' : function(element) {
        element.closest('.info-row').removeClass('edit');
      },

      '.points-row .confirm click' : function(element) {
        Dialog.showConfirm('您确定要修改积分吗？', function() {
          $(this).closest('.modal').modal('hide');
          var value = parseInt(element.siblings('.value-field').val());
          Rest.User.setPoints(value, function() {
            Dialog.showMessage('修改积分成功!!!');
            element.siblings('.value').html(value);
            element.closest('.info-row').removeClass('edit');
          }, function() {
          });
        });
      },

      '.money-row .confirm click' : function(element) {
        Dialog.showConfirm('您确定要修改天才币吗？', function() {
          $(this).closest('.modal').modal('hide');
          var value = parseInt(element.siblings('.value-field').val());
          Rest.User.setMoney(value, function() {
            Dialog.showMessage('修改天才币成功!!!');
            element.siblings('.value').html(value);
            element.closest('.info-row').removeClass('edit');
          }, function() {
          });
        });
      },

      '.close-button click' : function() {
        window.location.href = "/main";
      }
    });

    new UserPanel($('body'), {});
  });
})();
