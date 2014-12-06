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
			var model = new can.Model();
			var add = [];
			$.each(rule.add, function(index, addItem) {
				var levels = [];
				for (var i = 0; i < addItem.levels.length - 1; i++) {
					levels.push({
						from : addItem.levels[i],
						to : addItem.levels[i + 1],
						score : addItem.scores[i]
					});
				}
				add.push({
					selected : addItem.selected,
					total : addItem.total,
					levels : levels
				});
			});
			model.attr('add', add);
			model.attr('reduce', rule.reduce);
			this.model = model;
			return model;
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
			var index = parseInt(this.element.find('[name=addRule]:checked').parents('.add-rule-item').attr('index'));
			this.model.attr('add').splice(index, 1);
			this.element.find('.add-rule-item[index=0] [name=addRule]').click();
		},

		'.add-rule-item-actions .add-item-button click' : function(e) {
			this.model.attr('add').attr($(e).parents('.add-rule-item').attr('index')).attr('levels').push({
				from : 5,
				to : 10,
				score : 100
			});
		},

		'.add-rule-item-actions .delete-item-button click' : function(e) {
			this.model.attr('add').attr($(e).parents('.add-rule-item').attr('index')).attr('levels').pop();
		},

		'.setting-save-action click' : function() {
			var rule = this.getRule();
		},

		'.add-rule-from blur' : function(e) {
			this.getLevel(e).attr('from', parseInt($(e).val()));
		},

		'.add-rule-to blur' : function(e) {
			this.getLevel(e).attr('to', parseInt($(e).val()));
		},

		'.add-rule-score blur' : function(e) {
			this.getLevel(e).attr('score', parseInt($(e).val()));
		},

		'.reduce-rule-timeout-score blur' : function(e) {
			this.model.attr('reduce').attr('timeout', parseInt($(e).val()));
		},

		'.reduce-rule-pass-score blur' : function(e) {
			this.model.attr('reduce').attr('pass', parseInt($(e).val()));
		},

		'input[name=addRule] click' : function(e) {
			e = $(e);
			var index = parseInt(e.parents('.add-rule-item').attr('index'));
			$.each(this.model.attr('add'), function(i, addRule) {
				addRule.attr('selected', i === index);
			});
		},

		getAddRule : function(e) {
			e = $(e);
			var index = e.parents('.add-rule-item').attr('index');
			return this.model.attr('add.' + index);
		},

		getLevel : function(e) {
			e = $(e);
			var index = e.parents('.add-rule-item').attr('index');
			var itemIndex = e.parents('.add-rule-item-row').attr('itemIndex');
			return this.model.attr('add.' + index + '.levels.' + itemIndex);
		}
	});
})();