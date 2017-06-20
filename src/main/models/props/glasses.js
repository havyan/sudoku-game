const AbstractProp = require('./abstract_prop');

const TYPE = 'glasses';

class GlassesProp extends AbstractProp {

  constructor(game) {
    super(game, TYPE);
  }

  async afterUse(player) {
    this.game.glassesUsed[player] = true;
  }

  async check(player, prop) {
    if (this.isPlaying(player)) {
      throw 'You do not have permission now';
    }
  }

}

module.exports = GlassesProp;
