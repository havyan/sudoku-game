var _ = require('lodash');
var winston = require('winston');
var async = require('async');
var dateFormat = require('dateformat');
var util = require("util");
var EventEmitter = require('events').EventEmitter;
var RuleDAO = require('../daos/rule');
var UserDAO = require('../daos/user');
var PropDAO = require('../daos/prop');
var PropTypeDAO = require('../daos/prop_type');
var PuzzleDAO = require('../daos/puzzle');
var GameMode = require('./game_mode');
var Message = require('./message');
var Template = require('./template');
var Award = require('./award');
var EMPTY = "empty";
var WAITING = "waiting";
var LOADING = "loading";
var ONGOING = "ongoing";
var ABORTED = "aborted";
var DESTROYED = "destroyed";
var OVER = "over";
var PREFIX = "game";
var CAPACITY = 4;
var DEFAULT_LEVEL = 'DDD';
var DEFAULT_WAIT_TIME = 5;
var GAME_TIMEOUT = 10;
var COUNTDOWN_TOTAL = 5;
var QUIT_COUNTDOWN_TOTAL = 20;
var DELAY_COUNTDOWN_TOTAL = 60;
var DESTROY_COUNTDOWN_TOTAL = 120;
var MAX_TIMEOUT_ROUNDS = 10;
var START_MODE = {
  MANUAL : 'manual',
  AUTO : 'auto'
};

var SCORE_TYPE = {
  INCORRECT : "incorrect",
  CORRECT : "correct",
  TIMEOUT : "timeout",
  PASS : "pass",
  IMPUNITY : "impunity"
};

var Game = function(room, index, mode) {
  EventEmitter.call(this);
  this.room = room;
  this.id = room.id + '-' + index + '-' + Date.now();
  this.mode = mode || GameMode.MODE9;
  this.status = EMPTY;
  this.players = new Array(CAPACITY);
};
util.inherits(Game, EventEmitter);

Game.prototype.init = function(account, params, cb) {
  var self = this;
  var level = params.level || DEFAULT_LEVEL;
  async.waterfall([
  function(cb) {
    UserDAO.findOneByAccount(account, cb);
  },
  function(user, cb) {
    var money = user.money;
    var cost = _.findIndex(PuzzleDAO.LEVELS, {
      code : level
    }) * 100;
    if (money < cost) {
      cb('You don not have enough money, please recharge');
    } else {
      self.cost = cost;
      user.money = money - cost;
      user.save(cb);
    }
  },
  function(user, count, cb) {
    PropTypeDAO.all(cb);
  },
  function(propTypes, cb) {
    self.propTypes = propTypes.map(function(propType) {
      return propType.toJSON();
    });
    RuleDAO.getRule(cb);
  },
  function(rule, cb) {
    var add = rule.score.add;
    rule.score.add = _.find(add, function(e) {
      return e.total === params.stepTime;
    });
    if (!rule.score.add) {
      rule.score.add = _.find(add, function(e) {
        return e.selected;
      });
    }
    self.rule = rule;
    self.initParams(params);
    self.emit('init', self.toSimpleJSON());
    self.timer = setInterval(function() {
      self.remainingTime--;
      self.emit('total-countdown-stage', self.remainingTime);
      if (self.remainingTime <= 0) {
        self.stopTimer();
        self.over(function(error) {
          if (error) {
            winston.error(error);
          }
        });
      }
    }, 1000);
    var countdown = self.waitTime * 60;
    var countDownTimer = setInterval(function() {
      if (self.isWaiting()) {
        if (countdown >= 0) {
          self.emit('wait-countdown-stage', countdown);
          countdown--;
        } else {
          clearInterval(countDownTimer);
          self.abort();
        }
      } else {
        clearInterval(countDownTimer);
      }
    }, 1000);
    cb();
  }], cb);
};

