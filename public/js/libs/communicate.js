(function() {
  $(document).ready(function() {
    var $feedback = $('.communicate-area .feedback');
    var $arrow = $feedback.find('.feedback-arrow');
    var $popup = $feedback.find('.feedback-popup');
    var $input = $feedback.find('.feedback-input');

    $feedback.mouseenter(function() {
      $arrow.show().css('display', 'inline-block');
      $popup.show();
      $input.focus();
    });

    $feedback.click(function(event) {
      event = event || window.event;
      if (event.stopPropagation) {
        event.stopPropagation();
      } else if (window.event) {
        window.event.cancelBubble = true;
      }
    });

    $(document).click(function() {
      $arrow.hide();
      $popup.hide();
    });

    $('.feedback-submit').click( function(e) {
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
