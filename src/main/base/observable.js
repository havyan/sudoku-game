(function() {
  var Observable;

  Observable = (function() {
    var utils;

    utils = {
      is: function(type, value) {
        return Object.prototype.toString.call(value).match(/\s(\w+)/)[1].toLowerCase() === type;
      },
      isPlainObject: function(value) {
        return !!value && utils.is('object', value);
      },
      toArray: function(value) {
        if (utils.is('array', value)) {
          return value;
        } else {
          return [value];
        }
      }
    };

    function Observable(host) {
      var fn, key, _ref;
      if (host == null) {
        host = {};
      }
      host.__observable = {
        lastIds: {},
        events: {},
        ids: [],
        anyFns: []
      };
      _ref = Observable.prototype;
      for (key in _ref) {
        fn = _ref[key];
        host[key] = fn;
      }
      return host;
    }

    Observable.prototype.on = function(topics, fn, once) {
      var id, topic, _base, _base1, _i, _len;
      if (utils.isPlainObject(topics)) {
        once = fn;
        for (topic in topics) {
          fn = topics[topic];
          this.on(topic, fn, once);
        }
      } else {
        topics = utils.toArray(topics);
        this.__observable.ids.length = 0;
        for (_i = 0, _len = topics.length; _i < _len; _i++) {
          topic = topics[_i];
          (_base = this.__observable.lastIds)[topic] || (_base[topic] = 0);
          id = "" + topic + ";" + (++this.__observable.lastIds[topic]);
          if (once) {
            id += ' once';
          }
          this.__observable.ids.push(id);
          (_base1 = this.__observable.events)[topic] || (_base1[topic] = {});
          this.__observable.events[topic][id] = fn;
        }
      }
      return this;
    };

    Observable.prototype.once = function(topics, fn) {
      return this.on(topics, fn, true);
    };

    Observable.prototype.any = function(fn, excludes) {
      this.__observable.anyFns.push({fn:fn, excludes:excludes?excludes:[]});
      return this;
    };

    Observable.prototype.off = function(obj) {
      var id, topic, _i, _len, _ref;
      if (obj === void 0) {
        this.__observable.events = {};
      } else {
        _ref = obj.__observable.ids;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          id = _ref[_i];
          topic = id.substr(0, id.lastIndexOf(';')).split(' ')[0];
          if (obj.__observable.events[topic]) {
            delete obj.__observable.events[topic][id];
          }
        }
      }
      return this;
    };

    Observable.prototype.trigger = function() {
      var fn, id, _ref, topic, args, outArguments;
      if(arguments.length === 1 && Array.isArray(arguments[0])) {
        topic = arguments[0][0];
        args = arguments[0].slice(1, arguments[0].length);
        outArguments = arguments[0];
      } else {
      	topic = arguments[0];
      	args = [];
      	outArguments = arguments;
        if(arguments.length > 1) {
          for(var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
          } 
        }
      }
      _ref = this.__observable.events[topic];
      for (id in _ref) {
        fn = _ref[id];
        fn.apply(null, args);
        if (id.lastIndexOf(' once') === id.length - 1) {
          this.off(id);
        }
      }
      this.__observable.anyFns.forEach(function(anyFn) {
        if(anyFn.excludes.indexOf(topic) < 0){
          anyFn.fn.apply(null, outArguments);
        }
      });
      return this;
    };

    return Observable;

  })();
  
  Observable.general = {
    trigger : function() {
	  (this.$ || this.observable).trigger.apply((this.$ || this.observable), arguments);
    },
    on : function(topic, cb) {
	  (this.$ || this.observable).on(topic, cb);
    },
    any : function(cb) {
	  (this.$ || this.observable).any(cb);
    }
  };

  if (typeof define === 'function' && define.amd) {
    define('observable', [], function() {
      return Observable;
    });
  } else if (typeof exports !== 'undefined') {
    module.exports = Observable;
  } else {
    window.Observable = Observable;
  }

}).call(this);
