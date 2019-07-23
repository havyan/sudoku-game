(function() {
  var STATUS = {
    '0' : T('page:recharge.recharge_incompleted'),
    '1' : T('page:recharge.recharge_succesful'),
    '2' : T('page:recharge.recharge_completed'),
    '9' : T('page:recharge.recharge_start'),
    '-1' : T('page:recharge.recharge_fail')
  };
  var BANK = {
    '0' : T('page:recharge.icbc'),
    '1' : T('page:recharge.cmb'),
    '3' : T('page:recharge.abc'),
    '4' : T('page:recharge.ccb'),
    '11' : T('page:recharge.alipay'),
    '6' : T('page:recharge.union'),
    '13' : T('page:recharge.wepay')
  };
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
        code : 'ali',
        value : '11'
      }, {
        code : 'union',
        value : '6'
      }, {
        code : 'weixin',
        value : '13'
      }, {
        code : 'icbc',
        value : '0',
        disabled : true
      }, {
        code : 'cmb',
        value : '1',
        disabled : true
      }, {
        code : 'bcm',
        value : '4',
        disabled : true
      }, {
        code : 'abc',
        value : '3',
        disabled : true
      }]);
    },

    initEvents : function() {
      var self = this;
      var rate = this.attr('rule.exchange.rate');
      this.bind('purchase', function(e, purchase) {
        self.attr('cost', (purchase / rate).toFixed(2));
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

    resetOrder : function() {
      this.attr('order', null);
      this.setStep(1);
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

    findRecord : function(id) {
      return _.find(this.attr('records'), {
        _id : id
      });
    },

    isToSelf : function() {
      return this.attr('order.target') === this.attr('user.account');
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
      var self = this;
      var model = options.model;
      can.view('/js/libs/mst/recharge_panel.mst', model, {
        rechargeStatus : function(status) {
          return STATUS[status()];
        },

        rechargeResult : function(status) {
          status = status();
          if (status === '1' || status === '2') {
            return T('page:recharge.success_message');
          } else {
            return T('page:recharge.fail_message');
          }
        },

        rechargeBank : function(bank) {
          return BANK[bank()];
        },

        isContinued : function(record, options) {
          if (record.status === '9' && model.attr('user.account') === record.from) {
            return options.fn(this);
          } else {
            return options.inverse(this);
          }
        },

        isBankChecked : function(bank, options) {
          bank = bank();
          var currentBank = model.attr('order.bank');
          if (currentBank == null) {
            currentBank = '6';
          }
          if (currentBank === bank) {
            return options.fn(this);
          } else {
            return options.inverse(this);
          }
        }
      }, function(frag) {
        element.html(frag);
        self.paginationModel = new Models.PaginationModel();
        self.paginationBar = new Components.PaginationBar(element.find('.records-pagination-bar'), {
          model : self.paginationModel
        });
        self.initEvents();
      });
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
      this.element.find('.recharge-step:gt(' + (step - 1) + ')').removeClass('active');
      this.element.find('.recharge-step-component').removeClass('active').filter(':eq(' + (step - 1) + ')').addClass('active');
    },

    '.navigator .item click' : function(e) {
      var target = e.data('target');
      if (target === 'recharge-recharge') {
        this.options.model.resetOrder();
      } else if (target === 'recharge-records') {
        this.options.model.reloadRecords();
      }
      this.activeItem(e);
    },

    activeItem : function(e) {
      e.addClass('active').siblings('.item').removeClass('active');
      this.element.find('.recharge-container .item').removeClass('active').filter('.' + e.data('target')).addClass('active');
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
          Dialog.message(T('page:recharge.recharge_target'));
        }
      } else {
        Dialog.message(T('page:recharge.recharge_money'));
      }
    },

    '.pay-method-submit click' : function() {
      var model = this.options.model;
      model.next();
      var check = function() {
        Rest.Recharge.getPayStatus(model.attr('order.payuid'), function(result) {
          model.attr('order.status', result.status);
          if (result.status === '2' || result.status === '1') {
            if (result.account === model.attr('user.account')) {
              model.attr('user.money', result.money);
              $('.welcome .money').html(result.money);
            }
            dialog.hide();
            model.next();
            clearInterval(timer);
          } else if (result.status === '-1') {
            dialog.hide();
            model.next();
            clearInterval(timer);
          }
        }, function() {
        });
      };
      var timer = setInterval(check, 3000);
      var dialog = Dialog.show({
        title : T('page:recharge.pay_confirm'),
        userClass : 'pay-confirm-dialog',
        content : T('page:recharge.pay_in_new_page') + '<br>' + T('page:recharge.pay_view_later'),
        actions : [{
          name : T('page:recharge.pay_finished'),
          userClass : 'btn-primary',
          callback : function() {
            check();
            clearInterval(timer);
            this.hide();
            model.next();
          }
        }, {
          name : T('page:recharge.pay_problem'),
          userClass : 'btn-danger',
          callback : function() {
            check();
            clearInterval(timer);
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

    '.continue-pay click' : function(e) {
      var record = this.options.model.findRecord(e.closest('tr').data('record'));
      if (record) {
        this.options.model.attr('order', record);
        this.options.model.setStep(2);
        this.activeItem(this.element.find('.navigator .item.recharge'));
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
