(function() {
  can.Control('Dialog', {
    CANCEL_ACTION : {
      name : T('common:actions.cancel'),
      dismiss : true
    },

    CLOSE_ACTION : {
      name : T('common:actions.close'),
      dismiss : true,
      userClass : 'btn-primary'
    },

    /**
     * params: message -> text or html
     *         options -> optional, usally we don't need it, please refer to Dialog.show(options)
     */
    message : function(message, options) {
      return this.show(this.merge({
        title : T('common:titles.message'),
        content : message,
        autoClose : true,
        actions : [this.CLOSE_ACTION]
      }, options));
    },

    /**
     * params: error -> text or html
     *         options -> optional, usally we don't need it, please refer to Dialog.show(options)
     */
    error : function(error, options) {
      return this.show(this.merge({
        title : '错误',
        content : error,
        autoClose : true,
        disposable : true,
        userClass : 'error-dialog',
        actions : [this.CLOSE_ACTION]
      }, options));
    },

    /**
     * params: warning -> text or html
     *         options -> optional, usally we don't need it, please refer to Dialog.show(options)
     */
    warning : function(warning, options) {
      return this.show(this.merge({
        title : '警告',
        content : warning,
        autoClose : true,
        userClass : 'warning-dialog',
        actions : [this.CLOSE_ACTION]
      }, options));
    },

    /**
     * params: message -> text or html
     *         callback -> action handler of 'OK' button
     *         options -> optional, usally we don't need it, please refer to Dialog.show(options)
     */
    confirm : function(message, callback, options) {
      return this.show(this.merge({
        title : '确认',
        content : message,
        autoClose : false,
        actions : [this.CANCEL_ACTION, {
          name : 'OK',
          userClass : 'btn-primary',
          callback : callback
        }]
      }, options));
    },

    merge : function(destOptions, srcOptions) {
      var destActions,
          srcActions,
          destLeftActions,
          srcLeftActions;
      if (srcOptions) {
        destActions = destOptions.actions;
        srcActions = srcOptions.actions;
        destLeftActions = destOptions.leftActions;
        srcLeftActions = srcOptions.leftActions;
        delete destOptions.actions;
        delete destOptions.leftActions;
        $.extend(destOptions, srcOptions);
        if (destActions && srcActions) {
          if (_.isArray(srcActions)) {
            destOptions.actions = srcActions;
          } else {
            destOptions.actions = [];
            $.each(destActions, function(i, destAction) {
              destOptions.actions.push($.extend({}, destAction, srcActions[destAction.name]));
            });
          }
        } else {
          destOptions.actions = destActions;
        }
        if (destLeftActions && srcLeftActions) {
          if (_.isArray(srcLeftActions)) {
            destOptions.leftActions = srcLeftActions;
          } else {
            destOptions.leftActions = [];
            $.each(destLeftActions, function(i, destLeftAction) {
              destOptions.leftActions.push($.extend({}, destLeftAction, srcLeftActions[destLeftAction.name]));
            });
          }
        } else {
          destOptions.leftActions = destLeftActions;
        }
      }
      return destOptions;
    },

    /**
     * params: id -> optional, default is "dialog" +  Date.now()
     *         title -> optional, default is "Dialog"
     *         parent -> optional, default is body element
     *         disposable -> optional, whether to destroy dialog when dialog hidden
     *         content -> text or html
     *         template -> ejs path
     *         control -> type to dialog content
     *         data -> Object, used by template or control
     *         actions -> Array, right bottom actions {
     *           type -> 'button', 'link' or 'separator'
     *           name -> display name of action
     *           userClass -> class of action
     *           dismiss -> boolean, whether to hide dialog
     *           callback -> function to handle action, this object is the dialog self
     *         }
     *         leftActions -> Array, left bottom actions {
     *           type -> 'button', 'link' or 'separator'
     *           name -> display name of action
     *           userClass -> class of action
     *           dismiss -> boolean, whether to hide dialog
     *           callback -> function to handle action, this object is the dialog self
     *         }
     *
     * return: Dialog {
     *           control -> control of dialog
     *           element -> dialog element
     *           dom -> some child elements of dialog
     *         }
     */
    show : function(options) {
      var $parent,
          $dialog,
          dialog,
          modal;
      options = $.extend({
        title : 'Dialog',
        id : "dialog" + Date.now(),
        disposable : true,
        parent : 'body'
      }, options);
      $parent = $(options.parent);
      $parent.append(can.view('/js/libs/mst/dialog.mst', options));
      $dialog = $parent.find('#' + options.id);
      dialog = new Dialog($dialog, options);
      return dialog;
    }
  }, {
    init : function(element, options) {
      var $content = element.find('.modal-body');
      this.dom = {};
      if (options.control) {
        this.control = new options.control($content, options.data ? options.data : {});
      } else if (options.template) {
        can.view(options.template, options.data ? options.data : {}, function(frag) {
          $content.html(frag);
        });
      } else if (options.content) {
        $content.html(options.content);
      }
      this.initActions();
      if (options.disposable) {
        element.on('hidden.bs.modal', function() {
          element.remove();
        });
      }
      element.modal();
    },

    initActions : function() {
      var self = this;
      if (this.options.actions) {
        $.each(this.options.actions, function(index, action) {
          var actionName = action.name ? action.name : action.type ? action.type + index : 'action' + index;
          self.dom[actionName] = self.element.find('.modal-footer .action-item:eq(' + index + ')');
          if (action.callback) {
            self.dom[actionName].click(function(e) {
              action.callback.call(self, $(e.target), e);
            });
          }
        });
      }
    },

    show : function() {
      this.element.modal();
    },

    hide : function() {
      this.element.modal('hide');
    },

    remove : function() {
      this.element.remove();
    }
  });
})();
