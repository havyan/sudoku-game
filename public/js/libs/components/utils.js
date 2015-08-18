(function() {
  Utils = {
    formatSeconds : function(value) {
      var seconds = Math.round(value % 60);
      seconds = seconds >= 10 ? seconds : '0' + seconds;
      var minutes = Math.round(((value - seconds) / 60) % 60);
      minutes = minutes >= 10 ? minutes : '0' + minutes;
      var hours = Math.round((value - (minutes * 60) - seconds) / (60 * 60));
      hours = hours >= 10 ? hours : '0' + hours;
      return hours + ':' + minutes + ':' + seconds;
    }
  };

  can.mustache.registerHelper('formatSeconds', function(value) {
    return Utils.formatSeconds( typeof value === 'function' ? value() : value);
  });
})();
