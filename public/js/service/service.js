(function() {
	can.Model('Service.Rule', {
		getRule : function(success, error) {
			return $.ajax({
				type : 'GET',
				url : '/rule',
				dataType : 'json',
				success : success,
				error : error
			});
		}
	}, {});
})();