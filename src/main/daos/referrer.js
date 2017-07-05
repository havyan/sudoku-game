var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var common = require('./common');

var ReferrerSchema = new Schema({
  url: String
});

ReferrerSchema.statics.createReferrer = function(url, cb) {
  return this.create({
    url: url
  }, cb);
};

ReferrerSchema.plugin(common);

module.exports = mongoose.model('Referrer', ReferrerSchema);
