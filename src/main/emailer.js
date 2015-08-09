var nodemailer = require('nodemailer');
var _ = require('lodash');
var transporter = nodemailer.createTransport({
  service : global.config.app.mail.service,
  auth : {
    user : global.config.app.mail.from,
    pass : global.config.app.mail.password
  }
});

module.exports.send = function(options, cb) {
  transporter.sendMail(_.merge({
    from : global.config.app.mail.from
  }, options), cb);
};
