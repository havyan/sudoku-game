(function() {
  $(document).ready(function() {
    Rest.Lobby.getData(function(data) {
      var bindSinglePlayer = function() {
        var singlePlayerDialog = new SinglePlayerDialog($('body'));
        $('a.single-player').click(function() {
          singlePlayerDialog.show(function(params) {
            Rest.Game.createSingleGame(params, function() {

            }, function() {});
            window.open('/table/' + data.user.account, '_blank');
          });
        });
      };
      bindSinglePlayer();
      EventReceiver.createSystemEventReceiver(function(eventReceiver) {
        var lobbyModel = new Models.LobbyModel(data, eventReceiver);
        new Components.LobbyPanel($('#lobby'), {
          model : lobbyModel
        });
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
        $messagesCount.html(result.count).attr('title', result.count);
        showMessagesCount();
      }, function() {
        window.location.reload();
      });
    }, 15000);
    showMessagesCount();
  });
})();
