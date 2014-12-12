(function() {
	can.Control('Components.GamePanel', {}, {
		init : function(element, options) {
			element.html(can.view('mst/game_panel.mst', options.model));
			if (options.model.attr('status') === 'waiting') {
				this.showWaiting();
			} else if (options.model.attr('status') === 'ongoing') {
				this.showOngoing();
			}
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
			} else if (newStatus === 'ongoing') {
				this.showOngoing(oldStatus === 'waiting');
			}
		},

		'.game-player mouseenter' : function(e) {
			var player = this.getPlayer(e);
			$('body').append(can.view('mst/player_tip.mst', player));
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

		getPlayer : function(e) {
			return this.options.model.attr('players.' + e.attr('index'));
		},

		showWaiting : function() {
			$('.game-main-area').empty().html(can.view('mst/game_waiting.mst', this.options.model));
		},

		showOngoing : function(countdown) {
			$('.game-main-area').empty();
			var countdownElement = $('.game-countdown-number');
			var showChessbord = function() {
			};
			if (countdown) {
				var leftSeconds = 5;
				countdownElement.html(leftSeconds).fadeIn(500);
				var nextNumber = function() {
					countdownElement.hide();
					countdownElement.html(leftSeconds)
					countdownElement.fadeIn(500);
					if (leftSeconds >= 0) {
						setTimeout(nextNumber, 1000);
					} else {
						countdownElement.hide();
						showChessbord();
					}
					leftSeconds--;
				};
				nextNumber();
			} else {
				showChessbord();
			}
		}
	});
})();