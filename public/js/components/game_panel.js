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

		'.game-start-button click' : function() {
			this.options.model.start();
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