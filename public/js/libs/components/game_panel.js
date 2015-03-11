(function() {
  can.Control('Components.GamePanel', {}, {
    init : function(element, options) {
      element.html(can.view('/js/libs/mst/game_panel.mst', options.model, {
        formatMessage : function(message) {
          if (message.content) {
            return message.content.split('\n').reduce(function(previous, current) {
              return previous + '<br>' + current;
            });
          } else {
            return message.content;
          }
        }
      }));
      if (options.model.attr('status') === 'waiting') {
        this.showWaiting();
      } else if (options.model.attr('status') === 'ongoing') {
        this.showOngoing();
      }
      this.initDialog();
      this.initEvents();
      this.messageToBottom();
      this.activePlayer(options.model.attr('currentPlayer'));
    },

    initEvents : function() {
      $(document.body).keydown(function(e) {
        if (e.keyCode === 8) {
          if (!$(e.target).hasClass('game-message-input')) {
            return false;
          }
        }
      });
    },

    initDialog : function() {
      var self = this;
      $(".max-timeout-dialog").dialog({
        autoOpen : false,
        modal : true,
        buttons : {
          "继续" : function() {
            self.options.model.goahead();
            $(this).dialog("close");
          }
        }
      });
    },

    '.game-state-hide-button click' : function() {
      var gameStateArea = this.element.find('.game-state-area');
      if (gameStateArea.hasClass('out')) {
        gameStateArea.removeClass('out').css('right', '0px');
        gameStateArea.find('.game-state-hide-button').html('>>');
      } else {
        gameStateArea.addClass('out').css('right', (-gameStateArea[0].offsetWidth) + 'px');
        gameStateArea.find('.game-state-hide-button').html('<<');
      }
    },

    '{model} status' : function(model, e, newStatus, oldStatus) {
      if (newStatus === 'waiting') {
        this.showWaiting();
      } else if (newStatus === 'loading') {
        this.showLoading();
      } else if (newStatus === 'ongoing') {
        this.showOngoing();
      } else if (newStatus === 'over') {
        alert('Game Over!!!');
      } else if (newStatus === 'destroyed') {
        window.location.href = "/main";
      }
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
      $('.max-timeout-countdown-number').html(20);
      $(".max-timeout-dialog").dialog("open");
    },

    '{model} quitCountdownStage' : function(model, e, newStage) {
      $('.max-timeout-countdown-number').html(newStage);
    },

    '{model} quit' : function() {
      window.location.href = "/main";
    },

    messageToBottom : function() {
      var msgElement = this.element.find('.game-chat-messages')[0];
      msgElement.scrollTop = msgElement.scrollHeight - msgElement.clientHeight;
    },

    resetStartButton : function() {
      if (this.options.model.attr('players').length <= 1) {
        this.element.find('.game-start-button').attr('disabled', 'disabled');
      } else {
        this.element.find('.game-start-button').removeAttr('disabled');
      }
    },

    '.game-player mouseenter' : function(e) {
      var player = this.getPlayer(e);
      $('body').append(can.view('/js/libs/mst/player_tip.mst', player));
      var playerTip = $('.player-tip');
      playerTip.css({
        top : e.offset().top + e.outerHeight(),
        left : e.offset().left + e.outerWidth() / 2 - playerTip.width() / 2
      });
    },

    '.game-player mouseleave' : function(e) {
      $('.player-tip').remove();
    },

    '.game-start-button click' : function() {
      this.options.model.start();
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
      if (this.options.model.attr('status') === 'ongoing') {
        var confirmed = confirm('游戏中，是否强行退出游戏?');
        if (confirmed) {
          this.options.model.quit(function() {
            window.location.href = "/main";
          });
        }
      } else {
        this.options.model.quit(function() {
          window.location.href = "/main";
        });
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
      $('.game-main-area').empty().html(can.view('/js/libs/mst/game_waiting.mst', this.options.model));
      this.resetStartButton();
    },

    showLoading : function(countdown) {
      $('.game-main-area').empty();
    },

    showOngoing : function() {
      $('.game-countdown-number').hide();
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