Game.prototype.initParams = function(params) {
  this.capacity = params.capacity || CAPACITY;
  this.duration = params.duration || GAME_TIMEOUT;
  this.remainingTime = this.duration * 3600;
  this.waitTime = params.waitTime || DEFAULT_WAIT_TIME;
  this.level = params.level || DEFAULT_LEVEL;
  this.startMode = params.startMode || START_MODE.MANUAL;
  this.quitPlayers = [];
  this.messages = [];
  this.status = WAITING;
  this.delayed = false;
  this.initCellValues = {};
  this.userCellValues = {};
  this.knownCellValues = {};
  this.scores = {};
  this.timeoutCounter = {};
  this.timeoutTimer = {};
  this.props = [];
  this.optionsOnce = {};
  this.glassesUsed = {};
  this.results = [];
  this.optionsAlways = {};
  this.changedScores = {};
  this.playerTimer = {
    ellapsedTime : 0
  };
  this.buildPlayerIndex();
};

Game.prototype.buildPlayerIndex = function() {
  var playerIndex = {};
  var i = 0;
  this.players.forEach(function(player) {
    if (player) {
      playerIndex[player.account] = i;
      i++;
    }
  });
  this.playerIndex = playerIndex;
};

Game.prototype.addPlayerIndex = function(account) {
  if (this.playerIndex[account] === undefined) {
    var indexes = _.values(this.playerIndex);
    this.playerIndex[account] = indexes.length > 0 ? _.max(indexes) + 1 : 0;
  }
};

Game.prototype.isEmpty = function() {
  return this.status === EMPTY;
};

Game.prototype.isWaiting = function() {
  return this.status === WAITING;
};

Game.prototype.isOngoing = function() {
  return this.status === ONGOING;
};

Game.prototype.isOver = function() {
  return this.status === OVER || this.status === DESTROYED;
};

Game.prototype.setStatus = function(status) {
  var oldStatus = this.status;
  this.status = status;
  this.emit('status-changed', status, oldStatus);
  var self = this;
  if (oldStatus === WAITING && status === LOADING) {
    PuzzleDAO.findRandomOneByLevel(this.level, function(error, puzzle) {
      if (error) {
        winston.error(error);
      } else {
        puzzleJson = puzzle.toJSON();
        self.initCellValues = puzzleJson.question;
        self.answer = puzzleJson.answer;
        self.emit('puzzle-init', self.initCellValues);
        setTimeout(function() {
          var countdown = COUNTDOWN_TOTAL;
          var countDownTimer = setInterval(function() {
            if (countdown >= 0) {
              self.emit('countdown-stage', countdown);
              countdown--;
            } else {
              clearInterval(countDownTimer);
              setTimeout(function() {
                self.start();
              }, 2000);
              self.status = ONGOING;
              self.emit('status-changed', self.status, status);
            }
          }, 1000);
        }, 1000);
      }
    });
  }
};

Game.prototype.goahead = function(account) {
  if (this.timeoutTimer[account]) {
    clearInterval(this.timeoutTimer[account]);
    this.timeoutCounter[account] = 0;
  }
};

Game.prototype.start = function() {
  this.nextPlayer();
};

