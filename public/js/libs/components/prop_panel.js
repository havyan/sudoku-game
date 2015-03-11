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
        this.resetItemTotal(element);
      }
    },

    '.container .store .count .plus click' : function(element) {
      var valueElement = element.siblings('input');
      valueElement.val(parseInt(valueElement.val()) + 1);
      this.resetItemTotal(element);
    },

    '.container .store .count input keydown' : function(element, event) {
      return (event.keyCode > 47 && event.keyCode < 58) || (event.keyCode > 95 && event.keyCode < 106) || event.keyCode === 8;
    },

    '.container .store .count input blur' : function(element, event) {
      this.resetItemTotal(element);
    },

    resetItemTotal : function(element) {
      var type = _.find(this.model.attr('types'), {
        type : element.closest('.store-item').data('type')
      });
      var count = parseInt(element.closest('.count').find('input').val());
      element.closest('.count').siblings('.total').find('span').html(count * type.price);
    },

    '.bottom-actions .back click' : function() {
      window.history.back();
    },

    '.container .actions .buy click' : function(element) {
      var self = this;
      var money = this.model.attr('money');
      var type = _.find(this.model.attr('types'), {
        type : element.closest('.store-item').data('type')
      });
      var count = parseInt(element.closest('.store-item').find('.count input').val());
      if (type.price * count > money) {
        alert('天才币余额不足，请充值。');
      } else {
        Rest.Prop.buy(type.attr('type'), count, function(result) {
          if (result.success) {
            self.model.attr('money', result.money);
            _.find(self.model.attr('props'), {
              type : type.attr('type')
            }).attr('value', result.count);
            alert('购买成功');
          } else {
            alert('购买失败: ' + result.reason);
          }
        }, function() {
        });
      }
    }
  });
})();
