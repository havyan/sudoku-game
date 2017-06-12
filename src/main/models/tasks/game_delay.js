const AbstractTask = require('./abstract_task');

const COUNTDOWN = 60;

class GameDelayTask extends AbstractTask {

  constructor(game) {
    super();
    this.game = game;
    this.reset();
  }

  process() {
    if (this.game.delayCountdownStage == null) {
      this.game.delayCountdownStage = COUNTDOWN;
      this.game.emit('delay-countdown-stage', countdown);
    } else if (this.game.delayCountdownStage > 0) {
      this.game.delayCountdownStage--;
      this.game.emit('delay-countdown-stage', this.game.delayCountdownStage);
    } else {
      this.finish();
    }
  }

  reset() {
    this.game.delayCountdownStage = null;
  }

  restart() {
    super.restart();
    this.game.emit('game-delayed', true);
  }

}

module.exports = GameDelayTask;
