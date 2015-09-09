(function() {
  $(document).ready(function() {
    Rest.Prop.getPropData(function(data) {
      new Components.PropPanel($('body'), {
        data : data
      });
    }, function(e) {
    });
  });
})();
