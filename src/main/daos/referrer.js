var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReferrerSchema = new Schema({
  url: String
});

ReferrerSchema.statics.createReferrer = function(url, cb) {
  return this.create({
    url: url
  }, cb);
};

module.exports = mongoose.model('Referrer', ReferrerSchema);
