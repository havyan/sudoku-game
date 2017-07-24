var winston = require('winston');
var _ = require('lodash');
var uuid = require('uuid');
var OptionsCalculator = require('./options_calculator');

var Robot = function(game) {
  this.game = game;
  this.id = uuid.v1();
  this.account = 'robot-' + this.id;
  this.isRobot = true;
  this.name = '天才机器人';
  this.icon = '/imgs/default/user_icons/robot.png';
  this.grade = 0;
  this.points = 0;
  this.rounds = 0;
  this.wintimes = 0;
  this.losetimes = 0;
  this.winrate = 0;
  this.grade_name = '新手';
  this.money = 0;
};

Robot.prototype.toJSON = function() {
  return {
    id: this.id,
    account: this.account,
    isRobot: this.isRobot,
    name: this.name,
    icon: this.icon,
    grade: this.grade,
    points: this.points,
    rounds: this.rounds,
    wintimes: this.wintimes,
    losetimes: this.losetimes,
    winrate: this.winrate,
    grade_name: this.grade_name,
    money: this.money
  };
};

Robot.prototype.submit = function() {
  var sample = this.advancedSampleCellOptions();
  var value = _.sample(sample.cellOptions);
  this.game.submit(this.account, sample.xy, value, function(error) {
    if (error) {
      winston.error('Robot submit error: ' + error);
    }
  });
}

Robot.prototype.basicSampleCellOptions = function() {
  var xy = _.sample(this.getUnknownCells());
  var cellOptions = new OptionsCalculator(this.game).calcCellOptions(xy);
  return {
    xy: xy,
    cellOptions: cellOptions
  };
};

Robot.prototype.advancedSampleCellOptions = function() {
  var allCellOptions = new OptionsCalculator(this.game).calcAllCellOptions();
  var candidates = [];
  for (var i = 1; i <= 9; i++) {
    for (xy in allCellOptions) {
      var cellOptions = allCellOptions[xy];
      if (cellOptions.length === i) {
        candidates.push({
          xy: xy,
          cellOptions: cellOptions
        });
      }
    }
    if (candidates.length > 0) {
      return _.sample(candidates);
    }
  }
};

Robot.prototype.getUnknownCells = function() {
  var cells = [];
  for (var key in this.game.answer) {
    if (!(this.game.initCellValues[key] || this.game.userCellValues[key])) {
      cells.push(key);
    }
  }
  return cells;
}

module.exports = Robot;
