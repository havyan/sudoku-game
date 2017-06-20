const AbstractTask = require('./abstract_task');

const COUNTDOWN = 120;

class GameDestroyTask extends AbstractTask {

  constructor(game) {
    super();
    this.game = game;
  }

  process() {
    if (this.remaining == null) {
      this.remaining = COUNTDOWN;
      this.game.emit('destroy-countdown-stage', this.remaining);
    } else if (this.remaining > 0) {
      this.remaining--;
      this.game.emit('destroy-countdown-stage', this.remaining);
    } else {
      this.finish();
      this.game.destroy();
    }
  }

}

module.exports = GameDestroyTask;
