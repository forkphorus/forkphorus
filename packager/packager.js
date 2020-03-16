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
   * @property {string} customStyle
   * @property {boolean} turbo
   * @property {boolean} includeCSP
   * @property {boolean} phonegapEnabled
   * @property {string} phonegapConfig
   * @property {File} phonegapIcon
   */

  const sectionLoading = document.getElementById('loading-section');
  const sectionProjectFile = document.getElementById('project-file-section');
  const sectionProjectId = document.getElementById('project-id-section');
  const packageHtmlButton = /** @type {HTMLButtonElement} */ (document.getElementById('package-html'));
  const inputProjectId = /** @type {HTMLInputElement} */ (document.getElementById('project-id-input'));
  const inputProjectFile = /** @type {HTMLInputElement} */ (document.getElementById('project-file-input'));
  const inputLoadingText = /** @type {HTMLInputElement} */ (document.getElementById('loading-text-input'));
  const inputPostLoadScript = /** @type {HTMLInputElement} */ (document.getElementById('post-load-script-input'));
  const inputCustomStyle = /** @type {HTMLInputElement} */ (document.getElementById('custom-style-input'));
  const inputTurbo = /** @type {HTMLInputElement} */ (document.getElementById('turbo-input'));
  const includeCSP = /** @type {HTMLInputElement} */ (document.getElementById('include-csp'));
  const inputPhoneGapEnabled = /** @type {HTMLInputElement} */ (document.getElementById('phonegap-enabled'));
  const inputPhoneGapConfig = /** @type {HTMLInputElement} */ (document.getElementById('phonegap-config'));
  const inputPhoneGapIcon = /** @type {HTMLInputElement} */ (document.getElementById('phonegap-icon'));
  const phoneGapContainer = /** @type {HTMLElement} */ (document.getElementById('phonegap-container'));

  // Fully disable autocomplete on all inputs
  for (const input of document.getElementsByTagName('input')) {
    input.autocomplete = 'off';
  }

  /**
   * API route to fetch a project, replace $id with project ID.
   */
  const PROJECT_API = 'https://projects.scratch.mit.edu/$id';

  /**
   * File cache
   */
  const fileCache = {
    css: '',
    js: '',
    defaultIcon: null,
  };

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

  /**
   * Fetch a text file
   * @param {string} path
   * @returns {Promise<string>}
   */
  function getFile(path) {
    return fetch(path).then((r) => r.text());
  }

  /**
   * Inlines URLs in a source string with a data: URI
   * @param {string} source
   * @param {string[]} urls
   * @returns {Promise<string>}
   */
  function inlineURLs(source, urls) {
    const promises = urls.map((i) => fetch('../' + i)
      .then((res) => res.blob())
      .then((blob) => readAsURL(blob))
      .then((url) => void (source = source.replace(i, url)))
    );
    return Promise.all(promises).then(_ => source);
  }

  /**
   * Loads forkphorus and its dependencies.
   * @return {Promise<void>}
   */
  function loadSources() {
    const progressBar = createProgressBar('Loading forkphorus');
    const promises = [];
    if (!fileCache.js) {
      promises.push(Promise.all([
        getFile('../lib/jszip.min.js'),
        getFile('../lib/fontfaceobserver.standalone.js'),
        getFile('../lib/stackblur.min.js'),
        getFile('../lib/rgbcolor.js'),
        getFile('../lib/canvg.min.js'),
        getFile('../phosphorus.dist.js'),
      ]).then((sources) => {
        return inlineURLs(sources.join('\n'), [
          'fonts/Knewave-Regular.woff',
          'fonts/Handlee-Regular.woff',
          'fonts/Grand9K-Pixel.ttf',
          'fonts/Griffy-Regular.woff',
          'fonts/SourceSerifPro-Regular.woff',
          'fonts/NotoSans-Regular.woff',
          'fonts/Scratch.ttf',
        ]).then((source) => {
          // TODO: remove this dirty hack
          fileCache.js = source.replace(/P\.audio\.loadSoundbank/g, 'Promise.resolve');
        });
      }));
    }
    if (!fileCache.css) {
      promises.push(Promise.all([
        getFile('../phosphorus.css'),
      ]).then((sources) => {
        return inlineURLs(sources.join('\n'), [
          'fonts/DonegalOne-Regular.woff',
          'fonts/GloriaHallelujah.woff',
          'fonts/MysteryQuest-Regular.woff',
          'fonts/PermanentMarker-Regular.woff',
          'fonts/Scratch.ttf',
        ]).then((source) => {
          fileCache.css = source;
        });
      }));
    }
    if (!fileCache.defaultIcon) {
      promises.push(
        fetch('defaultIcon.png')
          .then((r) => r.blob())
          .then((blob) => {
            fileCache.defaultIcon = blob;
          })
      );
    }
    if (promises.length === 0) {
      progressBar.finish();
      return Promise.resolve();
    }
    return Promise.all(promises).then(_ => undefined);
  }

  /**
   * Determines the project type of a project from scratch.mit.edu
   * @param {string} id The project ID
   * @returns {Promise<'sb2'|'sb3'>}
   * @throws if the project type cannot be determined
   */
  function getProjectTypeById(id) {
    createProgressBar('Determining project type');
    return fetch(PROJECT_API.replace('$id', id))
      .then((r) => r.json())
      .then((data) => {
        currentProgressBar.finish();
        if ('targets' in data) return 'sb3';
        if ('objName' in data) return 'sb2';
        throw new Error('unknown project type');
      });
  }

  /**
   * Converts a File or Blob to a data: URL
   * @param {Blob|File} blob
   * @param {(progress: number) => void} [progressCallback]
   * @returns {Promise<string>}
   */
  function readAsURL(blob, progressCallback) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        if (progressCallback) {
          progressCallback(1);
        }
        resolve(/** @type {string} */ (fileReader.result));
      };
      if (progressCallback) {
        fileReader.onprogress = (e) => {
          if (!e.lengthComputable) return;
          const progress = e.loaded / e.total;
          if (Number.isNaN(progress)) {
            progressCallback(0);
          } else {
            progressCallback(progress);
          }
        };
      };
      fileReader.onerror = (e) => {
        reject('Error reading file');
      };
      fileReader.readAsDataURL(blob);
    })
  }

  /**
   * @param {{path: string, data: any}[]} files Files, compatible with those from an SBDL result
   * @returns {Promise<Blob>} A Blob of the zip
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
  function getProjectById(id) {
    var type = '';
    return getProjectTypeById(id)
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
      .then((blob) => {
        const progressBar = createProgressBar('Reading archive');
        return readAsURL(blob, (progress) => progressBar.percent(progress));
      })
      .then((url) => {
        return {
          url: url,
          type: type,
        };
      });
  }

  /**
   * Reads a file, and converts it to a data: URL
   * @param {File} file The file
   * @returns {Promise<ProjectResult>}
   */
  function getProjectByFile(file) {
    var type;
    const projectTypeProgressBar = createProgressBar('Determining project type');
    return JSZip.loadAsync(file)
      .then((zip) => {
        return zip.file('project.json').async('string');
      })
      .then((json) => {
        json = JSON.parse(json);
        if ('objName' in json) {
          type = 'sb2';
        } else if ('targets' in json) {
          type = 'sb3';
        } else {
          throw new Error('unknown project type (invalid project?)');
        }
        projectTypeProgressBar.finish();
        const progressBar = createProgressBar('Reading project');
        return readAsURL(file, (progress) => progressBar.percent(progress));
      })
      .then((/** @type {string} */ url) => {
        return {
          type,
          url,
        };
      });
  }

  /**
   * Creates the HTML page for a project
   * @param {ProjectResult} result The result of loading the project
   * @param {Options} options The result of loading the project
   * @returns {string}
   */
  function getProjectHTML(result, options) {
    return `<!DOCTYPE html>
<html>

<!-- Generated by the forkphorus packager: https://forkphorus.github.io/packager/ -->
<!-- For help, please post issues on GitHub: https://github.com/forkphorus/forkphorus/issues -->

<head>
  <meta charset="utf-8">
  ${options.includeCSP ? `<meta http-equiv="Content-Security-Policy" content="default-src 'unsafe-inline' 'unsafe-eval' data: blob:">` : ''}
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <!-- forkphorus core CSS -->
  <style>
  ${fileCache.css}
  </style>
  <style>
    body {
      background: #000;
      margin: 0;
      overflow: hidden;
    }
    .player {
      position: absolute;
    }
    .splash, .error {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      display: table;
      color: #fff;
      cursor: default;
    }
    .error {
      display: none;
    }
    .splash > div,
    .error > div {
      display: table-cell;
      height: 100%;
      text-align: center;
      vertical-align: middle;
    }
    .progress {
      width: 80%;
      height: 16px;
      border: 1px solid #fff;
      margin: 0 auto;
    }
    .progress-bar {
      background: #fff;
      width: 10%;
      height: 100%;
    }
    h1 {
      font: 300 72px Helvetica Neue, Helvetica, Arial, sans-serif;
      margin: 0 0 16px;
    }
    p {
      font: 300 24px/1.5 Helvetica Neue, Helvetica, Arial, sans-serif;
      margin: 0;
      color: rgba(255, 255, 255, .6);
    }
    .error a {
      color: #fff;
    }
    /* custom styles: */
    ${options.customStyle}
  </style>
</head>

<body>
  <div class="player"></div>
  <div class="splash">
    <div>
      ${ options.loadingText ? `<h1>${options.loadingText}</h1>` : '' }
      <div class="progress">
        <div class="progress-bar"></div>
      </div>
    </div>
  </div>
  <div class="error">
    <div>
      <h1>Internal Error</h1>
      <p class="error-report"></p>
    </div>
  </div>

  <!-- forkphorus core JS -->
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
  (function () {
    'use strict';

    var splash = document.querySelector('.splash');
    var error = document.querySelector('.error');
    var progressBar = document.querySelector('.progress');
    var progressBarFill = document.querySelector('.progress-bar');

    var splash = document.querySelector('.splash');
    var error = document.querySelector('.error');
    var progressBar = document.querySelector('.progress');
    var progressBarFill = document.querySelector('.progress-bar');

    var player = new P.player.Player();
    var errorHandler = new P.player.ErrorHandler(player, {
      container: document.querySelector('.error-report'),
    });
    player.onprogress.subscribe(function(progress) {
      progressBarFill.style.width = (10 + progress * 90) + '%';
    });
    player.onerror.subscribe(function(e) {
      player.exitFullscreen();
      error.style.display = 'table';
    });
    document.querySelector('.player').appendChild(player.root);

    document.addEventListener('touchmove', function(e) {
      e.preventDefault();
    });

    // ---
    var turbo = ${options.turbo};
    var type = '${result.type}';
    var project = '${result.url}';
    // ---

    fetch(project)
      .then((request) => request.arrayBuffer())
      .then((buffer) => player.loadProjectBuffer(buffer, type, { turbo: turbo }))
      .then(function() {
        player.fullscreenPadding = 0;
        player.enterFullscreen(false);
        splash.style.display = 'none';
        // Custom post load script:
        ${options.postLoadScript}
      });
  }());

  </script>
</body>
</html>`
  }

  /**
   * Gets the active options
   * @returns {Options}
   */
  function getOptions() {
    return {
      loadingText: inputLoadingText.value,
      postLoadScript: inputPostLoadScript.value,
      customStyle: inputCustomStyle.value,
      turbo: inputTurbo.checked,
      includeCSP: includeCSP.checked,
      phonegapEnabled: inputPhoneGapEnabled.checked,
      phonegapConfig: inputPhoneGapConfig.value,
      phonegapIcon: inputPhoneGapIcon.files[0] || fileCache.defaultIcon,
    };
  }

  /**
   * Downloads a string to the user's computer
   * @param {string|Blob} content The file content
   * @param {string} fileName The name of the downloaded file
   */
  function addDownloadLink(content, fileName) {
    function getBlob() {
      if (content instanceof Blob) {
        return content;
      }
      if ('TextEncoder' in window) {
        // firefox, chrome
        const encoder = new TextEncoder();
        return new Blob([encoder.encode(content)]);
      } else {
        // Using TextEncoder is the best method, but Edge doesn't support it.
        const bytes = new Array(content.length);
        for (let i = 0; i < content.length; i++) {
          bytes[i] = content.charCodeAt(i);
        }
        return new Blob([new Uint8Array(bytes)]);
      }
    }
    const link = document.createElement('a');
    const blob = getBlob();
    const size = blob.size / 1024 / 1024;
    link.href = URL.createObjectURL(blob);
    link.textContent = `Download ${fileName} (${size.toFixed(2)} MiB)`;
    link.download = fileName;
    sectionLoading.appendChild(link);
    link.click();
  }

  /**
   * Runs the packager.
   */
  function run() {
    packageHtmlButton.disabled = true;
    removeProgressBars();
    let options;
    return loadSources()
      .then(() => {
        options = getOptions();
        const projectType = /** @type {HTMLInputElement} */ (document.querySelector('input[name=project-type]:checked')).value;
        if (projectType === 'id') {
          return getProjectById(inputProjectId.value);
        } else {
          return getProjectByFile(inputProjectFile.files[0]);
        }
      }).then((result) => {
        const html = getProjectHTML(result, options);
        if (options.phonegapEnabled) {
          // Weird `new Promise` to fix weird complaints from TypeScript
          return new Promise((resolve, reject) => {
            return createArchive([
              { path: 'index.html', data: html, },
              { path: 'config.xml', data: options.phonegapConfig, },
              { path: 'icon.png', data: options.phonegapIcon, },
            ])
              .then((zip) => resolve({name: 'project.zip', data: zip}))
              .catch((err) => reject(err));
          });
        } else {
          return { name: 'project.html', data: html };
        }
      })
      .then((result) => {
        const data = result.data;
        const name = result.name;
        addDownloadLink(data, name);
        packageHtmlButton.disabled = false;
      })
      .catch((err) => {
        alert('Error: ' + err);
        console.error(err);
        packageHtmlButton.disabled = false;
      });
  }

  packageHtmlButton.addEventListener('click', run);

  document.querySelectorAll('input[name=project-type]').forEach((el) => {
    el.addEventListener('click', (e) => {
      sectionProjectFile.hidden = /** @type {HTMLInputElement} */(e.target).value !== 'file';
      sectionProjectId.hidden = /** @type {HTMLInputElement} */(e.target).value !== 'id';
    });
  });

  inputPhoneGapEnabled.addEventListener('change', (e) => {
    phoneGapContainer.dataset.enabled = inputPhoneGapEnabled.checked + '';
  });
  phoneGapContainer.dataset.enabled = inputPhoneGapEnabled.checked + '';
}());
