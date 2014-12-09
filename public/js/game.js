(function() {
	$(document).ready(function() {
		Service.Game.getGame('game_demo', function(game) {
			var gameModel = new Models.GameModel(game);
			new Components.GamePanel($('#game'), {
				model : gameModel
			});
		}, function(e) {
		});
	});
})();