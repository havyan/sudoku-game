const _ = require('lodash');

const INTERVAL = 1000;

const READY = 'READY';
const RUNNING = 'RUNNING';
const PAUSED = 'PAUSED';
const STOPPED = 'STOPPED';

class Timer {

  constructor() {
    this.tasks = [];
    this.status = READY;
  }

  start() {
    this.id = setInterval(this.process.bind(this), INTERVAL);
    this.status = RUNNING;
  }

  schedule(task, delay = 0, once = false) {
    this.tasks.push({
      task: task,
      delay: delay,
      once: once
    });
  }

  process() {
    if (this.running) {
      this.tasks.forEach(task => {
        if (task.delay > 0) {
          task.delay--;
        } else {
          if (task.task.available) {
            task.task.process();
            if (task.once) {
              task.task.finish();
            }
          }
        }
      });
      _.remove(this.tasks, task => {
        return task.task.finished;
      });
    }
  }

  pause(timeout) {
    this.status = PAUSED;
    if(timeout != null) {
      setTimeout(() => {
        this.status = RUNNING;
      });
    }
  }

  stop() {
    this.status = STOPPED;
    clearInterval(this.id);
  }

  get running() {
    return this.status === RUNNING;
  }

}

module.exports = Timer;
