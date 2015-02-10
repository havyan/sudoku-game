var winston = require('winston');

module.exports = function() {
	var winstonConfig = global.config.winston;
	if (winstonConfig.levels) {
		winston.setLevels(winstonConfig.levels);
	}
	if (winstonConfig.transport) {
		winston.add(winston.transports[winstonConfig.transport.type], winstonConfig.transport);
		winston.remove(winston.transports.Console);
		winston.add(winston.transports.Console, {
			level : winstonConfig.transport.level,
			timestamp: winstonConfig.transport.timestamp
		});
	}
};
