const AbstractProp = require('./abstract_prop');

const TYPE = 'options_always';

class OptionsAlwaysProp extends AbstractProp {

  constructor(game) {
    super(game, TYPE);
  }

  async afterUse(player) {
    this.game.optionsAlways[player] = true;
  }

  async check(player, prop) {
    if (this.game.optionsAlways[player]) {
      throw 'You have already used this type of card, only one time is allowed during one game.';
    }
  }

}

module.exports = OptionsAlwaysProp;
