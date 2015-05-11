(function() {
  can.Model('Models.GameModel', {}, {
    init : function(game, eventReceiver) {
      this.eventReceiver = eventReceiver;
      this.initDimension();
      this.initEvents();
      this.initStatus();
      this.initRanking();
      this.initMessages();
      this.initCellDatas();
      this.initOptions();
      this.initActive();
      this.initUI();
      this.initManualStart();
    },

    initDimension : function() {
      var mode = this.attr('mode');
      var maxX = 0;
      var maxY = 0;
      $.each(mode, function(index, xy) {
        maxX = Math.max(maxX, xy.x);
        maxY = Math.max(maxY, xy.y);
      });
      this.attr('dimension', {
        width : maxX + 9,
        height : maxY + 9
      });
    },

    initManualStart : function() {
      var self = this;
      var index = _.findIndex(this.attr('players'), function(player) {
        return player && player.attr('account') === self.attr('account');
      });
      this.attr('manualStart', index === 0 && this.attr('startMode') === 'manual');
    },

    initStatus : function() {
      if (!(this.attr('status'))) {
        this.attr('status', 'waiting');
      }
      this.attr('editStatus', 'submit');
      this.attr('viewStatus', 'plain');
    },

    initOptions : function() {
      var self = this;
      this.resetOptions();
      this.bind('optionsOnce', function(ev, attr, how, value) {
        self.resetOptions();
      });
      this.bind('optionsAlways', function(ev, attr, how, value) {
        self.resetOptions();
      });
    },

    initUI : function() {
      var ui = window.localStorage.getItem(this.attr('account') + '_ui');
      this.attr('ui', ui ? JSON.parse(ui) : {
        zoom : 1
      });
    },

    resetOptions : function() {
      this.attr('optionsEnabled', this.attr('optionsOnce') || this.attr('optionsAlways'));
    },

    isOptionsEnabled : function() {
      return this.attr('optionsEnabled');
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
        if (player) {
          ranking.push({
            account : player.attr('account'),
            name : player.attr('name'),
            score : scores[player.attr('account')] || 0
          });
        }
      });
      ranking.sort(function(source, dest) {
        return dest.score - source.score;
      });
      $.each(quitPlayers, function(index, quitPlayer) {
        ranking.push({
          account : quitPlayer.attr('account'),
          name : quitPlayer.attr('name'),
          score : quitPlayer.status === 'quit' ? '退出' : '离线',
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
      var dimension = this.dimension;
      var cellDatas = [];
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
            var x = position.x + j;
            var y = position.y + i;
            var xy = x + ',' + y;
            var index = y * dimension.width + x;
            if (!_.find(cellDatas, {
              index : index
            })) {
              cellDatas.push({
                x : x,
                y : y,
                xy : xy,
                index : index,
                type : initCellValues.attr(xy) ? 'init' : userCellValues.attr(xy) ? 'user' : knownCellValues.attr(xy) ? 'known' : '',
                value : initCellValues.attr(xy) || userCellValues.attr(xy) || knownCellValues.attr(xy),
                cellOptions : allCellOptions[xy] || [],
                draft : drafts[xy] ? drafts[xy] : []
              });
            }
            j++;
          }
          i++;
        }
      });
      cellDatas = _.sortBy(cellDatas, 'index');
      this.attr('cellDatas', cellDatas);
      this.attr('cellDatas').each(function(cellData, xy) {
        cellData.attr('draft').bind('change', function() {
          drafts[xy] = cellData.attr('draft').attr();
          self.saveDrafts(drafts);
        });
      });
      this.bind('initCellValues', function() {
        self.attr('initCellValues').each(function(value, xy) {
          var cellData = self.findCellData(xy);
          if (cellData) {
            cellData.attr('type', 'init');
            cellData.attr('value', value);
          }
          self.attr('knownCellValues').removeAttr(xy);
        });
        self.resetAllCellOptions();
      });
      this.attr('userCellValues').bind('change', function(ev, xy, how, value) {
        var cellData = self.findCellData(xy);
        if (cellData) {
          cellData.attr('type', 'user');
          cellData.attr('value', value);
        }
        self.attr('knownCellValues').removeAttr(xy);
        self.resetAllCellOptions();
      });
      this.attr('knownCellValues').bind('change', function(ev, xy, how, value) {
        if (how !== 'remove') {
          var cellData = self.findCellData(xy);
          if (cellData) {
            cellData.attr('type', 'known');
            cellData.attr('value', value);
          }
          self.resetAllCellOptions();
        }
      });
    },

    findCellData : function(xy) {
      var cellDatas = this.attr('cellDatas');
      if (cellDatas) {
        var splits = xy.split(','),
            index = parseInt(splits[1]) * this.dimension.width + parseInt(splits[0]),
            start = 0,
            end = cellDatas.length - 1;
        // Can be _.sortedIndex
        while (start <= end) {
          var middle = Math.floor((start + end) / 2),
              middleCellData = cellDatas[middle];
          if (middleCellData.index === index) {
            return cellDatas.attr(middle);
          } else if (middleCellData.index > index) {
            end = middle - 1;
          } else {
            start = middle + 1;
          }
        }
      }
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

    setZoom : function(zoom) {
      zoom = parseFloat(zoom.toFixed(1));
      this.attr('ui.zoom', zoom);
      window.localStorage.setItem(this.attr('account') + '_ui', JSON.stringify(this.attr('ui').attr()));
    },

    setPlayer : function(index, player) {
      this.attr('players').attr(index, player);
      this.attr('players', this.attr('players').attr());
      this.resetRanking();
    },

    playerQuit : function(account, status) {
      var index = _.findIndex(this.attr('players'), function(player) {
        return player && player.account === account;
      });
      if (this.attr('status') === 'ongoing') {
        var quitPlayer = this.attr('players.' + index).attr();
        quitPlayer.status = status;
        this.attr('quitPlayers').unshift(quitPlayer);
      }
      this.attr('players').attr(index, null);
      this.attr('players', this.attr('players').attr());
      this.resetRanking();
    },

    addMessage : function(message) {
      this.attr('messages').push(message);
      this.attr('messagesStamp', Date.now());
    },

    addDraft : function(xy, value) {
      var draft = this.findCellData(xy).attr('draft');
      if (draft.length < 4) {
        draft.push(value);
      }
      this.resetAllCellOptions();
    },

    popDraft : function(xy) {
      this.findCellData(xy).attr('draft').pop();
      this.resetAllCellOptions();
    },

    clearDraft : function(xy) {
      var draft = this.findCellData(xy).attr('draft');
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
        self.attr('prop.magnifier', self.attr('prop.magnifier') - 1);
      }, function() {
      });
    },

    peep : function(xy) {
      var self = this;
      Rest.Game.peep(this.attr('id'), xy, function(result) {
        self.attr('prop.magnifier', self.attr('prop.magnifier') - 1);
        self.attr('knownCellValues').attr(xy, result.result);
      }, function() {
      });
    },

    goahead : function(success) {
      Rest.Game.goahead(this.attr('id'), function(result) {
        if (success) {
          success();
        }
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
        self.attr('prop.delay', self.attr('prop.delay') - 1);
        if (success) {
          success(result);
        }
      }, function() {
      });
    },

    setOptionsOnce : function(success) {
      var self = this;
      Rest.Game.setOptionsOnce(this.attr('id'), function(result) {
        self.attr('optionsOnce', true);
        self.attr('prop.options_once', self.attr('prop.options_once') - 1);
        if (success) {
          success(result);
        }
      }, function() {
      });
    },

    setOptionsAlways : function(success) {
      var self = this;
      Rest.Game.setOptionsAlways(this.attr('id'), function(result) {
        self.attr('optionsAlways', true);
        self.attr('prop.options_always', self.attr('prop.options_always') - 1);
        if (success) {
          success(result);
        }
      }, function() {
      });
    },

    impunish : function(success) {
      var self = this;
      Rest.Game.impunish(this.attr('id'), this.attr('account'), function(result) {
        self.attr('prop.impunity', self.attr('prop.impunity') - 1);
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
      return this.attr('rule.score.add.total');
    },

    initEvents : function() {
      var self = this;
      this.eventReceiver.on('player-joined', function(index, player) {
        self.setPlayer(index, player);
      });
      this.eventReceiver.on('player-quit', function(data) {
        var account = data.account;
        self.playerQuit(account, data.status);
        if (self.attr('account') === account) {
          self.attr('quit', true);
          self.destroy();
        }
      });
      this.eventReceiver.on('message-added', function(message) {
        self.addMessage(message);
      });
      this.eventReceiver.on('status-changed', function(status) {
        self.attr('status', status);
      });
      this.eventReceiver.on('puzzle-init', function(initCellValues) {
        self.attr('initCellValues', initCellValues);
      });
      this.eventReceiver.on('countdown-stage', function(stage) {
        self.attr('countdownStage', stage);
      });
      this.eventReceiver.on('cell-correct', function(xy, value) {
        self.attr('userCellValues').attr(xy, parseInt(value));
      });
      this.eventReceiver.on('cell-incorrect', function(xy) {
        self.attr('incorrect', {
          xy : xy
        });
      });
      this.eventReceiver.on('switch-player', function(account) {
        self.attr('currentPlayer', account);
        self.attr('optionsOnce', false);
        self.attr('active', false);
        self.attr('active', account === self.attr('account'));
        self.attr('delayed', false);
      });
      this.eventReceiver.on('ellapsed-time', function(ellapsedTime) {
        var remainingTime = self.attr('rule.score.add.total') - ellapsedTime;
        self.attr('remainingTime', remainingTime);
      });
      this.eventReceiver.on('score-changed', function(account, info) {
        self.attr('scores').attr(account, parseInt(info.score));
        if (account === self.attr('account')) {
          self.attr('changedScore', info);
        }
      });
      this.eventReceiver.on('max-timeout-reached', function(account) {
        if (self.attr('account') === account) {
          self.attr('maxTimeoutReached', Date.now());
        }
      });
      this.eventReceiver.on('quit-countdown-stage', function(account, stage) {
        if (self.attr('account') === account) {
          self.attr('quitCountdownStage', stage);
        }
      });
      this.eventReceiver.on('game-over', function(results) {
        self.attr('status', 'over');
        self.attr('results', results);
      });
      this.eventReceiver.on('game-destroyed', function() {
        self.attr('status', 'destroyed');
        self.destroy();
      });
      this.eventReceiver.on('game-delayed', function() {
        self.attr('delayed', true);
      });
      this.eventReceiver.on('delay-countdown-stage', function(stage) {
        self.attr('delayCountdownStage', stage);
      });
      this.eventReceiver.on('game-delay-cancelled', function() {
        self.attr('delayed', false);
      });
      this.eventReceiver.on('destroy-countdown-stage', function(stage) {
        self.attr('destroyCountdownStage', stage);
      });
    },

    setCellOptions : function(xy, cellOptions) {
      var cellData = this.findCellData(xy);
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
      var cellData = this.findCellData(xy);
      if (cellData) {
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
      return this.findCellData(xy) !== undefined;
    },

    destroy : function() {
      this.deleteDrafts();
    }
  });
})();
