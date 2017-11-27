(function() {
  can.Control('Components.LobbyPanel', {}, {
    init : function(element, options) {
      window.localStorage.setItem('lobby_open', true);
      $(window).on('beforeunload', function() {
        window.localStorage.setItem('lobby_open', false);
      });
      can.view('/js/libs/mst/lobby_panel.mst', options.model, {
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
      }, function(frag) {
        element.html(frag);
        var selectedRoom = options.model.attr('selectedRoom');
        this.selectRoom(selectedRoom);
        this.toggleExpand(this.element.find('#' + selectedRoom).closest('.lobby-nav-item'));
        this.gameForm = new LobbyGameDialog(this.element, {
          user : this.options.model.attr('user').attr(),
          rule : this.options.model.attr('rule').attr(),
          levels : this.options.model.attr('levels').attr()
        });
      }.bind(this));
    },

    selectRoom : function(roomId) {
      var model = this.options.model;
      var room = this.options.model.findRealRoom(roomId);
      var $room = this.element.find('.lobby-nav-real-room[data-id=' + roomId + ']');
      this.element.find('.lobby-nav-real-room, .lobby-nav-virtual-room').removeClass('active');
      $room.addClass('active').parents('.lobby-nav-item').find('.lobby-nav-virtual-room').addClass('active');
      can.view('/js/libs/mst/lobby_room.mst', room, {
        tableOrder : function(game) {
          return _.findIndex(room.attr('games'), {
            id : game.id
          }) + 1;
        },
        tableInfo : function(game) {
          if (game.status === 'empty') {
            return T('page:lobby.create_game');
          } else if (game.status === 'waiting') {
            var level = L(_.find(model.attr('levels'), {
              code : game.level
            }).name);
            return T('page:lobby.waiting_start') + '<br>' + T('page:lobby.puzzle_level') + level + '<br>' + T('page:lobby.each_round') + game.duration + T('page:lobby.hour') + '<br>' + T('page:lobby.each_step') + game.stepTime + T('page:lobby.second');
          } else if (game.status === 'loading') {
            return '游戏加载中...<br>' + T('page:lobby.each_round') + game.duration + T('page:lobby.hour') + '<br>' + T('page:lobby.each_step') + game.stepTime + T('page:lobby.second');
          } else if (game.status === 'ongoing') {
            return T('page:lobby.game_ongoing') + '<br>' + T('page:lobby.each_round') + game.duration + T('page:lobby.hour') + '<br>' + T('page:lobby.each_step') + game.stepTime + T('page:lobby.second');
          } else if (game.status === 'over') {
            return '游戏结束';
          }
        },
        seatAvailable : function(index, context) {
          var capacity = context.scope._parent.read('capacity').value;
          if (!capacity || index() < capacity) {
            return 'available';
          } else {
            return 'unavailable';
          }
        },
        playerIncluded : function(game) {
          var players = _.compact(game.attr('players'));
          if (game && _.find(players, { account: model.attr('user.account') })) {
            return 'included';
          }
        },
        playerSelf : function(player) {
          if (player && (player.account === model.attr('user.account'))) {
            return 'self';
          }
        }
      }, function(frag) {
        this.element.find('.lobby-content').html(frag);
      }.bind(this));
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
        var path = 'M ' + left + ' 0 L ' + left + ' ' + ($roomContainer.height() / 2);
        path += ' A 10 10 0 0 0 ' + (left + 10) + ' ' + ($roomContainer.height() / 2 + 10);
        path += ' L ' + (left + 30) + ' ' + ($roomContainer.height() / 2 + 10);
        $rooms.each(function(index, room) {
          var $room = $(room);
          var y = $room.position().top + $room.height() / 2 + 10;
          if (index === 0) {
            path += ' L ' + (left + 30) + ' ' + (y + 10);
            path += ' A 10 10 0 0 1 ' + (left + 40) + ' ' + y;
            path += ' L ' + right + ' ' + y;
            path += ' M ' + (left + 30) + ' ' + ($roomContainer.height() / 2 + 5);
          } else if (index === $rooms.length - 1) {
            path += ' L ' + (left + 30) + ' ' + (y - 10);
            path += ' A 10 10 0 0 0 ' + (left + 40) + ' ' + y;
            path += ' L ' + right + ' ' + y;
          } else {
            path += ' L ' + (left + 30) + ' ' + y;
            path += ' L ' + right + ' ' + y;
            path += ' M ' + (left + 30) + ' ' + y;
          }
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

    '{model} reload' : function() {
      window.location.reload();
    },

    '.free .lobby-game.empty .lobby-table click' : function(e) {
      var self = this;
      var model = self.options.model;
      this.gameForm.show(function(params) {
        var gameId = e.closest('.lobby-game').data('id');
        var money = model.attr('user.money');
        var cost = _.findIndex(model.attr('levels'), {
          code : params.level
        }) * 100;
        if (money < cost) {
          Dialog.message('您的天才币余额不足');
        } else {
          if (cost > 0) {
            Dialog.confirm('您需要花费' + cost + '个天才币，是否继续？', function($e) {
              Rest.Game.playerJoin(gameId, 0, params, function(result) {
                $e.closest('.modal').modal('hide');
              }, function(error) {
                var message = '建桌失败, ' + error.responseJSON.message;
                $e.closest('.modal').modal('hide');
                Dialog.error(message);
              });
              self.openGame(gameId);
            });
          } else {
            Rest.Game.playerJoin(gameId, 0, params, function(result) {
            }, function(error) {
              var message = '建桌失败, ' + error.responseJSON.message;
              Dialog.error(message);
            });
            self.openGame(gameId);
          }
        }
      });
    },

    '.lobby-player.self, .lobby-table.included click' : function(e) {
      this.openGame(e.closest('.lobby-game').data('id'));
    },

    openGame : function(gameId) {
      window.open('/table/' + gameId, '_blank');
    },

    '.free .lobby-game.waiting .lobby-table click' : function(e) {
      var gameId = e.closest('.lobby-game').data('id');
      var game = this.options.model.findGame(gameId);
      var index = _.findIndex(game.attr('players'), function(player) {
        return player == null;
      });
      this.joinGame(game, index);
    },

    '.free .lobby-game.waiting .lobby-player.empty.normal.available click' : function(e) {
      this.joinGame(this.options.model.findGame(e.closest('.lobby-game').data('id')), e.data('index'));
    },

    joinGame : function(game, index) {
      var self = this;
      var model = this.options.model;
      var grade = model.attr('user.grade');
      var gameId = game.attr('id');
      var levelIndex = _.findIndex(model.attr('levels'), {
        code : game.attr('level')
      });
      if (parseInt(grade) < levelIndex - 1) {
        Dialog.message('您不能加入题目等级比自己段数高的游戏');
      } else {
        Rest.Game.playerJoin(gameId, index, {}, function(result) {});
        self.openGame(gameId);
      }
    },

    '.lobby-player.existent mouseenter' : function(e) {
      var player = this.options.model.findPlayer(e.data('id'));
      if (player) {
        can.view('/js/libs/mst/player_tip.mst', player, function(frag) {
          $('body').append(frag);
          var playerTip = $('.player-tip');
          playerTip.css({
            top : e.offset().top + e.outerHeight() / 2,
            left : e.offset().left + e.outerWidth() / 2 - playerTip.width() / 2
          });
        }.bind(this));
      }
    },

    '.lobby-player.existent mouseleave' : function(e) {
      $('.player-tip').remove();
    }
  });
})();