Game.prototype.nextPlayer = function() {
  var self = this;
  this.stopPlayerTimer();
  if (this.currentPlayer) {
    var currentIndex = _.findIndex(this.players, function(player) {
      return player && player.account === self.currentPlayer;
    });
    self.optionsOnce[this.currentPlayer] = false;
    self.glassesUsed[this.currentPlayer] = false;
    var nextIndex = (currentIndex + 1) % this.players.length;
    while (!this.players[nextIndex] && nextIndex !== currentIndex) {
      nextIndex = (nextIndex + 1) % this.players.length;
    }
    this.currentPlayer = this.players[nextIndex].account;
  } else {
    this.currentPlayer = this.players[0].account;
  }
  this.emit('switch-player', this.currentPlayer);
  setTimeout(function() {
    self.playerTimer = {
      ellapsedTime : 0
    };
    self.emit('player-ellapsed-time', self.playerTimer.ellapsedTime);
    self.playerTimer.timer = setInterval(function() {
      if (!self.playerTimer.stopped && !self.delayed) {
        self.playerTimer.ellapsedTime++;
        self.emit('player-ellapsed-time', self.playerTimer.ellapsedTime);
        if (self.playerTimer.ellapsedTime === self.rule.score.add.total) {
          var currentPlayer = self.currentPlayer;
          self.stopPlayerTimer();
          self.updateScore(SCORE_TYPE.TIMEOUT);
          if (self.timeoutCounter[currentPlayer] === undefined) {
            self.timeoutCounter[currentPlayer] = 0;
          }
          self.timeoutCounter[currentPlayer]++;
          if (self.timeoutCounter[currentPlayer] >= MAX_TIMEOUT_ROUNDS) {
            self.emit('max-timeout-reached', currentPlayer);
            var countdown = QUIT_COUNTDOWN_TOTAL;
            self.timeoutTimer[currentPlayer] = setInterval(function() {
              countdown--;
              if (countdown > 0) {
                self.emit('quit-countdown-stage', currentPlayer, countdown);
              } else {
                clearInterval(self.timeoutTimer[currentPlayer]);
                self.playerQuit(currentPlayer, 'offline', function(error) {
                  if (error) {
                    winston.error('Error happen when player quit for timeout: ' + error);
                  }
                });
              }
            }, 1000);
          }
          self.nextPlayer();
        }
      }
    }, 1000);
  }, 1000);
};

Game.prototype.updateScore = function(type, account, xy) {
  var rule = this.rule,
      score = 0;
  if (!account) {
    account = this.currentPlayer;
  }
  if (type === SCORE_TYPE.CORRECT) {
    var time = this.playerTimer.ellapsedTime;
    score = _.find(rule.score.add.levels, function(level) {
      return time >= level.from && time < level.to;
    }).score;
  } else if (type === SCORE_TYPE.INCORRECT || type === SCORE_TYPE.TIMEOUT) {
    score = -(rule.score.reduce.timeout);
  } else if (type === SCORE_TYPE.PASS) {
    score = -(rule.score.reduce.pass);
  } else if (type === SCORE_TYPE.IMPUNITY) {
    if (this.changedScores[account] && this.changedScores[account].changed < 0) {
      score = -this.changedScores[account].changed;
    }
  }
  if (score !== 0) {
    var oldScore = this.scores[account] || 0;
    this.scores[account] = oldScore + score;
    this.changedScores[account] = {
      score : this.scores[account],
      changed : score,
      type : type,
      xy : xy
    };
    this.emit('score-changed', account, this.changedScores[account]);
  }
  return score;
};

Game.prototype.stopTimer = function() {
  if (this.timer) {
    clearInterval(this.timer);
  }
  this.stopPlayerTimer();
};

Game.prototype.stopPlayerTimer = function() {
  if (this.playerTimer) {
    this.stopDelayTimer();
    this.playerTimer.stopped = true;
    if (this.playerTimer.timer) {
      clearInterval(this.playerTimer.timer);
    }
  }
};

Game.prototype.stopDelayTimer = function() {
  this.delayed = false;
  if (this.delayTimer) {
    clearInterval(this.delayTimer);
  }
  this.emit('game-delay-cancelled');
};

Game.prototype.playerJoin = function(account, index, cb) {
  var self = this;
  if (this.isFull()) {
    cb('Game is full, please join another game.');
  } else {
    if (index < 0 || index > this.players.length - 1) {
      cb('Index ' + index + ' is not valid');
    } else {
      UserDAO.findOneByAccount(account, function(error, user) {
        if (error) {
          cb(error);
        } else {
          self.players[index] = user;
          self.addPlayerIndex(account);
          self.knownCellValues[user.account] = {};
          PropDAO.findOneByAccount(account, function(error, prop) {
            if (error) {
              cb(error);
            } else {
              self.props.push(prop);
              self.emit('player-joined', index, user.toJSON());
              self.addMessage('用户[' + user.name + ']加入');
              if (self.startMode === START_MODE.AUTO && self.playersCount() === self.capacity) {
                self.setStatus(LOADING);
              }
              cb(null, {
                status : 'ok',
                gameId : self.id
              });
            }
          });
        }
      });
    }
  }
};

