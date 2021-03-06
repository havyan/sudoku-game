(function() {
  var ROBOT_RE = /^robot-\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/g;

  can.Model('Models.GameModel', {}, {
    init : function(game, eventReceiver) {
      this.eventReceiver = eventReceiver;
      this.initPlayer();
      this.initDimension();
      this.initEvents();
      this.initStatus();
      this.initPlayMode();
      this.initRanking();
      this.initMessages();
      this.initCellDatas();
      this.initProp();
      this.initOptions();
      this.initActive();
      this.initUI();
      this.initManualStart();
      this.initWait();
      this.initRemainingTime();
    },

    initPlayer: function() {
      var player = _.find(this.attr('players'), function(player) {
        return player && player.attr('account') === this.attr('account');
      }.bind(this));
      if (player) {
        this.attr('isGuest', player.attr('isGuest'));
      }
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

    initWait : function() {
      this.attr('waitCountdownStage', this.attr('waitTime'));
    },

    initRemainingTime : function() {
      this.attr('remainingTime', this.attr('remainingTime'));
    },

    initPlayMode: function() {
      var playMode = this.attr('playMode');
      this.attr('multiMode', playMode === 'multi');
      this.attr('singleMode', playMode === 'single');
      this.attr('robotMode', playMode === 'robot');
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

    initProp : function() {
      var singleMode = this.attr('singleMode');
      var propTypes = this.attr('propTypes').attr();
      var prop = this.attr('prop').attr();
      propTypes = _.filter(propTypes, {
        category: 'sudoku'
      });
      this.attr('props', propTypes.map(function(propType) {
        propType.count = prop[propType.type];
        propType.visible = !(singleMode && _.include(['delay', 'glasses'], propType.type));
        return propType;
      }));
      this.removeAttr('prop');
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
      if (ui) {
        ui = JSON.parse(ui);
      } else if (this.attr('rule.ui')) {
        ui = this.attr('rule.ui').attr();
      } else {
        ui = {
          zoom : 1
        };
      }
      this.attr('ui', ui);
    },

    resetOptions : function() {
      this.attr('optionsEnabled', this.attr('optionsOnce') || this.attr('optionsAlways'));
    },

    isOptionsEnabled : function() {
      return this.attr('optionsEnabled');
    },

    initActive : function() {
      this.attr('active', this.attr('currentPlayer') === this.attr('account'));
      this.bind('active', function() {
        this.deselectCell();
      }.bind(this));
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
          score : quitPlayer.status === 'quit' ? T('page:game.quit') : T('page:game.offline'),
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
              var value = initCellValues.attr(xy) || userCellValues.attr(xy) || knownCellValues.attr(xy);
              cellDatas.push({
                x : x,
                y : y,
                xy : xy,
                index : index,
                type : initCellValues.attr(xy) ? 'init' : userCellValues.attr(xy) ? 'user' : knownCellValues.attr(xy) ? 'known' : '',
                value : value,
                draft : value ? null : drafts[xy],
                robot : self.ownByRobot(xy)
              });
            }
            j++;
          }
          i++;
        }
      });
      cellDatas = _.sortBy(cellDatas, 'index');
      this.attr('cellDatas', cellDatas);
      this.bind('initCellValues', function() {
        self.attr('initCellValues').each(function(value, xy) {
          var cellData = self.findCellData(xy);
          if (cellData) {
            cellData.attr({
              type: 'init',
              value: value,
              cellOptions: null,
              draft: null
            });
          }
          self.attr('knownCellValues').removeAttr(xy);
        });
        self.resetAllCellOptions();
      });
      this.attr('cellDatas').each(function(cellData) {
        cellData.bind('draft', function() {
          self.saveDrafts();
        });
      });
      this.attr('userCellValues').bind('change', function(ev, xy, how, value) {
        var cellData = self.findCellData(xy);
        if (cellData) {
          cellData.attr('type', 'user');
          cellData.attr('value', value);
          cellData.attr('cellOptions', null);
          cellData.attr('draft', null);
          cellData.attr('robot', self.ownByRobot(xy));
        }
        self.attr('knownCellValues').removeAttr(xy);
        if (self.isOptions()) {
          self.resetAllCellOptions();
        }
      });
      this.attr('knownCellValues').bind('change', function(ev, xy, how, value) {
        if (how !== 'remove') {
          var cellData = self.findCellData(xy);
          if (cellData) {
            cellData.attr('type', 'known');
            cellData.attr('value', value);
            cellData.attr('cellOptions', null);
            cellData.attr('draft', null);
          }
          if (self.isOptions()) {
            self.resetAllCellOptions();
          }
        }
      });
    },

    ownByRobot: function(xy) {
      var owner = this.attr('cellValueOwners').attr(xy);
      return !!(owner && owner.match(ROBOT_RE));
    },

    retrieveInitCellValues: function() {
      var initCellValues = this.attr('initCellValues').attr();
      if (_.isEmpty(initCellValues)) {
        Rest.Game.getInitCellValues(this.attr('id'), function(result) {
          var initCellValues = this.attr('initCellValues').attr();
          if (_.isEmpty(initCellValues)) {
            this.attr('initCellValues', result);
          }
        }.bind(this));
      }
    },

    findCellData : function(xy) {
      var cellDatas = this.attr('cellDatas');
      if (xy && cellDatas) {
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

    saveDrafts : function() {
      var drafts = {};
      this.attr('cellDatas').each(function(cellData) {
        var draft = cellData.attr('draft');
        if (draft) {
          drafts[cellData.attr('xy')] = draft.attr();
        }
      });
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
      var players = this.attr('players').attr();
      players[index] = player;
      this.attr('players').replace(players);
      this.resetRanking();
    },

    playerQuit : function(account, status) {
      var players = this.attr('players').attr();
      var index = _.findIndex(players, function(player) {
        return player && player.account === account;
      });
      if (this.attr('status') === 'ongoing') {
        var quitPlayer = players[index];
        quitPlayer.status = status;
        this.attr('quitPlayers').unshift(quitPlayer);
      }
      players[index] = null;
      this.attr('players').replace(players);
      this.resetRanking();
    },

    addMessage : function(message) {
      this.attr('messages').push(message);
      this.attr('messagesStamp', Date.now());
    },

    addDraft : function(xy, value) {
      var cellData = this.findCellData(xy);
      var draft = cellData.attr('draft');
      if (!draft) {
        draft = [];
      } else {
        draft = draft.attr();
      }
      if (draft.length < 4) {
        draft.push(value);
        cellData.attr('draft', draft);
        if (this.isOptions()) {
          this.resetAllCellOptions();
        }
      }
    },

    popDraft : function(xy) {
      var cellData = this.findCellData(xy);
      var draft = cellData.attr('draft');
      if (draft) {
        draft = draft.attr();
        draft.pop();
        if (draft.length === 0) {
          draft = null;
        }
        cellData.attr('draft', draft);
      }
      if (this.isOptions()) {
        this.resetAllCellOptions();
      }
    },

    clearDraft : function(xy) {
      this.findCellData(xy).attr('draft', null);
      if (this.isOptions()) {
        this.resetAllCellOptions();
      }
    },

    deselectCell : function() {
      var cellDatas = this.attr('cellDatas');
      _.filter(cellDatas, {
        selected : true
      }).forEach(function(cellData) {
        cellData.attr('selected', false);
      });
      this.removeAttr('selectedCell');
    },

    selectCell : function(xy) {
      this.deselectCell();
      var cellData = this.findCellData(xy);
      if (cellData) {
        cellData.attr('selected', true);
        this.attr('selectedCell', xy);
      }
    },

    submit : function(xy, value) {
      Rest.Game.submit(this.attr('id'), xy, value, function(result) {
      }, function() {
      });
    },

    findProp : function(type) {
      return _.find(this.attr('props'), {
        type : type
      });
    },

    reduceProp : function(type) {
      var prop = this.findProp(type);
      prop.attr('count', prop.attr('count') - 1);
    },

    hasProp : function(type) {
      return this.findProp(type).attr('count') > 0;
    },

    autoSubmit : function(xy) {
      return this.useProp('magnifier', { xy: xy, peep: false });
    },

    peep : function(xy) {
      var self = this;
      return this.useProp('magnifier', { xy: xy, peep: true }, function(result) {
        self.attr('knownCellValues').attr(xy, result.result);
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

    useProp: function(type, params, success, error) {
      var self = this;
      Rest.Game.useProp(this.attr('id'), type, params, function(result) {
        self.reduceProp(type);
        if (success) {
          success(result);
        }
      }, error);
    },

    isSubmit : function() {
      return this.attr('editStatus') === 'submit';
    },

    toSubmit : function() {
      if (this.isOptions()) {
        this.resetAllCellOptions();
      }
      this.attr('editStatus', 'submit');
    },

    toDraft : function() {
      if (this.isOptions()) {
        this.resetAllCellOptions();
      }
      this.attr('editStatus', 'draft');

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
      this.resetAllCellOptions();
      this.attr('viewStatus', 'options');
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
      this.eventReceiver.on('cell-correct', function(xy, data) {
        self.attr('cellValueOwners').attr(xy, data.player);
        self.attr('userCellValues').attr(xy, parseInt(data.value));
      });
      this.eventReceiver.on('cell-incorrect', function(xy) {
        self.attr('incorrect', {
          xy : xy
        });
      });
      this.eventReceiver.on('switch-player', function(account) {
        self.attr('currentPlayer', account);
        self.attr('optionsOnce', false);
        self.attr('glassesUsed', false);
        self.attr('active', false);
        self.attr('active', account === self.attr('account'));
        self.attr('delayed', false);
      });
      this.eventReceiver.on('player-ellapsed-time', function(ellapsedTime) {
        var playerRemainingTime = self.attr('rule.score.add.total') - ellapsedTime;
        self.attr('playerRemainingTime', playerRemainingTime);
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
        var result = _.find(results, {account: self.attr('account')});
        self.attr('status', 'over');
        self.attr('awardResult', result ? result.awardResult : null);
        self.attr('results', results);
      });
      this.eventReceiver.on('game-destroyed', function(type) {
        self.attr('destroyType', type);
        self.attr('status', 'destroyed');
        self.destroy();
      });
      this.eventReceiver.on('game-delayed', function() {
        self.attr('delayed', true);
      });
      this.eventReceiver.on('delay-countdown-stage', function(stage) {
        self.attr('delayCountdown', stage);
      });
      this.eventReceiver.on('game-delay-cancelled', function() {
        self.attr('delayed', false);
      });
      this.eventReceiver.on('destroy-countdown-stage', function(stage) {
        self.attr('destroyCountdownStage', stage);
      });
      this.eventReceiver.on('wait-countdown-stage', function(stage) {
        self.attr('waitCountdownStage', stage);
      });
      this.eventReceiver.on('game-abort', function(stage) {
        self.attr('status', 'aborted');
      });
      this.eventReceiver.on('total-countdown-stage', function(stage) {
        self.attr('remainingTime', stage);
      });
    },

    setCellOptions : function(xy, cellOptions) {
      var cellData = this.findCellData(xy);
      var currentCellOptions = cellData.attr('cellOptions');
      if (currentCellOptions && currentCellOptions.length === cellOptions.length) {
        var same = true;
        for (var i = 0; i < cellOptions.length; i++) {
          same = same && (cellOptions[i] === currentCellOptions[i]);
        }
        if (same) {
          return;
        }
      }
      if (cellOptions) {
        if (cellOptions.length > 0 && cellOptions.length <= 4) {
          var size = 4 - cellOptions.length;
          for (var i = 0; i < size; i++) {
            cellOptions.unshift(null);
          }
        } else if (cellOptions.length > 4) {
          cellOptions = null;
        }
      } else {
        cellOptions = null;
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
          if (draft && draft.length === 1 && !isNaN(parseInt(draft[0]))) {
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

    isBanker : function() {
      return this.attr('players.0.account') === this.attr('account');
    },

    existsCell : function(xy) {
      return this.findCellData(xy) !== undefined;
    },

    destroy : function() {
      this.deleteDrafts();
    }
  });
})();
