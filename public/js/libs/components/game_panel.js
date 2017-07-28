(function() {
  can.Control('Components.GamePanel', {}, {
    init : function(element, options) {
      can.view('/js/libs/mst/game_panel.mst', options.model, {
        formatMessage : function(message) {
          if (message.content) {
            return message.content.split('\n').reduce(function(previous, current) {
              return previous + '<br>' + current;
            });
          } else {
            return message.content;
          }
        },
        formatRemainingTime : function(remainingTime) {
          if (options.model.attr('duration') === 99) {
            return '不限制时间';
          } else {
            return Utils.formatSeconds(remainingTime());
          }
        }
      }, function(frag) {
        element.html(frag);
        if (options.model.attr('status') === 'waiting') {
          this.showWaiting();
        } else if (options.model.attr('status') === 'ongoing') {
          this.showOngoing();
        }
        this.initEvents();
        this.messageToBottom();
        this.activePlayer(options.model.attr('currentPlayer'));
      }.bind(this));
    },

    initEvents : function() {
      $(document.body).keydown(function(e) {
        if (e.keyCode === 8) {
          var $target = $(e.target);
          if (!$target.hasClass('game-message-input') && !$target.hasClass('feedback-input')) {
            return false;
          }
        }
      });
      $(window).on('beforeunload', function() {
        return '确定离开游戏页面吗？';
      });
    },

    '.game-state-hide-button click' : function() {
      var gameStateArea = this.element.find('.game-state-area');
      if (gameStateArea.hasClass('out')) {
        gameStateArea.removeClass('out').css('right', '0px');
      } else {
        gameStateArea.addClass('out').css('right', (-gameStateArea[0].offsetWidth) + 'px');
      }
    },

    '{model} status' : function(model, e, newStatus, oldStatus) {
      if (newStatus === 'waiting') {
        this.showWaiting();
      } else if (newStatus === 'loading') {
        this.showLoading();
      } else if (newStatus === 'ongoing') {
        this.showOngoing();
      } else if (newStatus === 'destroyed') {
        this.destroy();
      }
    },

    '{model} active' : function(model, e, active) {
      this.activePlayer(model.attr('currentPlayer'));
    },

    '{model} currentPlayer' : function(model, e, player) {
      this.activePlayer(player);
    },

    '{model} countdownStage' : function(model, e, newStage, oldStage) {
      this.showCountdownStage(newStage);
    },

    '{model.players} change' : function() {
      this.resetStartButton();
    },

    '{model} messagesStamp' : function() {
      this.messageToBottom();
    },

    '{model} maxTimeoutReached' : function() {
      var self = this;
      Dialog.show({
        title : '确认',
        content : '游戏将在<span class="max-timeout-countdown-number">20</span>秒后退出，是否继续？',
        autoClose : false,
        actions : [{
          name : '继续',
          userClass : 'btn-primary',
          callback : function(element) {
            self.options.model.goahead(function() {
              element.closest('.modal').modal('hide');
            });
          }
        }]
      });
    },

    '{model} quitCountdownStage' : function(model, e, newStage) {
      $('.max-timeout-countdown-number').html(newStage);
    },

    '{model} destroyCountdownStage' : function(model, e, newStage) {
      $('.destroy-countdown-number').html(newStage);
    },

    '{model} waitCountdownStage' : function(model, e, newStage) {
      if (newStage === 0) {
        if (model.isBanker()) {
          Dialog.message('很遗憾，棋桌将要解散，您的建桌费会返到您的账户');
        } else {
          Dialog.message('很遗憾，棋桌将要解散，欢迎您继续游戏');
        }
      }
    },

    '{model} remainingTime' : function(model, e, remainingTime) {
      if (remainingTime <= 60) {
        var $remainingTime = this.element.find('.game-remaining-time');
        if (!$remainingTime.hasClass('warning')) {
          $remainingTime.addClass('warning');
        }
      }
    },

    '{model} quit' : function() {
      window.location.href = "/main";
    },

    '{model} results' : function(model, e, results) {
      var hasResults = results && results.length > 0;
      model.attr('hasResults', hasResults);
      var dialog = Dialog.show({
        title : hasResults ? '排行榜' : '游戏结束',
        template : '/js/libs/mst/results.mst',
        data : model,
        autoClose : false,
        actions : [{
          name : '关闭',
          dismiss : true,
          callback : function() {
            model.quit(function() {
              if (JSON.parse(window.localStorage.getItem('lobby_open'))) {
                window.close();
              } else {
                window.location.href = "/main";
              }
            });
          }
        }, {
          name : '退出',
          userClass : 'btn-primary',
          callback : function(element) {
            this.hide();
            model.quit(function() {
              window.location.href = "/main";
            });
          }
        }]
      });
    },

    messageToBottom : function() {
      var msgElement = this.element.find('.game-chat-messages-container')[0];
      msgElement.scrollTop = msgElement.scrollHeight - msgElement.clientHeight;
    },

    resetStartButton : function() {
      if (_.compact(this.options.model.attr('players')).length <= 1) {
        this.element.find('.game-start-button').attr('disabled', 'disabled');
      } else {
        this.element.find('.game-start-button').removeAttr('disabled');
      }
    },

    '.game-player mouseenter' : function(e) {
      var player = this.getPlayer(e);
      can.view('/js/libs/mst/player_tip.mst', player, function(frag) {
        $('body').append(frag);
        var playerTip = $('.player-tip');
        playerTip.css({
          top : e.offset().top + e.outerHeight(),
          left : e.offset().left + e.outerWidth() / 2 - playerTip.width() / 2
        });
      }.bind(this));
    },

    '.game-player mouseleave' : function(e) {
      $('.player-tip').remove();
    },

    '.game-start-button click' : function() {
      this.options.model.start();
    },

    '.game-group-chat click' : function(e) {
      e.find('.game-group-chat-link').click();
    },

    '.game-send-message-button click' : function() {
      this.sendMessage();
    },

    '.game-message-input keydown' : function(element, event) {
      if (event.keyCode == 13 && event.ctrlKey) {
        this.sendMessage();
      }
    },

    sendMessage : function() {
      var self = this;
      this.options.model.sendMessage(this.element.find('.game-message-input').val(), function() {
        self.element.find('.game-message-input').val('');
      });
    },

    '.game-quit-button click' : function() {
      var self = this;
      if (this.options.model.attr('status') === 'ongoing') {
        var message = '棋局已开始，确定要退出？';
        if (this.options.model.isBanker() && !this.options.model.attr('isGuest')) {
          message = '棋局已开始，您的建桌费不会返还，此桌游戏将取消，确定要退出？';
        }
        Dialog.confirm(message, function() {
          self.options.model.quit(function() {
            window.location.href = "/main";
          });
        });
      } else {
        var message = this.options.model.isBanker() ? '正在等待棋局，您的建桌费不会返还，此桌游戏将取消，确定要退出？' : '正在等待棋局，确定要退出？';
        Dialog.confirm(message, function() {
          self.options.model.quit(function() {
            window.location.href = "/main";
          });
        });
      }
    },

    destroy : function() {
      var model = this.options.model;
      var type = model.attr('destroyType');
      if (!model.isBanker() && type === 'banker-quit') {
        Dialog.show({
          title : '确认',
          content : '因为庄家退出，游戏将在<span class="close-countdown-number">10</span>秒后关闭',
          autoClose : false,
          actions : [{
            name : '立即关闭',
            userClass : 'btn-primary',
            callback : function() {
              window.location.href = "/main";
            }
          }]
        });
        var countdown = 10;
        var timer = setInterval(function() {
          $('.close-countdown-number').html(--countdown);
          if (countdown === 0) {
            clearInterval(timer);
            window.location.href = "/main";
          }
        }, 1000);
      } else {
        window.location.href = "/main";
      }
    },

    activePlayer : function(player) {
      if (player) {
        this.element.find('.game-player.active').removeClass('active');
        this.element.find('.game-player[account=' + player + ']').addClass('active');
      }
    },

    getPlayer : function(e) {
      if (e.hasClass('quit')) {
        return this.options.model.attr('quitPlayers.' + e.data('index'));
      } else {
        return this.options.model.attr('players.' + e.data('index'));
      }
    },

    showWaiting : function() {
      can.view('/js/libs/mst/game_waiting.mst', this.options.model, function(frag) {
        $('.game-main-area').empty().html(frag);
        this.resetStartButton();
      }.bind(this));
    },

    showLoading : function(countdown) {
      $('.game-main-area').empty();
    },

    showOngoing : function() {
      this.options.model.retrieveInitCellValues();
      $('.game-countdown-number').hide();
      setTimeout(function() {
        $('.game-countdown-number').remove();
      }, 2000);
      this.chessborad = new Chessboard($('.game-main-area'), {
        model : this.options.model
      });
    },

    showCountdownStage : function(stage) {
      var countdownElement = $('.game-countdown-number');
      countdownElement.hide().html(stage).fadeIn();
    }
  });
})();
