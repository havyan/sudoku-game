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

module.exports = function(schema) {
  return _.merge(schema, COMMON);
};
