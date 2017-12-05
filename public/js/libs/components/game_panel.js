(function() {
  can.Control('Components.GamePanel', {
    defaults: {
      template: '/js/libs/mst/game_panel.mst'
    }
  }, {
    init : function(element, options) {
      can.view(options.template, options.model, {
        formatMessage : function(message) {
          if (message.content) {
            return L(message.content).split('\n').reduce(function(previous, current) {
              return previous + '<br>' + current;
            });
          } else {
            return message.content;
          }
        },
        formatRemainingTime : function(remainingTime) {
          if (options.model.attr('duration') === 99) {
            return T('page:game.unlimited_time');
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
        return T('page:game.leave_ok');
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
        title : T('page:game.confirmation'),
        content : T('page:game.game_will') + '<span class="max-timeout-countdown-number">20</span>' + T('page:game.continue_game'),
        autoClose : false,
        actions : [{
          name : T('common:actions.continue'),
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
          Dialog.message(T('page:game.sorry_over_money'));
        } else {
          Dialog.message(T('page:game.sorry_over'));
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
        title : hasResults ? T('page:game.ranking') : T('page:game.game_over'),
        template : '/js/libs/mst/results.mst',
        data : model,
        autoClose : false,
        actions : [{
          name : T('common:actions.close'),
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
          name : T('page:game.quit'),
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
        var message = T('page:game.quit_ok');
        if (this.options.model.isBanker() && !this.options.model.attr('isGuest')) {
          message = T('page:game.quit_ok_money');
        }
        Dialog.confirm(message, function() {
          self.options.model.quit(function() {
            window.location.href = "/main";
          });
        });
      } else {
        var message = this.options.model.isBanker() ? T('page:game.quit_ok_wait_money') : T('page:game.quit_ok_wait');
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
          title : T('page:game.confirmation'),
          content : T('page:game.because_banker') + '<span class="close-countdown-number">10</span>' + T('page:game.seconds_close'),
          autoClose : false,
          actions : [{
            name : T('page:game.close_now'),
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
      this.chessborad = this.createChessboard();
    },

    createChessboard: function() {
      return new Chessboard($('.game-main-area'), {
        model : this.options.model
      });
    },

    showCountdownStage : function(stage) {
      var countdownElement = $('.game-countdown-number');
      countdownElement.hide().html(stage).fadeIn();
    }
  });
})();
