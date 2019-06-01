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
  <title>forkphorus</title>
  <style>
    ${cachedSourceFiles.css}
  </style>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
  </style>
</head>

<body>
  <div id="root"></div>

  <!-- forkphrous, and it's dependencies -->
  <script>
    ${cachedSourceFiles.js}
  </script>

  <script>
  (function() {
    // ---
    var type = "${result.type}";
    var project = "${result.data}";
    // ---
    var root = document.getElementById("root");
    fetch(project)
      .then((request) => request.arrayBuffer())
      .then((buffer) => {
        var loader = new P.sb3.SB3FileLoader(buffer);
        return loader.load();
      })
      .then((stage) => {
        root.appendChild(stage.root);
        stage.runtime.start();
        stage.runtime.triggerGreenFlag();
      });
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
