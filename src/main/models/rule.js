var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Mixed = Schema.Types.Mixed;

var RuleSchema = new Schema({
	add : [Mixed],
	reduce : Mixed
});

RuleSchema.statics.getRule = function(cb) {
	this.findOne(cb);
};

RuleSchema.statics.updateRule = function(rule, cb) {
	var id = rule._id;
	delete rule._id;
	this.update({
		'_id' : id
	}, rule, cb);
};

module.exports = mongoose.model('Rule', RuleSchema);
