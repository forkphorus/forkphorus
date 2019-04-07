'use strict';

const suite = {
  projects: [],
  stage: null,
  projectMeta: {},
  timeout: 0,

  containerEl: document.getElementById('suite-container'),
  tableEl: document.getElementById('suite-table'),

  _resolve() {},
  _reject() {},

  addProject(path, meta) {
    this.projects.push({
      path: path,
      timeout: meta.timeout || 1000,
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
    return this.getProject(meta.path)
      .then((stage) => {

        this.stage = stage;
        this.projectMeta = meta;

        while (this.containerEl.firstChild) {
          this.containerEl.removeChild(this.containerEl.firstChild);
        }
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

  testFail(reason) {
    clearInterval(this.timeout);
    this.stage.runtime.stopAll();
    this._reject(reason);
    this.endTest('FAIL: ' + reason);
  },

  testOkay() {
    clearInterval(this.timeout);
    this.stage.runtime.stopAll();
    this._resolve();
    this.endTest('OKAY');
  },

  endTest(message) {
    const row = document.createElement('tr');

    const name = document.createElement('td');
    name.className = 'name';
    name.textContent = this.projectMeta.path;

    const result = document.createElement('td');
    result.className = 'result';
    result.textContent = message;

    row.appendChild(name);
    row.appendChild(result);
    this.tableEl.appendChild(row);
  },

  async start() {
    while (this.projects.length > 0) {
      const project = this.projects.shift();
      await this.testProject(project);
    }
    console.log('DONE');
  },
};
