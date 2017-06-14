const DelayProp = require('./delay');

const TYPE = 'delay';

class PropFactory {

  static create(game) {
    return new PropFactory(game);
  }

  constructor(game) {
    this.game = game;
    this.initProps();
  }

  initProps() {
    this.props = {};
    let prop = new DelayProp(this.game);
    this.props[prop.type] = prop;
  }

  async use(type, player, ...params) {
    const prop = this.props[type];
    if (prop) {
      await prop.use(player, ...params);
    } else {
      throw `No prop found for ${type}`;
    }
  }

}

module.exports = PropFactory;
