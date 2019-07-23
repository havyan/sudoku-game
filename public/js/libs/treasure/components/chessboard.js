(function() {
  Chessboard.extend('Treasure.Chessboard', {
    defaults: {
      template: '/js/libs/treasure/mst/chessboard.mst'
    }
  }, {
    init : function(element, options) {
      this._super(element, options);
    },

    createHelpers: function() {
      var self = this;
      var helpers = this._super();
      var model = this.options.model;
      var dimension = model.attr('dimension');
      var cellUsedWidth = 100 / dimension.width;
      var cellUsedHeight = 100 / dimension.height;
      var cellWidth = cellUsedWidth * 0.9;
      var cellHeight = cellUsedHeight * 0.9;

      helpers.hasGate = function(cellData, options) {
        var width = model.attr('dimension.width');
        var height = model.attr('dimension.height');
        var x = cellData.attr('x');
        var y = cellData.attr('y');
        if (model.attr('positionStatus') === 'out' && (x === 0 || y === 0 || x === width - 1 || y === height - 1)) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      };

      helpers.gateDirection = function(cellData) {
        var width = model.attr('dimension.width');
        var height = model.attr('dimension.height');
        var x = cellData.attr('x');
        var y = cellData.attr('y');
        return x === 0 ? 'left' : y === 0 ? 'top' : x === width - 1 ? 'right' : y === height - 1 ? 'bottom' : '';
      };

      helpers.gateLayout = function(cellData) {
        var width = model.attr('dimension.width');
        var height = model.attr('dimension.height');
        var dimension = self.calcCellDimension(cellData);
        if (cellData.x === 0) {
          dimension.left -= dimension.width;
        }
        if (cellData.y === 0) {
          dimension.top -= dimension.height;
        }
        if (cellData.x === width - 1) {
          dimension.left += dimension.width;
        }
        if (cellData.y === height - 1) {
          dimension.top += dimension.height;
        }
        var style = 'width: ' + dimension.width + '%; height: ' + dimension.height + '%;';
        style += (' left: ' + dimension.left + '%; top: ' + dimension.top + '%;');
        return style;
      };
      return helpers
    }
  });
})();
