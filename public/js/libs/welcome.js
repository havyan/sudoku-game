(function() {
  $(document).ready(function() {
    $('.law-btn').click(function(e) {
      Agreement.showLaw();
    });
    
    $('.parents-btn').click(function() {
      Agreement.showParentsDetail();
    });
  });
})();
