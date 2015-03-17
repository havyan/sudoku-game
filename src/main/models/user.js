var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	account : String,
	name : String,
	grade : Number,
	points : Number,
	rounds : Number,
	wintimes : Number
});

UserSchema.statics.findOneByName = function(name, cb) {
	this.findOne({
		name : name
	}, cb);
};

UserSchema.statics.findOneByAccount = function(account, cb) {
	this.findOne({
		account : account
	}, cb);
};

module.exports = mongoose.model('User', UserSchema);
