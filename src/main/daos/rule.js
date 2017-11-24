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
  grade: [
    {
      code: String,
      floor: Number
    }
  ],
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
  0: {
    cn: "新手",
    en: "Green Hand",
    jp: "初心"
  },
  1: {
    cn: "一段",
    en: "Grade 1",
    jp: "一段"
  },
  2: {
    cn: "二段",
    en: "Grade 2",
    jp: "二段"
  },
  3: {
    cn: "三段",
    en: "Grade 3",
    jp: "三段"
  },
  4: {
    cn: "四段",
    en: "Grade 4",
    jp: "四段"
  },
  5: {
    cn: "五段",
    en: "Grade 5",
    jp: "五段"
  },
  6: {
    cn: "六段",
    en: "Grade 6",
    jp: "六段"
  },
  7: {
    cn: "七段",
    en: "Grade 7",
    jp: "七段"
  },
  8: {
    cn: "八段",
    en: "Grade 8",
    jp: "八段"
  },
  9: {
    cn: "九段",
    en: "Grade 9",
    jp: "九段"
  }
};

module.exports = Rule;
