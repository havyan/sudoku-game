(function() {
	can.Model('Models.GameModel', {}, {
		init : function(game, eventCenter) {
			this.eventCenter = eventCenter;
			this.initEvents();
			this.initStatus();
			this.initRanking();
			this.initMessages();
			this.initCellDatas();
			this.initActive();
		},

		initStatus : function() {
			if (!(this.attr('status'))) {
				this.attr('status', 'waiting');
			}
			this.attr('editStatus', 'submit');
			this.attr('viewStatus', 'plain');
		},

		initActive : function() {
			var self = this;
			self.attr('active', self.attr('currentPlayer') === self.attr('account'));
		},

		initRanking : function() {
			var self = this;
			this.resetRanking();
			this.attr('scores').bind('change', function(ev, attr, how, value) {
				self.resetRanking();
			});
		},

		resetRanking : function() {
			var self = this;
			var players = this.attr('players');
			var quitPlayers = this.attr('quitPlayers');
			var scores = this.attr('scores');
			var ranking = [];
			$.each(players, function(index, player) {
				ranking.push({
					account : player.attr('account'),
					name : player.attr('name'),
					score : scores[player.attr('account')] || 0
				});
			});
			ranking.sort(function(source, dest) {
				return dest.score - source.score;
			});
			$.each(quitPlayers, function(index, quitPlayer) {
				ranking.push({
					account : quitPlayer.attr('account'),
					name : quitPlayer.attr('name'),
					score : scores[quitPlayer.attr('account')] || 0,
					type : 'quit'
				});
			});
			$.each(ranking, function(index, e) {
				e.position = index + 1;
			});
			this.attr('ranking', ranking);
		},

		initMessages : function() {
			if (!(this.attr('messages'))) {
				this.attr('messages', []);
			}
		},

		initCellDatas : function() {
			var self = this;
			var cellDatas = {};
			var initCellValues = this.attr('initCellValues');
			var userCellValues = this.attr('userCellValues');
			var knownCellValues = this.attr('knownCellValues');
			var drafts = this.retrieveDrafts();
			var allCellOptions = this.calcAllCellOptions();
			$.each(this.attr('mode'), function(index, position) {
				var i = 0;
				while (i < 9) {
					var j = 0;
					while (j < 9) {
						var xy = (position.x + i) + ',' + (position.y + j);
						if (!cellDatas[xy]) {
							cellDatas[xy] = {
								xy : xy,
								type : initCellValues.attr(xy) ? 'init' : userCellValues.attr(xy) ? 'user' : knownCellValues.attr(xy) ? 'known' : '',
								value : initCellValues.attr(xy) || userCellValues.attr(xy) || knownCellValues.attr(xy),
								cellOptions : allCellOptions[xy] || [],
								draft : drafts[xy] ? drafts[xy] : []
							};
						}
						j++;
					}
					i++;
				}
			});
			this.attr('cellDatas', cellDatas);
			this.attr('cellDatas').each(function(cellData, xy) {
				cellData.attr('draft').bind('change', function() {
					drafts[xy] = cellData.attr('draft').attr();
					self.saveDrafts(drafts);
				});
			});
			this.bind('initCellValues', function() {
				var cellDatas = self.attr('cellDatas');
				self.attr('initCellValues').each(function(value, xy) {
					var cellData = cellDatas.attr(xy);
					if (cellData) {
						cellData.attr('type', 'init');
						cellData.attr('value', value);
					}
					self.attr('knownCellValues').removeAttr(xy);
				});
				self.resetAllCellOptions();
			});
			this.attr('userCellValues').bind('change', function(ev, xy, how, value) {
				var cellData = self.attr('cellDatas').attr(xy);
				if (cellData) {
					cellData.attr('type', 'user');
					cellData.attr('value', value);
				}
				self.attr('knownCellValues').removeAttr(xy);
				self.resetAllCellOptions();
			});
			this.attr('knownCellValues').bind('change', function(ev, xy, how, value) {
				if (how !== 'remove') {
					var cellData = self.attr('cellDatas').attr(xy);
					if (cellData) {
						cellData.attr('type', 'known');
						cellData.attr('value', value);
					}
					self.resetAllCellOptions();
				}
			});
		},

		deleteDrafts : function() {
			window.localStorage.removeItem(this.attr('id') + '_' + this.attr('account') + '_drafts');
		},

		retrieveDrafts : function() {
			var drafts = window.localStorage.getItem(this.attr('id') + '_' + this.attr('account') + '_drafts');
			if (drafts) {
				return JSON.parse(drafts);
			} else {
				return {};
			}
		},

		saveDrafts : function(drafts) {
			window.localStorage.setItem(this.attr('id') + '_' + this.attr('account') + '_drafts', JSON.stringify(drafts));
		},

		start : function(success, error) {
			Rest.Game.setStatus(this.attr('id'), 'loading', success, error);
		},

		sendMessage : function(message, success, error) {
			Rest.Game.sendMessage(this.attr('id'), message, success, error);
		},

		addPlayer : function(player) {
			this.attr('players').push(player);
			this.resetRanking();
		},

		playerQuit : function(account) {
			var index = _.findIndex(this.attr('players'), function(player) {
				return player.account === account;
			});
			if (this.attr('status') === 'ongoing') {
				this.attr('quitPlayers').unshift(this.attr('players.' + index).attr());
			}
			this.attr('players').splice(index, 1);
			this.resetRanking();
		},

		addMessage : function(message) {
			this.attr('messages').push(message);
			this.attr('messagesStamp', Date.now());
		},

		addDraft : function(xy, value) {
			var draft = this.attr('cellDatas').attr(xy).attr('draft');
			if (draft.length < 4) {
				draft.push(value);
			}
			this.resetAllCellOptions();
		},

		popDraft : function(xy) {
			this.attr('cellDatas').attr(xy).attr('draft').pop();
			this.resetAllCellOptions();
		},

		clearDraft : function(xy) {
			var draft = this.attr('cellDatas').attr(xy).attr('draft');
			draft.splice(0, draft.length);
			this.resetAllCellOptions();
		},

		submit : function(xy, value) {
			Rest.Game.submit(this.attr('id'), xy, value, function(result) {
			}, function() {
			});
		},

		autoSubmit : function(xy) {
			var self = this;
			Rest.Game.autoSubmit(this.attr('id'), xy, function(result) {
				self.attr('props.magnifier', self.attr('props.magnifier') - 1);
			}, function() {
			});
		},

		peep : function(xy) {
			var self = this;
			Rest.Game.peep(this.attr('id'), xy, function(result) {
				self.attr('props.magnifier', self.attr('props.magnifier') - 1);
				self.attr('knownCellValues').attr(xy, result.result);
			}, function() {
			});
		},

		goahead : function() {
			Rest.Game.goahead(this.attr('id'), function(result) {
			}, function() {
			});
		},

		pass : function() {
			Rest.Game.pass(this.attr('id'), function(result) {
			}, function() {
			});
		},

		quit : function(success) {
			Rest.Game.quit(this.attr('id'), function(result) {
				if (success) {
					success(result);
				}
			}, function() {
			});
		},

		delay : function(success) {
			var self = this;
			Rest.Game.delay(this.attr('id'), function(result) {
				self.attr('props.delay', self.attr('props.delay') - 1);
				if (success) {
					success(result);
				}
			}, function() {
			});
		},

		impunish : function(success) {
			var self = this;
			Rest.Game.impunish(this.attr('id'), this.attr('account'), function(result) {
				self.attr('props.impunity', self.attr('props.impunity') - 1);
				if (success) {
					success(result);
				}
			}, function() {
			});
		},

		isSubmit : function() {
			return this.attr('editStatus') === 'submit';
		},

		toSubmit : function() {
			this.attr('editStatus', 'submit');
			this.resetAllCellOptions();
		},

		toDraft : function() {
			this.attr('editStatus', 'draft');
			this.resetAllCellOptions();
		},

		isDraft : function() {
			return this.attr('editStatus') === 'draft';
		},

		toPlain : function() {
			this.attr('viewStatus', 'plain');
		},

		isPlain : function() {
			return this.attr('viewStatus') === 'plain';
		},

		toOptions : function() {
			this.attr('viewStatus', 'options');
			this.resetAllCellOptions();
		},

		isOptions : function() {
			return this.attr('viewStatus') === 'options';
		},

		isActive : function() {
			return this.attr('active');
		},

		totalTime : function() {
			return this.attr('rule.add.total');
		},

		initEvents : function() {
			var self = this;
			this.eventCenter.on('player-joined', function(player) {
				self.addPlayer(player);
			});
			this.eventCenter.on('player-quit', function(account) {
				self.playerQuit(account);
				if (self.attr('account') === account) {
					self.attr('quit', true);
					self.destroy();
				}
			});
			this.eventCenter.on('message-added', function(message) {
				self.addMessage(message);
			});
			this.eventCenter.on('status-changed', function(status) {
				self.attr('status', status);
			});
			this.eventCenter.on('puzzle-init', function(initCellValues) {
				self.attr('initCellValues', initCellValues);
			});
			this.eventCenter.on('countdown-stage', function(stage) {
				self.attr('countdownStage', stage);
			});
			this.eventCenter.on('cell-correct', function(xy, value) {
				self.attr('userCellValues').attr(xy, parseInt(value));
			});
			this.eventCenter.on('cell-incorrect', function(xy) {
				self.attr('incorrect', {
					xy : xy
				});
			});
			this.eventCenter.on('switch-player', function(account) {
				self.attr('currentPlayer', account);
				self.attr('active', false);
				self.attr('active', account === self.attr('account'));
				self.attr('delayed', false);
			});
			this.eventCenter.on('ellapsed-time', function(ellapsedTime) {
				var remainingTime = self.attr('rule.add.total') - ellapsedTime;
				self.attr('remainingTime', remainingTime);
			});
			this.eventCenter.on('score-changed', function(account, info) {
				self.attr('scores').attr(account, parseInt(info.score));
				if (account === self.attr('account')) {
					self.attr('changedScore', info);
				}
			});
			this.eventCenter.on('max-timeout-reached', function(account) {
				if (self.attr('account') === account) {
					self.attr('maxTimeoutReached', Date.now());
				}
			});
			this.eventCenter.on('quit-countdown-stage', function(account, stage) {
				if (self.attr('account') === account) {
					self.attr('quitCountdownStage', stage);
				}
			});
			this.eventCenter.on('game-over', function() {
				self.attr('status', 'over');
			});
			this.eventCenter.on('game-destroyed', function() {
				self.attr('status', 'destroyed');
				self.destroy();
			});
			this.eventCenter.on('game-delayed', function() {
				self.attr('delayed', true);
			});
			this.eventCenter.on('delay-countdown-stage', function(stage) {
				self.attr('delayCountdownStage', stage);
			});
			this.eventCenter.on('game-delay-cancelled', function() {
				self.attr('delayed', false);
			});
		},

		setCellOptions : function(xy, cellOptions) {
			var cellData = this.attr('cellDatas').attr(xy);
			var currentCellOptions = cellData.attr('cellOptions');
			if (currentCellOptions.length === cellOptions.length) {
				var same = true;
				for (var i = 0; i < cellOptions.length; i++) {
					same = same && (cellOptions[i] === currentCellOptions[i]);
				}
				if (same) {
					return;
				}
			}
			cellData.attr('cellOptions', cellOptions);
		},

		resetAllCellOptions : function() {
			var allCellOptions = this.calcAllCellOptions();
			for (var key in allCellOptions) {
				this.setCellOptions(key, allCellOptions[key]);
			}
		},

		calcCellOptions : function(xy) {
			if (this.getCellValue(xy) === undefined) {
				var self = this,
				    splits = xy.split(','),
				    x = parseInt(splits[0]),
				    y = parseInt(splits[1]),
				    cellOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
				this.removeCubicOptions(cellOptions, x, y);
				$.each(this.attr('mode'), function(index, xy) {
					if (x >= xy.x && x < xy.x + 9 && y >= xy.y && y < xy.y + 9) {
						var k = 0;
						while (k < 9) {
							if (k !== x - xy.x) {
								self.removeFromCellOptions(cellOptions, (xy.x + k) + ',' + y);
							}
							if (k !== y - xy.y) {
								self.removeFromCellOptions(cellOptions, x + ',' + (xy.y + k));
							}
							k++;
						}
					}
				});
				return cellOptions;
			} else {
				return [];
			}
		},

		removeCubicOptions : function(cellOptions, x, y) {
			var startX = Math.floor(x / 3) * 3,
			    startY = Math.floor(y / 3) * 3;
			var m = 0;
			while (m < 3) {
				var n = 0;
				while (n < 3) {
					var currentX = startX + m,
					    currentY = startY + n;
					if (currentX !== x || currentY !== y) {
						this.removeFromCellOptions(cellOptions, currentX + ',' + currentY);
					}
					n++;
				}
				m++;
			}
		},

		removeFromCellOptions : function(cellOptions, sourceKey) {
			var innerValue = this.getCellValue(sourceKey);
			if (cellOptions && innerValue !== undefined) {
				var innerIndex = cellOptions.indexOf(innerValue);
				if (innerIndex >= 0) {
					cellOptions.splice(innerIndex, 1);
				}
			}
		},

		calcAllCellOptions : function() {
			var self = this;
			var allCellOptions = {};
			$.each(this.attr('mode'), function(index, xy) {
				var i = 0;
				while (i < 9) {
					var j = 0;
					while (j < 9) {
						var key = (xy.x + i) + ',' + (xy.y + j);
						if (self.getCellValue(key) === undefined) {
							if (!(allCellOptions[key])) {
								allCellOptions[key] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
								self.removeCubicOptions(allCellOptions[key], xy.x + i, xy.y + j);
							}
							var k = 0;
							while (k < 9) {
								if (k !== i) {
									self.removeFromCellOptions(allCellOptions[key], (xy.x + k) + ',' + (xy.y + j));
								}
								if (k !== j) {
									self.removeFromCellOptions(allCellOptions[key], (xy.x + i) + ',' + (xy.y + k));
								}
								k++;
							}
						}
						j++;
					}
					i++;
				}
			});
			return allCellOptions;
		},

		getCellValue : function(xy) {
			var cellValue = this.attr('initCellValues').attr(xy) || this.attr('userCellValues').attr(xy) || this.attr('knownCellValues').attr(xy);
			var cellDatas = this.attr('cellDatas');
			if (cellDatas) {
				var cellData = cellDatas.attr(xy);
				var cellValue = cellData.attr('value');
				if (cellValue === undefined && this.attr('editStatus') === 'draft') {
					var draft = cellData.attr('draft');
					if (draft.length === 1 && !isNaN(parseInt(draft[0]))) {
						cellValue = parseInt(draft[0]);
					}
				}
			}
			return cellValue;
		},

		getKnownCellValue : function(xy) {
			return this.attr('knownCellValues').attr(xy);
		},

		getRealCellValue : function(xy) {
			return this.attr('initCellValues').attr(xy) || this.attr('userCellValues').attr(xy);
		},

		existsCell : function(xy) {
			return this.attr('cellDatas').attr(xy) !== undefined;
		},

		destroy : function() {
			this.deleteDrafts();
		}
	});
})();
