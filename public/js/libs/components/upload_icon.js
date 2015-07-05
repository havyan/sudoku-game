(function() {
  var DRAGGER_WIDTH = 3;
  can.Control('UploadIconPanel', {}, {
    init : function(element, options) {
      element.html(can.view('/js/libs/mst/upload_icon.mst'));
      this.initEvents();
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
          $icon.css('background-image', 'url(' + data.result.path + ')');
          element.find('.inner-icon-display').css('background-image', 'url(' + data.result.path + ')');
          $icon.find('span').hide();
          element.find('.upload-icon-cutter').show();
          self.resetCutter($icon.width() / 2 - 75, $icon.height() / 2 - 75, 150, 150);
        }
      });

      $innerIconContainer.draggable({
        drag : function(event, ui) {
          var boundaryRight = $iconCutter.width() - $innerIconContainer.width();
          var boundaryBottom = $iconCutter.height() - $innerIconContainer.height();
          if (ui.position.top > boundaryBottom) {
            ui.position.top = boundaryBottom;
          } else if (ui.position.top < 0) {
            ui.position.top = 0;
          }
          if (ui.position.left > boundaryRight) {
            ui.position.left = boundaryRight;
          } else if (ui.position.left < 0) {
            ui.position.left = 0;
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
          if (ui.position.left > boundaryRight) {
            ui.position.left = boundaryRight;
          } else if (ui.position.left < -DRAGGER_WIDTH) {
            ui.position.left = -DRAGGER_WIDTH;
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
          if (ui.position.left < boundaryLeft) {
            ui.position.left = boundaryLeft;
          } else if (ui.position.left > $iconCutter.width()) {
            ui.position.left = $iconCutter.width();
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
          var boundaryBottom = $bottom.position().top;
          if (ui.position.top > boundaryBottom) {
            ui.position.top = boundaryBottom;
          } else if (ui.position.top < -DRAGGER_WIDTH) {
            ui.position.top = -DRAGGER_WIDTH;
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
          if (ui.position.top < boundaryTop) {
            ui.position.top = boundaryTop;
          } else if (ui.position.top > $iconCutter.height()) {
            ui.position.top = $iconCutter.height();
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
