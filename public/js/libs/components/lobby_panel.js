(function() {
  can.Control('Components.LobbyPanel', {}, {
    init : function(element, options) {
      element.html(can.view('/js/libs/mst/lobby_panel.mst', options.model, {
        playersCount : function(room) {
          var count = function(room) {
            var result = 0;
            if (room.attr('virtual')) {
              room.attr('children').each(function(child) {
                result += count(child);
              });
            } else {
              room.attr('games').each(function(game) {
                game.attr('players').each(function(player) {
                  if (player) {
                    result++;
                  }
                });
              });
            }
            return result;
          };
          return count(room).toString();
        }
      }));
      this.selectRoom(options.model.attr('selectedRoom'));
      this.toggleExpand(this.element.find('.lobby-nav-item:first'));
      this.gameForm = new LobbyGameForm(this.element, {
        user : this.options.model.attr('user').attr(),
        rule : this.options.model.attr('rule').attr(),
        levels : this.options.model.attr('levels').attr()
      });
    },

    selectRoom : function(roomId) {
      var $room = this.element.find('.lobby-nav-real-room[data-id=' + roomId + ']');
      this.element.find('.lobby-nav-real-room, .lobby-nav-virtual-room').removeClass('active');
      $room.addClass('active').parents('.lobby-nav-item').find('.lobby-nav-virtual-room').addClass('active');
      this.element.find('.lobby-content').html(can.view('/js/libs/mst/lobby_room.mst', this.options.model.findRealRoom(roomId), {
        tableInfo : function(game) {
          if (game.status === 'empty') {
            return '空桌';
          } else if (game.status === 'waiting') {
            return '等待开始';
          } else if (game.status === 'loading') {
            return '游戏加载中...<br>每局' + game.duration + '小时<br>每步' + game.stepTime + '秒';
          } else if (game.status === 'ongoing') {
            return '游戏进行中<br>每局' + game.duration + '小时<br>每步' + game.stepTime + '秒';
          } else if (game.status === 'over') {
            return '游戏结束';
          }
        }
      }));
    },

    '.lobby-nav-virtual-room click' : function(e) {
      this.toggleExpand(e.closest('.lobby-nav-item'));
    },

    toggleExpand : function(e) {
      e.toggleClass('expand');
      if (e.hasClass('expand')) {
        var $roomContainer = e.find('.lobby-nav-real-rooms');
        var $rooms = $roomContainer.find('.lobby-nav-real-room');
        var $line = e.find('.lobby-nav-item-line');
        var $svg = $line.find('svg');
        $line.css({
          'height' : $roomContainer.height() + 'px'
        });
        $svg.attr('width', $line.width() + 'px').attr('height', $line.height() + 'px');
        var left = $line.width() / 2 - 10;
        var right = $line.width();
        var path = 'M ' + left + ' 0 ';
        $rooms.each(function(index, room) {
          var $room = $(room);
          var y = $room.position().top + $room.height() / 2 + 10;
          path += 'L ' + left + ' ' + y + ' L ' + right + ' ' + y + ' L ' + left + ' ' + y + ' ';
        });
        $svg.find('path').attr('d', path);
      }
    },

    '.lobby-nav-real-room click' : function(e) {
      this.options.model.selectRoom(e.data('id'));
    },

    '{model} selectedRoom' : function(model, e, selectedRoom) {
      this.selectRoom(selectedRoom);
    },

    '.lobby-game.empty .lobby-table click' : function(e) {
      var self = this;
      this.gameForm.show(function(params) {
        var gameId = e.closest('.lobby-game').data('id');
        var money = self.options.model.attr('user.money');
        var cost = _.findIndex(self.options.model.attr('levels'), {
          code : params.level
        }) * 100;
        if (money < cost) {
          Dialog.showMessage('您的天才币余额不足');
        } else {
          if (cost > 0) {
            Dialog.showConfirm('您需要花费' + cost + '个天才币，是否继续？', function() {
              Rest.Game.playerJoin(gameId, 0, params, function(result) {
                window.location.href = '/table/' + result.gameId;
              }, function(error) {
                Dialog.showError('建桌失败, ' + error);
              });
            });
          } else {
            Rest.Game.playerJoin(gameId, 0, params, function(result) {
              window.location.href = '/table/' + result.gameId;
            }, function(error) {
              Dialog.showError('建桌失败, ' + error);
            });
          }
        }
      });
    },

    '.lobby-game.waiting .lobby-player.empty.normal click' : function(e) {
      var gameId = e.closest('.lobby-game').data('id');
      Rest.Game.playerJoin(gameId, e.data('index'), {}, function(result) {
        window.location.href = '/table/' + result.gameId;
      });
    },

    '.lobby-player.existent mouseenter' : function(e) {
      var player = this.options.model.findPlayer(e.data('id'));
      if (player) {
        $('body').append(can.view('/js/libs/mst/player_tip.mst', player));
        var playerTip = $('.player-tip');
        playerTip.css({
          top : e.offset().top + e.outerHeight() / 2,
          left : e.offset().left + e.outerWidth() / 2 - playerTip.width() / 2
        });
      }
    },

    '.lobby-player.existent mouseleave' : function(e) {
      $('.player-tip').remove();
    },
  });
})();
