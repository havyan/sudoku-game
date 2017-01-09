var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
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
  run_id: String,
  level: String,
  cost: {
    type: Number,
    default: 0
  },
  money_returned: {
    type: Boolean,
    default: false
  },
  return_time: Date,
  wait_time: Number
});

GameSchema.statics.createGame = function(userId, roomId, params, cb) {
  this.create(Object.assign({
    creator: ObjectId(userId),
    room: ObjectId(userId)
  }, params), cb);
};

GameSchema.plugin(common);

module.exports = mongoose.model('Game', GameSchema);
