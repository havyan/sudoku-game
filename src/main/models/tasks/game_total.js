const winston = require('winston');

const AbstractTask = require('./abstract_task');

class GameTotalTask extends AbstractTask {

  constructor(game) {
    super();
    this.game = game;
  }

  process() {
    this.game.remainingTime--;
    this.game.emit('total-countdown-stage', this.game.remainingTime);
    if (this.game.remainingTime <= 0) {
      this.finish();
      // TODO stop player timer
      this.game.over(function(error) {
        if (error) {
          winston.error(error);
        }
      });
    }
  }

}

module.exports = GameTotalTask;
