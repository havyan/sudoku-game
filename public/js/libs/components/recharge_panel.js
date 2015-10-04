(function() {
  can.Control('Components.RechargePanel', {}, {
    init : function(element, options) {
      element.html(can.view('/js/libs/mst/recharge_panel.mst', {}));
    }
  });
})();
