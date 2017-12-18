(function() {
  Date.prototype.format = function(fmt) {//author: meizz
    var o = {
      "M+" : this.getMonth() + 1,
      "d+" : this.getDate(),
      "h+" : this.getHours(),
      "m+" : this.getMinutes(),
      "s+" : this.getSeconds(),
      "q+" : Math.floor((this.getMonth() + 3) / 3),
      "S" : this.getMilliseconds()
    };
    if (/(y+)/.test(fmt))
      fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
  };

  window.Utils = {
    formatSeconds : function(value) {
      if (value <= 0) {
        return '00:00:00';
      }
      var seconds = Math.round(value % 60);
      seconds = seconds >= 10 ? seconds : '0' + seconds;
      var minutes = Math.round(((value - seconds) / 60) % 60);
      minutes = minutes >= 10 ? minutes : '0' + minutes;
      var hours = Math.round((value - (minutes * 60) - seconds) / (60 * 60));
      hours = hours >= 10 ? hours : '0' + hours;
      return hours + ':' + minutes + ':' + seconds;
    },

    isIntKey : function(keyCode) {
      return (keyCode > 47 && keyCode < 58) || (keyCode > 95 && keyCode < 106) || keyCode === 8 || keyCode === 37 || keyCode === 39 || keyCode === 46;
    }
  };

  can.mustache.registerHelper('formatSeconds', function(value) {
    return Utils.formatSeconds( typeof value === 'function' ? value() : value);
  });

  can.mustache.registerHelper('formatDate', function(value) {
    var format = "yyyy年MM月dd日 hh:mm:ss";
    return typeof value === 'function' ? value().format(format) : value.format(format);
  });

  can.mustache.registerHelper('isEmpty', function(data, options) {
    if ( typeof data === 'function') {
      data = data();
    }
    if (_.isEmpty(data)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  can.mustache.registerHelper('isSingle', function(data, options) {
    if ( typeof data === 'function') {
      data = data();
    }
    if (data && data.length === 1) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });
})();
