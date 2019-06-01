// @ts-check

(function() {
  'use strict';

  // @ts-ignore
  const SBDL = window.SBDL;
  // @ts-ignore
  const JSZip = window.JSZip;

  /**
   * A progress bar
   * @typedef {Object} ProgressBar
   * @property {number} finished
   * @property {number} total
   * @property {function():void} finish
   */

   /**
   * The result of getting a project
   * @typedef {Object} ProjectResult
   * @property {string} url
   * @property {string} type
   */

  const sectionLoading = document.getElementById('section-loading');
  const sectionContent = document.getElementById('section-content');
  const packageHtml = document.getElementById('package-html');
  const packageZip = document.getElementById('package-zip');
  const inputProjectId = /** @type {HTMLInputElement} */ (document.getElementById('input-project'));

  /**
   * API route to fetch a project, replace $1 with project ID.
   */
  const PROJECT_API = 'https://projects.scratch.mit.edu/$1';

  /**
   * File cache
   */
  const fileCache = {
    css: '',
    js: '',
  };

  /**
   * @type {ProgressBar}
   */
  var currentProgressBar = null;

  /**
   * Create a new progress bar
   * @param {string} text The name of the progress bar
   * @returns {ProgressBar}
   */
  function createProgressBar(text) {
    const div = document.createElement('div');
    const progressEl = document.createElement('progress');
    progressEl.value = 0;
    const label = document.createElement('i');
    label.style.paddingLeft = '5px';
    label.textContent = text;
    div.appendChild(progressEl);
    div.appendChild(label);
    sectionLoading.appendChild(div);

    var finished = 0;
    var total = 0;
    var updateProgress = () => {
      if (total === 0) {
        progressEl.value = 0;
      } else {
        progressEl.value = finished / total;
      }
    };

    /**
     * @type {ProgressBar}
     */
    const progressBar = {
      set total(_total) {
        total = _total;
        updateProgress();
      },
      set finished(_finished) {
        finished = _finished;
        updateProgress();
      },
      get total() { return total; },
      get finished() { return finished; },
      finish() {
        total = finished = 1;
        updateProgress();
      },
    };

    currentProgressBar = progressBar;
    return progressBar;
  }
  /**
   * Remove all progress bars
   */
  function removeProgressBars() {
    currentProgressBar = null;
    while (sectionLoading.firstChild) {
      sectionLoading.removeChild(sectionLoading.firstChild);
    }
  }

  SBDL.progressHooks.newTask = function() {
    currentProgressBar.total++;
  };
  SBDL.progressHooks.finishTask = function() {
    currentProgressBar.finished++;
  };

  /**
   * Fetch a text file
   * @param {string} path
   * @returns {Promise<string>}
   */
  function getFile(path) {
    currentProgressBar.total++;
    return fetch(path)
      .then((r) => r.text())
      .then((t) => {
        currentProgressBar.finished++;
        return t;
      });
  }

  /**
   * Begins loading the script cache
   * @return {Promise}
   */
  function loadSourceCache() {
    const progressBar = createProgressBar('Loading forkphorus source');
    const promises = [];
    if (!fileCache.js) {
      promises.push(Promise.all([
        getFile('../lib/fontfaceobserver.standalone.js'),
        getFile('../lib/jszip.min.js'),
        getFile('../lib/rgbcolor.js'),
        getFile('../lib/StackBlur.js'),
        getFile('../lib/canvg.js'),
        getFile('../phosphorus.dist.js'),
      ]).then((sources) => fileCache.js = sources.join('\n')));
    }
    if (!fileCache.css) {
      promises.push(Promise.all([
        getFile('../phosphorus.css'),
      ]).then((sources) => fileCache.css = sources.join('\n')));
    }
    if (promises.length === 0) {
      progressBar.finish();
      return Promise.resolve();
    }
    return Promise.all(promises);
  }

  function loadAssetCache() {
    createProgressBar('Loading assets').finish();
  }

  /**
   * Determines the project type of a project from scratch.mit.edu
   * @param {string} id The project ID
   * @returns {Promise<"sb2"|"sb3">}
   * @throws if the project type cannot be determined
   */
  function getProjectType(id) {
    createProgressBar('Determining project type');
    return fetch(PROJECT_API.replace('$1', id))
      .then((r) => r.json())
      .then((data) => {
        currentProgressBar.finish();
        if ('targets' in data) return 'sb3';
        if ('objName' in data) return 'sb2';
        throw new Error('unknown project type');
      });
  }

  /**
   * Converts a Blob to a data: URL
   * @param {Blob} blob
   * @returns {Promise<string>}
   */
  function blobToURL(blob) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        resolve(/** @type {string} */ (fileReader.result));
      };
      fileReader.readAsDataURL(blob);
    })
  }

  /**
   * Fetches a project, and converts its zip archive to a data: URL
   * @param {string} id The project ID
   * @returns {Promise<ProjectResult>}
   */
  function getProject(id) {
    var type = '';
    return getProjectType(id)
      .then((t) => {
        type = t;
        createProgressBar('Loading project');
        return SBDL.loadProject(id, type);
      })
      .then((result) => {
        // all types we support should be of 'zip'
        if (result.type !== 'zip') {
          throw new Error('unknown result type: ' + result.type);
        }
        return SBDL.createArchive(result.files, new JSZip());
      })
      .then((buffer) => blobToURL(buffer))
      .then((url) => {
        return {
          url: url,
          type: type,
        };
      })
  }

  /**
   * Creates the HTML page for a project
   * @param {ProjectResult} result The result of loading the project
   * @returns {string}
   */
  function getProjectHTML(result) {
    return `<!DOCTYPE html>
  <html>

  <head>
    <style>
      ${fileCache.css}
    </style>
    <style>
      body, html {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #000;
      }
      #root, #splash, #error {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      #splash, #error {
        background: #000;
        display: table;
        color: #fff;
        cursor: default;
      }
      #error {
        display: none;
      }
      #splash > div,
      #error > div {
        display: table-cell;
        height: 100%;
        text-align: center;
        vertical-align: middle;
      }

      #progress {
        width: 80%;
        height: 16px;
        border: 1px solid #fff;
        margin: 0 auto;
      }
      #progress-bar {
        background: #fff;
        width: 10%;
        height: 100%;
      }
      h1 {
        font: 300 52px sans-serif;
        margin: 0 0 16px;
      }
      p {
        font: 300 24px/1.5 sans-serif;
        margin: 0;
        color: rgba(255, 255, 255, .6);
      }
    </style>
  </head>

  <body>
    <div id="root"></div>
    <div id="splash">
      <div>
        <!-- <h1>forkphorus</h1> -->
        <div id="progress"><div id="progress-bar"></div></div>
      </div>
    </div>
    <div id="error">
      <div>
        <h1>Internal Error</h1>
        <p>An error has occurred. <a id="error-bug-link" href="https://github.com/forkphorus/forkphorus/issues/new" target="_blank">Click here</a> to file a bug report.</p>
      </div>
    </div>

    <!-- forkphrous, and it's dependencies -->
    <script>
      ${fileCache.js}
    </script>

    <!-- special hooks for NW.js -->
    <script>
    (function() {
      if (typeof nw !== 'undefined') {
        // open links in the browser
        var win = nw.Window.get();
        win.on('new-win-policy', (frame, url, policy) => {
          policy.ignore();
          nw.Shell.openExternal(url);
        });
        // fix the size of the window made by NW.js
        var package = nw.require('package.json');
        if (package.window && package.window.height && package.window.width) {
          win.resizeBy(package.window.width - window.innerWidth, package.window.height - window.innerHeight);
        }
      }
    })();
    </script>

    <script>
    (function() {

      // ---
      var type = "${result.type}";
      var project = "${result.url}";
      // ---

      var root = document.getElementById("root");
      var progressBar = document.getElementById("progress-bar");
      var splash = document.getElementById("splash");
      var error = document.getElementById("error");
      var bugLink = document.getElementById("error-bug-link");

      var stage;

      var totalTasks = 0;
      var completedTasks = 0;
      P.IO.progressHooks.new = function() {
        totalTasks++;
        progressBar.style.width = (10 + completedTasks / totalTasks * 90) + '%';
      };
      P.IO.progressHooks.end = function() {
        completedTasks++;
        progressBar.style.width = (10 + completedTasks / totalTasks * 90) + '%';
      };

      function showError(e) {
        error.style.display = 'table';
        bugLink.href = createBugLink("Describe what you were doing to cause this error:", '\`\`\`\\n' + P.utils.stringifyError(e) + '\\n\`\`\`');
        console.error(e.stack);
      }

      function createBugLink(before, after) {
        var title = 'Error in packaged project ' + document.title;
        var baseBody = '\\n\\n\\n----\\nPackaged project: ' + document.title + '\\n' + navigator.userAgent + '\\n';
        return 'https://github.com/forkphorus/forkphorus/issues/new?title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(before + baseBody + after) + '&labels=bug';
      }

      function updateLayout() {
        if (!stage) return;
        var w = Math.min(window.innerWidth, window.innerHeight / .75);
        var h = w * .75;
        root.style.left = (window.innerWidth - w) / 2 + 'px';
        root.style.top = (window.innerHeight - h) / 2 + 'px';
        stage.setZoom(w / 480);
        stage.draw();
      }

      window.addEventListener('resize', updateLayout);

      fetch(project)
        .then((request) => request.arrayBuffer())
        .then((buffer) => {
          if (type === 'sb3') {
            var loader = new P.sb3.SB3FileLoader(buffer);
            return loader.load();
          } else if (type === 'sb2') {
            return P.sb2.loadSB2Project(buffer);
          }
        })
        .then((s) => {
          stage = s;
          splash.style.display = "none";
          root.appendChild(stage.root);
          updateLayout();
          stage.runtime.handleError = showError;
          stage.runtime.start();
          stage.runtime.triggerGreenFlag();
          stage.focus();
        })
        .catch((err) => showError(err));
    }());
    </script>
  </body>

  </html>`;
  }

  /**
   * Creates the zip archive for a project
   * @param {string} id The project ID
   */
  function getProjectZip(id) {

  }

  /**
   * Downloads a string to the user's computer
   * @param {string} text The file content
   * @param {string} fileName The name of the downloaded file
   */
  function downloadText(text, fileName) {
    const encoder = new TextEncoder();
    const blob = new Blob([new Uint8Array(encoder.encode(text))]);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  packageHtml.onclick = function() {
    removeProgressBars();
    loadSourceCache()
      .then(() => getProject(inputProjectId.value))
      .then((result) => {
        const html = getProjectHTML(result);
        downloadText(html, 'project.html');
      });
  };

  packageZip.onclick = function() {
    removeProgressBars();
    loadSourceCache()
      .then(() => loadAssetCache())
  };
}());
