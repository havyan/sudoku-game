(function() {
  can.Control('Components.LobbyPanel', {}, {
    init : function(element, options) {
      element.html(can.view('/js/libs/mst/lobby_panel.mst', options.model));
    }
  });
})();
