(function() {
	can.Control('ChessCell', {}, {
		init : function(element, options) {
			element.html(can.view('/js/libs/mst/chess_cell.mst', options.model));
			element.find('.chess-cell').addClass(options.cellClass);
			this.setCellOptions(options.model.attr('cellOptions'));
		},

		resetView : function() {
			var model = this.options.model;
			var parentModel = this.options.parentModel;
			if (model.attr('value')) {
				this.showValue();
			} else {
				if (parentModel.isDraft() && model.attr('draft').length > 0) {
					this.showDraft();
				} else {
					if (parentModel.isOptions()) {
						this.showCellOptions();
					} else {
						this.showValue();
					}
				}
			}
		},

		'{parentModel} editStatus' : function(parentModel, e, status) {
			this.resetView();
		},

		'{parentModel} viewStatus' : function(model, e, status) {
			this.resetView();
		},

		'{model} value' : function(model, e, value) {
			this.resetView();
		},

		'{model.draft} change' : function() {
			this.setDraft(this.options.model.attr('draft'));
			this.resetView();
		},

		'{model} cellOptions' : function(model, e, cellOptions) {
			this.setCellOptions(cellOptions);
			this.resetView();
		},

		'.chess-cell keydown' : function(element, event) {
			if (this.options.parentModel.isDraft()) {
				var draft = this.options.model.attr('draft');
				var code = event.keyCode;
				var codeMap = {
					normal : {
						'192' : '`',
						'188' : ',',
						'190' : '.',
						'191' : '/',
						'186' : ';',
						'222' : "'",
						'219' : '[',
						'221' : ']',
						'220' : '\\',
						'189' : '-',
						'187' : '=',
						'106' : '*',
						'107' : '+',
						'109' : '-',
						'110' : '.',
						'111' : '/'
					},
					shift : {
						'192' : '~',
						'188' : '<',
						'190' : '>',
						'191' : '?',
						'186' : ':',
						'222' : '"',
						'219' : '{',
						'221' : '}',
						'220' : '|',
						'48' : ')',
						'49' : '!',
						'50' : '@',
						'51' : '#',
						'52' : '$',
						'53' : '%',
						'54' : '^',
						'55' : '&',
						'56' : '*',
						'57' : '('
					}
				};
				if (event.shiftKey) {
					if (codeMap.shift['' + code]) {
						this.options.parentModel.addDraft(this.options.xy, codeMap.shift['' + code]);
					} else if (code > 64 && code < 91) {
						this.options.parentModel.addDraft(this.options.xy, String.fromCharCode(code));
					}
				} else {
					if (codeMap.normal['' + code]) {
						this.options.parentModel.addDraft(this.options.xy, codeMap.normal['' + code]);
					} else if (code === 46) {
						this.options.parentModel.popDraft(this.options.xy);
					} else if (code === 8) {
						this.options.parentModel.clearDraft(this.options.xy);
						return false;
					} else if (code === 32) {
						this.options.parentModel.addDraft(this.options.xy, ' ');
						return false;
					} else if (code > 64 && code < 91) {
						this.options.parentModel.addDraft(this.options.xy, String.fromCharCode(code + 32));
					} else if (code > 47 && code < 58) {
						this.options.parentModel.addDraft(this.options.xy, String.fromCharCode(code));
					} else if (code > 95 && code < 106) {
						this.options.parentModel.addDraft(this.options.xy, code - 96);
					}
				}
			}
		},

		resetFont : function() {
			var element = this.element;
			var valueElement = element.find('.chess-cell-value');
			element.find('.chess-cell-value, .chess-cell-no-options, .chess-cell-draft-one').css({
				'line-height' : valueElement.height() + 'px',
				'font-size' : Math.round(valueElement.height() * 0.75) + 'px'
			});
			this.resetElementFont(element.find('.chess-cell-options-cell'));
			this.resetElementFont(element.find('.chess-cell-draft-cell'));
		},

		resetElementFont : function(element) {
			element.css({
				'line-height' : element.height() + 'px',
				'font-size' : Math.round(element.height() * 0.8) + 'px'
			});
		},

		showValue : function() {
			this.element.find('.chess-cell-value').show();
			this.element.find('.chess-cell-options').hide();
			this.element.find('.chess-cell-draft').hide();
		},

		showDraft : function() {
			this.element.find('.chess-cell-draft').show();
			this.resetElementFont(this.element.find('.chess-cell-draft-cell'));
			this.element.find('.chess-cell-options').hide();
			this.element.find('.chess-cell-value').hide();
		},

		showCellOptions : function() {
			this.element.find('.chess-cell-options').show();
			this.resetElementFont(this.element.find('.chess-cell-options-cell'));
			this.element.find('.chess-cell-value').hide();
			this.element.find('.chess-cell-draft').hide();
		},

		setDraft : function(draft) {
			this.element.find('.chess-cell-draft-cell').empty();
			if (draft.length > 0 && draft.length <= 4) {
				this.element.find('.chess-cell-draft').addClass('has-value');
				if (draft.length === 1) {
					this.element.find('.chess-cell-draft-one').html(draft[0]).attr('active', "true");
				} else if (draft.length > 1) {
					this.element.find('.chess-cell-draft-one').attr('active', "false");
					if (draft.length <= 4) {
						for (var i = 0; i <= draft.length; i++) {
							this.element.find('.chess-cell-draft-cell[index=' + i + ']').html(draft[i]);
						}
					}
				}
			} else {
				this.element.find('.chess-cell-draft').removeClass('has-value');
			}
		},

		setCellOptions : function(cellOptions) {
			this.element.find('.chess-cell-options-cell').empty();
			if (cellOptions.length === 0) {
				this.element.find('.chess-cell-no-options').attr('active', "true");
			} else if (cellOptions.length > 0) {
				this.element.find('.chess-cell-no-options').attr('active', "false");
				if (cellOptions.length <= 4) {
					var index = 3;
					for (var i = cellOptions.length - 1; i >= 0; i--) {
						this.element.find('.chess-cell-options-cell[index=' + index + ']').html(cellOptions[i]);
						index--;
					}
				}
			}
		},

		focus : function() {
			this.element.find('.chess-cell').focus();
		}
	});
})();
