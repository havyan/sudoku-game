(function() {
	can.Control('Components.SettingPanel', {}, {
		init : function(element, options) {
			var model = this.setRule(options.rule);
			element.html(can.view('mst/setting_panel.mst', model));
		},

		getRule : function() {
			var rule = this.model.attr();
			return rule;
		},

		setRule : function(rule) {
			this.model = new can.Model(rule);
			return this.model;
		},

		'.add-rule-collapsed-button click' : function(e) {
			e = $(e);
			var text = e.html();
			e.html(text === '收起' ? '展开' : '收起');
			$(e.parent()).toggleClass('collapsed');
		},

		'.setting-panel .add-button click' : function() {
			this.model.attr('add').push({
				total : 30,
				levels : [ {
					from : 0,
					to : 5,
					score : 200
				}, {
					from : 5,
					to : 10,
					score : 100
				} ]
			});
		},

		'.setting-panel .delete-button click' : function() {
			var index = this.getAddRuleIndex(this.element.find('[name=addRule]:checked'));
			this.model.attr('add').splice(index, 1);
			this.element.find('.add-rule-item[index=0] [name=addRule]').click();
		},

		'.add-rule-item-actions .add-item-button click' : function(e) {
			var addRule = this.getAddRule(e);
			addRule.attr('levels').push({
				from : '',
				to : addRule.total,
				score : ''
			});
			this.resetAddRule(addRule);
		},

		'.add-rule-item-actions .delete-item-button click' : function(e) {
			var addRule = this.getAddRule(e);
			addRule.attr('levels').pop();
			this.resetAddRule(addRule);
		},

		'.setting-save-action click' : function() {
			var rule = this.getRule();
		},

		'.add-rule-from blur' : function(e) {
			this.getLevel(e).attr('from', this.getValue(e));
		},

		'.add-rule-to blur' : function(e) {
			this.getLevel(e).attr('to', this.getValue(e));
		},

		'.add-rule-score blur' : function(e) {
			this.getLevel(e).attr('score', this.getValue(e));
		},

		'.reduce-rule-timeout-score blur' : function(e) {
			this.model.attr('reduce').attr('timeout', this.getValue(e));
		},

		'.reduce-rule-pass-score blur' : function(e) {
			this.model.attr('reduce').attr('pass', this.getValue(e));
		},

		'input[name=addRule] click' : function(e) {
			var index = this.getAddRuleIndex(e);
			$.each(this.model.attr('add'), function(i, addRule) {
				addRule.attr('selected', i === index);
			});
		},

		'input[type=text] keydown' : function(e) {
			return ((event.keyCode > 47 && event.keyCode < 58) || (event.keyCode > 95 && event.keyCode < 106));
		},

		'input.add-rule-to blur' : function(e) {
			var addRuleRowIndex = this.getAddRuleRowIndex(e);
			var levels = this.getAddRule(e).attr('levels');
			if (addRuleRowIndex < levels.length - 1) {
				levels.attr(addRuleRowIndex + 1).attr('from', this.getValue(e));
			}
		},

		getValue : function(e) {
			var value = $(e).val();
			return $.isNumeric(value) ? parseInt(value) : '';
		},

		resetAddRule : function(addRule) {
			var levels = addRule.attr('levels');
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
			return this.model.attr('add.' + this.getAddRuleIndex(e));
		},

		getLevel : function(e) {
			var index = this.getAddRuleIndex(e);
			var rowIndex = this.getAddRuleRowIndex(e);
			return this.model.attr('add.' + index + '.levels.' + rowIndex);
		}
	});
})();