(function() {
	$(document).ready(function() {
		Rest.Rule.getRule(function(rule) {
			new Components.SettingPanel($('#setting'), {
				rule : rule
			});
		}, function(e) {
		});
	});
})();