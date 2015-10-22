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

    var $messagesCount = $('.header .messages-count');

    var showMessagesCount = function() {
      var count = $messagesCount.html();
      if (count && count.length > 0) {
        count = parseInt(count);
      } else {
        count = 0;
      }
      if (count > 0) {
        $messagesCount.show();
      } else {
        $messagesCount.hide();
      }
    };
    setInterval(function() {
      Rest.Message.getUnreadCount(function(result) {
        $messagesCount.html(result.count);
        showMessagesCount();
      }, function() {
      });
    }, 3000);
    showMessagesCount();
  });
})();
