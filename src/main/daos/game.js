var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var Mixed = Schema.Types.Mixed;
var common = require('./common');

var GameSchema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Room'
  },
  index: Number,
  level: String,
  capacity: Number,
  duration: Number,
  start_mode: String,
  mode: [Mixed],
  playMode: {
    type: String,
    default: 'multi'
  },
  rule: Mixed,
  cost: {
    type: Number,
    default: 0
  },
  money_returned: {
    type: Boolean,
    default: false
  },
  return_time: Date,
  wait_time: Number,
  real_wait_time: Number
});

GameSchema.statics.createGame = function(userId, roomId, gameId, params, cb) {
  this.create(Object.assign({
    _id: ObjectId(gameId),
    creator: ObjectId(userId),
    room: ObjectId(userId)
  }, params), cb);
};

GameSchema.plugin(common);

module.exports = mongoose.model('Game', GameSchema);
