const winston = require('winston');
const _ = require('lodash');
const uuid = require('uuid');

const GUEST_RE = /^guest-\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/g;

class Guest {

  static genid() {
    return 'guest-' + uuid.v1();;
  }

  static isGuest(account) {
    return !!(account && account.match(GUEST_RE));
  }

  static createProp(account) {
    return {
      account: account,
      magnifier: 1,
      impunity: 1,
      delay: 1,
      glasses: 1,
      options_once: 1,
      options_always: 1,
      purchases: {
        magnifier: 0,
        impunity: 0,
        delay: 0,
        glasses: 0,
        options_once: 0,
        options_always: 0
      }
    }
  }

  constructor(account) {
    this.id = account;
    this.account = account;
    this.isGuest = true;
    this.name = '游客';
    this.icon = '/imgs/default/guest.png';
    this.grade = 0;
    this.points = 0;
    this.rounds = 0;
    this.wintimes = 0;
    this.losetimes = 0;
    this.winrate = 0;
    this.grade_name = '新手';
    this.money = 0;
  }

  toJSON() {
    return {
      id: this.id,
      account: this.account,
      isGuest: this.isGuest,
      name: this.name,
      icon: this.icon,
      grade: this.grade,
      points: this.points,
      rounds: this.rounds,
      wintimes: this.wintimes,
      losetimes: this.losetimes,
      winrate: this.winrate,
      grade_name: this.grade_name,
      money: this.money
    };
  }

}

module.exports = Guest;
