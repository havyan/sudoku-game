(function() {
  $(document).ready(function() {
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
    Rest.Lobby.getData(function(data) {
      var bindSinglePlayer = function() {
        if (!window.singlePlayerDialog) {
          window.singlePlayerDialog = new SinglePlayerDialog($('body'));
        }
        $('a.single-player').click(function() {
          Rest.Game.getUnfinishedGames(function(result) {
            window.singlePlayerDialog.show({
              unfinishedSingle: result.result.single,
              unfinishedRobot: result.result.robot
            }, function(params) {
              if (params.continueLast) {
                Rest.Game.restoreGame(result.result[params.playMode]);
              } else {
                Rest.Game.createSingleGame({
                  playMode: params.playMode
                }, function() {}, function() {});
              }
              window.open('/table/' + data.user.account, '_blank');
            });
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
      if (!data.user.isGuest) {
        setInterval(function() {
          Rest.Message.getUnreadCount(function(result) {
            $messagesCount.html(result.count).attr('title', result.count);
            showMessagesCount();
          }, function() {
            window.location.reload();
          });
        }, 15000);
      }
    }, function(e) {
    });

    showMessagesCount();
  });
})();
