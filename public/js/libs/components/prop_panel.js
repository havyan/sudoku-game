(function() {
  can.Control('Components.PropPanel', {}, {
    init : function(element, options) {
      var self = this;
      this.model = new can.Model(options.data);
      this.model.attr('category', 'sudoku');
      can.view('/js/libs/mst/prop_panel.mst', this.model, {
        tabClass: function(category) {
          return self.model.attr('category') === category ? 'active' : '';
        },
        itemClass: function(item) {
          return self.model.attr('category') === item.category ? 'visible' : '';
        }
      }, function(frag) {
        element.html(frag);
      }.bind(this));
    },

    '.tabs .tab click' : function(element) {
      this.model.attr('category', element.data('category'));
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
      }).count;
      if (value < (999 - current)) {
        valueElement.val(value + 1);
        this.resetItem(element);
      }
    },

    '.container .store .count input keydown' : function(element, event) {
      return Utils.isIntKey(event.keyCode);
    },

    '.container .store .count input blur' : function(element, event) {
      var max = 999;
      var value = parseInt(element.val());
      var current = _.find(this.model.attr('props'), {
        type : element.closest('.store-item').data('type')
      }).count;
      if (value > max) {
        element.val(max);
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
      }).count;
      if ((count + current) > 999) {
        Dialog.message(T('page:props.purchase_limit'));
        $value.val(999 - current);
      } else if (type.price * count > money) {
        Dialog.message(T('page:props.money_not_enough'));
      } else {
        Rest.Prop.buy(type.attr('type'), count, function(result) {
          if (result.success) {
            self.model.attr('money', result.money);
            $('.welcome .money').html(result.money);
            _.find(self.model.attr('props'), {
              type : type.attr('type')
            }).attr('count', result.count);
            type.attr('sales', type.attr('sales') + count);
            type.attr('purchase', type.attr('purchase') + count);
            Dialog.message(T('page:props.purchase_successful'));
          } else {
            Dialog.message(T('page:props.purchase_fail') + result.reason);
          }
        }, function() {
        });
      }
    }
  });
})();
