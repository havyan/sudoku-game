(function() {
  can.Control('Components.SettingPanel', {
    defaults : {
      maxLevelCount : 4
    }
  }, {
    init : function(element, options) {
      var self = this;
      var model = this.initModel(options.rule);
      model.attr('rule').bind('change', function() {
        self.ruleChanged = true;
      });
      can.view('/js/libs/mst/setting_panel.mst', model, {
        disableLastTo : function(ruleRow) {
          var isLast = false;
          self.model.attr('rule.score.add').forEach(function(addRule) {
            var levels = addRule.attr('levels');
            isLast = isLast || (levels.indexOf(ruleRow) === levels.length - 1);
          });
          if (isLast) {
            return 'disabled="disabled"';
          } else {
            return '';
          }
        },
        disableEdit : function() {
          return self.model.attr('editable') ? '' : 'disabled="disabled"';
        }
      }, function(frag) {
        element.html(frag);
      }.bind(this));
    },

    getRule : function() {
      var rule = this.model.attr('rule').attr();
      return rule;
    },

    initModel : function(rule) {
      var account = $('body').data('account');
      this.model = new can.Model({
        rule : rule,
        account : account,
        editable : account === 'SYSTEM'
      });
      return this.model;
    },

    '.navigator .item click' : function(e) {
      e.addClass('active').siblings('.item').removeClass('active');
      this.element.find('.setting-container .item').removeClass('active').filter('.' + e.data('target')).addClass('active');
    },

    '.add-rule-collapsed-button click' : function(e) {
      e = $(e);
      var text = e.html();
      e.html(text === '收起' ? '展开' : '收起');
      $(e.parent()).toggleClass('collapsed');
    },

    '.setting-panel .add-button click' : function() {
      this.model.attr('rule.score.add').push({
        total : 30,
        levels : [{
          "from" : 0,
          "to" : 5,
          "score" : 200
        }, {
          "from" : 5,
          "to" : 10,
          "score" : 180
        }, {
          "from" : 10,
          "to" : 20,
          "score" : 150
        }, {
          "from" : 20,
          "to" : 30,
          "score" : 100
        }]
      });
    },

    '.setting-panel .delete-button click' : function() {
      if (this.model.attr('rule.score.add').length > 1) {
        var index = this.getAddRuleIndex(this.element.find('[name=addRule]:checked'));
        this.model.attr('rule.score.add').splice(index, 1);
        this.model.attr('rule.score.add.0.selected', true);
      } else {
        Dialog.message('不能删除最后一条规则！');
      }
    },

    '.add-rule-row-actions .add-row-button click' : function(e) {
      var addRule = this.getAddRule(e);
      var levels = addRule.attr('levels');
      if (levels.length < this.options.maxLevelCount) {
        addRule.attr('levels').push({
          from : '',
          to : addRule.total,
          score : ''
        });
        this.resetAddRule(addRule);
      } else {
        Dialog.message('最多可以定制' + this.options.maxLevelCount + '行！');
      }
      this.validate();
    },

    '.add-rule-row-actions .delete-row-button click' : function(e) {
      var addRule = this.getAddRule(e);
      var levels = addRule.attr('levels');
      if (levels.length > 1) {
        addRule.attr('levels').pop();
        this.resetAddRule(addRule);
      } else {
        Dialog.message('不能删除最后一行！');
      }
      this.validate();
    },

    '.reset-prop-action click' : function() {
      Dialog.confirm('你确认要重置所有道具吗？', function() {
        this.hide();
        Rest.Prop.reset(function() {
          Dialog.message('重置道具成功!!!');
        }, function() {
        });
      });
    },

    '.reset-money-action click' : function() {
      Dialog.confirm('你确认要重置天才币吗？', function() {
        this.hide();
        Rest.User.resetMoney(function() {
          Dialog.message('重置天才币成功!!!');
        }, function() {
        });
      });
    },

    '.setting-save-action click' : function() {
      var self = this;
      if (this.validate()) {
        var rule = this.getRule();
        if (this.ruleChanged) {
          Rest.Rule.updateRule(rule, function(res) {
            self.ruleChanged = false;
            if (res.success) {
              Dialog.message('更新规则成功');
            } else {
              Dialog.error(res.reason);
            }
          });
        } else {
          Dialog.message('没有修改任何规则');
        }
      } else {
        var $invalid = this.element.find('input.invalid:first');
        if ($invalid.length > 0) {
          this.element.find('.navigator .item.' + $invalid.closest('[data-nav]').data('nav')).click();
          $invalid.focus();
        }
      }
    },

    '.setting-back-action click' : function() {
      if (this.ruleChanged) {
        Dialog.confirm('设置已被修改，是否放弃？', function() {
          window.location.href = "/main";
        });
      } else {
        window.location.href = "/main";
      }
    },

    '.add-rule-from blur' : function(e) {
      this.getLevel(e).attr('from', this.getValue(e));
    },

    '.add-rule-score blur' : function(e) {
      var level = this.getLevel(e);
      var value = this.getValue(e);
      if ($.isNumeric(value)) {
        level.attr('score', this.getValue(e));
        var addRuleRowIndex = this.getAddRuleRowIndex(e);
        var min = 0;
        var max = Number.MAX_VALUE;
        var levels = this.getAddRule(e).attr('levels');
        for (var i = 0; i < addRuleRowIndex; i++) {
          var score = levels.attr(i + '.score');
          if ($.isNumeric(score)) {
            max = Math.min(max, score);
          }
        }
        for (var i = addRuleRowIndex + 1; i < levels.length; i++) {
          var score = levels.attr(i + '.score');
          if ($.isNumeric(score)) {
            min = Math.max(min, score);
          }
        }
        if (value <= min || value >= max) {
          level.attr('score', '');
          Dialog.message('您必须输入介于' + min + '和' + max + '之间的值！');
        }
      }
      this.getLevel(e).attr('score', this.getValue(e));
    },

    '.reduce-rule-timeout-score blur' : function(e) {
      this.model.attr('rule.score.reduce').attr('timeout', this.getValue(e));
    },

    '.reduce-rule-pass-score blur' : function(e) {
      this.model.attr('rule.score.reduce').attr('pass', this.getValue(e));
    },

    '.single-rule-correct-score blur' : function(e) {
      this.model.attr('rule.score.single').attr('correct', this.getValue(e));
    },

    '.single-rule-incorrect-score blur' : function(e) {
      this.model.attr('rule.score.single').attr('incorrect', this.getValue(e));
    },

    'input[name=addRule] click' : function(e) {
      var index = this.getAddRuleIndex(e);
      $.each(this.model.attr('rule.score.add'), function(i, addRule) {
        addRule.attr('selected', i === index);
      });
    },

    'input[type=text] keydown' : function(e, event) {
      return Utils.isIntKey(event.keyCode);
    },

    '.add-rule-to blur' : function(e) {
      var level = this.getLevel(e);
      var value = this.getValue(e);
      if ($.isNumeric(value)) {
        level.attr('to', this.getValue(e));
        var addRuleRowIndex = this.getAddRuleRowIndex(e);
        var addRule = this.getAddRule(e);
        var min = 0;
        var max = addRule.total;
        var levels = addRule.attr('levels');
        for (var i = 0; i < addRuleRowIndex; i++) {
          var to = levels.attr(i + '.to');
          if ($.isNumeric(to)) {
            min = Math.max(min, to);
          }
        }
        for (var i = addRuleRowIndex + 1; i < levels.length; i++) {
          var to = levels.attr(i + '.to');
          if ($.isNumeric(to)) {
            max = Math.min(max, to);
          }
        }
        if (value <= min || value >= max) {
          level.attr('to', '');
          Dialog.message('您必须输入介于' + min + '和' + max + '之间的值！');
        } else {
          if (addRuleRowIndex < levels.length - 1) {
            levels.attr(addRuleRowIndex + 1).attr('from', this.getValue(e));
          }
        }
      }
    },

    '.add-rule-item-header > label span click' : function(e) {
      e.closest('.add-rule-item-header').addClass('edit');
      e.parent().find('input').focus();
    },

    '.add-rule-item-header > label input blur' : function(e) {
      var addRule = this.getAddRule(e),
          total = parseInt(e.val());
      if (total !== addRule.attr('total')) {
        addRule.attr('total', total);
        this.resetAddRule(addRule);
      }
      e.closest('.add-rule-item-header').removeClass('edit');
    },

    getValue : function(e) {
      var value = $(e).val();
      return $.isNumeric(value) ? parseInt(value) : '';
    },

    resetAddRule : function(addRule) {
      var levels = addRule.attr('levels');
      if (levels.length > 1) {
        $.each(levels, function(index, level) {
          if (index === 0) {
            level.attr('from', 0);
            level.attr('to', '');
            level.attr('score', '');
          } else if (index === (levels.length - 1)) {
            level.attr('from', '');
            level.attr('to', addRule.total);
            level.attr('score', '');
          } else {
            level.attr('from', '');
            level.attr('to', '');
            level.attr('score', '');
          }
        });
      } else {
        var level = levels.attr(0);
        level.attr('from', 0);
        level.attr('to', addRule.total);
        level.attr('score', '');
      }
    },

    getAddRuleIndex : function(e) {
      e = $(e);
      return parseInt(e.parents('.add-rule-item').attr('index'));
    },

    getAddRuleRowIndex : function(e) {
      e = $(e);
      return parseInt(e.parents('.add-rule-item-row').attr('rowIndex'));
    },

    getAddRule : function(e) {
      return this.model.attr('rule.score.add.' + this.getAddRuleIndex(e));
    },

    getLevel : function(e) {
      var index = this.getAddRuleIndex(e);
      var rowIndex = this.getAddRuleRowIndex(e);
      return this.model.attr('rule.score.add.' + index + '.levels.' + rowIndex);
    },

    '.grade-table .value span click' : function(e) {
      if (!this.model.attr('editable')) return;
      var index = parseInt(e.closest('tr').data('index'));
      if (index > 0) {
        e.closest('.value').addClass('edit').find('input').val(this.model.attr('rule.grade.' + index + '.floor')).focus();
      }
    },

    '.grade-table .value input keydown' : function(e, event) {
      return Utils.isIntKey(event.keyCode);
    },

    '.setting-grade input blur' : function(e) {
      if (!this.validateGrade(e)) {
        e.focus();
      }
    },

    '.ui-value-zoom input change' : function(e, event) {
      var value = parseFloat(e.val());
      if (isNaN(value)) {
        value = this.model.attr('rule.ui.zoom');
        e.val(value);
      } else {
        if (value < 1) {
          value = 1;
          e.val(value);
        } else if (value > 1.5) {
          value = 1.5;
          e.val(value);
        }
      }
      this.model.attr('rule.ui.zoom', value);
    },

    '.exchange-rate input change' : function(e, event) {
      var value = parseFloat(e.val());
      if (isNaN(value) || value < 0) {
        value = this.model.attr('rule.exchange.rate');
        e.val(value);
      }
      this.model.attr('rule.exchange.rate', value);
    },

    '.setting-main input blur' : function() {
      this.validate();
    },

    validate : function() {
      var self = this;
      var valid = true;
      this.element.find('input[type=text]').each(function() {
        if (!self.validateScore($(this))) {
          valid = false;
        }
      });
      this.element.find('.setting-grade input[type=text]').each(function(index) {
        if (index > 0 && !self.validateGrade($(this))) {
          valid = false;
        }
      });
      return valid;
    },

    validateScore : function(e) {
      var valid = true;
      if (_.isEmpty(e.val())) {
        e.addClass('invalid');
        valid = false;
      } else {
        e.removeClass('invalid');
      }
      return valid;
    },

    validateGrade : function(e) {
      var valid = true;
      var value = parseInt(e.val());
      var index = parseInt(e.closest('tr').data('index'));
      var beforValue = index > 0 ? this.model.attr('rule.grade.' + (index - 1) + '.floor') : 0;
      var afterValue = index < this.model.attr('rule.grade').length - 1 ? this.model.attr('rule.grade.' + (index + 1) + '.floor') : 9999999999;
      if (isNaN(value) || value <= beforValue || value >= afterValue) {
        e.siblings('.error').html('积分必须介于' + beforValue + '到' + afterValue + '之间');
        e.closest('.grade-table').find('.value').removeClass('edit');
        e.closest('.value').addClass('edit');
        e.addClass('invalid');
        valid = false;
      } else {
        e.siblings('.error').empty();
        e.removeClass('invalid').closest('.value').removeClass('edit');
        this.model.attr('rule.grade.' + index + '.floor', value);
      }
      return valid;
    }
  });
})();
