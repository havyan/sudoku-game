(function() {
  $(document).ready(function() {
    new Components.MessagesPanel($('#messages'), {
      model : new Models.MessagesModel()
    });
  });
})();
