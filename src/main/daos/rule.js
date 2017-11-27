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
  0: L('app:rule.beginner'),
  1: L('app:rule.grade1'),
  2: L('app:rule.grade2'),
  3: L('app:rule.grade3'),
  4: L('app:rule.grade4'),
  5: L('app:rule.grade5'),
  6: L('app:rule.grade6'),
  7: L('app:rule.grade7'),
  8: L('app:rule.grade8'),
  9: L('app:rule.grade9')
};

module.exports = Rule;
