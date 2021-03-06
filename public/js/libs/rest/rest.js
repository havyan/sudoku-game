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

    getGameStatus : function(id, success, error) {
      return $.ajax({
        type : 'GET',
        url : '/game/' + id + '/status',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    getInitCellValues : function(id, success, error) {
      return $.ajax({
        type : 'GET',
        url : '/game/' + id + '/init_cell_values',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    getUnfinishedGames : function(success, error) {
      return $.ajax({
        type : 'GET',
        url : '/game/unfinished/all',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    restoreGame: function(id, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/restore/' + id,
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

    createSingleGame: function(params, success, error) {
      return $.ajax({
        type : 'post',
        url : '/single_game',
        data : {
          params : JSON.stringify(params || {})
        },
        dataType : 'json',
        success : success,
        error : error
      });
    },

    createTreasureGame: function(params, success, error) {
      return $.ajax({
        type : 'post',
        url : '/treasure_game',
        data : {
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

    useProp: function(gameId, type, params, success, error) {
      return $.ajax({
        type : 'post',
        url : '/game/' + gameId + '/prop/' + type,
        dataType : 'json',
        data : {
          params : JSON.stringify(params || {})
        },
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

    setName : function(name, success, error) {
      return $.ajax({
        type : 'put',
        url : '/user/name',
        dataType : 'json',
        data : {
          name : name
        },
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

    setIcon : function(icon, library, bound, success, error) {
      var formData = new FormData();
      formData.append('icon', icon);
      formData.append('library', library);
      formData.append('bound', JSON.stringify(bound));
      return $.ajax({
        type : 'put',
        url : '/user/icon',
        dataType : 'json',
        data : formData,
        success : success,
        error : error,
        processData : false,
        contentType : false
      });
    },

    resetPassword : function(account, password, key, success, error) {
      return $.ajax({
        type : 'put',
        url : '/user/password',
        dataType : 'json',
        data : {
          account : account,
          password : password,
          key : key
        },
        success : success,
        error : error
      });
    },

    checkAccount : function(account, success, error) {
      return $.ajax({
        type : 'post',
        url : '/user/check_account',
        dataType : 'json',
        data : {
          account : account
        },
        success : success,
        error : error
      });
    },

    checkEmail : function(email, success, error) {
      return $.ajax({
        type : 'post',
        url : '/user/check_email',
        dataType : 'json',
        data : {
          email : email
        },
        success : success,
        error : error
      });
    },

    checkVcode : function(vcode, success, error) {
      return $.ajax({
        type : 'post',
        url : '/user/check_vcode',
        dataType : 'json',
        data : {
          vcode : vcode
        },
        success : success,
        error : error
      });
    },

    getVcode : function(success, error) {
      return $.ajax({
        type : 'get',
        url : '/user/vcode',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    sendResetMail : function(email, success, error) {
      return $.ajax({
        type : 'post',
        url : '/user/reset_mail',
        dataType : 'json',
        data : {
          email : email
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

  can.Model('Rest.Message', {
    getMessages : function(start, size, success, error) {
      return $.ajax({
        type : 'get',
        url : '/messages',
        dataType : 'json',
        data : {
          start : start,
          size : size
        },
        success : success,
        error : error
      });
    },

    getTotal : function(success, error) {
      return $.ajax({
        type : 'get',
        url : '/messages/total',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    getUnreadCount : function(success, error) {
      return $.ajax({
        type : 'get',
        url : '/messages/unread/count',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    removeInbox : function(ids, success, error) {
      return $.ajax({
        type : 'delete',
        url : '/messages/inbox',
        dataType : 'json',
        data : {
          ids : JSON.stringify(ids)
        },
        success : success,
        error : error
      });
    },

    read : function(id, success, error) {
      return $.ajax({
        type : 'get',
        url : '/message/' + id,
        dataType : 'json',
        success : success,
        error : error
      });
    }
  }, {});

  can.Model('Rest.Recharge', {
    getData : function(success, error) {
      return $.ajax({
        type : 'get',
        url : '/recharge/data',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    create : function(data, success, error) {
      return $.ajax({
        type : 'post',
        url : '/recharge',
        data : {
          data : JSON.stringify(data)
        },
        dataType : 'json',
        success : success,
        error : error
      });
    },

    getTotal : function(success, error) {
      return $.ajax({
        type : 'get',
        url : '/recharge/records/total',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    getRecords : function(start, size, success, error) {
      return $.ajax({
        type : 'get',
        url : '/recharge/records',
        dataType : 'json',
        data : {
          start : start,
          size : size
        },
        success : success,
        error : error
      });
    },

    getPayStatus : function(payuid, success, error) {
      return $.ajax({
        type : 'get',
        url : '/recharge/pay/' + payuid + '/status',
        dataType : 'json',
        success : success,
        error : error
      });
    }
  }, {});

  can.Model('Rest.Events', {
    getSystem : function(success, error) {
      return $.ajax({
        type : 'get',
        url : '/events/system',
        dataType : 'json',
        success : success,
        error : error
      });
    },

    getGame : function(success, error) {
      return $.ajax({
        type : 'get',
        url : '/events/game',
        dataType : 'json',
        success : success,
        error : error
      });
    }
  }, {});

  can.Model('Rest.Feedback', {
    createFeedback : function(content, success, error) {
      return $.ajax({
        type : 'post',
        url : '/feedback',
        data : {
          content : content
        },
        dataType : 'json',
        success : success,
        error : error
      });
    }
  }, {});
})();
