(function() {
  can.Model('Models.MessagesModel', {
  }, {
    init : function() {
      this.pageSize = 10;
      this.reset();
    },

    reset : function() {
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
      return Math.ceil(this.attr('total') / this.pageSize) || 1;
    },

    getMessages : function(page) {
      var self = this;
      var total = this.attr('total');
      var cache = this.attr('cache');
      var messages = cache.attr(page);
      if (messages) {
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
    },

    initEvents : function() {
      var self = this;
      this.paginationModel.bind('current', function() {
        self.options.model.getMessages(self.paginationModel.getCurrent());
      });
    },

    '{model} total' : function(model) {
      this.paginationModel.setCount(model.getPageCount());
    }
  });
})();
