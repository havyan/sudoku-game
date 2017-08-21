const AbstractTask = require('./abstract_task');

const COUNTDOWN = 60;

class GameDelayTask extends AbstractTask {

  constructor(game) {
    super();
    this.game = game;
    this.reset();
  }

  process() {
    if (this.game.delayCountdown == null) {
      this.game.delayCountdown = COUNTDOWN;
      this.game.emit('delay-countdown-stage', this.game.delayCountdown);
    } else if (this.game.delayCountdown > 0) {
      this.game.delayCountdown--;
      this.game.emit('delay-countdown-stage', this.game.delayCountdown);
    } else {
      this.game.stopDelayTask();
    }
  }

  reset() {
    this.game.delayCountdown = null;
  }

  restart() {
    super.restart();
    this.game.emit('game-delayed', true);
  }

}

module.exports = GameDelayTask;
