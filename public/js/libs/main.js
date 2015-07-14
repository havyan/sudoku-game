(function() {
  $(document).ready(function() {
    Rest.Lobby.getData(function(data) {
      var eventReceiver = EventReceiver.createSystemEventReceiver();
      var lobbyModel = new Models.LobbyModel(data, eventReceiver);
      new Components.LobbyPanel($('#lobby'), {
        model : lobbyModel
      });
    }, function(e) {
    });
  });
})();
