var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var JoinRecordSchema = new Schema({
  account: String,
  game: {
    type: Schema.Types.ObjectId,
    ref: 'Game'
  },
  join_time: {
    type : Date,
    default : Date.now
  },
  quit_time: Date
});

JoinRecordSchema.statics.createRecord = function(account, gameId, cb) {
  this.create({
    account: account,
    game: ObjectId(gameId)
  }, cb);
};

module.exports = mongoose.model('JoinRecord', JoinRecordSchema);
