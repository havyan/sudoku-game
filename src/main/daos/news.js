var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var common = require('./common');

var NewsSchema = new Schema({
  id : Schema.Types.ObjectId,
  title : String,
  author : String,
  content : String,
});

NewsSchema.statics.findOneById = function(id, cb) {
  this.findOne({
    _id: mongoose.Types.ObjectId(id)
  }, cb);
};

NewsSchema.plugin(common);

module.exports = mongoose.model('News', NewsSchema);
