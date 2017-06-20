const winston = require('winston');

const AbstractTask = require('./abstract_task');

const COUNTDOWN = 20;

class PlayerQuitTask extends AbstractTask {

  constructor(game, player) {
    super();
    this.game = game;
    this.player = player;
  }

  process() {
    if (this.remaining == null) {
      this.remaining = COUNTDOWN;
      this.game.emit('quit-countdown-stage', this.player, this.remaining);
    } else if (this.remaining > 0) {
      this.remaining--;
      this.game.emit('quit-countdown-stage', this.player, this.remaining);
    } else {
      this.finish();
      this.game.playerQuit(this.player, 'offline', function(error) {
        if (error) {
          winston.error('Error happen when player quit for timeout: ' + error);
        }
      });
    }
  }

  reset() {
    this.remaining = null;
  }

}

module.exports = PlayerQuitTask;
