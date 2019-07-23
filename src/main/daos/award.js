var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Mixed = Schema.Types.Mixed;

var AwardSchema = new Schema({
  type : String,
  title : String,
  code : String,
  money : Number,
  props : [Mixed]
});

AwardSchema.statics.findOneByCode = function(code, cb) {
  this.findOne({
    code : code
  }, cb);
};

module.exports = mongoose.model('Award', AwardSchema);
