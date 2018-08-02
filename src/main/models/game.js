var _ = require('lodash');
var winston = require('winston');
var mongoose = require('mongoose');
var Async = require('async');
var dateFormat = require('dateformat');
var util = require("util");
var EventEmitter = require('events').EventEmitter;
var RuleDAO = require('../daos/rule');
var UserDAO = require('../daos/user');
var PropDAO = require('../daos/prop');
var GameDAO = require('../daos/game');
var PropTypeDAO = require('../daos/prop_type');
var PuzzleDAO = require('../daos/puzzle');
var JoinRecordDAO = require('../daos/join_record');
var PointsRecordDAO = require('../daos/points_record');
var User = require('./user');
var Prop = require('./prop');
var Guest = require('./guest');

var Timer = require('./timer');
var GameWaitTask = require('./tasks/game_wait');
var GameCountdownTask = require('./tasks/game_countdown');
var GameTotalTask = require('./tasks/game_total');
var GameDestroyTask = require('./tasks/game_destroy');
var GamePlayerTask = require('./tasks/game_player');
var GameDelayTask = require('./tasks/game_delay');
var PlayerQuitTask = require('./tasks/player_quit');

var PropFactory = require('./props/prop_factory');

var OptionsCalculator = require('./options_calculator');
var GameMode = require('./game_mode');
var Message = require('./message');
var Template = require('./template');
var Award = require('./award');
var Robot = require('./robot');
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
var MAX_TIMEOUT_ROUNDS = 1;
var START_MODE = {
  MANUAL: 'manual',
  AUTO: 'auto'
};

var PLAY_MODE = {
  MULTI: 'multi',
  SINGLE: 'single',
  ROBOT: 'robot'
};

var SCORE_TYPE = {
  INCORRECT: "incorrect",
  CORRECT: "correct",
  TIMEOUT: "timeout",
  PASS: "pass",
  IMPUNITY: "impunity"
};

var Game = function(room, index, mode, playMode, creator) {
  EventEmitter.call(this);
  this.room = room || {};
  this.index = index;
  this.id = mongoose.Types.ObjectId().toString();
  this.mode = mode || GameMode.MODE9;
  this.playMode = playMode || PLAY_MODE.MULTI;
  this.creator = creator || 'SYSTEM';
  this.status = EMPTY;
  this.players = new Array(CAPACITY);
  this.joinRecords = [];
};
util.inherits(Game, EventEmitter);

Game.restore = function(room, index, entity, cb) {
  // players, joinRecords, propTypes, timer, entity, quitPlayers
  // messages (retrieve), initCellValues, props, answer, allCellOptions,
  // quitTasks,
  var game = new Game(room, index, entity.mode, entity.playMode, entity.creator);
  game.id = entity._id.toString();
  Object.assign(game, pickEntityAttrs(entity));
  if (index != null) {
    game.index = index;
  }
  game.entity = entity;
  game.propFactory = PropFactory.create(game);
  var retrievePlayers = function(name, service, cb) {
    Async.map(entity[name], function(e, cb) {
      if (e) {
        if (Robot.isRobot(e)) {
          cb(null, new Robot(game, e));
        } else {
          service(e, cb);
        }
      } else {
        cb(null, null);
      }
    }, function(error, results) {
      if (error) {
        cb(error);
      } else {
        game[name] = results;
        cb();
      }
    });
  };
  Async.waterfall([
    function(cb) {
      retrievePlayers('players', User.findOneByAccount.bind(User), cb);
    },
    function(cb) {
      Async.map(_.compact(entity.players), Prop.findOneByAccount.bind(Prop), cb);
    },
    function(results, cb) {
      game.props = _.compact(results);
      cb();
    },
    function(cb) {
      retrievePlayers('quitPlayers', User.findOneByAccount.bind(User), cb);
    },
    function(cb) {
      Async.map(_.compact(entity.joinRecords), JoinRecordDAO.findOneById.bind(JoinRecordDAO), cb);
    },
    function(joinRecords, cb) {
      game.joinRecords = joinRecords;
      cb();
    },
    function(cb) {
      PropTypeDAO.all(cb);
    },
    function(propTypes, cb) {
      game.propTypes = propTypes.map(function(propType) {
        return propType.toJSON();
      });
      cb();
    },
    function(cb) {
      PuzzleDAO.findOneById(game.puzzle, cb);
    },
    function(puzzle, cb) {
      game.initCellValues = puzzle.question;
      game.answer = puzzle.answer;
      if (game.isRobot()) {
        game.allCellOptions = new OptionsCalculator(game).calcAllCellOptions();
      }
      game.initTimer();
      game.nextPlayer();
      cb(null, game);
    }
  ], cb);
};

