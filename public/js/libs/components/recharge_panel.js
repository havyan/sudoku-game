(function() {
  can.Model('Models.RechargeModel', {
  }, {
    init : function() {
      this.attr('step', 1);
      this.attr('target', this.attr('user.account'));
      this.pageSize = 10;
      this.initBanks();
      this.initEvents();
      this.attr('purchase', 100);
    },

    initBanks : function() {
      this.attr('banks', [{
        code : 'icbc',
        value : 0
      }, {
        code : 'cmb',
        value : 1
      }, {
        code : 'ccb',
        value : 4
      }, {
        code : 'abc',
        value : 3
      }]);
    },

    initEvents : function() {
      var self = this;
      this.bind('purchase', function(e, purchase) {
        self.attr('cost', purchase / 10);
      });
    },

    reloadRecords : function() {
      this.attr('recordsCache', {});
      this.removeAttr('recordsTotal');
      this.getTotal();
      this.getRecords(1);
    },

    getPageCount : function() {
      return Math.ceil(this.attr('recordsTotal') / this.pageSize);
    },

    getTotal : function() {
      var self = this;
      Rest.Recharge.getTotal(function(result) {
        self.attr('recordsTotal', result.total);
      }, function() {
      });
    },

    getRecords : function(page) {
      if (page > 0) {
        var self = this;
        var pageSize = this.pageSize;
        var total = this.attr('recordsTotal') || pageSize;
        var recordsCache = this.attr('recordsCache');
        var records = recordsCache.attr(page);
        if (records) {
          this.attr('records', records);
        } else {
          var start = pageSize * (page - 1);
          var size = (start + pageSize) > total ? total - start : pageSize;
          Rest.Recharge.getRecords(start, size, function(result) {
            recordsCache.attr(page, result);
            self.attr('records', result);
          }, function() {
          });
        }
      }
    },

    setStep : function(step) {
      this.attr('step', step);
    },

    next : function() {
      if (this.attr('step') < 4) {
        this.setStep(this.attr('step') + 1);
      }
    },

    setPurchase : function(purchase) {
      this.attr('purchase', purchase);
    },

    setTarget : function(target) {
      this.attr('target', target);
    },

    createOrder : function(success, error) {
      var self = this;
      var data = {
        from : this.attr('user.account'),
        target : this.attr('target'),
        purchase : this.attr('purchase'),
        cost : this.attr('cost')
      };
      Rest.Recharge.create(data, function(result) {
        self.attr('order', result);
        if (success) {
          success();
        }
      }, error);
    }
  });

  can.Control('Components.RechargePanel', {}, {
    init : function(element, options) {
      element.html(can.view('/js/libs/mst/recharge_panel.mst', this.options.model));
      this.paginationModel = new Models.PaginationModel();
      this.paginationBar = new Components.PaginationBar(element.find('.records-pagination-bar'), {
        model : this.paginationModel
      });
      this.initEvents();
    },

    initEvents : function() {
      var self = this;
      this.paginationModel.bind('current', function() {
        self.options.model.getRecords(self.paginationModel.getCurrent());
      });
    },

    '{model} recordsTotal' : function(model) {
      this.paginationModel.setCount(model.getPageCount());
    },

    '{model} step' : function(model, e, step) {
      this.element.find('.recharge-step:lt(' + step + ')').addClass('active');
      this.element.find('.recharge-step-component').removeClass('active').filter(':eq(' + (step - 1) + ')').addClass('active');
    },

    '.navigator .item click' : function(e) {
      e.addClass('active').siblings('.item').removeClass('active');
      var target = e.data('target');
      if (target === 'recharge-records') {
        this.options.model.reloadRecords();
      }
      this.element.find('.recharge-container .item').removeClass('active').filter('.' + target).addClass('active');
    },

    '.order-next click' : function() {
      var model = this.options.model;
      var purchase = model.attr('purchase');
      if (purchase) {
        var target = model.attr('target');
        if (target) {
          model.createOrder(function() {
            model.next();
          });
        } else {
          Dialog.message('请正确输入你要充值的对象.');
        }
      } else {
        Dialog.message('请选择或输入你要购买的天才币.');
      }
    },

    '.pay-method-submit click' : function() {
      var model = this.options.model;
      model.next();
      Dialog.show({
        title : '付款确认',
        userClass : 'pay-confirm-dialog',
        content : '请在新开网银页面完成付款。<br>支付成功后订单状态可能会延迟更新，可稍后查看。',
        actions : [{
          name : '已完成付款',
          userClass : 'btn-primary',
          callback : function() {
            this.hide();
            model.next();
          }
        }, {
          name : '付款遇到问题',
          userClass : 'btn-primary',
          callback : function() {
            this.hide();
            model.next();
          }
        }]
      });
    },

    '.purchase-row.custom input[type=text] keydown' : function(element, event) {
      return Utils.isIntKey(event.keyCode);
    },

    '.purchase-row.custom input[type=text] blur' : function(element, event) {
      var value = element.val();
      var $error = element.siblings('.error');
      if (!_.isEmpty(value) && value > 0) {
        this.options.model.setPurchase(parseInt(value));
        $error.hide();
      } else {
        this.options.model.setPurchase(0);
        $error.show();
      }
    },

    '.recharge-target-row.other input[type=text] blur' : function(element, event) {
      var model = this.options.model;
      var account = element.val();
      var $error = element.siblings('.error');
      if (!_.isEmpty(account)) {
        Rest.User.checkAccount(account, function(result) {
          if (result.exist) {
            $error.hide();
            model.setTarget(account);
          } else {
            $error.show();
            model.setTarget(null);
          }
        }, function() {
        });
      } else {
        $error.show();
        model.setTarget(null);
      }
    },

    '.purchase-row input[type=radio] click' : function(element) {
      var $parent = element.closest('.purchase-row');
      var $customText = this.element.find('.purchase-row.custom input[type=text]');
      var $error = this.element.find('.purchase-row.custom .error');
      if ($parent.is('.custom')) {
        $customText.attr('disabled', false).focus();
        var value = $customText.val();
        if (!_.isEmpty(value)) {
          this.options.model.setPurchase(parseInt(value));
          $error.hide();
        } else {
          this.options.model.setPurchase(0);
          $error.show();
        }
      } else {
        $customText.attr('disabled', true);
        this.options.model.setPurchase($parent.data('value'));
        $error.hide();
      }
    },

    '.recharge-target-row input[type=radio] click' : function(element) {
      var model = this.options.model;
      var $parent = element.closest('.recharge-target-row');
      var $otherText = this.element.find('.recharge-target-row.other input[type=text]');
      var $error = this.element.find('.recharge-target-row.other .error');
      if ($parent.is('.other')) {
        $otherText.attr('disabled', false).focus();
        var account = $otherText.val();
        if (!_.isEmpty(account)) {
          Rest.User.checkAccount(account, function(result) {
            if (result.exist) {
              $error.hide();
              model.setTarget(account);
            } else {
              $error.show();
              model.setTarget(null);
            }
          }, function() {
          });
        } else {
          $error.show();
        }
      } else {
        $otherText.attr('disabled', true);
        $error.hide();
        model.setTarget(model.attr('user.account'));
      }
    }
  });
})();
