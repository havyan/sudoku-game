(function() {
  var STATUS = {
    '0' : '充值未完成',
    '1' : '充值成功',
    '2' : '已付款，等待处理',
    '9' : '开始充值',
    '-1' : '充值失败'
  };
  var BANK = {
    '0' : '中国工商银行',
    '1' : '招商银行',
    '3' : '中国农业银行',
    '4' : '中国建设银行',
    '5' : '支付宝',
    '6' : '中国银联'
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
        value : '5'
      }, {
        code : 'union',
        value : '6'
      }, {
        code : 'icbc',
        value : '0'
      }, {
        code : 'cmb',
        value : '1'
      }, {
        code : 'ccb',
        value : '4'
      }, {
        code : 'abc',
        value : '3'
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
      var model = options.model;
      can.view('/js/libs/mst/recharge_panel.mst', model, {
        rechargeStatus : function(status) {
          return STATUS[status()];
        },

        rechargeResult : function(status) {
          status = status();
          if (status === '1' || status === '2') {
            return '充值天才币成功！';
          } else {
            return '充值天才币失败！';
          }
        },

        rechargeBank : function(bank) {
          return BANK[bank()];
        },

        isUnfinished : function(status, options) {
          status = status();
          if (status === '9') {
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
        this.paginationModel = new Models.PaginationModel();
        this.paginationBar = new Components.PaginationBar(element.find('.records-pagination-bar'), {
          model : this.paginationModel
        });
        this.initEvents();
      }.bind(this));
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
          Dialog.message('请正确输入你要充值的对象.');
        }
      } else {
        Dialog.message('请选择或输入你要购买的天才币.');
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
        title : '付款确认',
        userClass : 'pay-confirm-dialog',
        content : '请在新开网银页面完成付款。<br>支付成功后订单状态可能会延迟更新，可稍后查看。',
        actions : [{
          name : '已完成付款',
          userClass : 'btn-primary',
          callback : function() {
            check();
            clearInterval(timer);
            this.hide();
            model.next();
          }
        }, {
          name : '付款遇到问题',
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
