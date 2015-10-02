(function() {
  can.Model('Models.MessagesModel', {
  }, {
    init : function() {
      this.pageSize = 10;
    },

    reload : function() {
      this.attr('cache', {});
      this.getTotal();
      this.getMessages(1);
    },

    getTotal : function() {
      var self = this;
      Rest.Message.getTotal(function(result) {
        self.attr('total', result.total);
      }, function() {
      });
    },

    getPageCount : function() {
      return Math.ceil(this.attr('total') / this.pageSize);
    },

    select : function(id) {
      var message = _.find(this.attr('messages'), {
        _id : id
      });
      if (message) {
        message.attr("selected", true);
      }
    },

    deselect : function(id) {
      var message = _.find(this.attr('messages'), {
        _id : id
      });
      if (message) {
        message.attr("selected", false);
      }
    },

    selectAll : function(id) {
      var messages = this.attr('messages');
      messages.forEach(function(message) {
        message.attr("selected", true);
      });
    },

    deselectAll : function(id) {
      var messages = this.attr('messages');
      messages.forEach(function(message) {
        message.attr("selected", false);
      });
    },

    removeIndex : function(success, error) {
      var self = this;
      var ids = _.filter(this.attr('messages'), {
        selected : true
      }).map(function(message) {
        return message.attr('_id');
      });
      if (ids.length > 0) {
        Rest.Message.removeInbox(ids, function() {
          self.reload();
          if (success) {
            success();
          }
        }, error);
      }
    },

    getMessages : function(page) {
      var self = this;
      var total = this.attr('total');
      var cache = this.attr('cache');
      var messages = cache.attr(page);
      if (messages) {
        messages.forEach(function(message) {
          message.attr('selected', false);
        });
        this.attr('messages', messages);
      } else {
        var pageSize = this.pageSize;
        var start = pageSize * (page - 1);
        var size = (start + pageSize) > total ? total - start : pageSize;
        Rest.Message.getMessages(start, size, function(result) {
          cache.attr(page, result);
          self.attr('messages', result);
        }, function() {
        });
      }
    }
  });

  can.Control('Components.MessagesPanel', {}, {
    init : function(element, options) {
      element.html(can.view('/js/libs/mst/messages_panel.mst', this.options.model));
      this.paginationModel = new Models.PaginationModel();
      this.paginationBar = new Components.PaginationBar(element.find('.messages-pagination-bar'), {
        model : this.paginationModel
      });
      this.initEvents();
      this.options.model.reload();
    },

    initEvents : function() {
      var self = this;
      this.paginationModel.bind('current', function() {
        self.options.model.getMessages(self.paginationModel.getCurrent());
        self.element.find('.select-all').removeAttr('checked');
      });
    },

    '{model} total' : function(model) {
      this.paginationModel.setCount(model.getPageCount());
    },

    '.select-one click' : function(element) {
      var id = element.closest('tr').data('id');
      if (element.is(':checked')) {
        this.options.model.select(id);
      } else {
        this.options.model.deselect(id);
      }
    },

    '.select-all click' : function(element) {
      if (element.is(':checked')) {
        this.options.model.selectAll();
      } else {
        this.options.model.deselectAll();
      }
    },

    '.messages-remove click' : function() {
      this.options.model.removeIndex(function() {
        Dialog.message('删除成功！');
      });
    }
  });
})();
