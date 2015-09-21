var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var common = require('./common');

var LoginHistorySchema = new Schema(common({
  user : {
    type : Schema.Types.ObjectId,
    ref : 'User'
  },
  ip : String
}));

module.exports = mongoose.model('LoginHistory', LoginHistorySchema);
