(function() {
  can.Control('UploadIconPanel', {}, {
    init : function(element, options) {
      var self = this;
      element.html(can.view('/js/libs/mst/upload_icon.mst'));
      this.element.find('.upload-action input').fileupload({
        dataType : 'json',
        progressall : function(e, data) {
          var progress = parseInt(data.loaded / data.total * 100);
          element.find('.progress-bar').css('width', progress + '%').html(progress + '%');
        },
        done : function(e, data) {
          self.path = data.result.path;
          element.find('.upload-icon-display').css('background-image', 'url(' + data.result.path + ')');
          element.find('.upload-icon-display span').hide();
        }
      });
    }
  });
})();
