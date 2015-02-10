(function() {
	$(document).ready(function() {
		var gameId = _.last(window.location.pathname.split('/'));
		Rest.Game.getGame(gameId, function(game) {
			var eventCenter = new EventCenter(gameId);
			var gameModel = new Models.GameModel(game, eventCenter);
			new Components.GamePanel($('#game'), {
				model : gameModel
			});
		}, function(e) {
		});
	});
})();
