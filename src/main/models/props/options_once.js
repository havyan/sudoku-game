const AbstractProp = require('./abstract_prop');

const TYPE = 'options_once';

class OptionsOnceProp extends AbstractProp {

  constructor(game) {
    super(game, TYPE);
  }

  async afterUse(player) {
    this.game.optionsOnce[player] = true;
  }

  async check(player, prop) {
    if (!this.isPlaying(player)) {
      throw 'You do not have permission now';
    }
  }

}

module.exports = OptionsOnceProp;
