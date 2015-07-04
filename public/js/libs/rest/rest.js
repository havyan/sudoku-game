(function() {
  can.Model('Rest.Rule', {
    getRule : function(success, error) {
      return $.ajax({
        type : 'GET',
        url : '/rule',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    updateRule : function(rule, success, error) {
      return $.ajax({
        type : 'PUT',
        url : '/rule',
        data : {
          data : JSON.stringify(rule)
        },
        success : success,
        error : error
      });
    }
  }, {});

  can.Model('Rest.Game', {
    getGame : function(id, success, error) {
      return $.ajax({
        type : 'GET',
        url : '/game/' + id,
        dataType : 'json',
        success : success,
        error : error
      });
    },

    playerJoin : function(id, index, params, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + id + '/player',
        data : {
          index : index,
          params : JSON.stringify(params || {})
        },
        dataType : 'json',
        success : success,
        error : error
      });
    },

    sendMessage : function(gameId, message, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + gameId + '/message',
        data : {
          message : message
        },
        dataType : 'json',
        success : success,
        error : error
      });
    },

    setStatus : function(gameId, status, success, error) {
      return $.ajax({
        type : 'put',
        url : '/game/' + gameId + '/status',
        data : {
          status : status
        },
        dataType : 'json',
        success : success,
        error : error
      });
    },

    submit : function(gameId, xy, value, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + gameId + '/submit',
        data : {
          xy : xy,
          value : value
        },
        dataType : 'json',
        success : success,
        error : error
      });
    },

    autoSubmit : function(gameId, xy, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + gameId + '/auto_submit',
        data : {
          xy : xy
        },
        dataType : 'json',
        success : success,
        error : error
      });
    },

    peep : function(gameId, xy, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + gameId + '/peep',
        data : {
          xy : xy
        },
        dataType : 'json',
        success : success,
        error : error
      });
    },

    impunish : function(gameId, account, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + gameId + '/impunity',
        dataType : 'json',
        data : {
          account : account
        },
        success : success,
        error : error
      });
    },

    goahead : function(gameId, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + gameId + '/goahead',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    quit : function(gameId, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + gameId + '/quit',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    pass : function(gameId, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + gameId + '/pass',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    delay : function(gameId, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + gameId + '/delay',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    useGlasses : function(gameId, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + gameId + '/glasses',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    setOptionsOnce : function(gameId, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + gameId + '/options_once',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    setOptionsAlways : function(gameId, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + gameId + '/options_always',
        dataType : 'json',
        success : success,
        error : error
      });
    }
  }, {});

  can.Model('Rest.Prop', {
    buy : function(type, count, success, error) {
      return $.ajax({
        type : 'post',
        url : '/prop/buy',
        dataType : 'json',
        data : {
          type : type,
          count : count
        },
        success : success,
        error : error
      });
    },

    getPropData : function(success, error) {
      return $.ajax({
        type : 'get',
        url : '/prop/data',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    reset : function(success, error) {
      return $.ajax({
        type : 'post',
        url : '/prop/reset',
        dataType : 'json',
        success : success,
        error : error
      });
    }
  }, {});

  can.Model('Rest.User', {
    resetMoney : function(success, error) {
      return $.ajax({
        type : 'post',
        url : '/user/reset_money',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    setMoney : function(money, success, error) {
      return $.ajax({
        type : 'put',
        url : '/user/money',
        dataType : 'json',
        data : {
          money : money
        },
        success : success,
        error : error
      });
    },

    setPoints : function(points, success, error) {
      return $.ajax({
        type : 'put',
        url : '/user/points',
        dataType : 'json',
        data : {
          points : points
        },
        success : success,
        error : error
      });
    },

    setIcon : function(icon, success, error) {
      return $.ajax({
        type : 'put',
        url : '/user/icon',
        dataType : 'json',
        data : {
          icon : icon
        },
        success : success,
        error : error
      });
    }
  }, {});

  can.Model('Rest.Lobby', {
    getData : function(success, error) {
      return $.ajax({
        type : 'get',
        url : '/lobby/data',
        dataType : 'json',
        success : success,
        error : error
      });
    }
  }, {});
})();
