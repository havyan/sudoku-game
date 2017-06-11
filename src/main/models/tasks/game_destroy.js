const AbstractTask = require('./abstract_task');

const COUNTDOWN = 120;

class GameDestroyTask extends AbstractTask {

  constructor(game) {
    super();
    this.game = game;
    this.remaining = COUNTDOWN;
  }

  process() {
    this.game.emit('destroy-countdown-stage', this.remaining);
    if (this.remaining === 0) {
      this.finish();
      this.game.destroy();
    }
    this.remaining--;
  }

}

module.exports = GameDestroyTask;
