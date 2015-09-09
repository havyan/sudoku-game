(function() {
  $(document).ready(function() {
    var $rooms = $('.room');
    var roomWidth = $rooms.width();
    var roomHeight = $rooms.height();
    var centerX = 400;
    var centerY = 400;
    var radius = 300;
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
  });
})();
