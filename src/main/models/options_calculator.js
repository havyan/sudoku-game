var _ = require('lodash');

var OptionsCalculator = function(game) {
  this.game = game;
}

OptionsCalculator.prototype.calcCellOptions = function(xy) {
  if (this.getCellValue(xy) === undefined) {
    var self = this,
      splits = xy.split(','),
      x = parseInt(splits[0]),
      y = parseInt(splits[1]),
      cellOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    this.removeCubicOptions(cellOptions, x, y);
    _.each(this.game.mode, function(xy, index) {
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
};

OptionsCalculator.prototype.removeCubicOptions = function(cellOptions, x, y) {
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
};

OptionsCalculator.prototype.removeFromCellOptions = function(cellOptions, sourceKey, innerValue) {
  if (innerValue === undefined) {
    innerValue = this.getCellValue(sourceKey);
  }
  if (cellOptions && innerValue !== undefined) {
    var innerIndex = cellOptions.indexOf(innerValue);
    if (innerIndex >= 0) {
      cellOptions.splice(innerIndex, 1);
    }
  }
};

OptionsCalculator.prototype.calcAllCellOptions = function() {
  var self = this;
  var allCellOptions = {};
  _.each(this.game.mode, function(xy, index) {
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
};

OptionsCalculator.prototype.resetAllCellOptions = function(xy, value) {
  var allCellOptions = this.game.allCellOptions;
  var splits = xy.split(',');
  var x = parseInt(splits[0]);
  var y = parseInt(splits[1]);
  var startX = Math.floor(x / 3) * 3;
  var startY = Math.floor(y / 3) * 3;
  var m = 0;
  var removeOption = function(key) {
    var cellOptions = allCellOptions[key];
    if (cellOptions && key !== xy) {
      this.removeFromCellOptions(cellOptions, xy, value);
      if(cellOptions.length === 0) {
        delete allCellOptions[key];
      }
    }
  }.bind(this);
  delete allCellOptions[xy];
  while (m < 3) {
    var n = 0;
    while (n < 3) {
      removeOption((startX + m) + ',' + (startY + n));
      n++;
    }
    m++;
  }

  startX = Math.floor(x / 9) * 9;
  startY = Math.floor(y / 9) * 9;
  m = 0;
  while(m < 9) {
    removeOption((startX + m) + ',' + y);
    removeOption(x + ',' + (startY + m));
    m++;
  }
};

OptionsCalculator.prototype.getCellValue = function(xy) {
  return this.game.initCellValues[xy] || this.game.userCellValues[xy];
};

module.exports = OptionsCalculator;
