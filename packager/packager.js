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
   * @property {function(number):void} percent
   */

   /**
   * The result of getting a project
   * @typedef {Object} ProjectResult
   * @property {string} url
   * @property {string} type
   */

  /**
   * Options
   * @typedef {Object} Options
   * @property {string} loadingText
   * @property {string} postLoadScript
   */

  // Replace fetch so we can observe progress of things
  const nativeFetch = window.fetch;
  window.fetch = function fetch(url, options) {
    currentProgressBar.total++;
    return nativeFetch(url, options)
      .then((res) => {
        currentProgressBar.finished++
        return res;
      });
  };

  const sectionLoading = document.getElementById('section-loading');
  const packageHtml = /** @type {HTMLButtonElement} */document.getElementById('package-html');
  const inputProjectId = /** @type {HTMLInputElement} */ (document.getElementById('input-project'));
  const inputLoadingText = /** @type {HTMLInputElement} */ (document.getElementById('input-loading-text'));
  const inputPostLoadScript = /** @type {HTMLTextAreaElement} */ (document.getElementById('input-post-load-script'));

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
      percent(percent) {
        total = 1;
        finished = percent;
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
    return fetch(path).then((r) => r.text());
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
        getFile('../lib/jszip.min.js'),
        getFile('../lib/fontfaceobserver.standalone.js'),
        getFile('../lib/stackblur.min.js'),
        getFile('../lib/rgbcolor.js'),
        getFile('../lib/canvg.min.js'),
        getFile('../phosphorus.dist.js'),
      ]).then((sources) => fileCache.js = sources.join('\n')));
    }
    if (!fileCache.css) {
      promises.push(getFile('../phosphorus.css').then((text) => {
        const fonts = [
          'fonts/Knewave/Knewave-Regular.woff2',
          'fonts/Handlee/Handlee-Regular.woff2',
          'fonts/Grand9K-Pixel/Grand9K-Pixel.ttf',
          'fonts/Griffy/Griffy-Regular.woff2',
          'fonts/Source_Serif_Pro/SourceSerifPro-Regular.woff2',
          'fonts/Noto_Sans/NotoSans-Regular.woff2',
          'fonts/Donegal_One/DonegalOne-Regular.woff2',
          'fonts/Gloria_Hallelujah/GloriaHallelujah.woff2',
          'fonts/Mystery_Quest/MysteryQuest-Regular.woff2',
          'fonts/Permanent_Marker/PermanentMarker-Regular.woff2',
          'fonts/Scratch/Scratch.ttf',
        ];

        const promises = fonts.map((i) => fetch('../' + i)
          .then((res) => res.blob())
          .then((blob) => blobToURL(blob))
          .then((url) => text = text.replace(i, url))
        );

        return Promise.all(promises).then(() => fileCache.css = text);
      }));
    }
    if (promises.length === 0) {
      progressBar.finish();
      return Promise.resolve();
    }
    return Promise.all(promises);
  }

  /**
   * Determines the project type of a project from scratch.mit.edu
   * @param {string} id The project ID
   * @returns {Promise<'sb2'|'sb3'>}
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
   * @param {any} files Files from an SBDL result
   * @returns {Blob} A Blob representation of the zip
   */
  function createArchive(files) {
    const progressBar = createProgressBar('Creating archive');
    const zip = new JSZip();
    for (const file of files) {
      const path = file.path;
      const data = file.data;
      zip.file(path, data);
    }
    return zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
    }, function updateCallback(/** @type {any} */ metadata) {
      progressBar.percent(metadata.percent);
    });
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
        return createArchive(result.files);
      })
      .then((blob) => blobToURL(blob))
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
    const options = getOptions();
    return `<!DOCTYPE html>
  <html>

  <!-- https://forkphorus.github.io/ -->

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
        ${ options.loadingText ? `<h1>${options.loadingText}</h1>` : '' }
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

    <!-- project data & player -->
    <script>
    (function() {

      // ---
      var type = '${result.type}';
      var project = '${result.url}';
      // ---

      var root = document.getElementById('root');
      var progressBar = document.getElementById('progress-bar');
      var splash = document.getElementById('splash');
      var error = document.getElementById('error');
      var bugLink = document.getElementById('error-bug-link');

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
        bugLink.href = createBugLink('Describe what you were doing to cause this error:', '\`\`\`\\n' + P.utils.stringifyError(e) + '\\n\`\`\`');
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
          // post-load script
          ${options.postLoadScript}
          // end script
          splash.style.display = 'none';
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
   * Gets the active options
   * @returns {Options}
   */
  function getOptions() {
    return {
      loadingText: inputLoadingText.value,
      postLoadScript: inputPostLoadScript.value,
    };
  }

  /**
   * Downloads a string to the user's computer
   * @param {string} text The file content
   * @param {string} fileName The name of the downloaded file
   */
  function addDownloadLink(text, fileName) {
    const encoder = new TextEncoder();
    const blob = new Blob([new Uint8Array(encoder.encode(text))]);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.textContent = 'Download ' + fileName;
    link.download = fileName;
    sectionLoading.appendChild(link);
    link.click();
  }

  packageHtml.onclick = function() {
    removeProgressBars();
    loadSourceCache()
      .then(() => getProject(inputProjectId.value))
      .then((result) => {
        const html = getProjectHTML(result);
        addDownloadLink(html, 'project.html');
      });
  };
}());
