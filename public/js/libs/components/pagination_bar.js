(function() {
  can.Control('PaginationBar', {
  }, {
    setup : function(element, options) {
      options.model = new can.Model({
        count : options.count
      });
    },

    init : function(element, options) {
      this.element.append(can.view('/js/libs/mst/pagination_bar.mst'));
    }
  });
})();
