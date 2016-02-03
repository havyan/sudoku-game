(function() {
  var DRAGGER_WIDTH = 3;
  can.Control('UploadIconPanel', {}, {
    init : function(element, options) {
      can.view('/js/libs/mst/upload_icon.mst', {},function(frag) {
        element.html(frag);
        this.initEvents();
      }.bind(this));
    },

    initEvents : function() {
      var self = this;
      var element = this.element;
      var $innerIconContainer = element.find('.inner-icon-container');
      var $iconCutter = element.find('.upload-icon-cutter');
      var $left = element.find('.dragger-left');
      var $right = element.find('.dragger-right');
      var $top = element.find('.dragger-top');
      var $bottom = element.find('.dragger-bottom');
      element.find('.upload-action input').fileupload({
        dataType : 'json',
        progressall : function(e, data) {
          var progress = parseInt(data.loaded / data.total * 100);
          element.find('.progress-bar').css('width', progress + '%').html(progress + '%');
        },
        done : function(e, data) {
          var $icon = element.find('.upload-icon-display');
          self.path = data.result.path;
          self.setIconBound(function(bound) {
            $icon.css('background-image', 'url(' + data.result.path + ')');
            element.find('.inner-icon-display').css('background-image', 'url(' + data.result.path + ')');
            $icon.find('span').hide();
            element.find('.upload-icon-cutter').show();
            var cutterSize = Math.min(bound.width, bound.height, 150);
            self.resetCutter(bound.left + (bound.width - cutterSize) / 2, bound.top + (bound.height - cutterSize) / 2, cutterSize, cutterSize);
          });
        }
      });

      $innerIconContainer.draggable({
        drag : function(event, ui) {
          var boundaryRight = self.bound.left + self.bound.width - $innerIconContainer.width();
          var boundaryBottom = self.bound.top + self.bound.height - $innerIconContainer.height();
          if (ui.position.top > boundaryBottom) {
            ui.position.top = boundaryBottom;
          } else if (ui.position.top < self.bound.top) {
            ui.position.top = self.bound.top;
          }
          if (ui.position.left > boundaryRight) {
            ui.position.left = boundaryRight;
          } else if (ui.position.left < self.bound.left) {
            ui.position.left = self.bound.left;
          }
          self.resetCutter(ui.position.left, ui.position.top, $innerIconContainer.width(), $innerIconContainer.height());
        },
        stop : function(event, ui) {
          self.resetCutter(ui.position.left, ui.position.top, $innerIconContainer.width(), $innerIconContainer.height());
        }
      });

      $left.draggable({
        axis : 'x',
        drag : function(event, ui) {
          var boundaryRight = $right.position().left;
          var boundaryLeft = Math.max(self.bound.left - DRAGGER_WIDTH, $right.position().left - (self.bound.top + self.bound.height - $top.position().top));
          if (ui.position.left > boundaryRight) {
            ui.position.left = boundaryRight;
          } else if (ui.position.left < boundaryLeft) {
            ui.position.left = boundaryLeft;
          }
          var size = boundaryRight - ui.position.left - DRAGGER_WIDTH;
          self.resetCutter(ui.position.left + DRAGGER_WIDTH, ui.position.top, size, size);
        },
        stop : function(event, ui) {
          var size = $right.position().left - ui.position.left - DRAGGER_WIDTH;
          self.resetCutter(ui.position.left + DRAGGER_WIDTH, ui.position.top, size, size);
        }
      });

      $right.draggable({
        axis : 'x',
        drag : function(event, ui) {
          var boundaryLeft = $left.position().left;
          var boundaryRight = Math.min(self.bound.left + self.bound.width, $left.position().left + (self.bound.top + self.bound.height - $top.position().top));
          if (ui.position.left < boundaryLeft) {
            ui.position.left = boundaryLeft;
          } else if (ui.position.left > boundaryRight) {
            ui.position.left = boundaryRight;
          }
          var size = ui.position.left - boundaryLeft - DRAGGER_WIDTH;
          self.resetCutter(boundaryLeft + DRAGGER_WIDTH, ui.position.top, size, size);
        },
        stop : function(event, ui) {
          var boundaryLeft = $left.position().left;
          var size = ui.position.left - boundaryLeft - DRAGGER_WIDTH;
          self.resetCutter(boundaryLeft + DRAGGER_WIDTH, ui.position.top, size, size);
        }
      });

      $top.draggable({
        axis : 'y',
        drag : function(event, ui) {
          var boundaryTop = Math.max(self.bound.top - DRAGGER_WIDTH, $bottom.position().top - (self.bound.left + self.bound.width - $left.position().left));
          var boundaryBottom = $bottom.position().top;
          if (ui.position.top > boundaryBottom) {
            ui.position.top = boundaryBottom;
          } else if (ui.position.top < boundaryTop) {
            ui.position.top = boundaryTop;
          }
          var size = boundaryBottom - ui.position.top - DRAGGER_WIDTH;
          self.resetCutter(ui.position.left + DRAGGER_WIDTH, ui.position.top + DRAGGER_WIDTH, size, size);
        },
        stop : function(event, ui) {
          var boundaryBottom = $bottom.position().top;
          var size = boundaryBottom - ui.position.top - DRAGGER_WIDTH;
          self.resetCutter(ui.position.left + DRAGGER_WIDTH, ui.position.top + DRAGGER_WIDTH, size, size);
        }
      });

      $bottom.draggable({
        axis : 'y',
        drag : function(event, ui) {
          var boundaryTop = $top.position().top;
          var boundaryBottom = Math.min(self.bound.top + self.bound.height, $top.position().top + (self.bound.left + self.bound.width - $left.position().left));
          if (ui.position.top < boundaryTop) {
            ui.position.top = boundaryTop;
          } else if (ui.position.top > boundaryBottom) {
            ui.position.top = boundaryBottom;
          }
          var size = ui.position.top - boundaryTop - DRAGGER_WIDTH;
          self.resetCutter(ui.position.left + DRAGGER_WIDTH, boundaryTop + DRAGGER_WIDTH, size, size);
        },
        stop : function(event, ui) {
          var boundaryTop = $top.position().top;
          var size = ui.position.top - boundaryTop - DRAGGER_WIDTH;
          self.resetCutter(ui.position.left + DRAGGER_WIDTH, boundaryTop + DRAGGER_WIDTH, size, size);
        }
      });
    },

    setIconBound : function(callback) {
      var self = this;
      var image = new Image();
      image.src = this.path;
      $icon = this.element.find('.upload-icon-display');
      $(image).load(function() {
        var zoom = $icon.width() / this.width;
        if (zoom * this.height > $icon.height()) {
          zoom = $icon.height() / this.height;
        }
        var width = this.width * zoom;
        var height = this.height * zoom;
        self.bound = {
          left : ($icon.width() - width) / 2,
          top : ($icon.height() - height) / 2,
          width : width,
          height : height
        };
        if (callback) {
          callback(self.bound);
        }
      });
    },

    getCutterBound : function() {
      var $cutter = this.element.find('.inner-icon-container');
      return {
        x : ($cutter.position().left - this.bound.left) / this.bound.width,
        y : ($cutter.position().top - this.bound.top) / this.bound.height,
        width : $cutter.width() / this.bound.width,
        height : $cutter.height() / this.bound.height
      };
    },

    resetCutter : function(x, y, width, height) {
      this.element.find('.dragger-left').css({
        'top' : y + 'px',
        'left' : (x - DRAGGER_WIDTH) + 'px',
        'height' : height + 'px'
      });
      this.element.find('.dragger-right').css({
        'top' : y + 'px',
        'left' : (x + width) + 'px',
        'height' : height + 'px'
      });
      this.element.find('.dragger-top').css({
        'top' : (y - DRAGGER_WIDTH) + 'px',
        'left' : (x - DRAGGER_WIDTH) + 'px',
        'width' : (width + 2 * DRAGGER_WIDTH) + 'px'
      });
      this.element.find('.dragger-bottom').css({
        'top' : (y + height) + 'px',
        'left' : (x - DRAGGER_WIDTH) + 'px',
        'width' : (width + 2 * DRAGGER_WIDTH) + 'px'
      });
      this.element.find('.inner-icon-container').css({
        'top' : y + 'px',
        'left' : x + 'px',
        'width' : width + 'px',
        'height' : height + 'px'
      });
      this.element.find('.inner-icon-display').css({
        'top' : (-y) + 'px',
        'left' : (-x) + 'px'
      });
    }
  });
})();