Game.prototype.playerQuit = function(account, status, cb) {
  var self = this;
  var quitPlayer = this.findPlayer(account);
  if (this.playersCount() > 1) {
    if (this.currentPlayer === account && this.isOngoing()) {
      this.nextPlayer();
    }
  } else {
    this.stopPlayerTimer();
  }
  if (quitPlayer) {
    if (this.isOngoing()) {
      quitPlayer.rounds = quitPlayer.rounds + 1;
      quitPlayer.points = quitPlayer.points + 100 * (this.results.length + 1);
      var ceilingIndex = _.findIndex(this.rule.grade, function(e) {
        return e.floor > quitPlayer.points;
      });
      var oldGrade = quitPlayer.grade;
      quitPlayer.grade = this.rule.grade[ceilingIndex - 1].code;
      async.waterfall([
      function(cb) {
        quitPlayer.save(cb);
      },
      function(quitPlayer, count, cb) {
        if (parseInt(quitPlayer.grade) > parseInt(oldGrade)) {
          Award.perform('upgrade-to-' + quitPlayer.grade, quitPlayer.account, cb);
        } else {
          cb(null);
        }
      }], function(error, awardResult) {
        if (error) {
          cb(error);
        } else {
          self.quitPlayers.unshift(quitPlayer);
          self.results.unshift(self.createResult(quitPlayer, status, awardResult));
          self.removePlayer(account);
          self.emit('player-quit', {
            account : account,
            status : status
          });
          self.addMessage('用户[' + quitPlayer.name + ']' + (status === 'quit' ? '退出' : '离线'));
          if (self.playersCount() <= 0) {
            self.destroy();
          }
          cb();
        }
      });
    } else {
      this.removePlayer(account);
      this.emit('player-quit', {
        account : account,
        status : status
      });
      self.addMessage('用户[' + quitPlayer.name + ']退出');
      if (self.playersCount() <= 0) {
        self.destroy();
      }
      cb();
    }
  } else {
    cb();
  }
};

Game.prototype.playersCount = function() {
  return _.compact(this.players).length;
};

Game.prototype.createResult = function(player, status, awardResult) {
  return {
    account: player.account,
    playerName : player.name,
    score : status === 'quit' ? '退出' : status === 'offline' ? '离线' : this.scores[player.account] || 0,
    status : status,
    points : player.points,
    money : player.money,
    awardResult : awardResult
  };
};

Game.prototype.removePlayer = function(account) {
  var index = _.findIndex(this.players, function(player) {
    return player && player.account === account;
  });
  if (index >= 0) {
    this.players[index] = null;
  }
  _.remove(this.props, function(prop) {
    return prop.account === account;
  });
  delete this.knownCellValues[account];
  delete this.timeoutCounter[account];
  clearInterval(this.timeoutTimer[account]);
  delete this.timeoutTimer[account];
  delete this.changedScores[account];
};

Game.prototype.addMessage = function(message, account) {
  var from;
  if (account) {
    var player = this.findPlayer(account);
    from = {
      account : player.account,
      name : player.name,
      index : this.playerIndex[player.account]
    };
  } else {
    from = {
      account : 'system',
      name : '系统',
      index : 'system'
    };
  }
  message = {
    from : from,
    date : dateFormat(new Date(), 'yyyy/mm/dd hh:MM:ss'),
    content : message
  };
  this.messages.push(message);
  this.emit('message-added', message);
  return message;
};

Game.prototype.checkOver = function() {
  var over = true;
  for (xy in this.answer) {
    over = over && ((this.userCellValues[xy] || this.initCellValues[xy]) === this.answer[xy]);
    if (!over) {
      break;
    }
  }
  return over;
};

Game.prototype.isFull = function() {
  return this.playersCount() === this.capacity;
};

