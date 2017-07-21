const winston = require('winston');
const _ = require('lodash');
const uuid = require('uuid');

const GUEST_RE = /^guest-\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/g;

class Guest {

  static genId() {
    return 'guest-' + this.id;
  }

  static isGuest(account) {
    return !!(account && account.match(GUEST_RE));
  }

  static createGuest(account) {

  }

  constructor(account) {
    this.account = account;
    this.isGuest = true;
    this.name = '游客';
    this.icon = '/imgs/default/user_icons/robot.png';
    this.grade = 0;
  }

}

module.exports = Guest;
