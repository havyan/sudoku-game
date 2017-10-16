(function() {
  $(document).ready(function() {
    var gameId = _.last(window.location.pathname.split('/'));
    var stopped = false;
    var stop = function() {
      stopped = true;
      clearInterval(timer);
    };
    var timer = setInterval(function() {
      Rest.Game.getGameStatus(gameId, function(result) {
        if (!stopped && _.contains(['waiting', 'loading', 'ongoing'], result.result)) {
          stop();
          Rest.Game.getGame(gameId, function(game) {
            EventReceiver.createGameEventReceiver(game.id, function(eventReceiver) {
              var gameModel = new Models.GameModel(game, eventReceiver);
              new Components.GamePanel($('#game'), {
                model : gameModel
              });
            });
          }, function(e) {
            stop();
          });
        }
      }, function(e) {
        stop();
      });
    }, 500);
  });
})();
