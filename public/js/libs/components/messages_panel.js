(function() {
  can.Control('Components.PropPanel', {}, {
    init : function(element, options) {
      this.model = new can.Model(options.data);
      element.html(can.view('/js/libs/mst/prop_panel.mst', this.model));
    }
  });
})(); 