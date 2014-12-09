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
	
	can.Model('Service.Game', {
		getGame : function(id, success, error) {
			return $.ajax({
				type : 'GET',
				url : '/games/' + id,
				dataType : 'json',
				success : success,
				error : error
			});
		}
	}, {});
})();