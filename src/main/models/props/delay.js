const AbstractProp = require('./abstract_prop');

const TYPE = 'delay';

class DelayProp extends AbstractProp {

  constructor(game) {
    super(game, TYPE);
  }

  async process(player, prop) {
    this.game.delayed = true;
    this.game.delayTask.restart();
  }

  async check(player, prop) {
    if (!this.isPlaying(player)) {
      throw 'You do not have permission now';
    }
  }

}

module.exports = DelayProp;
