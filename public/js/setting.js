(function() {
	$(document).ready(function() {
		Service.Rule.getRule(function(rule) {
			new Components.SettingPanel($('#setting'), {
				rule : rule
			});
		}, function(e) {
		});
	});
})();