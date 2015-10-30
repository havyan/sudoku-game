(function() {
  $(document).ready(function() {
    var gameId = _.last(window.location.pathname.split('/'));
    Rest.Game.getGame(gameId, function(game) {
      EventReceiver.createGameEventReceiver(gameId, function(eventReceiver) {
        var gameModel = new Models.GameModel(game, eventReceiver);
        new Components.GamePanel($('#game'), {
          model : gameModel
        });
      });
    }, function(e) {
    });
  });
})();
