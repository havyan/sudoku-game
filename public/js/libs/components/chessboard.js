(function() {
  can.Control('Chessboard', {}, {
    init : function(element, options) {
      var self = this;
      this.render();
      this.initEvents();
      this.resetChessCellsFont();
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
    },

    render : function() {
      var self = this;
      var mode = this.options.model.attr('mode');
      var dimension = this.options.model.attr('dimension');
      var cellWidth = 100 / dimension.width;
      var cellHeight = 100 / dimension.height;
      this.element.html(can.view('/js/libs/mst/chessboard.mst', this.options.model, {
        chessboardLayout : function() {
          var chessboardSize = self.getChessboardSize();
          return 'width: ' + chessboardSize.width + 'px; ' + 'height: ' + chessboardSize.height + 'px; ';
        },
        chessCellContainerLayout : function(cellData) {
          return 'left: ' + (cellData.x * cellWidth) + '%; top: ' + (cellData.y * cellHeight) + '%; width: ' + cellWidth + '%; height: ' + cellHeight + '%;';
        },

        cellContainerClass : function(cellData) {
          return "chess-cell-container-" + (cellData.x % 3) + '-' + (cellData.y % 3);
        }
      }));
      this.chessCells = {};
      this.element.find('.chess-cell-container').each(function() {
        var container = $(this);
        var xy = container.data('xy');
        self.chessCells[xy] = new ChessCell(container, {
          model : self.options.model.findCellData(xy),
          parent : self,
          parentModel : self.options.model,
          xy : xy
        });
      });
      this.numberPicker = new NumberPicker(this.element.find('.chessboard-container'), {});
      this.zoomBar = new ZoomBar(this.element.find('.game-zoom'), {
        min : 1.0,
        max : 1.5,
        step : 0.1,
        value : this.options.model.attr('zoom'),
        callback : function(zoom) {
          self.options.model.setZoom(zoom);
        }
      });
      this.gameTimer = new GameTimer(this.element.find('.game-timer-panel'), {
        model : this.options.model
      });
      this.resetPropStatus();
    },

    resetPropStatus : function() {
      if (this.options.model.attr('changedScore.changed') < 0 && this.options.model.attr('prop.impunity') > 0) {
        this.element.find('.prop .impunity').addClass('active');
      } else {
        this.element.find('.prop .impunity').removeClass('active');
      }
      if (this.options.model.isActive() && !this.options.model.attr('delayed') && this.options.model.attr('prop.delay') > 0) {
        this.element.find('.prop .delay').addClass('active');
      } else {
        this.element.find('.prop .delay').removeClass('active');
      }
      if (this.options.model.isActive() && !this.options.model.attr('optionsEnabled') && this.options.model.attr('prop.options_once') > 0) {
        this.element.find('.prop .options_once').addClass('active');
      } else {
        this.element.find('.prop .options_once').removeClass('active');
      }
      if (this.options.model.attr('prop.options_always') > 0 && !this.options.model.attr('optionsAlways')) {
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
      this.resetChessCellsFont();
    },

    resetChessCellsFont : function() {
      for (var key in this.chessCells) {
        this.chessCells[key].resetFont();
      }
    },

    getChessboardSize : function() {
      var dimension = this.options.model.attr('dimension');
      var cellSize = Math.floor((window.innerHeight - 60) / dimension.height);
      if (cellSize * dimension.width > window.innerWidth) {
        cellSize = Math.floor((window.innerWidth - 60) / dimension.width);
      }
      cellSize = cellSize * this.options.model.attr('zoom');
      return {
        width : cellSize * dimension.width,
        height : cellSize * dimension.height
      };
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
      this.resetPropStatus();
    },

    '.chess-cell click' : function(element, event) {
      var model = this.options.model;
      var self = this;
      var container = element.parent();
      var xy = container.data('xy');
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

    '{model} zoom' : function(model, e, zoom) {
      this.element.find('.game-zoom-bar').val(zoom);
      this.resize();
    },

    '.game-zoom-bar change' : function() {
      this.options.model.setZoom(parseFloat(this.element.find('.game-zoom-bar').val()));
    },

    '.chess-cell focus' : function(element, event) {
      var model = this.options.model;
      var container = element.parent();
      var xy = container.data('xy');
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
