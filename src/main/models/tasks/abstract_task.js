const _ = require('lodash');

const AVAILABLE = 'AVAILABLE';
const PAUSED = 'PAUSED';
const FINISHED = 'FINISHED';

class AbstractTask {

  constructor() {
    this.status = AVAILABLE;
  }

  process() {
  }

  pause(timeout) {
    this.status = PAUSED;
    if(timeout != null) {
      setTimeout(() => {
        this.status = AVAILABLE;
      });
    }
  }

  finish() {
    this.status = FINISHED;
  }

  get available() {
    return this.status === AVAILABLE;
  }

  get paused() {
    return this.status === PAUSED;
  }

  get finished() {
    return this.status === FINISHED;
  }

}

module.exports = AbstractTask;
