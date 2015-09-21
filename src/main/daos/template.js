var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var common = require('./common');

var TemplateSchema = new Schema(common({
  name : String,
  code : String,
  event : String,
  content : String
}));

TemplateSchema.statics.findOneByCode = function(code, cb) {
  this.findOne({
    code : code
  }, cb);
};

module.exports = mongoose.model('Template', TemplateSchema);
