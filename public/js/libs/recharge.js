(function() {
  $(document).ready(function() {
    new Components.RechargePanel($('#recharge'), {
      model : new Models.RechargeModel()
    });
  });
})();
