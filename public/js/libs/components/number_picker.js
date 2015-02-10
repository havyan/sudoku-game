(function() {
	can.Control('NumberPicker', {
	}, {
		init : function(element, options) {
			var self = this;
			this.element.append(can.view('/js/libs/mst/number_picker.mst'));
			document.onclick = function() {
				self.element.find('.number-picker').hide();
			};
		},

		show : function(top, left, numbers, callback) {
			var self = this;
			this.callback = callback;
			var cellElement = this.element.find('.number-picker-cell');
			cellElement.addClass('disabled');
			$.each(numbers, function(index, number) {
				self.element.find('.number-picker-cell[value=' + number + ']').removeClass('disabled');
			});
			this.element.find('.number-picker').css({
				top : top + 'px',
				left : left + 'px'
			}).show();
		},

		hide : function() {
			this.element.find('.number-picker').hide();
		},

		'.number-picker-cell click' : function(element) {
			if (!element.hasClass('disabled')) {
				this.hide();
				if (this.callback) {
					this.callback(parseInt(element.attr('value')));
				}
			}
		},

		'.number-picker click' : function(element, event) {
			event = event || window.event;
			if (event.stopPropagation) {
				event.stopPropagation();
			} else if (window.event) {
				window.event.cancelBubble = true;
			}
		}
	});
})();
