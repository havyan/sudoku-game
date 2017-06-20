const AbstractTask = require('./abstract_task');

const MAX_TIMEOUT_ROUNDS = 10;

class PlayerTimerTask extends AbstractTask {

  constructor(game) {
    super();
    this.game = game;
    this.reset();
  }

  process() {
    if (this.delay > 0) {
      this.delay--;
    } else if(!this.game.delayed) {
      this.ellapsed++;
      this.game.emit('player-ellapsed-time', this.ellapsed);
      if (this.ellapsed === this.game.rule.score.add.total) {
        const player = this.game.currentPlayer;
        this.game.stopDelayTask();
        this.game.updateScore('timeout');
        if (this.game.timeoutCounter[player] === undefined) {
          this.game.timeoutCounter[player] = 0;
        }
        this.game.timeoutCounter[player]++;
        if (this.game.timeoutCounter[player] >= MAX_TIMEOUT_ROUNDS) {
          this.game.emit('max-timeout-reached', player);
          this.game.startPlayerQuitTask(player);
        }
        this.game.nextPlayer();
      }
    }
  }

  reset() {
    this.ellapsed = 0;
    this.delay = 1;
    this.game.emit('player-ellapsed-time', this.ellapsed);
  }

}

module.exports = PlayerTimerTask;