Game.prototype.toJSON = function(account) {
  return this.status === EMPTY ? {
    roomId : this.room.id,
    id : this.id,
    mode : this.mode,
    status : this.status,
    players : this.players.map(function(player) {
      return player ? player.toJSON() : null;
    })
  } : {
    roomId : this.room.id,
    id : this.id,
    mode : this.mode,
    waitTime : this.waitTime,
    startMode : this.startMode,
    duration : this.duration,
    remainingTime : this.remainingTime,
    capacity : this.capacity,
    level : this.level,
    rule : this.rule,
    propTypes : this.propTypes,
    initCellValues : this.initCellValues,
    userCellValues : this.userCellValues,
    players : this.players.map(function(player) {
      return player ? player.toJSON() : null;
    }),
    quitPlayers : this.quitPlayers.map(function(player) {
      return player.toJSON();
    }),
    currentPlayer : this.currentPlayer,
    messages : this.messages,
    scores : this.scores,
    status : this.status,
    delayed : this.delayed,
    delayCountdownStage : this.delayCountdownStage,
    account : account ? account : undefined,
    prop : account ? _.find(this.props, {
      account : account
    }) : this.props.map(function(prop) {
      return prop.toJSON();
    }),
    knownCellValues : account ? this.knownCellValues[account] : this.knownCellValues,
    changedScore : account ? this.changedScores[account] : this.changedScores,
    playerRemainingTime : this.rule.score.add.total - this.playerTimer.ellapsedTime,
    glassesUsed : account ? this.glassesUsed[account] ? true : false : this.glassesUsed,
    optionsOnce : account ? this.optionsOnce[account] ? true : false : this.optionsOnce,
    optionsAlways : account ? this.optionsAlways[account] ? true : false : this.optionsAlways
  };
};

Game.prototype.toSimpleJSON = function() {
  var self = this;
  return this.status === EMPTY ? {
    roomId : this.room.id,
    id : this.id,
    mode : _.findKey(GameMode, function(value) {
      return value === self.mode;
    }),
    status : this.status,
    players : this.players.map(function(player) {
      return player ? player.toJSON() : null;
    })
  } : {
    roomId : this.room.id,
    id : this.id,
    stepTime : this.rule.score.add.total,
    startMode : this.startMode,
    duration : this.duration,
    remainingTime : this.remainingTime,
    capacity : this.capacity,
    level : this.level,
    mode : _.findKey(GameMode, function(value) {
      return value === self.mode;
    }),
    players : this.players.map(function(player) {
      return player ? player.toJSON() : null;
    }),
    currentPlayer : this.currentPlayer,
    status : this.status,
  };
};

Game.prototype.findPlayer = function(account) {
  return _.find(this.players, function(player) {
    return player && player.account === account;
  });
};

Game.prototype.submit = function(account, xy, value, cb) {
  this.timeoutCounter[account] = 0;
  if (account === this.currentPlayer) {
    value = parseInt(value);
    this.stopPlayerTimer();
    var result = {};
    var over = false;
    if (this.answer[xy] === value) {
      this.userCellValues[xy] = value;
      for (key in this.knownCellValues) {
        delete this.knownCellValues[key][xy];
      }
      this.emit('cell-correct', xy, value);
      result.score = this.updateScore(SCORE_TYPE.CORRECT, this.currentPlayer, xy);
      over = this.checkOver();
      result.success = true;
    } else {
      this.emit('cell-incorrect', xy);
      result.score = this.updateScore(SCORE_TYPE.INCORRECT, this.currentPlayer, xy);
      result.success = false;
    }
    if (over) {
      result.over = true;
      this.over(function(error) {
        if (error) {
          cb(error);
        } else {
          cb(null, result);
        }
      });
    } else {
      this.nextPlayer();
      cb(null, result);
    }
  } else {
    cb('You do not have permission now');
  }
};

