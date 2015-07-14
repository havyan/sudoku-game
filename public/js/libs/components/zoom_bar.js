(function() {
  can.Control('ZoomBar', {
  }, {
    init : function(element, options) {
      var self = this;
      var scales = [];
      var steps = Math.round((options.max - options.min) / options.step);
      for (var i = 0; i <= steps; i++) {
        scales.push({
          top : (steps - i) / steps * 100 + '%',
          value : options.min + (i * options.step)
        });
      }
      options.model = new can.Model({
        max : options.max,
        min : options.min,
        step : options.step,
        value : options.value,
        scales : scales
      });
      options.model.bind('value', function(e, value) {
        self.renderValue();
        if (options.callback) {
          options.callback(value);
        }
      });
      this.element.append(can.view('/js/libs/mst/zoom_bar.mst', options.model));
      this.renderValue();
      this.initEvents();
    },

    '.zoom-in-button click' : function() {
      var model = this.options.model;
      var currentIndex = _.findIndex(model.attr('scales'), {
        value : model.attr('value')
      });
      if (currentIndex >= 0 && currentIndex < model.attr('scales').length - 1) {
        model.attr('value', model.attr('scales.' + (currentIndex + 1)).attr('value'));
      }
    },

    '.zoom-out-button click' : function() {
      var model = this.options.model;
      var currentIndex = _.findIndex(model.attr('scales'), {
        value : model.attr('value')
      });
      if (currentIndex > 0 && currentIndex <= model.attr('scales').length - 1) {
        model.attr('value', model.attr('scales.' + (currentIndex - 1)).attr('value'));
      }
    },

    renderValue : function() {
      var model = this.options.model;
      var value = model.attr('value');
      var $marker = this.element.find('.zoom-marker');
      var total = $marker.closest('.zoom-ruler').height();
      var top = ((model.attr('max') - value) / (model.attr('max') - model.attr('min')) * total - ($marker.height() / 2));
      $marker.css('top', top.toFixed(2) + 'px');
      this.element.find('.zoom-value').css('height', (total - top - $marker.height() / 2).toFixed(2) + 'px');
    },

    '.zoom-ruler click' : function(e, event) {
      var $marker = this.element.find('.zoom-marker');
      var top = event.clientY - e.offset().top + $('body').scrollTop();
      this.markerChanged($marker.position().top, top);
    },

    initEvents : function() {
      var self = this;
      var model = this.options.model;
      var $marker = this.element.find('.zoom-marker');
      var $value = this.element.find('.zoom-value');
      $marker.draggable({
        axis : 'y',
        drag : function(event, ui) {
          var markerHeight = $marker.height();
          var rulerHeight = $marker.closest('.zoom-ruler').height();
          var valueHeight = rulerHeight - ui.position.top - markerHeight / 2;
          if (ui.position.top <= -markerHeight) {
            ui.position.top = -markerHeight;
            valueHeight = rulerHeight;
          }
          if (ui.position.top >= rulerHeight) {
            ui.position.top = rulerHeight;
            valueHeight = 0;
          }
          $value.css('height', valueHeight.toFixed(2) + 'px');
        },
        stop : function(event, ui) {
          self.markerChanged(ui.originalPosition.top, ui.position.top);
        }
      });
    },

    markerChanged : function(originalTop, top) {
      var model = this.options.model;
      var $marker = this.element.find('.zoom-marker');
      var markerHeight = $marker.height();
      var value;
      var rulerHeight = $marker.closest('.zoom-ruler').height();
      var valueHeight = rulerHeight - top - markerHeight / 2;
      var steps = Math.round((model.attr('max') - model.attr('min')) / model.attr('step'));
      if (originalTop > top) {
        value = model.attr('min') + Math.floor(valueHeight / rulerHeight * steps) * model.attr('step');
      } else {
        value = model.attr('min') + Math.ceil(valueHeight / rulerHeight * steps) * model.attr('step');
      }
      this.options.model.attr('value', value);
      this.renderValue(value);
    }
  });
})();
