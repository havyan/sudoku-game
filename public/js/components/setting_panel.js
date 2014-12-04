(function() {
	can.Control('Components.SettingPanel', {}, {
		init : function(element, options) {
			var model = this.setRule(options.rule);
			element.html(can.view('mst/setting_panel.mst', model));
		},

		setRule : function(rule) {
			var model = new can.Model();
			var add = [];
			$.each(rule.add, function(index, addItem) {
				var levels = [];
				for (var i = 0; i < addItem.levels.length - 1; i++) {
					levels.push({
						start : addItem.levels[i],
						end : addItem.levels[i + 1],
						score : addItem.scores[i]
					});
				}
				add.push({
					total : addItem.total,
					levels : levels
				});
			});
			model.attr('add', add);
			model.attr('reduce', rule.reduce);
			this.model = model;
			return model;
		}
	});
})();