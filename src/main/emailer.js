var nodemailer = require('nodemailer');
var _ = require('lodash');
var config = global.config.app.mail;
var transporter = nodemailer.createTransport({
  host: config.host,
  port: config.port,
  secure: config.secure,
  auth: {
    user: config.auth.user,
    pass: config.auth.pass
  }
});

module.exports.send = function(options, cb) {
  transporter.sendMail(_.merge({
    from: config.from
  }, options), cb);
};
