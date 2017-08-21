var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var LoginHistorySchema = new Schema({
  user : {
    type : Schema.Types.ObjectId,
    ref : 'User'
  },
  ip : String
});

LoginHistorySchema.statics.createHistory = function(user, ip, cb) {
  this.create({
    user : ObjectId(user),
    ip : ip
  }, cb);
};

module.exports = mongoose.model('LoginHistory', LoginHistorySchema);
