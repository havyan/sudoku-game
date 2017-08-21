var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var Mixed = Schema.Types.Mixed;

var ChatRecordSchema = new Schema({
  game: {
    type: Schema.Types.ObjectId,
    ref: 'Game'
  },
  messages: [Mixed]
});

ChatRecordSchema.statics.createRecord = function(gameId, messages, cb) {
  this.create({
    game: ObjectId(gameId),
    messages: messages
  }, cb);
};

module.exports = mongoose.model('ChatRecord', ChatRecordSchema);
