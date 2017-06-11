const AbstractTask = require('./abstract_task');

const COUNTDOWN = 5;

class GameCountdownTask extends AbstractTask {

  constructor(game) {
    super();
    this.game = game;
    this.remaining = COUNTDOWN;
  }

  process() {
    if (this.remaining >= 0) {
      this.game.emit('countdown-stage', this.remaining);
      this.remaining--;
    } else {
      this.finish();
      setTimeout(() => {
        this.game.timer.schedule(this.game.totalTask);;
        this.game.nextPlayer();
      }, 3000);
      this.game.setOngoingStatus();
    }
  }

}

module.exports = GameCountdownTask;
