var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RoomSchema = new Schema({
  name : String
});

RoomSchema.statics.findOneByName = function(name, cb) {
  this.findOne({
    name : name
  }, cb);
};

RoomSchema.statics.all = function(cb) {
  this.find({}, cb);
};

module.exports = mongoose.model('Room', RoomSchema);
