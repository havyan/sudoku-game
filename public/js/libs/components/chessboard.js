(function() {
	can.Control('Chessboard', {}, {
		init : function(element, options) {
			var self = this;
			this.render();
			this.initEvents();
			this.resize();
		},

		initEvents : function() {
			var self = this;
			var model = this.options.model;
			$(window).resize(this.resize.bind(this));
			$(document).keydown(function(e) {
				if (e.keyCode >= 37 && e.keyCode <= 40) {
					var activeElement = $(document.activeElement);
					if (activeElement.hasClass('chess-cell')) {
						var xy = activeElement.attr('xy');
						var splits = xy.split(',');
						var x = parseInt(splits[0]);
						var y = parseInt(splits[1]);
						while (true) {
							switch(e.keyCode) {
							case 37:
								x--;
								break;
							case 38:
								y--;
								break;
							case 39:
								x++;
								break;
							case 40:
								y++;
								break;
							}
							var key = x + ',' + y;
							if (model.existsCell(key)) {
								if (model.getRealCellValue(key) === undefined) {
									self.chessCells[key].focus();
									break;
								}
							} else {
								break;
							}
						}
					}
				}
			});
		},

		render : function() {
			var self = this;
			var mode = this.options.model.attr('mode');
			var cellDatas = this.options.model.attr('cellDatas');
			this.element.html(can.view('/js/libs/mst/chessboard.mst', this.options.model));
			this.chessCells = {};
			var chessboardElement = this.element.find('.chessboard-panel');
			var dimension = this.getDimension();
			var cellWidth = 100 / dimension.width;
			var cellHeight = 100 / dimension.height;
			$.each(mode, function(index, position) {
				var startX = cellWidth * position.x;
				var startY = cellHeight * position.y;
				var i = 0;
				while (i < 9) {
					var j = 0;
					while (j < 9) {
						var xy = (position.x + i) + ',' + (position.y + j);
						if (!self.chessCells[xy]) {
							chessboardElement.append(can.view('/js/libs/mst/chess_cell_container.mst', {
								xy : xy,
								left : (startX + cellWidth * i) + '%',
								top : (startY + cellHeight * j) + '%',
								width : cellWidth + '%',
								height : cellHeight + '%'
							}));
							self.chessCells[xy] = new ChessCell(chessboardElement.find('[xy="' + xy + '"]'), {
								model : cellDatas.attr(xy),
								parent : self,
								parentModel : self.options.model,
								xy : xy,
								cellClass : "chess-cell-" + (i % 3) + '-' + (j % 3),
							});
						}
						j++;
					}
					i++;
				}
			});
			this.numberPicker = new NumberPicker(this.element.find('.chessboard-container'), {});
			this.gameTimer = new GameTimer(this.element.find('.game-timer-panel'), {
				model : this.options.model
			});
			if (this.options.model.attr('changedScore.changed') < 0 && this.options.model.attr('prop.impunity') > 0) {
				this.element.find('.prop .impunity').addClass('active');
			}
			if (this.options.model.isActive() && !this.options.model.attr('delayed') && this.options.model.attr('prop.delay') > 0) {
				this.element.find('.prop .delay').addClass('active');
			}
		},

		getDimension : function() {
			var mode = this.options.model.attr('mode');
			var maxX = 0;
			var maxY = 0;
			$.each(mode, function(index, xy) {
				maxX = Math.max(maxX, xy.x);
				maxY = Math.max(maxY, xy.y);
			});
			return {
				width : maxX + 9,
				height : maxY + 9
			};
		},

		toDraftMode : function() {
			this.element.find('.chessboard-container').addClass('draft');
			this.element.find('.chessboard-submit-mode-action').removeClass('action-active');
			this.element.find('.chessboard-draft-mode-action').addClass('action-active');
		},

		toSubmitMode : function() {
			this.element.find('.chessboard-container').removeClass('draft');
			this.element.find('.chessboard-submit-mode-action').addClass('action-active');
			this.element.find('.chessboard-draft-mode-action').removeClass('action-active');
		},

		resize : function() {
			var dimension = this.getDimension();
			var cellSize = Math.floor((window.innerHeight - 60) / dimension.height);
			if (cellSize * dimension.width > window.innerWidth) {
				cellSize = Math.floor((window.innerWidth - 60) / dimension.width);
			}
			this.element.find('.chessboard-container').css({
				'width' : (cellSize * dimension.width) + 'px',
				'height' : (cellSize * dimension.height) + 'px'
			});
			for (var key in this.chessCells) {
				this.chessCells[key].resetFont();
			}
		},

		'.chessboard-submit-mode-action click' : function() {
			this.options.model.toSubmit();
		},

		'.chessboard-draft-mode-action click' : function() {
			this.options.model.toDraft();
		},

		'.chessboard-plain-mode-action click' : function() {
			this.options.model.toPlain();
		},

		'.chessboard-options-mode-action click' : function() {
			this.options.model.toOptions();
		},

		'.pass-action click' : function() {
			this.options.model.pass();
		},

		'{model} active' : function(model, e, active) {
			this.numberPicker.hide();
			this.element.find('.prop .magnifier').removeClass('active');
			if (active && model.attr('prop.delay') > 0) {
				this.element.find('.prop .delay').addClass('active');
			} else {
				this.element.find('.prop .delay').removeClass('active');
			}
		},

		'{model} editStatus' : function(model, e, status) {
			if (status === 'submit') {
				this.toSubmitMode();
			} else {
				this.toDraftMode();
			}
		},

		'{model} viewStatus' : function(model, e, status) {
			if (status === 'plain') {
				this.element.find('.chessboard-options-mode-action').removeClass('action-active');
				this.element.find('.chessboard-plain-mode-action').addClass('action-active');
			} else {
				this.element.find('.chessboard-plain-mode-action').removeClass('action-active');
				this.element.find('.chessboard-options-mode-action').addClass('action-active');
			}
		},

		'{model.userCellValues} change' : function(userCellValues, e, xy) {
			var self = this;
			this.chessCells[xy].element.addClass('correct');
			setTimeout(function() {
				self.chessCells[xy].element.removeClass('correct');
			}, 2000);
		},

		'{model.knownCellValues} change' : function(userCellValues, e, xy, how) {
			if (how !== 'remove') {
				var self = this;
				this.chessCells[xy].element.addClass('known-cell');
				setTimeout(function() {
					self.chessCells[xy].element.removeClass('known-cell');
				}, 2000);
			}
		},

		'{model} incorrect' : function(model, e, data) {
			var self = this,
			    xy = data.xy;
			this.chessCells[xy].element.addClass('incorrect');
			setTimeout(function() {
				self.chessCells[xy].element.removeClass('incorrect');
			}, 2000);
		},

		'{model} changedScore' : function(model, e, changedScore) {
			var text = changedScore.changed > 0 ? '+' + changedScore.changed : '' + changedScore.changed;
			if (changedScore.type === 'timeout') {
				text = '超时 ' + text;
			} else if (changedScore.type === 'impunity') {
				text = '免罚 ' + text;
			}
			var chessboardElement = this.element.find('.chessboard-container');
			var messageElement = this.element.find('.' + changedScore.type + '-message');
			messageElement.html(text).fadeIn();
			var left = (chessboardElement.width() - messageElement.width()) / 2;
			var top = (chessboardElement.height() - messageElement.height()) / 2;
			if (changedScore.type === 'correct' || changedScore.type === 'incorrect') {
				if (changedScore.xy) {
					var cellElement = this.chessCells[changedScore.xy].element;
					left = cellElement.position().left - (messageElement.width() - cellElement.width()) / 2;
					top = cellElement.position().top - (messageElement.height() - cellElement.height()) / 2;
				}
			}
			if (changedScore.type !== 'pass') {
				messageElement.css({
					'left' : left + 'px',
					'top' : top + 'px'
				});
			}
			messageElement.css('color', changedScore.changed > 0 ? '#05B522' : '#FD8C04');
			setTimeout(function() {
				messageElement.fadeOut();
			}, 1000);
			if (changedScore.changed < 0 && model.attr('prop.impunity') > 0) {
				this.element.find('.prop .impunity').addClass('active');
			} else {
				this.element.find('.prop .impunity').removeClass('active');
			}
		},

		'.chess-cell click' : function(element, event) {
			var model = this.options.model;
			var self = this;
			var container = element.parent();
			var xy = container.attr('xy');
			if (model.isDraft()) {

			} else if (model.isActive() && model.isPlain()) {
				if (model.getKnownCellValue(xy) !== undefined) {
					model.submit(xy, model.getKnownCellValue(xy));
					model.attr('active', false);
				} else if (model.getCellValue(xy) === undefined) {
					var cellOptions = model.calcCellOptions(xy);
					this.showNumberPicker(container, cellOptions, function(value) {
						model.submit(xy, value);
						model.attr('active', false);
					});
				}
			}
			event = event || window.event;
			if (event.stopPropagation) {
				event.stopPropagation();
			} else if (window.event) {
				window.event.cancelBubble = true;
			}
		},

		'.chess-cell focus' : function(element, event) {
			var model = this.options.model;
			var container = element.parent();
			var xy = container.attr('xy');
			this.selectedChassCell = this.chessCells[xy];
			if (model.isDraft() || model.isActive()) {
				if (model.attr('prop.magnifier') > 0) {
					this.element.find('.prop .magnifier').addClass('active');
				}
			}
		},

		'.chess-cell blur' : function(element, event) {
			this.element.find('.prop .magnifier').removeClass('active');
		},

		'.magnifier click' : function(element, event) {
			if (this.selectedChassCell) {
				if (this.options.model.isDraft()) {
					this.options.model.peep(this.selectedChassCell.options.xy);
				} else {
					if (this.options.model.isActive()) {
						this.options.model.autoSubmit(this.selectedChassCell.options.xy);
					}
				}
				this.selectedChassCell = null;
			}
		},

		'.delay click' : function(element, event) {
			var self = this;
			if (element.hasClass('active')) {
				this.options.model.delay(function() {
					self.element.find('.prop .delay').removeClass('active');
				});
			}
		},

		'.impunity click' : function(element, event) {
			var self = this;
			if (element.hasClass('active')) {
				this.options.model.impunish(function() {
					self.element.find('.prop .impunity').removeClass('active');
				});
			}
		},

		showNumberPicker : function(parent, options, callback) {
			var top = parent.position().top + parent.height() / 2,
			    left = parent.position().left + parent.width() / 2;
			this.numberPicker.show(top, left, options, callback);
		}
	});
})();