Game.prototype.abort = function() {
  var self = this;
  var banker = this.players[0];
  banker.money = banker.money + this.cost;
  banker.save(function(error) {
    if (error) {
      winston.error(error);
    } else {
      async.eachSeries(self.players, function(player, cb) {
        if (player && player.account) {
          self.playerQuit(player.account, 'quit', cb);
        }
      }, function() {
        self.status = ABORTED;
        self.emit('game-abort');
        setTimeout(function() {
          self.destroy();
        }, 5000);
      });
    }
  });
};

Game.prototype.over = function(cb) {
  var self = this;
  var players = _.compact(this.players);
  this.stopTimer();
  players.sort(function(source, dest) {
    var sourceScore = self.scores[source.account] ? self.scores[source.account] : 0;
    var destScore = self.scores[dest.account] ? self.scores[dest.account] : 0;
    return sourceScore - destScore;
  });
  async.waterfall([
  function(cb) {
    var index = 0;
    async.eachSeries(players, function(player, cb) {
      player.points = player.points + 100 * (self.results.length + 1);
      var ceilingIndex = _.findIndex(self.rule.grade, function(e) {
        return e.floor > player.points;
      });
      var oldGrade = player.grade;
      player.grade = self.rule.grade[ceilingIndex - 1].code;
      player.rounds = player.rounds + 1;
      if (index === players - 1) {
        player.wintimes = player.wintimes + 1;
      }
      async.waterfall([
      function(cb) {
        player.save(cb);
      },
      function(player, count, cb) {
        if (parseInt(player.grade) > parseInt(oldGrade)) {
          Award.perform('upgrade-to-' + player.grade, player.account, cb);
        } else {
          cb(null);
        }
      }], function(error, awardResult) {
        if (error) {
          cb(error);
        } else {
          self.results.unshift(self.createResult(player, 'normal', awardResult));
          index++;
          cb();
        }
      });
    }, cb);
  },
  function(cb) {
    self.results.forEach(function(result, index) {
      result.rank = index + 1;
    });
    Template.generate('game_results', {
      results : self.results
    }, cb);
  },
  function(content, cb) {
    Message.sendFromSystem(_.pluck(players, 'id'), '最新战报', content, cb);
  }], function(error) {
    if (error) {
      cb(error);
    } else {
      var oldStatus = self.status;
      self.status = OVER;
      self.emit('status-changed', self.status, oldStatus);
      self.emit('game-over', self.results);
      var countdown = DESTROY_COUNTDOWN_TOTAL;
      self.emit('destroy-countdown-stage', countdown);
      var destroyTimer = setInterval(function() {
        countdown--;
        self.emit('destroy-countdown-stage', countdown);
        if (countdown === 0) {
          clearInterval(destroyTimer);
          self.destroy();
        }
      }, 1000);
      cb();
    }
  });
};

Game.prototype.autoSubmit = function(account, xy, cb) {
  var self = this;
  this.timeoutCounter[account] = 0;
  var prop = _.find(this.props, {
    account : account
  });
  var magnifier = prop.magnifier;
  if (magnifier > 0) {
    var value = this.answer[xy];
    this.submit(account, xy, value, function(error, result) {
      if (error) {
        cb(error);
      } else {
        prop.magnifier = magnifier - 1;
        prop.save(function(error) {
          if (error) {
            winston.error('Error when updating prop: ' + error);
            cb(error);
          } else {
            self.emit('magnifier-changed', prop.magnifier);
            cb(null, result);
          }
        });
      }
    });
  } else {
    cb('You do not have enough magnifiers');
  }
};

Game.prototype.impunish = function(account, cb) {
  this.timeoutCounter[account] = 0;
  var prop = _.find(this.props, {
    account : account
  });
  var impunity = prop.impunity;
  if (impunity > 0) {
    prop.impunity = impunity - 1;
    this.updateScore(SCORE_TYPE.IMPUNITY, account);
    prop.save(function(error) {
      if (error) {
        winston.error('Error when updating prop: ' + error);
        cb(error);
      } else {
        cb(null);
      }
    });
  } else {
    cb('You do not have enough impunities');
  }
};

