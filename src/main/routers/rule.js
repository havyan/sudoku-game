var HttpError = require('../http_error');
var winston = require('winston');
var Rule = require('../models/rule');

module.exports = function(router) {
	/* GET System Rule. */
	router.get('/rule', function(req, res) {
		Rule.getRule(function(error, rule) {
			if (error) {
				next(new HttpError(error));
				return;
			}
			res.send(rule);
		});
	});

	/* GET System Rule. */
	router.put('/rule', function(req, res) {
		Rule.updateRule(JSON.parse(req.body.data), function(error) {
			if (error) {
				next(new HttpError(error));
				return;
			}
			res.send('ok');
		});
	});
};

