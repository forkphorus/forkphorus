var P = P || {};

/**
 * @typedef {Object} ProjectMeta
 * @property {string} path The path to download this project from.
 * @property {number} timeout The time, in milliseconds, to wait for a project to run.
 * @property {string[]} ignoredFailures Failure messages to ignore, and allow the project to continue.
 * @property {number} repeatCount The total number of times to repeat this test.
 */

/**
 * @typedef {Object} TestResult
 * @property {boolean} success Was the test a success?
 * @property {string} message An optional message provided by the project.
 * @property {number} projectTime The total time, in milliseconds, that was spent in the project.
 * @property {number} totalTime The total time, in milliseconds, that this project took to test. Includes asset loading, compiling, among other things.
 */

/**
 * @typedef {Object} FinalResults
 * @property {TestResult[]} tests All tests run
 * @property {number} time The time, in milliseconds, to complete the test.
 */

/**
 * @typedef {2|3} ProjectType
 */

/**
 * Automated test suite
 */
P.suite = (function() {
  'use strict';

  /**
   * @type {ProjectMeta[]}
   */
  const projectList = [];

  /**
   * Default options to override the default options
   * @type {ProjectMeta}
   */
  const defaultMetadata = {
    timeout: 5000,
    ignoredFailures: [],
    repeatCount: 1,
  };

  const containerEl = document.getElementById('suite-container');
  const tableBodyEl = document.getElementById('suite-table');
  const finalResultsEl = document.getElementById('suite-final-results');

  /**
   * Removes all children of an HTML element
   * @param {HTMLElement} element 
   */
  function removeChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  /**
   * Create an HTML element
   * @param {string} tagName The tag of the HTML element
   * @param {any} options Properties to set on the Element in key/object form
   * @returns {HTMLElement}
   */
  function createElement(tagName, options = {}) {
    const el = document.createElement(tagName);
    for (const key of Object.keys(options)) {
      const value = options[key];
      el[key] = value;
    }
    return el;
  }

  /**
   * @param {string} path
   * @param {ProjectMeta} metadata 
   */
  function addProject(path, metadata) {
    metadata.path = path;
    const clonedDefaults = Object.assign({}, defaultMetadata);
    projectList.push(Object.assign(clonedDefaults, metadata));
  }

  /**
   * @param {string} path The path to fetch
   * @returns {ArrayBuffer} The ArrayBuffer representing the fetched content
   */
  function fetchAsArrayBuffer(path) {
    return fetch(path)
      .then((r) => r.arrayBuffer());
  }

  /**
   * Determines the type of a project
   * @param {string} path
   * @returns {ProjectType}
   */
  function getProjectType(path) {
    const extension = path.match(/\..*$/)[0];
    switch (extension) {
      case '.sb3': return 3;
      case '.sb2': return 2;
    }
    throw new Error('unknown project type: ' + extension);
  }

  /**
   * Load a project
   * @param {ArrayBuffer} buffer 
   * @param {ProjectType} type
   * @returns {Promise<P.core.Stage>}
   */
  function loadProjectBuffer(buffer, type) {
    if (type === 2) {
      return P.sb2.loadSB2Project(buffer);
    } else if (type === 3) {
      const loader = new P.sb3.SB3FileLoader(buffer);
      return loader.load();
    }
    throw new Error('unknown type: ' + type);
  }

  /**
   * Runs and tests a Stage
   * @param {P.core.Stage} stage
   * @param {ProjectMeta} metadata
   * @returns {Promise<TestResult>}
   */
  function testStage(stage, metadata) {
    removeChildren(containerEl);
    containerEl.appendChild(stage.root);

    return new Promise((_resolve, _reject) => {
      /**
       * @param {TestResult} result
       */
      function resolve(result) {
        const endTime = performance.now();
        result.projectTime = endTime - startTime;

        clearTimeout(timeoutId);
        stage.runtime.pause();
        stage.runtime.stopAll();

        _resolve(result);
      }

      /**
       * The test has failed.
       * @param {string} message
       * @returns {boolean} Stop the program's execution after this failure?
       */
      function testFail(message) {
        if (metadata.ignoredFailures.includes(message)) {
          return false;
        }
        resolve({
          success: false,
          message,
        });
        return true;
      };

      /**
       * Test test has passed.
       * @param {string} message
       */
      function testOkay(message) {
        resolve({
          success: true,
          message,
        });
      };

      /**
       * testFail() when the project encounters an error
       * @param {ErrorEvent} e
       */
      function handleError(e) {
        const error = e.error;
        const message = P.utils.stringifyError(error);
        stage.runtime.testFail('ERROR: ' + message);
      };

      /**
       * The project has not completed in a reasonable amount of time
       */
      function timeout() {
        testFail('timeout');
      }

      stage.runtime.testFail = testFail;
      stage.runtime.testOkay = testOkay;
      stage.runtime.handleError = handleError;

      const timeoutId = setTimeout(timeout, metadata.timeout);

      const startTime = performance.now();

      stage.runtime.start();
      stage.runtime.triggerGreenFlag();
    });
  }

  /**
   * Loads, runs, and tests a project.
   * @param {ProjectMeta} metadata The project's metadata
   * @param {ArrayBuffer} buffer The ArrayBuffer representing this project
   * @param {ProjectType} type The project's type
   * @returns {Promise<TestResult>}
   */
  function runProject(metadata, buffer, type) {
    const startTime = performance.now();
    return loadProjectBuffer(buffer, type)
      .then((stage) => testStage(stage, metadata))
      .then((result) => {
        const endTime = performance.now();
        result.totalTime = endTime - startTime;
        return result;
      });
  }

  /**
   * Displays the result of a test
   * @param {ProjectMeta} projectMeta
   * @param {TestResult} result
   */
  function displayResult(projectMeta, result) {
    const row = createElement('tr');

    row.appendChild(createElement('td', {
      className: 'cell-name',
    })).appendChild(createElement('a', {
      textContent: projectMeta.path,
      href: projectMeta.path,
    }));

    const message = (result.success ? 'OKAY: ' : 'FAIL: ') + result.message;
    const successClass = result.success ? 'cell-result-okay' : 'cell-result-fail';
    row.appendChild(createElement('td', {
      className: 'cell-result ' + successClass,
      textContent: message,
    }));

    row.appendChild(createElement('td', {
      className: 'cell-total-time',
      textContent: result.totalTime + 'ms',
    }));

    row.appendChild(createElement('td', {
      className: 'cell-project-time',
      textContent: result.projectTime + 'ms',
    }));

    tableBodyEl.appendChild(row);
  }

  /**
   * @param {FinalResults} result
   */
  function displayFinalResults(result) {
    const listEl = createElement('ul');

    listEl.appendChild(createElement('li', {
      textContent: 'Done in ' + result.time + 'ms',
    }));
    
    const totalTests = result.tests.length;
    const passingTests = result.tests.filter((i) => i.success).length;
    const failingTests = totalTests - passingTests;
    listEl.appendChild(createElement('li', {
      textContent: 'Passed ' + passingTests + ' and failed ' + failingTests + ' of ' + totalTests,
    }));

    finalResultsEl.appendChild(listEl);
  }

  /**
   * Start the test suite
   * @returns {Promise} Resolves when the test is done.
   */
  async function run() {
    const startTime = performance.now();
    const allTestResults = [];

    while (projectList.length > 0) {
      const projectMetadata = projectList.shift();
      const path = projectMetadata.path;
      const repeatCount = projectMetadata.repeatCount;

      const projectType = getProjectType(path);
      const buffer = await fetchAsArrayBuffer(path);

      for (let i = 0; i < repeatCount; i++) {
        const result = await runProject(projectMetadata, buffer, projectType);
        allTestResults.push(result);
        displayResult(projectMetadata, result);
      }
    }

    const endTime = performance.now();
    const totalTestTime = endTime - startTime;
    displayFinalResults({
      time: totalTestTime,
      tests: allTestResults,
    });
  }

  return {
    addProject,
    run,
    defaults: defaultMetadata,
  };
}());
