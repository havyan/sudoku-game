(function() {
  can.Model('Models.LobbyModel', {}, {
    init : function(data, eventReceiver) {
      this.eventReceiver = eventReceiver;
      this.selectRoom(this.attr('rooms.0.id'));
    },

    selectRoom : function(roomId) {
      this.attr('selectedRoom', roomId);
    }
  });
})();
