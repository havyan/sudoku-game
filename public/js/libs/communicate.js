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
          Dialog.message(T('common:communicate.feedback_successful'), { userClass: 'cool' });
          $input.val('');
        }, function() {

        })
      }
    });

    window._bd_share_config={"common":{"bdSnsKey":{},"bdText":"","bdMini":"2","bdMiniList":false,"bdPic":"","bdStyle":"0","bdSize":"16"},"slide":{"type":"slide","bdImg":"6","bdPos":window.sharePosition,"bdTop":"100"},"image":{"viewList":["qzone","tsina","tqq","renren","weixin"],"viewText":"分享到：","viewSize":"16"},"selectShare":{"bdContainerClass":null,"bdSelectMiniList":["qzone","tsina","tqq","renren","weixin"]}};with(document)0[(getElementsByTagName('head')[0]||body).appendChild(createElement('script')).src='http://bdimg.share.baidu.com/static/api/js/share.js?v=89860593.js?cdnversion='+~(-new Date()/36e5)];
  });

})();
