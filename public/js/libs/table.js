(function() {
  $(document).ready(function() {
    var gameId = _.last(window.location.pathname.split('/'));
    var timer = setInterval(function() {
      Rest.Game.getGameStatus(gameId, function(result) {
        if (_.contains(['waiting', 'loading', 'ongoing'], result.result)) {
          clearInterval(timer);
          Rest.Game.getGame(gameId, function(game) {
            EventReceiver.createGameEventReceiver(gameId, function(eventReceiver) {
              var gameModel = new Models.GameModel(game, eventReceiver);
              new Components.GamePanel($('#game'), {
                model : gameModel
              });
            });
          }, function(e) {
            clearInterval(timer);
          });
        }
      }, function(e) {
        clearInterval(timer);
      });
    }, 500);
  });
})();
