var _ = require('lodash');
var winston = require('winston');
var async = require('async');
var Observable = require('../base/observable');
var Rule = require('./rule');
var User = require('./user');
var Prop = require('./prop');
var Puzzle = require('./puzzle');
var GameMode = require('./game_mode');
var WAITING = "waiting";
var LOADING = "loading";
var ONGOING = "ongoing";
var DESTROYED = "destroyed";
var OVER = "over";
var PREFIX = "game";
var CAPACITY = 9;
var COUNTDOWN_TOTAL = 5;
var QUIT_COUNTDOWN_TOTAL = 20;
var DELAY_COUNTDOWN_TOTAL = 60;
var DESTROY_COUNTDOWN_TOTAL = 120;
var MAX_TIMEOUT_ROUNDS = 10;

var SCORE_TYPE = {
  INCORRECT : "incorrect",
  CORRECT : "correct",
  TIMEOUT : "timeout",
  PASS : "pass",
  IMPUNITY : "impunity"
};

var Game = function(mode) {
  this.$ = new Observable();
  this.id = PREFIX + Date.now();
  this.players = [];
  this.quitPlayers = [];
  this.messages = [];
  this.status = WAITING;
  this.delayed = false;
  this.mode = mode || GameMode.MODE9;
  this.initCellValues = {};
  this.userCellValues = {};
  this.knownCellValues = {};
  this.scores = {};
  this.timeoutCounter = {};
  this.timeoutTimer = {};
  this.props = [];
  this.optionsOnce = {};
  this.results = [];
  this.optionsAlways = {};
  this.changedScores = {};
  this.playerTimer = {
    ellapsedTime : 0
  };
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

Game.prototype.setStatus = function(account, status) {
  var oldStatus = this.status;
  this.status = status;
  this.trigger('status-changed', status, oldStatus);
  var self = this;
  if (oldStatus === WAITING && status === LOADING) {
    var player = self.findPlayer(account);
    Puzzle.findRandomOneByLevel(Puzzle.LEVELS[parseInt(player.grade)], function(error, puzzle) {
      if (error) {
        // TODO handle error.
        winston.error(error);
      } else {
        puzzleJson = puzzle.toJSON();
        self.initCellValues = puzzleJson.question;
        self.answer = puzzleJson.answer;
        self.trigger('puzzle-init', self.initCellValues);
        var countdown = COUNTDOWN_TOTAL;
        var countDownTimer = setInterval(function() {
          if (countdown >= 0) {
            self.trigger('countdown-stage', countdown);
            countdown--;
          } else {
            clearInterval(countDownTimer);
            setTimeout(function() {
              self.start();
            }, 5000);
            self.status = ONGOING;
            self.trigger('status-changed', self.status, status);
          }
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
    var playerIndex = _.findIndex(this.players, function(player) {
      return player.account === self.currentPlayer;
    });
    self.optionsOnce[this.currentPlayer] = false;
    this.currentPlayer = this.players[++playerIndex % this.players.length].account;
  } else {
    this.currentPlayer = this.players[0].account;
  }
  this.trigger('switch-player', this.currentPlayer);
  setTimeout(function() {
    self.playerTimer = {
      ellapsedTime : 0
    };
    self.trigger('ellapsed-time', self.playerTimer.ellapsedTime);
    self.playerTimer.timer = setInterval(function() {
      if (!self.playerTimer.stopped && !self.delayed) {
        self.playerTimer.ellapsedTime++;
        self.trigger('ellapsed-time', self.playerTimer.ellapsedTime);
        if (self.playerTimer.ellapsedTime === self.rule.score.add.total) {
          var currentPlayer = self.currentPlayer;
          self.stopPlayerTimer();
          self.updateScore(SCORE_TYPE.TIMEOUT);
          if (self.timeoutCounter[currentPlayer] === undefined) {
            self.timeoutCounter[currentPlayer] = 0;
          }
          self.timeoutCounter[currentPlayer]++;
          if (self.timeoutCounter[currentPlayer] >= MAX_TIMEOUT_ROUNDS) {
            self.trigger('max-timeout-reached', currentPlayer);
            var countdown = QUIT_COUNTDOWN_TOTAL;
            self.timeoutTimer[currentPlayer] = setInterval(function() {
              countdown--;
              if (countdown > 0) {
                self.trigger('quit-countdown-stage', currentPlayer, countdown);
              } else {
                clearInterval(self.timeoutTimer[currentPlayer]);
                self.playerQuit(currentPlayer, function(error) {
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
    score = -(rule.reduce.timeout);
  } else if (type === SCORE_TYPE.PASS) {
    score = -(rule.reduce.pass);
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
    this.trigger('score-changed', account, this.changedScores[account]);
  }
  return score;
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
  this.trigger('game-delay-cancelled');
};

Game.prototype.playerJoin = function(account, cb) {
  var self = this;
  User.findOneByAccount(account, function(error, user) {
    if (error) {
      cb(error);
    } else {
      self.players.push(user);
      self.knownCellValues[user.account] = {};
      Prop.findOneByAccount(account, function(error, prop) {
        if (error) {
          cb(error);
        } else {
          self.props.push(prop);
          self.trigger('player-joined', user.toJSON());
          cb(null, user);
        }
      });
    }
  });
};

Game.prototype.playerQuit = function(account, cb) {
  var self = this;
  if (this.players.length > 1) {
    if (this.currentPlayer === account) {
      this.nextPlayer();
    }
  } else {
    this.stopPlayerTimer();
  }

  if (this.isOngoing()) {
    var quitPlayer = _.find(this.players, {
      account : account
    });
    quitPlayer.rounds = quitPlayer.rounds + 1;
    quitPlayer.points = quitPlayer.points + 100 * (this.results.length + 1);
    quitPlayer.save(function(error) {
      if (error) {
        cb(error);
      } else {
        self.quitPlayers.unshift(quitPlayer);
        self.results.unshift(self.createResult(quitPlayer, 'quit'));
        self.removePlayer(account);
        self.trigger('player-quit', account);
        if (self.players.length <= 0) {
          self.destroy();
        }
        cb();
      }
    });
  } else {
    this.removePlayer(account);
    this.trigger('player-quit', account);
    if (self.players.length <= 0) {
      self.destroy();
    }
    cb();
  }
};

Game.prototype.createResult = function(player, status) {
  return {
    playerName : player.name,
    score : status === 'quit' ? '离线' : this.scores[player.account],
    status : status,
    points : player.points,
    money : player.money
  };
};

Game.prototype.removePlayer = function(account) {
  _.remove(this.players, function(player) {
    return player.account === account;
  });
  _.remove(this.props, function(prop) {
    return prop.account === account;
  });
  delete this.knownCellValues[account];
  delete this.timeoutCounter[account];
  delete this.timeoutTimer[account];
  delete this.changedScores[account];
};

Game.prototype.addMessage = function(account, message, cb) {
  var self = this;
  User.findOneByAccount(account, function(error, user) {
    if (error) {
      cb(error);
    } else {
      var convert = function(value) {
        return value >= 10 ? value : '0' + value;
      };
      var now = new Date(),
          year = now.getFullYear(),
          month = convert(now.getMonth() + 1),
          date = convert(now.getDate()),
          hours = convert(now.getHours()),
          minutes = convert(now.getMinutes()),
          seconds = convert(now.getSeconds());
      message = {
        from : user.name,
        date : year + '/' + month + '/' + date + ' ' + hours + ':' + minutes + ':' + seconds,
        content : message
      };
      self.messages.push(message);
      self.trigger('message-added', message);
      cb(null, message);
    }
  });
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
  return this.players.length >= CAPACITY;
};

Game.prototype.toJSON = function(account) {
  return {
    id : this.id,
    mode : this.mode,
    rule : this.rule,
    initCellValues : this.initCellValues,
    userCellValues : this.userCellValues,
    players : this.players.map(function(player) {
      return player.toJSON({
        virtuals : true
      });
    }),
    quitPlayers : this.quitPlayers.map(function(player) {
      return player.toJSON({
        virtuals : true
      });
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
    remainingTime : this.rule.score.add.total - this.playerTimer.ellapsedTime,
    optionsOnce : account ? this.optionsOnce[account] ? true : false : this.optionsOnce,
    optionsAlways : account ? this.optionsAlways[account] ? true : false : this.optionsAlways
  };
};

Game.prototype.findPlayer = function(account) {
  return _.find(this.players, function(player) {
    return player.account === account;
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
      this.trigger('cell-correct', xy, value);
      result.score = this.updateScore(SCORE_TYPE.CORRECT, this.currentPlayer, xy);
      over = this.checkOver();
      result.success = true;
    } else {
      this.trigger('cell-incorrect', xy);
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

Game.prototype.over = function(cb) {
  var self = this;
  this.stopPlayerTimer();
  this.players.sort(function(source, dest) {
    var sourceScore = self.scores[source.account] ? self.scores[source.account] : 0;
    var destScore = self.scores[dest.account] ? self.scores[dest.account] : 0;
    return sourceScore - destScore;
  });
  var index = 0;
  async.eachSeries(this.players, function(player, cb) {
    player.points = player.points + 100 * (self.results.length + 1);
    player.rounds = player.rounds + 1;
    if (index === self.players.length - 1) {
      player.wintimes = player.wintimes + 1;
    }
    player.save(function(error) {
      if (error) {
        cb(error);
      } else {
        self.results.unshift(self.createResult(player, 'normal'));
        index++;
        cb();
      }
    });
  }, function(error) {
    if (error) {
      cb(error);
    } else {
      self.status = OVER;
      self.results.forEach(function(result, index) {
        result.rank = index + 1;
      });
      self.trigger('game-over', self.results);
      var countdown = DESTROY_COUNTDOWN_TOTAL;
      self.trigger('destroy-countdown-stage', countdown);
      var destroyTimer = setInterval(function() {
        countdown--;
        self.trigger('destroy-countdown-stage', countdown);
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
            self.trigger('magnifier-changed', prop.magnifier);
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
      self.trigger('delay-countdown-stage', countdown);
      self.trigger('game-delayed', countdown);
      self.delayTimer = setInterval(function() {
        countdown--;
        self.delayCountdownStage = countdown;
        self.trigger('delay-countdown-stage', countdown);
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

Game.prototype.init = function(cb) {
  var self = this;
  Rule.getRule(function(error, rule) {
    if (error) {
      cb(error);
    } else {
      var ruleJSON = rule.toJSON();
      ruleJSON.score.add = _.find(ruleJSON.score.add, function(e) {
        return e.selected;
      });
      self.rule = ruleJSON;
      cb();
    }
  });
};

Game.prototype.destroy = function() {
  this.stopPlayerTimer();
  this.status = DESTROYED;
  this.trigger('game-destroyed');
};

_.merge(Game.prototype, Observable.general);

module.exports = Game;
