const winston = require('winston');

const AbstractTask = require('./abstract_task');

class GameTotalTask extends AbstractTask {

  constructor(game) {
    super();
    this.game = game;
  }

  process() {
    if (this.game.remainingTime > 0) {
      this.game.remainingTime--;
      this.game.emit('total-countdown-stage', this.game.remainingTime);
    } else {
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
