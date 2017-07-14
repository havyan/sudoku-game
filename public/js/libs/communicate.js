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
    $(document.body).keydown(function(e) {
      if (e.keyCode === 8) {
        var $target = $(e.target);
        if (!$target.hasClass('feedback-input')) {
          return false;
        }
      }
    });
  });
})();
