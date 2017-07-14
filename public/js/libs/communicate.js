(function() {
  $(document).ready(function() {
    $('.feedback-submit').click( function(e) {
      var $input = $(e.target).siblings('.feedback-input');
      var content = $input.val();
      if (!_.isEmpty(content)) {
        Rest.Feedback.createFeedback(content, function() {
          Dialog.message('反馈成功, 非常感谢!');
          $input.val('');
        }, function() {

        })
      }
    });
  });
})();
