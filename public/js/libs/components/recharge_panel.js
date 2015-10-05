(function() {
  can.Control('Components.RechargePanel', {}, {
    init : function(element, options) {
      element.html(can.view('/js/libs/mst/recharge_panel.mst', {}));
      this.paginationModel = new Models.PaginationModel();
      this.paginationBar = new Components.PaginationBar(element.find('.records-pagination-bar'), {
        model : this.paginationModel
      });
    },

    '.navigator .item click' : function(e) {
      e.addClass('active').siblings('.item').removeClass('active');
      this.element.find('.recharge-container .item').removeClass('active').filter('.' + e.data('target')).addClass('active');
    },
  });
})();
