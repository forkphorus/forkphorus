var P = P || {};

/**
 * The metadata for a project test.
 * @typedef {Object} ProjectMeta
 * @property {string} path The path to download this project from.
 * @property {number} timeout The time, in milliseconds, to wait for a project to run.
 * @property {string[]} ignoredFailures Failure messages to ignore, and allow the project to continue.
 * @property {number} repeatCount The total number of times to repeat this test.
 */

/**
 * The result of a test.
 * @typedef {Object} TestResult
 * @property {string} path The path to the file tested.
 * @property {boolean} success Was the test a success?
 * @property {string} message An optional message provided by the project.
 * @property {number} projectTime The total time, in milliseconds, that was spent in the project.
 * @property {number} totalTime The total time, in milliseconds, that this project took to test. Includes asset loading, compiling, among other things.
 */

/**
 * The final accumulated tests of running a set of tests.
 * @typedef {Object} FinalResults
 * @property {TestResult[]} tests All tests run
 * @property {number} time The time, in milliseconds, to complete the test.
 */

/**
 * Identifies the version of Scratch a project is made for.
 * @typedef {'sb'|'sb2'|'sb3'} ProjectType
 */

/**
 * Automated phosphorus test suite
 */
P.suite = (function() {
  'use strict';

  // UI Elements
  const containerEl = document.getElementById('suite-container');
  const tableBodyEl = document.getElementById('suite-table');
  const finalResultsEl = document.getElementById('suite-final-results');

  // Project player
  const player = new P.player.Player();
  containerEl.appendChild(player.root);

  // Configure IO to fetch files from the right place.
  P.io.config.localPath = '../';

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
   * @param {string} path The path to fetch
   * @returns {Promise<ArrayBuffer>} The ArrayBuffer representing the fetched content
   */
  function fetchAsArrayBuffer(path) {
    return new P.io.Request(path).load('arraybuffer');
  }

  /**
   * Determines the type of a project
   * @param {string} path
   * @returns {ProjectType}
   */
  function getProjectType(path) {
    const extension = path.match(/\..*$/)[0];
    switch (extension) {
      case '.sb': return 'sb';
      case '.sb2': return 'sb2';
      case '.sb3': return 'sb3';
    }
    throw new Error('unknown project type: ' + extension);
  }

  /**
   * Load a project
   * @param {ArrayBuffer} buffer
   * @param {ProjectType} type
   */
  function loadProjectBuffer(buffer, type) {
    return player.loadProjectFromBuffer(buffer, type);
  }

  function stringifyError(error) {
    if (!error) {
      return 'unknown error';
    }
    if (error.stack) {
      return 'Message: ' + error.message + '\nStack:\n' + error.stack;
    }
    return error.toString();
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
    P.suite.stage = stage;

    return new Promise((_resolve, _reject) => {
      console.log('Starting test', metadata.path);

      /**
       * @param {Partial<TestResult>} result
       */
      const resolve = (result) => {
        const endTime = performance.now();
        result.projectTime = endTime - startTime;

        clearTimeout(timeoutId);
        stage.runtime.pause();
        stage.runtime.stopAll();

        _resolve(result);
      };

      /**
       * The test has failed.
       * @param {string} message
       * @returns {boolean} Stop the program's execution after this failure?
       */
      const testFail = (message) => {
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
      const testOkay = (message) => {
        resolve({
          success: true,
          message,
        });
      };

      let plannedTests = null;
      let passedTests = 0;
      /**
       * Handle scratch-vm-style test hook.
       * Example messages:
       * "plan 1"
       * "pass name"
       * "fail name"
       * "end"
       * @param {string} message 
       */
      const testVm = (message) => {
        const [method] = message.split(' ');
        const args = message.substring(method.length).trim();
        if (method === 'plan') {
          if (plannedTests !== null) {
            testFail('already planned test');
            return;
          }
          plannedTests = +args;
        } else if (method === 'pass') {
          console.log('Pass', args);
          passedTests++;
        } else if (method === 'fail') {
          testFail(args);
        } else if (method === 'end') {
          if (plannedTests !== null) {
            if (plannedTests === passedTests) {
              testOkay(`Passed ${passedTests}`);
            } else {
              testFail(`Expected ${plannedTests} but only got ${passedTests}`);
            }
          } else {
            testOkay('WARN: not did not plan');
          }
        }
      };

      /**
       * testFail() when the project encounters an error
       */
      const handleError = (e) => {
        const message = stringifyError(e);
        testFail('ERROR: ' + message);
      };

      /**
       * The project has not completed in a reasonable amount of time
       */
      const timeout = () => {
        testFail('timeout');
      };

      stage.runtime.testFail = testFail;
      stage.runtime.testOkay = testOkay;
      stage.runtime.testVm = testVm;
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
      .then(() => testStage(player.getStage(), metadata))
      .then((result) => {
        const endTime = performance.now();
        result.totalTime = endTime - startTime;
        result.path = metadata.path;
        return result;
      });
  }

  /**
   * Converts a duration to a human readable string
   * @param {number} time Time, in milliseconds, to format
   * @returns {string} Human readable string
   */
  function formatTime(time) {
    const precision = 1e2; // two decimal places
    return Math.round(time * precision) / precision + 'ms';
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

    let message = result.success ? 'OKAY' : 'FAIL';
    if (result.message) {
      message += ': ' + result.message;
    }
    const successClass = result.success ? 'cell-result-okay' : 'cell-result-fail';
    row.appendChild(createElement('td', {
      className: 'cell-result ' + successClass,
      textContent: message,
    }));

    row.appendChild(createElement('td', {
      className: 'cell-total-time',
      textContent: formatTime(result.totalTime),
    }));

    row.appendChild(createElement('td', {
      className: 'cell-project-time',
      textContent: formatTime(result.projectTime),
    }));

    tableBodyEl.appendChild(row);
  }

  /**
   * @param {FinalResults} result
   */
  function displayFinalResults(result) {
    const listEl = createElement('ul');

    listEl.appendChild(createElement('li', {
      textContent: 'Done in ' + formatTime(result.time),
    }));

    const totalTests = result.tests.length;
    const passingTests = result.tests.filter((i) => i.success).length;
    const failingTests = totalTests - passingTests;
    const percentPassing = Math.round((passingTests / totalTests) * 100);
    listEl.appendChild(createElement('li', {
      textContent: `Of ${totalTests} tests, ${passingTests} passed and ${failingTests} failed. (${percentPassing}% passing)`,
    }));
    if (failingTests > 0) {
      listEl.classList.add('suite-failed');
    } else {
      listEl.classList.add('suite-passed');
    }

    finalResultsEl.appendChild(listEl);
  }

  /**
   * Run tests on a list of project metadata.
   * @param {ProjectMeta[]} projectList
   * @returns {Promise<void>} Resolves when the test is done.
   */
  async function runTests(projectList) {
    removeChildren(tableBodyEl);

    /** @type {TestResult[]} */
    const allTestResults = [];
    const startTime = performance.now();

    while (projectList.length > 0) {
      const projectMetadata = projectList.shift();
      const path = projectMetadata.path;
      const repeatCount = projectMetadata.repeatCount;

      const projectType = getProjectType(path);
      const buffer = await fetchAsArrayBuffer(path);

      // Allow allow automated test runners to monitor progress.
      if (window.startProjectHook) {
        window.startProjectHook(projectMetadata);
      }

      for (let i = 0; i < repeatCount; i++) {
        const result = await runProject(projectMetadata, buffer, projectType);
        allTestResults.push(result);
        displayResult(projectMetadata, result);
      }
    }

    const endTime = performance.now();
    const totalTestTime = endTime - startTime;
    const finalResults = {
      time: totalTestTime,
      tests: allTestResults,
    };
    displayFinalResults(finalResults);

    // Allow automated test runners to learn the final results.
    if (window.testsFinishedHook) {
      window.testsFinishedHook(finalResults);
    }
  }

  /**
   * Start the test suite
   * @param {ProjectMeta[]} projectList
   * @returns {Promise<void>} Resolves when the test is done.
   */
  async function run(projectList) {
    try {
      return await runTests(projectList);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  return {
    run,
    stage: null,
  };
}());

/**
 * SB3 compiler hook
 */
(function(compiler) {
  // The Scratch 3 compiler exposes its internals so it can be modified.
  // In this, we replace procedures_call opcodes with something else at compile time.

  const originalProcedureCall = compiler.statementLibrary['procedures_call'];

  function getArguments(util) {
    var source = '';
    const mutation = util.block.mutation;
    const inputIds = JSON.parse(mutation.argumentids);
    for (let i = 0; i < inputIds.length; i++) {
      const id = inputIds[i];
      source += util.getInput(id, 'any') + ', ';
    }
    return source.substr(0, source.length - 2);
  }

  compiler.statementLibrary['procedures_call'] = function procedureCall(util) {
    switch (util.block.mutation.proccode) {
      case 'FAIL':
        util.writeLn('if (runtime.testFail("")) { return; }');
        break;

      case 'FAIL %s':
        util.writeLn('if (runtime.testFail(' + getArguments(util) + ' || "")) { return; }');
        break;

      case 'OKAY':
      case 'OK':
        util.writeLn('runtime.testOkay(""); return;');
        break;

      case 'OKAY %s':
      case 'OK %s':
        util.writeLn('runtime.testOkay(' + getArguments(util) + ' || ""); return;');
        break;

      default:
        originalProcedureCall(util);
    }
  };
}(P.sb3.compiler));

/**
 * SB2 compiler hook
 */
(function(compiler) {
  // The Scratch 2 compiler has very limited internals exposed, but we can replace the entire listener compiler.
  // (which is where all top level blocks, such as procedure definitions, are compiled)
  // We replace custom block definitions and some broadcast receivers instead of the calls because that's easier.

  const originalCompileListener = compiler.compileListener;
  compiler.compileListener = function compileListener(object, script) {
    const opcode = script[0][0];
    if (opcode !== 'procDef' && opcode !== 'whenIReceive') {
      return originalCompileListener(object, script);
    }

    const proccode = script[0][1];
    var source;
    switch (proccode) {
      case 'OK':
      case 'OKAY':
        source = 'runtime.testOkay(""); return;\n';
        break;

      case 'OK %s':
      case 'OKAY %s':
      case 'OK %n':
      case 'OKAY %n':
        source = 'runtime.testOkay(C.args[0]); return;\n';
        break;

      case 'FAIL':
        source = 'if (runtime.testFail("")) { return; }\n';
        break;

      case 'FAIL %s':
      case 'FAIL %n':
        source = 'if (runtime.testFail(C.args[0])) { return; }\n';
        break;

      default:
        return originalCompileListener(object, script);
    }

    source += 'endCall();\n';
    const f = P.runtime.createContinuation(source);
    object.fns.push(f);

    if (opcode === 'procDef') {
      object.procedures[proccode] = new compiler.Scratch2Procedure(f, false, []);
    }
    if (opcode === 'whenIReceive') {
      (object.listeners.whenIReceive[proccode] || (object.listeners.whenIReceive[proccode] = [])).push(f);
    }
  };
}(P.sb2.compiler));

/**
 * scratch-vm-style hook
 */
(function() {
  const originalSay = P.core.Base.prototype.say;
  P.core.Base.prototype.say = function (message, thinking) {
    this.stage.runtime.testVm(message);
    return originalSay.call(this, message, thinking);
  };
}());
