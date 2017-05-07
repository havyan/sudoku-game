(function() {
  $(document).ready(function() {
    Rest.Recharge.getData(function(data) {
      new Components.RechargePanel($('#recharge'), {
        model : new Models.RechargeModel(data)
      });
    }, function() {
    });
  });
})();
