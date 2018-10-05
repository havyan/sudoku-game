var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var FeedbackSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  content: String
});

FeedbackSchema.statics.createFeedback = function(user, content, cb) {
  user = user ? ObjectId(user) : null;
  return this.create({
    user: user,
    content: content
  }, cb);
};

module.exports = mongoose.model('Feedback', FeedbackSchema);
