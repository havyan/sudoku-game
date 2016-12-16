(function() {
  $(document).ready(function() {
    Rest.Prop.getPropData(function(data) {
      new Components.PropPanel($('.main'), {
        data : data
      });
    }, function(e) {
    });
  });
})();
