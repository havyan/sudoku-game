var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var common = require('./common');

var PointsRecordSchema = new Schema({
  account: String,
  game: {
    type: Schema.Types.ObjectId,
    ref: 'Game'
  },
  gain: Number,
  total: Number
});

PointsRecordSchema.statics.createRecord = function(account, gameId, gain, total, cb) {
  this.create({
    account: account,
    game: ObjectId(gameId),
    gain: gain,
    total: total
  }, cb);
};

PointsRecordSchema.plugin(common);

module.exports = mongoose.model('PointsRecord', PointsRecordSchema);
