var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var common = require('./common');
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

AwardSchema.plugin(common);

module.exports = mongoose.model('Award', AwardSchema);
