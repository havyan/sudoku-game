(function() {
  $(document).ready(function() {
    var $rooms = $('.room');
    var roomWidth = $rooms.width();
    var roomHeight = $rooms.height();
    var centerX = 400;
    var centerY = 300;
    var radius = 280;
    var step = Math.PI * 2 / $rooms.length;
    var start = -step;
    $rooms.each(function(i, e) {
      var angle = start + step * i;
      var x = centerX + radius * Math.sin(angle) - 60;
      var y = centerY - radius * Math.cos(angle) - 60;
      $(e).css({
        top : y + 'px',
        left : x + 'px'
      });
    });
    var itemName = 'favarite_room';
    var favariteRoom = window.localStorage.getItem(itemName);
    if (favariteRoom) {
      $('#' + favariteRoom).addClass('favarite');
    }
    $rooms.find('a').click(function(e) {
      $room = $(e.target).closest('.room');
      $rooms.removeClass('favarite');
      $room.addClass('favarite');
      window.localStorage.setItem(itemName, $room.attr('id'));
    });
    $('.law-btn').click(function(e) {
      Agreement.showLaw();
    });

    $('.parents-btn').click(function() {
      Agreement.showParentsDetail();
    });

    $('.dispute-btn').click(function() {
      Agreement.showDispute();
    });

    $('.guest-pass-button a').click(function() {
      if ($('.protocol-read input[type=checkbox]').is(':checked')) {
        window.location = '/guest_pass';
      } else {
        Dialog.message('请先同意超天才数独玩家协议和法律声明.');
      }
    });

    $('.protocol-read .protocol').click(function() {
      Agreement.showProtocol();
    });

    $('.protocol-read .law').click(function() {
      Agreement.showLaw();
    });
  });
})();
