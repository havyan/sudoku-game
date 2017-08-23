var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var Mixed = Schema.Types.Mixed;

var GameSchema = new Schema({
  room: String,
  index: Number,
  mode: [Mixed],
  playMode: String,
  creator: String,
  status: String,
  players: [String],
  joinRecords: [String],
  cost: {
    type: Number,
    default: 0
  },
  rule: Mixed,
  waitCountdown: Number,
  gameCountdown: Number,
  delayCountdown: Number,
  capacity: Number,
  duration: Number,
  remainingTime: Number,
  waitTime: Number,
  level: String,
  startMode: String,
  quitPlayers: [String],
  delayed: {
    type: Boolean,
    default: false
  },
  userCellValues: Mixed,
  cellValueOwners: Mixed,
  knownCellValues: Mixed,
  scores: Mixed,
  timeoutCounter: Mixed,
  optionsOnce: Mixed,
  glassesUsed: Mixed,
  results: [Mixed],
  optionsAlways: Mixed,
  changedScores: Mixed,
  playerIndex: Mixed,
  puzzle: String,
  money_returned: {
    type: Boolean,
    default: false
  },
  return_time: Date,
  wait_time: Number,
  real_wait_time: Number
});

GameSchema.statics.createGame = function(account, roomId, gameId, params, cb) {
  this.create(Object.assign({
    _id: ObjectId(gameId),
    creator: account,
    room: roomId
  }, params), cb);
};

GameSchema.statics.findUnfinishedSingleGame = function(account, cb) {
  return this.findOne({
    creator: account,
    status: 'ongoing',
    playMode: 'single'
  }, cb);
};

GameSchema.statics.findUnfinishedRobotGame = function(account, cb) {
  return this.findOne({
    creator: account,
    status: 'ongoing',
    playMode: 'robot'
  }, cb);
};

module.exports = mongoose.model('Game', GameSchema);
