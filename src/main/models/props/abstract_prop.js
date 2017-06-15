const _ = require('lodash');

class AbstractProp {

  constructor(game, type) {
    this.game = game;
    this.type = type;
  }

  async use(player, params={}) {
    this.game.resetTimeout(player);
    await this.beforeUse(player, params);
    const prop = this.findProp(player);
    const amount = prop[this.type];
    if(amount <= 0) {
      throw 'Not enough props.';
    }
    await this.check(player, prop, params);
    const result = await this.process(player, prop, params);
    prop[this.type] = amount - 1;
    await prop.save();
    await this.afterUse(player, params);
    return result;
  }

  async beforeUse(player, params) {}

  async afterUse(player, params) {}

  async check(player, prop, params) {}

  async process(player, prop, params) {

  }

  isPlaying(player) {
    return player === this.game.currentPlayer
  }

  findProp(player) {
    return _.find(this.game.props, {
      account: player
    });
  }

}

module.exports = AbstractProp;
