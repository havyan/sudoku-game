var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var COMMON = {
  createtime : {
    type : Date,
    default : Date.now
  },
  updatetime : Date
};

module.exports = function(schema, options) {
  schema.add(_.cloneDeep(COMMON));

  schema.statics.findOneById = function(id, cb) {
    return this.findOne({
      _id : ObjectId(id)
    }, cb);
  };

  schema.statics.updateById = function(id, params, cb) {
    return this.update({
      _id : ObjectId(id)
    }, params, cb);
  };

  schema.pre('save', function(next) {
    this.updatetime = new Date();
    next();
  });

  schema.pre('update', function(next) {
    this.updatetime = new Date();
    next();
  });
};
