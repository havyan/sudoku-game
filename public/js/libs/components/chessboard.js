(function() {
  can.Control('Chessboard', {}, {
    init : function(element, options) {
      var self = this;
      this.render();
      this.initEvents();
    },

    initEvents : function() {
      var self = this;
      var model = this.options.model;
      $(window).resize(this.resize.bind(this));
      $(document).keydown(function(e) {
        if (e.keyCode >= 37 && e.keyCode <= 40) {
          var activeElement = $(document.activeElement);
          if (activeElement.hasClass('chess-cell')) {
            var xy = activeElement.data('xy');
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
      this.element.find('.game-timer-panel, .game-zoom, .chessboard-actions, .prop').draggable();
    },

    render : function() {
      var self = this;
      var mode = this.options.model.attr('mode');
      var dimension = this.options.model.attr('dimension');
      var cellUsedWidth = 100 / dimension.width;
      var cellUsedHeight = 100 / dimension.height;
      var cellWidth = cellUsedWidth * 0.9;
      var cellHeight = cellUsedHeight * 0.9;
      this.element.html(can.view('/js/libs/mst/chessboard.mst', this.options.model, {
        cellLayout : function(cellData) {
          var style = 'width: ' + cellWidth + '%; height: ' + cellHeight + '%;';
          var rx = cellData.x % 3;
          var ry = cellData.y % 3;
          var left = cellData.x * cellUsedWidth;
          var top = cellData.y * cellUsedHeight;
          if (rx === 0) {
            left += (cellUsedWidth * 0.08);
          } else if (rx === 1) {
            left += (cellUsedWidth * 0.05);
          } else if (rx === 2) {
            left += (cellUsedWidth * 0.02);
          }
          if (ry === 0) {
            top += (cellUsedHeight * 0.08);
          } else if (ry === 1) {
            top += (cellUsedHeight * 0.05);
          } else if (ry === 2) {
            top += (cellUsedHeight * 0.02);
          }
          style += (' left: ' + left + '%; top: ' + top + '%;');
          return style;
        }
      }));
      this.chessCells = {};
      this.element.find('.chess-cell').each(function() {
        var chessCell = $(this);
        self.chessCells[chessCell.data('xy')] = chessCell;
      });
      this.numberPicker = new NumberPicker(this.element.find('.chessboard-container'), {});
      this.zoomBar = new ZoomBar(this.element.find('.game-zoom'), {
        min : 1.0,
        max : 1.5,
        step : 0.1,
        value : this.options.model.attr('ui.zoom'),
        callback : function(zoom) {
          self.options.model.setZoom(zoom);
        }
      });
      this.gameTimer = new GameTimer(this.element.find('.game-timer-panel'), {
        model : this.options.model
      });
      this.resetPropStatus();
      this.resize();
      this.layout();
    },

    resetPropStatus : function() {
      var model = this.options.model;
      if (this.selectedChassCell && (model.isDraft() || model.isActive()) && model.attr('prop.magnifier') > 0) {
        this.element.find('.prop .magnifier').addClass('active');
      } else {
        this.element.find('.prop .magnifier').removeClass('active');
      }
      if (model.attr('changedScore.changed') < 0 && model.attr('prop.impunity') > 0) {
        this.element.find('.prop .impunity').addClass('active');
      } else {
        this.element.find('.prop .impunity').removeClass('active');
      }
      if (model.attr('changedScore.changed') < 0 && model.attr('prop.impunity') > 0) {
        this.element.find('.prop .impunity').addClass('active');
      } else {
        this.element.find('.prop .impunity').removeClass('active');
      }
      if (model.isActive() && !model.attr('delayed') && model.attr('prop.delay') > 0) {
        this.element.find('.prop .delay').addClass('active');
      } else {
        this.element.find('.prop .delay').removeClass('active');
      }
      if (!model.isActive() && model.isSubmit() && !model.attr('glassesUsed')) {
        this.element.find('.prop .glasses').addClass('active');
      } else {
        this.element.find('.prop .glasses').removeClass('active');
      }
      if (model.isActive() && !model.attr('optionsEnabled') && model.attr('prop.options_once') > 0) {
        this.element.find('.prop .options_once').addClass('active');
      } else {
        this.element.find('.prop .options_once').removeClass('active');
      }
      if (model.attr('prop.options_always') > 0 && !model.attr('optionsAlways')) {
        this.element.find('.prop .options_always').addClass('active');
      } else {
        this.element.find('.prop .options_always').removeClass('active');
      }
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
      var chessboardSize = this.getChessboardSize();
      this.element.find('.chessboard-container').css({
        'width' : chessboardSize.width + 'px',
        'height' : chessboardSize.height + 'px'
      });
      this.element.find('.chessboard-panel').css('font-size', this.getCellSize() * 0.9 + 'px');
    },

    getChessboardSize : function() {
      var dimension = this.options.model.attr('dimension');
      var cellSize = this.getCellSize();
      return {
        width : cellSize * dimension.width,
        height : cellSize * dimension.height
      };
    },

    getCellSize : function() {
      var dimension = this.options.model.attr('dimension');
      var cellSize = Math.floor((window.innerHeight - 60) / dimension.height);
      if (cellSize * dimension.width > window.innerWidth) {
        cellSize = Math.floor((window.innerWidth - 60) / dimension.width);
      }
      cellSize = Math.max(24, cellSize);
      return cellSize * this.options.model.attr('ui.zoom');
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
      if (this.options.model.isOptionsEnabled()) {
        this.options.model.toOptions();
      }
    },

    '.pass-action click' : function() {
      this.options.model.pass();
    },

    '{model} active' : function(model, e, active) {
      this.numberPicker.hide();
      this.resetPropStatus();
    },

    '{model} optionsEnabled' : function(model, e, optionsEnabled) {
      if (optionsEnabled) {
        this.options.model.toOptions();
      } else {
        this.options.model.toPlain();
      }
      this.element.find('.chessboard-options-mode-action').attr('disabled', !optionsEnabled);
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
      this.chessCells[xy].addClass('correct');
      setTimeout(function() {
        self.chessCells[xy].removeClass('correct');
      }, 2000);
    },

    '{model.knownCellValues} change' : function(userCellValues, e, xy, how) {
      if (how !== 'remove') {
        var self = this;
        this.chessCells[xy].addClass('known-cell');
        setTimeout(function() {
          self.chessCells[xy].removeClass('known-cell');
        }, 2000);
      }
    },

    '{model} incorrect' : function(model, e, data) {
      var self = this,
          xy = data.xy;
      this.chessCells[xy].addClass('incorrect');
      setTimeout(function() {
        self.chessCells[xy].removeClass('incorrect');
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
          var cellElement = this.chessCells[changedScore.xy];
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
      this.resetPropStatus();
    },

    '.chess-cell click' : function(element, event) {
      var model = this.options.model;
      var xy = element.data('xy');
      if (model.isActive() && model.isPlain() && model.isSubmit()) {
        if (model.getKnownCellValue(xy) !== undefined) {
          model.submit(xy, model.getKnownCellValue(xy));
          model.attr('active', false);
        } else if (model.getCellValue(xy) === undefined) {
          var cellOptions = model.calcCellOptions(xy);
          this.showNumberPicker(element, cellOptions, function(value) {
            model.submit(xy, value);
            model.attr('active', false);
          });
        }
      } else if (!model.isActive() && model.isSubmit() && model.attr('glassesUsed')) {
        if (model.getCellValue(xy) === undefined) {
          var cellOptions = model.calcCellOptions(xy);
          this.showNumberPicker(element, cellOptions, function(value) {
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

    '.chess-cell keydown' : function(element, event) {
      var model = this.options.model;
      var xy = element.data('xy');
      if (model.isDraft() && model.isPlain()) {
        var draft = model.findCellData(xy).attr('draft');
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
            model.addDraft(xy, codeMap.shift['' + code]);
          } else if (code > 64 && code < 91) {
            model.addDraft(xy, String.fromCharCode(code));
          }
        } else {
          if (codeMap.normal['' + code]) {
            model.addDraft(xy, codeMap.normal['' + code]);
          } else if (code === 46) {
            model.popDraft(xy);
          } else if (code === 8) {
            model.clearDraft(xy);
            return false;
          } else if (code === 32) {
            model.addDraft(xy, ' ');
            return false;
          } else if (code > 64 && code < 91) {
            model.addDraft(xy, String.fromCharCode(code + 32));
          } else if (code > 47 && code < 58) {
            model.addDraft(xy, String.fromCharCode(code));
          } else if (code > 95 && code < 106) {
            model.addDraft(xy, code - 96);
          }
        }
      }
    },

    '{model.ui} zoom' : function(model, e, zoom) {
      this.element.find('.game-zoom-bar').val(zoom);
      this.layout();
      this.resize();
    },

    layout : function() {
      if (this.options.model.attr('ui.zoom') >= 1.3) {
        this.element.find('.chessboard-container').addClass('big');
      } else {
        this.element.find('.chessboard-container').removeClass('big');
      }
    },

    '.game-zoom-bar change' : function() {
      this.options.model.setZoom(parseFloat(this.element.find('.game-zoom-bar').val()));
    },

    '.chess-cell focus' : function(element, event) {
      var model = this.options.model;
      var xy = element.data('xy');
      this.selectedChassCell = this.chessCells[xy];
      this.resetPropStatus();
    },

    '.chess-cell blur' : function(element, event) {
      this.selectedChassCell = null;
      this.resetPropStatus();
    },

    '.magnifier click' : function(element, event) {
      if (this.selectedChassCell) {
        if (this.options.model.isDraft()) {
          this.options.model.peep(this.selectedChassCell.data('xy'));
        } else {
          if (this.options.model.isActive()) {
            this.options.model.autoSubmit(this.selectedChassCell.data('xy'));
          }
        }
      }
    },

    '.delay click' : function(element, event) {
      var self = this;
      if (element.hasClass('active')) {
        this.options.model.delay(function() {
          self.resetPropStatus();
        });
      }
    },

    '.impunity click' : function(element, event) {
      var self = this;
      if (element.hasClass('active')) {
        this.options.model.impunish(function() {
          self.resetPropStatus();
        });
      }
    },

    '.glasses click' : function(element, event) {
      var self = this;
      if (element.hasClass('active') && !this.options.model.attr('glassesUsed')) {
        this.options.model.useGlasses(function() {
          self.resetPropStatus();
        });
      }
    },

    '.options_once click' : function(element, event) {
      var self = this;
      if (element.hasClass('active') && !this.options.model.attr('optionsOnce')) {
        this.options.model.setOptionsOnce(function() {
          self.resetPropStatus();
        });
      }
    },

    '.options_always click' : function(element, event) {
      var self = this;
      if (element.hasClass('active') && !this.options.model.attr('optionsAlways')) {
        this.options.model.setOptionsAlways(function() {
          self.resetPropStatus();
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
