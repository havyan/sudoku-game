(function() {
  can.Control('Dialog', {

    showMessage : function(message) {
      return this.showDialog({
        title : '消息',
        content : message,
        autoClose : true,
        disposable : true,
        actions : [{
          name : '关闭',
          dismiss : true,
          callback : function(e) {
            $(this).closest('.modal').modal('hide');
          }
        }]
      });
    },

    showConfirm : function(message, confirmCallback, cancelCallback) {
      return this.showDialog({
        title : '确认',
        content : message,
        autoClose : false,
        actions : [{
          name : '取消',
          dismiss : true,
          callback : cancelCallback
        }, {
          name : '确认',
          btnClass : 'btn-primary',
          callback : confirmCallback
        }]
      });
    },

    showDialog : function(options) {
      if (!options.id) {
        options.id = "dialog" + Date.now();
      }
      if (options.disposable === undefined) {
        options.disposable = true;
      }
      if (options.actions) {
        options.actions.forEach(function(action) {
          if (!action.btnClass) {
            action.btnClass = 'btn-default';
          }
        });
      }
      $('body').append(can.view('/js/libs/mst/dialog.mst', options));
      var dialogElement = $('#' + options.id);
      var contentElement = dialogElement.find('.modal-body');
      if (options.control) {
        new options.control(contentElement, options.data ? options.data : {});
      } else if (options.template) {
        contentElement.html(can.view(options.template, options.data ? options.data : {}));
      } else if (options.content) {
        contentElement.html(options.content);
      }
      if (options.actions) {
        options.actions.forEach(function(action, index) {
          if (action.callback) {
            dialogElement.find('.modal-footer .btn:eq(' + index + ')').click(action.callback);
          }
        });
      }
      if (options.disposable) {
        dialogElement.on('hidden.bs.modal', function() {
          dialogElement.remove();
        });
      }
      dialogElement.modal();
      return dialogElement;
    }
  }, {});
})();
