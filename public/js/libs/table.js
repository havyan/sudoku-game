(function() {
  $(document).ready(function() {
    var gameId = _.last(window.location.pathname.split('/'));
    Rest.Game.getGame(gameId, function(game) {
      var eventReceiver = EventReceiver.createGameEventReceiver(gameId);
      var gameModel = new Models.GameModel(game, eventReceiver);
      new Components.GamePanel($('#game'), {
        model : gameModel
      });
    }, function(e) {
    });
  });
})();
