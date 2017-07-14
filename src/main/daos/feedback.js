var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var common = require('./common');

var FeedbackSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  content: String
});

FeedbackSchema.statics.createFeedback = function(user, content, cb) {
  return this.create({
    user : ObjectId(user),
    content: content
  }, cb);
};

FeedbackSchema.plugin(common);

module.exports = mongoose.model('Feedback', FeedbackSchema);
