var winston = require('winston');

module.exports.init = function(cb) {
	var winstonConfig = global.config.winston;
	if (winstonConfig.transport) {
		winston.add(winston.transports[winstonConfig.transport.type], winstonConfig.transport);
		winston.remove(winston.transports.Console);
		winston.add(winston.transports.Console, {
			level : winstonConfig.transport.level,
			timestamp: winstonConfig.transport.timestamp
		});
	}
	cb && cb();
};
