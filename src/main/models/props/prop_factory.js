const DelayProp = require('./delay');
const GlassesProp = require('./glasses');
const OptionsOnceProp = require('./options_once');
const OptionsAlwaysProp = require('./options_always');
const ImpunityProp = require('./impunity');
const MagnifierProp = require('./magnifier');

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
    [DelayProp, GlassesProp, OptionsOnceProp, OptionsAlwaysProp, ImpunityProp, MagnifierProp].forEach(Prop => {
      const prop = new Prop(this.game);
      this.props[prop.type] = prop;
    });
  }

  async use(type, player, params) {
    const prop = this.props[type];
    if (prop) {
      return await prop.use(player, params);
    } else {
      throw `No prop found for ${type}`;
    }
  }

}

module.exports = PropFactory;
