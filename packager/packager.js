const sectionLoading = document.getElementById('section-loading');
const sectionLoaded = document.getElementById('section-loaded');
const sectionLoadingProgress = document.getElementById('section-loading-progress');
const packageHtml = document.getElementById('package-html');
const inputProjectId = document.getElementById('input-project');

const PROJECT_API = 'https://projects.scratch.mit.edu/$1';

const cachedSourceFiles = {
  css: '',
  js: '',
};

var totalTasks = 0;
var finishedTasks = 0;
function updateLoadingProgressBar() {
  if (totalTasks === 0) {
    sectionLoadingProgress.value = 0;
  } else {
    sectionLoadingProgress.value = finishedTasks / totalTasks;
  }
}
function resetLoadingProgress() {
  totalTasks = 0;
  finishedTasks = 0;
  updateLoadingProgressBar();
}

function showLoadingProgress() {
  sectionLoading.style.display = 'block';
}
function hideLoadingProgress() {
  sectionLoading.style.display = 'none';
}
function showContent() {
  sectionLoaded.style.display = 'block';
}

SBDL.progressHooks.start = function() {
  resetLoadingProgress();
  showLoadingProgress();
};
SBDL.progressHooks.newTask = function() {
  totalTasks++;
  updateLoadingProgressBar();
};
SBDL.progressHooks.finishTask = function() {
  finishedTasks++;
  updateLoadingProgressBar();
};

/**
 * Fetch a text file
 */
function getFile(path) {
  totalTasks++;
  return fetch(path)
    .then((r) => r.text())
    .then((t) => {
      finishedTasks++;
      updateLoadingProgressBar();
      return t;
    });
}

/**
 * Begins loading the script cache
 */
function loadSourceCache() {
  resetLoadingProgress();
  const jsFiles = [
    getFile('../lib/fontfaceobserver.standalone.js'),
    getFile('../lib/jszip.min.js'),
    getFile('../lib/rgbcolor.js'),
    getFile('../lib/StackBlur.js'),
    getFile('../lib/canvg.js'),
    getFile('../phosphorus.dist.js'),
  ];
  const cssFiles = [
    getFile('../phosphorus.css'),
  ];
  updateLoadingProgressBar();
  const jsPromise = Promise.all(jsFiles).then((sources) => cachedSourceFiles.js = sources.join('\n'));
  const cssPromise = Promise.all(cssFiles).then((sources) => cachedSourceFiles.css = sources.join('\n'));
  return Promise.all([jsPromise, cssPromise])
    .then(() => {
      hideLoadingProgress();
      showContent();
    });
}

/**
 * Determines the project type of a project from scratch.mit.edu
 * @returns 'sb2' or 'sb3'
 */
function getProjectType(id) {
  return fetch(PROJECT_API.replace('$1', id))
    .then((r) => r.json())
    .then((data) => {
      if ('targets' in data) return 'sb3';
      if ('objName' in data) return 'sb2';
      throw new Error('unknown project type');
    });
}

/**
 * Converts a Blob to a data: URL
 */
function blobToURL(blob) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.readAsDataURL(blob);
  })
}

/**
 * Fetches a project, and converts its zip archive to a data: URL
 */
function getProject(id) {
  var type = '';
  return getProjectType(id)
    .then((t) => {
      type = t;
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
      hideLoadingProgress();
      return {
        data: url,
        type: type,
      };
    })
}

/**
 * Creates the HTML page appropriate for a project
 */
function getProjectHTML(id) {
  return getProject(id)
    .then((result) => {
      return `<!DOCTYPE html>
<html>

<head>
  <style>
    ${cachedSourceFiles.css}
  </style>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    #splash, #error {
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
    ${cachedSourceFiles.js}
  </script>

  <!-- special hooks for NW.js -->
  <script>
    if (typeof nw !== 'undefined') {
      nw.Window.get().on('new-win-policy', (frame, url, policy) => {
        policy.ignore();
        nw.Shell.openExternal(url);
      });
    }
  </script>

  <script>
  (function() {

    // ---
    var type = "${result.type}";
    var project = "${result.data}";
    // ---

    var root = document.getElementById("root");
    var progressBar = document.getElementById("progress-bar");
    var splash = document.getElementById("splash");
    var error = document.getElementById("error");
    var bugLink = document.getElementById("error-bug-link");

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
      .then((stage) => {
        splash.style.display = "none";
        root.appendChild(stage.root);
        stage.runtime.handleError = showError;
        stage.runtime.start();
        stage.runtime.triggerGreenFlag();
        stage.focus();
      })
      .catch((err) => showError(err));
  }());
  </script>
</body>

</html>
`})
}

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
  getProjectHTML(inputProjectId.value)
    .then((r) => {
      downloadText(r, 'project.html');
    });
}

// Start by fetching the files we need
loadSourceCache();
