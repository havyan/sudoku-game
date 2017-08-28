const AbstractTask = require('./abstract_task');

const COUNTDOWN = 5;

class GameCountdownTask extends AbstractTask {

  constructor(game) {
    super();
    this.game = game;
    this.game.gameCountdown = null;
  }

  process() {
    if (this.game.gameCountdown == null) {
      this.game.gameCountdown = COUNTDOWN;
      this.game.emit('countdown-stage', this.game.gameCountdown);
    } else if (this.game.gameCountdown > 0) {
      this.game.gameCountdown--;
      this.game.emit('countdown-stage', this.game.gameCountdown);
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
