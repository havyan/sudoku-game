(function() {
  can.Model('Models.RechargeModel', {
  }, {
    init : function() {
      this.attr('step', 1);
    },

    setStep : function(step) {
      this.attr('step', step);
    },

    next : function() {
      if (this.attr('step') < 4) {
        this.setStep(this.attr('step') + 1);
      }
    }
  });

  can.Control('Components.RechargePanel', {}, {
    init : function(element, options) {
      element.html(can.view('/js/libs/mst/recharge_panel.mst', {}));
      this.paginationModel = new Models.PaginationModel();
      this.paginationBar = new Components.PaginationBar(element.find('.records-pagination-bar'), {
        model : this.paginationModel
      });
    },

    '{model} step' : function(model, e, step) {
      this.element.find('.recharge-step:lt(' + step + ')').addClass('active');
      this.element.find('.recharge-step-component').removeClass('active').filter(':eq(' + (step - 1) + ')').addClass('active');
    },

    '.navigator .item click' : function(e) {
      e.addClass('active').siblings('.item').removeClass('active');
      this.element.find('.recharge-container .item').removeClass('active').filter('.' + e.data('target')).addClass('active');
    },

    '.recharge-steps-actions .next click' : function() {
      this.options.model.next();
    }
  });
})();
