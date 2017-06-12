const _ = require('lodash');

const AVAILABLE = 'AVAILABLE';
const PAUSED = 'PAUSED';
const STOPPED = 'STOPPED';
const FINISHED = 'FINISHED';

class AbstractTask {

  constructor() {
    this.status = AVAILABLE;
  }

  process() {}

  pause(timeout) {
    this.status = PAUSED;
    if (timeout != null) {
      setTimeout(() => {
        this.status = AVAILABLE;
      });
    }
  }

  stop() {
    this.status = STOPPED;
  }

  restart() {
    this.reset();
    this.status = AVAILABLE;
  }

  reset() {}

  finish() {
    this.status = FINISHED;
  }

  get available() {
    return this.status === AVAILABLE;
  }

  get paused() {
    return this.status === PAUSED;
  }

  get stopped() {
    return this.status === STOPPED;
  }

  get finished() {
    return this.status === FINISHED;
  }

}

module.exports = AbstractTask;
