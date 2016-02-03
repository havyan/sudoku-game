(function() {
  can.Model('Models.PaginationModel', {
  }, {
    init : function() {
      this.attr('count', this.attr('count') || 0);
      this.reset();
      this.initEvents();
    },

    initEvents : function() {
      var self = this;
      this.bind('current', function() {
        self.resetPages();
      });
    },

    setCount : function(count) {
      this.attr('count', count);
      this.reset();
    },

    reset : function() {
      var start = this.attr('count') > 0 ? 1 : 0;
      this.attr('start', start);
      this.attr('current', start);
      this.resetPages();
    },

    setEditable : function(editable) {
      this.attr('editable', editable);
    },

    resetPages : function() {
      var pages = [];
      var total = 11;
      var count = this.attr('count');
      var current = this.attr('current');
      if (count <= total) {
        for (var i = 1; i <= count; i++) {
          pages.push({
            type : 'page',
            selected : i === current,
            value : i
          });
        }
      } else {
        if (current <= 5) {
          for (var i = 1; i <= Math.max(5, current + 3); i++) {
            pages.push({
              type : 'page',
              selected : i === current,
              value : i
            });
          }
          pages.push({
            type : 'ellipsis',
            value : '...'
          });
          for (var i = count - (total - pages.length - 1); i <= count; i++) {
            pages.push({
              type : 'page',
              selected : i === current,
              value : i
            });
          }
        } else if (current >= count - 4) {
          for (var i = Math.min(count - 4, current - 3); i <= count; i++) {
            pages.push({
              type : 'page',
              selected : i === current,
              value : i
            });
          }
          pages.unshift({
            type : 'ellipsis',
            value : '...'
          });
          for (var i = total - pages.length; i >= 1; i--) {
            pages.unshift({
              type : 'page',
              selected : i === current,
              value : i
            });
          }
        } else {
          for (var i = current - 3; i <= current + 3; i++) {
            pages.push({
              type : 'page',
              selected : i === current,
              value : i
            });
          }
          pages.unshift({
            type : 'ellipsis',
            value : '...'
          });
          pages.unshift({
            type : 'page',
            value : 1
          });
          pages.push({
            type : 'ellipsis',
            value : '...'
          });
          pages.push({
            type : 'page',
            value : count
          });
        }
      }
      this.attr('pages', pages);
    },

    setCurrent : function(current) {
      this.attr('current', current);
    },

    getCurrent : function() {
      return this.attr('current');
    },

    previous : function() {
      var current = this.attr('current');
      if (current > 1) {
        this.setCurrent(current - 1);
      }
    },

    next : function() {
      var current = this.attr('current');
      if (current < this.attr('count')) {
        this.setCurrent(current + 1);
      }
    },

    first : function() {
      this.attr('current', this.attr('start'));
    },

    last : function() {
      this.attr('current', this.attr('count'));
    }
  });

  can.Control('Components.PaginationBar', {
  }, {
    init : function(element, options) {
      can.view('/js/libs/mst/pagination_bar.mst', options.model, function(frag) {
        element.append(frag);
      });
    },

    '.current click' : function() {
      this.options.model.setEditable(true);
      this.element.find('.edit-goto').focus().val(this.options.model.attr('current'));
    },

    '.edit-goto blur' : function() {
      this.options.model.setEditable(false);
    },

    '.previous,.previous-arrow click' : function() {
      this.options.model.previous();
    },

    '.next,.next-arrow click' : function() {
      this.options.model.next();
    },

    '.first click' : function() {
      this.options.model.first();
    },

    '.last click' : function() {
      this.options.model.last();
    },

    '.page-item.page click' : function(element) {
      var page = element.data('page');
      this.options.model.setCurrent(page);
    },

    '.goto click' : function() {
      var page = parseInt(this.element.find('.edit-goto').val());
      this.options.model.setCurrent(page);
    }
  });
})();
