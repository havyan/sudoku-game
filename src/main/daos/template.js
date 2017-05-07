var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var common = require('./common');

var TemplateSchema = new Schema({
  name : String,
  code : String,
  event : String,
  content : String,
  type : String
});

TemplateSchema.statics.findOneByCode = function(code, cb) {
  this.findOne({
    code : code
  }, cb);
};

TemplateSchema.plugin(common);

module.exports = mongoose.model('Template', TemplateSchema);
