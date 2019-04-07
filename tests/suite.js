'use strict';

const suite = {
  projects: [],
  stage: null,
  projectMeta: {},
  timeout: 0,
  startTime: 0,
  suiteStartTime: 0,

  containerEl: document.getElementById('suite-container'),
  tableEl: document.getElementById('suite-table'),

  _resolve() {},
  _reject() {},

  addProject(path, meta) {
    this.projects.push({
      path: path,
      timeout: meta.timeout || 2000,
    });
  },

  getProject(path) {
    const type = path.match(/\..*$/)[0];
    return fetch(path)
      .then((r) => r.arrayBuffer())
      .then((buffer) => {
        if (type === '.sb2') {
          return P.sb2.loadSB2Project(buffer);
        } else if (type === '.sb3') {
          const loader = new P.sb3.SB3FileLoader(buffer);
          return loader.load();
        }
      });
  },

  startStage(stage) {
    stage.runtime.handleError = this.testFail;
    stage.runtime.start();
    stage.runtime.triggerGreenFlag();
  },

  testProject(meta) {
    this.startTime = performance.now();
    return this.getProject(meta.path)
      .then((stage) => {

        this.stage = stage;
        this.projectMeta = meta;

        this.emptyContainer();
        this.containerEl.appendChild(stage.root);

        return new Promise((resolve, reject) => {
          this._resolve = resolve;
          this._reject = reject;

          this.timeout = setTimeout(() => {
            this.testFail('Timed out');
          }, meta.timeout);
          this.startStage(stage);
        });
      });
  },

  testFail(message) {
    clearInterval(this.timeout);
    this.stage.runtime.stopAll();

    if (message) {
      message = 'FAIL: ' + message;
    } else {
      message = 'FAIL';
    }

    this.endTest(message);
    this._reject(message);
  },

  testOkay(message) {
    clearInterval(this.timeout);
    this.stage.runtime.stopAll();

    if (message) {
      message = 'OKAY: ' + message;
    } else {
      message = 'OKAY';
    }

    this.endTest(message);
    this._resolve(message);
  },

  endTest(message) {
    const endTime = performance.now();
    const testTime = endTime - this.startTime;

    const rowEl = document.createElement('tr');

    const nameEl = document.createElement('td');
    nameEl.className = 'name';
    nameEl.textContent = this.projectMeta.path;

    const resultEl = document.createElement('td');
    resultEl.className = 'result';
    resultEl.textContent = message;

    const timeEl = document.createElement('td');
    timeEl.className = 'time';
    timeEl.textContent = testTime + 'ms';

    rowEl.appendChild(nameEl);
    rowEl.appendChild(resultEl);
    rowEl.appendChild(timeEl);
    this.tableEl.appendChild(rowEl);
  },

  emptyContainer() {
    while (this.containerEl.firstChild) {
      this.containerEl.removeChild(this.containerEl.firstChild);
    }
  },

  async start() {
    this.suiteStartTime = performance.now();
    while (this.projects.length > 0) {
      const project = this.projects.shift();
      await this.testProject(project);
    }
    this.emptyContainer();
    const suiteEndTime = performance.now();
    const suiteTime = suiteEndTime - this.suiteStartTime;
    this.containerEl.textContent = 'DONE in ' + suiteTime + 'ms';
  },
};
