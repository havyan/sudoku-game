const AbstractProp = require('./abstract_prop');

const TYPE = 'magnifier';

class MagnifierProp extends AbstractProp {

  constructor(game) {
    super(game, TYPE);
  }

  async process(player, prop, params) {
    const xy = params.xy;
    const peep = params.peep;
    if (peep) {
      this.game.knownCellValues[player][xy] = this.game.answer[xy];
      return this.game.knownCellValues[player][xy];
    } else {
      const value = this.game.answer[xy];
      return await this.submit(player, xy, value);
    }
  }

  submit(player, xy, value) {
    return new Promise((resolve, reject) => {
      this.game.submit(player, xy, value, function(error, result) {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

}

module.exports = MagnifierProp;
