var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var COMMON = {
  createtime : {
    type : Date,
    default : Date.now
  },
  updatetime : Date
};

module.exports = function(schema, options) {
  schema.add(_.cloneDeep(COMMON));

  schema.pre('save', function(next) {
    this.updatetime = new Date();
    next();
  });

  schema.pre('update', function(next) {
    this.updatetime = new Date();
    next();
  });
};
