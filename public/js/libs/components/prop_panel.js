(function() {
  can.Control('Components.PropPanel', {}, {
    init : function(element, options) {
      this.model = new can.Model(options.data);
      element.html(can.view('/js/libs/mst/prop_panel.mst', this.model));
    },

    '.navigator .item click' : function(element) {
      if (element.hasClass('store')) {
        element.addClass('active');
        element.siblings('.my-prop').removeClass('active');
        $('.container .store').addClass('active');
        $('.container .my-prop').removeClass('active');
      } else {
        element.addClass('active');
        element.siblings('.store').removeClass('active');
        $('.container .my-prop').addClass('active');
        $('.container .store').removeClass('active');
      }
    },

    '.container .store .count .subtract click' : function(element) {
      var valueElement = element.siblings('input');
      var value = parseInt(valueElement.val());
      if (value > 0) {
        valueElement.val(parseInt(valueElement.val()) - 1);
        this.resetItem(element);
      }
    },

    '.container .store .count .plus click' : function(element) {
      var valueElement = element.siblings('input');
      var value = parseInt(valueElement.val());
      var current = _.find(this.model.attr('props'), {
        type : element.closest('.store-item').data('type')
      }).value;
      if (value < (999 - current)) {
        valueElement.val(value + 1);
        this.resetItem(element);
      }
    },

    '.container .store .count input keydown' : function(element, event) {
      return (event.keyCode > 47 && event.keyCode < 58) || (event.keyCode > 95 && event.keyCode < 106) || event.keyCode === 8 || event.keyCode === 37 || event.keyCode === 39 || event.keyCode === 46;
    },

    '.container .store .count input blur' : function(element, event) {
      var value = parseInt(element.val());
      var current = _.find(this.model.attr('props'), {
        type : element.closest('.store-item').data('type')
      }).value;
      if (value > (999 - current)) {
        element.val(999 - current);
      }
      this.resetItem(element);
    },

    resetItem : function(element) {
      var type = _.find(this.model.attr('types'), {
        type : element.closest('.store-item').data('type')
      });
      var count = parseInt(element.closest('.count').find('input').val());
      element.closest('.count').siblings('.total').find('span').html(count * type.price);
      element.closest('.store-item').find('.buy').attr('disabled', count <= 0);
    },

    '.bottom-actions .back click' : function() {
      window.location.href = "/main";
    },

    '.container .actions .buy click' : function(element) {
      var self = this;
      var money = this.model.attr('money');
      var $value = element.closest('.store-item').find('.count input');
      var type = _.find(this.model.attr('types'), {
        type : element.closest('.store-item').data('type')
      });
      var count = parseInt($value.val());
      var current = _.find(this.model.attr('props'), {
        type : element.closest('.store-item').data('type')
      }).value;
      if ((count + current) > 999) {
        Dialog.showMessage('单个道具最多只能买999个。');
        $value.val(999 - current);
      } else if (type.price * count > money) {
        Dialog.showMessage('天才币余额不足，请充值。');
      } else {
        Rest.Prop.buy(type.attr('type'), count, function(result) {
          if (result.success) {
            self.model.attr('money', result.money);
            _.find(self.model.attr('props'), {
              type : type.attr('type')
            }).attr('value', result.count);
            Dialog.showMessage('购买成功');
          } else {
            Dialog.showMessage('购买失败: ' + result.reason);
          }
        }, function() {
        });
      }
    }
  });
})();
