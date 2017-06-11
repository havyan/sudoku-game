const AbstractTask = require('./abstract_task');

class GameWaitTask extends AbstractTask {

  constructor(game) {
    super();
    this.game = game;
  }

  process() {
    if (this.game.isWaiting()) {
      if (this.game.waitCountdown >= 0) {
        this.game.emit('wait-countdown-stage', this.game.waitCountdown);
        this.game.waitCountdown--;
      } else {
        this.finish();
        this.game.abort();
      }
    } else {
      this.finish();
    }
  }

}

module.exports = GameWaitTask;
