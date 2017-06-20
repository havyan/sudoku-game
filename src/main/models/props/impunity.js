const AbstractProp = require('./abstract_prop');

const TYPE = 'impunity';

class ImpunityProp extends AbstractProp {

  constructor(game) {
    super(game, TYPE);
  }

  async process(player, prop) {
    this.game.updateScore('impunity', player);
  }

}

module.exports = ImpunityProp;
