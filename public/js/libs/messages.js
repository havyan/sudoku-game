(function() {
  $(document).ready(function() {
    Rest.Message.getMessages(function(messages) {
    }, function(e) {
    });
  });
})();
