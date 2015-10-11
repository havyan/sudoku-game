var HttpError = require('../http_error');
var UserDAO = require('../daos/user');
var winston = require('winston');

module.exports = function(router) {
  router.get('/recharge/data', function(req, res, next) {
    UserDAO.findOneByAccount(req.session.account, function(error, user) {
      if (error) {
        next(new HttpError(error));
      } else {
        res.send({
          user : user.toJSON()
        });
      }
    });
  });
};

