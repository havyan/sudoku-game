var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Mixed = Schema.Types.Mixed;

var RuleSchema = new Schema({
  status: {
    type: String,
    default: '1'
  },
  score: {
    add: [Mixed],
    reduce: Mixed,
    single: Mixed
  },
  grade: [{
    code: String,
    floor: Number
  }],
  exchange: {
    rate: Number
  },
  ui: {
    zoom: Number
  }
});

RuleSchema.statics.getRule = function(cb) {
  this.findOne(function(error, rule) {
    if (error) {
      cb(error);
    } else {
      if (rule) {
        rule = rule.toJSON();
        rule.grade.forEach(function(e) {
          e.name = Rule.GRADE_NAMES[e.code];
        });
      }
      cb(null, rule);
    }
  });
};

RuleSchema.statics.updateRule = function(rule, cb) {
  var id = rule._id;
  delete rule._id;
  rule.updatetime = new Date();
  this.update({
    '_id': id
  }, rule, cb);
};

var Rule = mongoose.model('Rule', RuleSchema);

Rule.GRADE_NAMES = {
  0: "新手",
  1: "一段",
  2: "二段",
  3: "三段",
  4: "四段",
  5: "五段",
  6: "六段",
  7: "七段",
  8: "八段",
  9: "九段"
};

module.exports = Rule;