Game.prototype.init = function(account, params, cb) {
  var self = this;
  var creator;
  var level = params.level || DEFAULT_LEVEL;
  this.creator = account;
  this.initTimer();
  this.propFactory = PropFactory.create(this);
  Async.waterfall([
    function(cb) {
      User.findOneByAccount(account, cb);
    },
    function(user, cb) {
      creator = user;
      self.cost = 0;
      if (user.isGuest) {
        cb(null, user, 0);
      } else {
        var money = user.money;
        var cost = _.findIndex(PuzzleDAO.LEVELS, {
          code: level
        }) * 100;
        if (money < cost) {
          cb('You don not have enough money, please recharge');
        } else {
          self.cost = cost;
          user.money = money - cost;
          user.save(cb);
        }
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
      self.waitCountdown = self.waitTime * 60;
      self.timer.schedule(self.waitTask);
      self.createEntity(creator.isGuest ? null : account, cb);
    },
    function(entity, cb) {
      self.entity = entity;
      cb();
    }
  ], cb);
};

Game.prototype.initTimer = function() {
  this.timer = new Timer();
  this.timer.start();
  this.waitTask = new GameWaitTask(this);
  this.countdownTask = new GameCountdownTask(this);
  this.totalTask = new GameTotalTask(this);
  this.destroyTask = new GameDestroyTask(this);
  this.playerTask = new GamePlayerTask(this);
  this.playerTask.stop();
  this.timer.schedule(this.playerTask);
  this.delayTask = new GameDelayTask(this);
  this.delayTask.stop();
  this.timer.schedule(this.delayTask);
  this.quitTasks = {};
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
  this.cellValueOwners = {};
  this.knownCellValues = {};
  this.scores = {};
  this.timeoutCounter = {};
  this.props = [];
  this.optionsOnce = {};
  this.glassesUsed = {};
  this.results = [];
  this.optionsAlways = {};
  this.changedScores = {};
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

Game.prototype.isSingle = function() {
  return this.playMode === PLAY_MODE.SINGLE;
};

Game.prototype.isRobot = function() {
  return this.playMode === PLAY_MODE.ROBOT;
};



Game.prototype.switchStatus = function(status, cb) {
  var oldStatus = this.status;
  this.setStatus(status);
  if (oldStatus === WAITING && status === LOADING) {
    this.start(cb);
  } else {
    cb(null, {
      status: 'ok',
      gameId: this.id
    });
  }
};

Game.prototype.setOngoingStatus = function(status) {
  this.setStatus(ONGOING);
};

Game.prototype.setStatus = function(status) {
  var oldStatus = this.status;
  this.status = status;
  this.emit('status-changed', status, oldStatus);
};

Game.prototype.prepare = function(cb) {
  var self = this;
  Async.waterfall([
    function(cb) {
      self.entity.update({
        real_wait_time: self.waitTime * 60 - self.waitCountdown
      }, cb);
    },
    function(result, cb) {
      PuzzleDAO.findRandomOneByLevel(self.level, cb);
    },
    function(puzzle, cb) {
      self.puzzle = puzzle._id.toString();
      self.initCellValues = puzzle.question;
      self.answer = puzzle.answer;
      if (self.isRobot()) {
        self.allCellOptions = new OptionsCalculator(self).calcAllCellOptions();
      }
      self.emit('puzzle-init', self.initCellValues);
      cb();
    }
  ], cb);
};

Game.prototype.start = function(cb) {
  var self = this;
  Async.waterfall([
    function(cb) {
      self.prepare(cb);
    },
    function(cb) {
      setTimeout(cb, 2000);
    },
    function(cb) {
      self.timer.schedule(self.countdownTask);
      cb(null, {
        status: 'ok',
        gameId: self.id
      });
    }
  ], cb);
};

Game.prototype.goahead = function(account) {
  if (this.quitTasks[account]) {
    this.quitTasks[account].stop();
    this.timeoutCounter[account] = 0;
  }
};

Game.prototype.nextPlayer = function() {
  var self = this;
  if (this.isSingle()) {
    if (!this.currentPlayer) {
      this.currentPlayer = this.players[0].account;
      this.emit('switch-player', this.currentPlayer);
    }
    return;
  }
  this.stopPlayerTask();
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
  this.restartPlayerTask();

  var player = this.findPlayer(this.currentPlayer);
  if (player && player.isRobot) {
    setTimeout(function() {
      player.submit();
    }, 2000);
  }
};

Game.prototype.restartPlayerTask = function() {
  this.playerTask.restart();
};

Game.prototype.startPlayerQuitTask = function(player) {
  var task = this.quitTasks[player];
  if (task == null) {
    task = new PlayerQuitTask(this, player);
    this.quitTasks[player] = task;
    this.timer.schedule(task);
  }
  task.restart();
};

Game.prototype.updateScore = function(type, account, xy) {
  var rule = this.rule,
    single = this.isSingle(),
    score = 0,
    player;
  if (!account) {
    account = this.currentPlayer;
  }
  player = this.findPlayer(account);
  if (type === SCORE_TYPE.CORRECT) {
    if (single) {
      score = rule.score.single.correct;
    } else if (player && player.isRobot) {
      score = 150; //TODO
    } else {
      var time = this.playerTask.ellapsed;
      score = _.find(rule.score.add.levels, function(level) {
        return time >= level.from && time < level.to;
      }).score;
    }
  } else if (type === SCORE_TYPE.INCORRECT || type === SCORE_TYPE.TIMEOUT) {
    score = -(single ? rule.score.single.incorrect : rule.score.reduce.timeout);
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
      score: this.scores[account],
      changed: score,
      type: type,
      xy: xy
    };
    this.emit('score-changed', account, this.changedScores[account]);
  }
  return score;
};

Game.prototype.stopTimer = function() {
  if (this.timer) {
    this.timer.stop();
  }
  this.stopPlayerTask();
};

Game.prototype.stopPlayerTask = function() {
  this.playerTask.stop();
  this.stopDelayTask();
};

Game.prototype.stopDelayTask = function() {
  this.delayed = false;
  this.delayTask.stop();
  this.emit('game-delay-cancelled');
};

Game.prototype.playerJoin = function(account, index, cb) {
  var self = this;
  var player;
  if (this.isFull()) {
    cb('Game is full, please join another game.');
    return;
  }
  if (index < 0 || index > this.players.length - 1) {
    cb('Index ' + index + ' is not valid');
    return;
  }
  Async.waterfall([
    function(cb) {
      User.findOneByAccount(account, cb)
    },
    function(user, cb) {
      player = user;
      self.players[index] = player;
      self.addPlayerIndex(account);
      self.knownCellValues[player.account] = {};
      JoinRecordDAO.createRecord(account, self.id, cb);
    },
    function(joinRecord, cb) {
      self.joinRecords.push(joinRecord);
      Prop.findOneByAccount(account, cb);
    },
    function(prop, cb) {
      self.props.push(prop);
      self.emit('player-joined', index, player.toJSON());
      self.addMessage(L('app:game.join_message', { name: player.name }));
      if (self.startMode === START_MODE.AUTO && self.playersCount() === self.capacity) {
        self.switchStatus(LOADING, cb);
      } else {
        cb(null, {
          status: 'ok',
          gameId: self.id
        });
      }
    }
  ], cb);
};

Game.prototype.addRobot = function() {
  var player = new Robot(this);
  var index = _.findIndex(this.players, function(p) {
    return !p;
  });
  this.players[index] = player;
  this.addPlayerIndex(player.account);
  this.knownCellValues[player.account] = {};
  this.emit('player-joined', index, player.toJSON());
  this.addMessage(L('app:game.join_message', { name: player.name }));
};

Game.prototype.playerQuit = function(account, status, cb) {
  var self = this;
  var robotLeft = false;
  var quitPlayer = this.findPlayer(account);
  if (this.playersCount() > 1) {
    robotLeft = _.every(this.players, function(player) {
      return player == null || player === quitPlayer || player.isRobot;
    });
    if (robotLeft) {
      this.stopPlayerTask();
    } else if (this.currentPlayer === account && this.isOngoing()) {
      this.nextPlayer();
    }
  } else {
    this.stopPlayerTask();
  }
  if (quitPlayer) {
    if (robotLeft) {
      this.updateEntity();
      this.removePlayer(account);
      this.emit('player-quit', {
        account: account,
        status: status
      });
      self.addMessage(L('app:game.robot_game_over'));
      self.destroy();
      cb();
    } else if (this.isOngoing()) {
      Async.waterfall([
        function(cb) {
          self.upgradePlayer(quitPlayer, status, 0, false, cb);
        },
        function(cb) {
          self.updateEntity();
          self.quitPlayers.unshift(quitPlayer);
          self.removePlayer(account);
          self.emit('player-quit', {
            account: account,
            status: status
          });
          var message = status === 'quit' ? L('app:game.quit_message', { name: quitPlayer.name }) : L('app:game.offline_message', { name: quitPlayer.name });
          self.addMessage(message);
          if (self.playersCount() <= 0) {
            self.destroy();
          }
          cb();
        }
      ], cb);
    } else if (quitPlayer === this.players[0]) {
      this.updateEntity();
      this.removePlayer(account);
      this.emit('player-quit', {
        account: account,
        status: status
      });
      self.addMessage(L('app:game.banker_quit_message', { name: quitPlayer.name }));
      this.players.forEach(function(player) {
        if (player) {
          self.recordQuit(player.account);
        }
      });
      self.destroy('banker-quit');
      cb();
    } else {
      this.updateEntity();
      this.removePlayer(account);
      this.emit('player-quit', {
        account: account,
        status: status
      });
      self.addMessage(L('app:game.quit_message', { name: quitPlayer.name }));
      if (self.playersCount() <= 0) {
        self.destroy();
      }
      cb();
    }
    this.recordQuit(account);
  } else {
    cb();
  }
};

Game.prototype.recordQuit = function(account) {
  var joinRecord = _.find(this.joinRecords, {
    account: account
  });
  if (joinRecord) {
    joinRecord.update({
      quit_time: Date.now()
    }, function(error) {
      if (error) {
        winston.error("Write quite time to record error: " + error);
      }
    });
  }
}

Game.prototype.playersCount = function() {
  return _.compact(this.players).length;
};

Game.prototype.createResult = function(player, status, gainPoints, awardResult) {
  PointsRecordDAO.createRecord(player.account, this.id, gainPoints, player.points, function(error) {
    if (error) {
      winston.error("Create points error: " + error);
    }
  });
  return {
    account: player.account,
    playerName: player.name,
    score: status === 'quit' ? '退出' : status === 'offline' ? '离线' : this.scores[player.account] || 0,
    gainPoints: gainPoints,
    status: status,
    points: player.points,
    money: player.money,
    awardResult: awardResult
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
  if (this.quitTasks[account]) {
    this.quitTasks[account].stop();
  }
  delete this.changedScores[account];
  this.expireGuest(account);
};

Game.prototype.expireGuest = function(account) {
  if (Guest.isGuest(account)) {
    global.expiredGuests.push(account);
  }
};

Game.prototype.addMessage = function(message, account) {
  var from;
  if (account) {
    var player = this.findPlayer(account);
    from = {
      account: player.account,
      name: player.name,
      index: this.playerIndex[player.account]
    };
  } else {
    from = {
      account: 'system',
      name: L('common:system'),
      index: 'system'
    };
  }
  message = {
    from: from,
    date: dateFormat(new Date(), 'yyyy/mm/dd hh:MM:ss'),
    content: message
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
    roomId: this.room.id,
    id: this.id,
    mode: this.mode,
    playMode: this.playMode,
    creator: this.creator,
    status: this.status,
    players: this.players.map(function(player) {
      return player ? player.toJSON() : null;
    })
  } : {
    roomId: this.room.id,
    id: this.id,
    mode: this.mode,
    playMode: this.playMode,
    creator: this.creator,
    waitTime: this.waitTime,
    startMode: this.startMode,
    duration: this.duration,
    remainingTime: this.remainingTime,
    capacity: this.capacity,
    level: this.level,
    rule: this.rule,
    propTypes: this.propTypes,
    initCellValues: this.initCellValues,
    userCellValues: this.userCellValues,
    cellValueOwners: this.cellValueOwners,
    players: this.players.map(function(player) {
      return player ? player.toJSON() : null;
    }),
    quitPlayers: this.quitPlayers.map(function(player) {
      return player.toJSON();
    }),
    currentPlayer: this.currentPlayer,
    messages: this.messages,
    scores: this.scores,
    status: this.status,
    delayed: this.delayed,
    delayCountdown: this.delayCountdown,
    account: account ? account : undefined,
    prop: account ? _.find(this.props, {
      account: account
    }) : this.props.map(function(prop) {
      return prop.toJSON();
    }),
    knownCellValues: account ? this.knownCellValues[account] : this.knownCellValues,
    changedScore: account ? this.changedScores[account] : this.changedScores,
    playerRemainingTime: this.rule.score.add.total - this.playerTask.ellapsed,
    glassesUsed: account ? this.glassesUsed[account] ? true : false : this.glassesUsed,
    optionsOnce: account ? this.optionsOnce[account] ? true : false : this.optionsOnce,
    optionsAlways: account ? this.optionsAlways[account] ? true : false : this.optionsAlways
  };
};

Game.prototype.toSimpleJSON = function() {
  var self = this;
  return this.status === EMPTY ? {
    roomId: this.room.id,
    id: this.id,
    mode: _.findKey(GameMode, function(value) {
      return value === self.mode;
    }),
    playMode: self.playMode,
    creator: self.creator,
    status: this.status,
    players: this.players.map(function(player) {
      return player ? player.toJSON() : null;
    })
  } : {
    roomId: this.room.id,
    id: this.id,
    stepTime: this.rule.score.add.total,
    startMode: this.startMode,
    duration: this.duration,
    remainingTime: this.remainingTime,
    capacity: this.capacity,
    level: this.level,
    mode: _.findKey(GameMode, function(value) {
      return value === self.mode;
    }),
    playMode: self.playMode,
    creator: self.creator,
    players: this.players.map(function(player) {
      return player ? player.toJSON() : null;
    }),
    currentPlayer: this.currentPlayer,
    status: this.status,
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
    this.stopPlayerTask();
    var result = {};
    var over = false;
    if (this.answer[xy] === value) {
      this.userCellValues[xy] = value;
      this.cellValueOwners[xy] = account;
      for (key in this.knownCellValues) {
        delete this.knownCellValues[key][xy];
      }
      if (this.isRobot()) {
        new OptionsCalculator(this).resetAllCellOptions(xy, value);
      }
      this.emit('cell-correct', xy, {
        player: account,
        value: value,
      });
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
  Async.waterfall([
    function(cb) {
      if (banker.isGuest) {
        cb(null, banker, 0);
      } else {
        banker.money = banker.money + self.cost;
        banker.save(cb);
      }
    },
    function(user, count, cb) {
      self.entity.money_returned = true;
      self.entity.return_time = Date.now();
      self.entity.save(cb);
    }
  ], function(error) {
    if (error) {
      winston.error(error);
    } else {
      Async.eachSeries(self.players, function(player, cb) {
        if (player && player.account) {
          self.playerQuit(player.account, 'quit', cb);
        }
      }, function(error) {
        if (error) {
          winston.error('Error when player quiting: ' + error);
        }
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
  var done = function(error) {
    if (error) {
      cb(error);
    } else {
      var oldStatus = self.status;
      self.status = OVER;
      self.emit('status-changed', self.status, oldStatus);
      self.emit('game-over', self.results);
      self.timer.schedule(self.destroyTask);
      cb();
    }
  };
  var players = _.filter(this.players, function(player) {
    return player && !player.isRobot && !player.isGuest;
  });
  players.sort(function(source, dest) {
    var sourceScore = self.scores[source.account] ? self.scores[source.account] : 0;
    var destScore = self.scores[dest.account] ? self.scores[dest.account] : 0;
    return sourceScore - destScore;
  });
  var gains = this.calculateGains(players);
  Async.waterfall([
    function(cb) {
      Async.eachSeries(players, function(player, cb) {
        var win = (player === _.last(players));
        self.recordQuit(player.account);
        self.upgradePlayer(player, 'normal', gains[player.account], win, cb);
      }, cb);
    },
    function(cb) {
      self.results.forEach(function(result, index) {
        result.rank = index + 1;
      });
      Template.generate('game_results', {
        results: self.results
      }, cb);
    },
    function(content, cb) {
      Message.sendFromSystem(_.map(players, 'id'), '最新战报', content, cb);
    }
  ], done);
};

Game.prototype.calculateGains = function(players) {
  var gains = {};
  var single = this.isSingle();
  var robot = this.isRobot();
  var score, points;
  for (var i = players.length - 1; i >= 0; i--) {
    var account = players[i].account;
    if (this.scores[account] === score) {
      gains[account] = points;
    } else {
      gains[account] = 100 * (this.results.length + i + 1);
      if (single && this.scores[account] <= 0) {
        gains[account] = 0;
      }
      if (robot) {
        if (this.scores[account] > 0) {
          var robots = _.filter(this.players, {
            isRobot: true
          });
          var win = _.every(robots, function(r) {
            return this.scores[r.account] < this.scores[account];
          }.bind(this));
          gains[account] = win ? 100 : 50;
        } else {
          gains[account] = 0;
        }
      }
      points = gains[account];
      score = this.scores[account];
    }
  }
  return gains;
};

Game.prototype.upgradePlayer = function(player, status, gainPoints, win, cb) {
  if (player.isRobot || player.isGuest) {
    cb();
    return;
  }

  var self = this;
  player.points = player.points + gainPoints;
  var ceilingIndex = _.findIndex(self.rule.grade, function(e) {
    return e.floor > player.points;
  });
  var oldGrade = player.grade;
  if (ceilingIndex > 1 && self.rule.grade[ceilingIndex - 1]) {
    player.grade = self.rule.grade[ceilingIndex - 1].code;
  }
  player.rounds = player.rounds + 1;
  if (win) {
    player.wintimes = player.wintimes + 1;
  }
  Async.waterfall([
    function(cb) {
      player.save(cb);
    },
    function(player, count, cb) {
      if (parseInt(player.grade) > parseInt(oldGrade)) {
        Award.perform('upgrade-to-' + player.grade, player.account, cb);
      } else {
        cb(null, null);
      }
    },
    function(awardResult, cb) {
      self.results.unshift(self.createResult(player, status, gainPoints, awardResult));
      cb();
    }
  ], cb);
};

Game.prototype.resetTimeout = function(account) {
  this.timeoutCounter[account] = 0;
};

Game.prototype.pass = function(account, cb) {
  this.timeoutCounter[account] = 0;
  if (account === this.currentPlayer) {
    this.stopPlayerTask();
    var score = this.updateScore(SCORE_TYPE.PASS);
    this.nextPlayer();
    cb(null, {
      success: true,
      score: score
    });
  } else {
    cb('You do not have permission now');
  }
};

Game.prototype.useProp = function(type, account, params, cb) {
  return this.propFactory.use(type, account, params).then(function(result) {
    cb(null, result);
  }).catch(cb);
};

Game.prototype.destroy = function(type) {
  var self = this;
  type = type || 'normal';
  this.players.forEach(function(player) {
    if (player && player.isGuest) {
      self.expireGuest(player.account);
    }
  });
  this.stopTimer();
  this.status = DESTROYED;
  winston.info('Game [' + this.id + '] destoryed');
  this.emit('game-destroyed', type);
};

Game.prototype.createEntity = function(creator, cb) {
  return GameDAO.createGame(creator, this.room.id, this.id, this.createEntityParams(), cb);
};

Game.prototype.updateEntity = function() {
  var self = this;
  return this.entity.update({
    $set: this.createEntityParams()
  }, function(error) {
    if (error) {
      winston.error('Error when update game entity: ' + self.id);
    }
  });
};

var ENTITY_ATTRS = [
  'index',
  'mode',
  'playMode',
  'status',
  'cost',
  'rule',
  'waitCountdown',
  'gameCountdown',
  'delayCountdown',
  'capacity',
  'duration',
  'remainingTime',
  'waitTime',
  'level',
  'startMode',
  'delayed',
  'userCellValues',
  'cellValueOwners',
  'knownCellValues',
  'scores',
  'timeoutCounter',
  'optionsOnce',
  'glassesUsed',
  'results',
  'optionsAlways',
  'changedScores',
  'playerIndex',
  'puzzle',
  'messages'
];

var pickEntityAttrs = function(target) {
  var result = {};
  ENTITY_ATTRS.forEach(function(attr) {
    result[attr] = target[attr];
  });
  return result;
};

Game.prototype.createEntityParams = function() {
  var result = pickEntityAttrs(this);
  result.room = this.room.id;
  result.players = _.map(this.players, 'account');
  result.joinRecords = _.map(this.joinRecords, 'id');
  result.quitPlayers = _.map(this.quitPlayers, 'account');
  return result;
};

module.exports = Game;