Game.prototype.peep = function(account, xy, cb) {
  this.timeoutCounter[account] = 0;
  var self = this;
  var prop = _.find(this.props, {
    account : account
  });
  var magnifier = prop.magnifier;
  if (magnifier > 0) {
    this.knownCellValues[account][xy] = this.answer[xy];
    prop.magnifier == magnifier - 1;
    prop.save(function(error) {
      if (error) {
        winston.error('Error when updating prop: ' + error);
        cb(error);
      } else {
        cb(null, self.knownCellValues[account][xy]);
      }
    });
  } else {
    cb('You do not have enough magnifiers');
  }
};

Game.prototype.pass = function(account, cb) {
  this.timeoutCounter[account] = 0;
  if (account === this.currentPlayer) {
    this.stopPlayerTimer();
    var score = this.updateScore(SCORE_TYPE.PASS);
    this.nextPlayer();
    cb(null, {
      success : true,
      score : score
    });
  } else {
    cb('You do not have permission now');
  }
};

Game.prototype.delay = function(account, cb) {
  var self = this;
  this.timeoutCounter[account] = 0;
  this.stopDelayTimer();
  if (account === this.currentPlayer) {
    var prop = _.find(this.props, {
      account : account
    });
    var delay = prop.delay;
    if (delay > 0) {
      this.delayed = true;
      prop.delay = delay - 1;
      var countdown = DELAY_COUNTDOWN_TOTAL;
      self.delayCountdownStage = countdown;
      self.emit('delay-countdown-stage', countdown);
      self.emit('game-delayed', countdown);
      self.delayTimer = setInterval(function() {
        countdown--;
        self.delayCountdownStage = countdown;
        self.emit('delay-countdown-stage', countdown);
        if (countdown === 0) {
          self.stopDelayTimer();
        }
      }, 1000);
      prop.save(function(error) {
        if (error) {
          winston.error('Error when updating prop: ' + error);
          cb(error);
        } else {
          cb();
        }
      });
    } else {
      cb('You do not have enough delay cards');
    }
  } else {
    cb('You do not have permission now');
  }
};

Game.prototype.useGlasses = function(account, cb) {
  var self = this;
  if (account !== this.currentPlayer) {
    var prop = _.find(this.props, {
      account : account
    });
    var glasses = prop.glasses;
    if (glasses > 0) {
      prop.glasses = glasses - 1;
      prop.save(function(error) {
        if (error) {
          winston.error('Error when updating prop: ' + error);
          cb(error);
        } else {
          self.glassesUsed[account] = true;
          cb();
        }
      });
    } else {
      cb('You do not have enough cards');
    }
  } else {
    cb('You do not have permission now');
  }
};

Game.prototype.setOptionsOnce = function(account, cb) {
  var self = this;
  if (account === this.currentPlayer) {
    var prop = _.find(this.props, {
      account : account
    });
    var options_once = prop.options_once;
    if (options_once > 0) {
      prop.options_once = options_once - 1;
      prop.save(function(error) {
        if (error) {
          winston.error('Error when updating prop: ' + error);
          cb(error);
        } else {
          self.optionsOnce[account] = true;
          cb();
        }
      });
    } else {
      cb('You do not have enough cards');
    }
  } else {
    cb('You do not have permission now');
  }
};

Game.prototype.setOptionsAlways = function(account, cb) {
  var self = this;
  if (self.optionsAlways[account]) {
    cb('You have already used this type of card, only one time is allowed during one game.');
  } else {
    var prop = _.find(this.props, {
      account : account
    });
    var options_always = prop.options_always;
    if (options_always > 0) {
      prop.options_always = options_always - 1;
      prop.save(function(error) {
        if (error) {
          winston.error('Error when updating prop: ' + error);
          cb(error);
        } else {
          self.optionsAlways[account] = true;
          cb();
        }
      });
    } else {
      cb('You do not have enough cards');
    }
  }
};

Game.prototype.destroy = function() {
  this.stopTimer();
  this.status = DESTROYED;
  winston.info('Game [' + this.id + '] destoryed');
  this.emit('game-destroyed');
};

module.exports = Game;
