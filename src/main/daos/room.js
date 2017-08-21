var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RoomSchema = new Schema({
  name : String,
  code : String,
  icon : String,
  description : String,
  capacity : Number,
  virtual : Boolean,
  parent : String,
  seat : Number,
  help : String,
  order : Number,
  status : String
});

RoomSchema.statics.findOneByName = function(name, cb) {
  this.findOne({
    name : name
  }, cb);
};

RoomSchema.statics.all = function(cb) {
  this.find({}, cb);
};

RoomSchema.statics.allVirtuals = function(cb) {
  this.find({
    virtual : true
  }, cb);
};

module.exports = mongoose.model('Room', RoomSchema);
