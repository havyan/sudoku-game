(function() {
	can.Control('Components.GamePanel', {}, {
		init : function(element, options) {
			element.html(can.view('mst/game_panel.mst', options.model));
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
		}
	});
})();