(function() {
	can.Control('Components.GamePanel', {}, {
		init: function(element, options) {
			element.html(can.view('mst/game_panel.mst', options.model));
		},
	
		'.game-state-hide-button click': function() {
			this.element.find('.game-state-area').css('right', '-webkit-calc(-13%-20px)');
		}
	});
})();