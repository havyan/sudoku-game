(function() {
  $(document).ready(function() {
    Rest.Mail.getMails(function(mails) {
    }, function(e) {
    });
  });
})();
