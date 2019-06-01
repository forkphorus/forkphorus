// MIT Licensed.
// https://github.com/forkphorus/sb-downloader

window.SBDL = (function() {
  'use strict';

  // Customizable hooks that can be overridden by other scripts to measure progress.
  const progressHooks = {
    // Indicates a loader has just started
    start() {},
    // Indicates a new task has started.
    newTask() {},
    // Indicates a task has finished
    finishTask() {},
  };

  // Sorts a list of files in-place.
  function sortFiles(files) {
    files.sort((a, b) => {
      const nameA = a.path;
      const nameB = b.path;

      // project.json always the top
      if (nameA === "project.json") {
        return -1;
      } else if (nameB === "project.json") {
        return 1;
      }

      const valueA = +nameA.split('.').shift() || 0;
      const valueB = +nameB.split('.').shift() || 0;

      if (valueA < valueB) {
        return -1;
      } else if (valueA > valueB) {
        return 1;
      }

      // Fallback to just a string compare
      return nameA.localeCompare(nameB);
    });
  }
  
  // Loads a Scratch 1 project
  function loadScratch1Project(id) {
    const PROJECTS_API = 'https://projects.scratch.mit.edu/internalapi/project/$id/get/';
    const HEADER = 'ScratchV01';

    const result = {
      title: id.toString(),
      extension: 'sb',
      // Scratch 1 projects load as buffers because they use a custom format that I don't want to implement.
      // The API only responds with the full file.
      type: 'buffer',
      buffer: null,
    };

    return fetch(PROJECTS_API.replace('$id', id))
      .then((data) => data.arrayBuffer())
      .then((buffer) => {

        // Check that the header matches that of a Scratch 1 project.
        const header = new Uint8Array(buffer.slice(0, HEADER.length));
        for (let i = 0; i < HEADER.length; i++) {
          if (header[i] !== HEADER.charCodeAt(i)) {
            throw new Error('Failed header check, expected ' + HEADER.charCodeAt(i) + ' but got ' + header[i] + ' @ ' + i);
          }
        }

        result.buffer = buffer;
        return result;
      });
  }

  // Loads a scratch 2 project
  function loadScratch2Project(id) {
    const PROJECTS_API = 'https://projects.scratch.mit.edu/internalapi/project/$id/get/';
    const ASSETS_API = 'https://cdn.assets.scratch.mit.edu/internalapi/asset/$path/get/';

    const IMAGE_EXTENSIONS = [
      'svg',
      'png',
    ];
    const SOUND_EXTENSIONS = [
      'wav',
    ];

    const result = {
      title: id.toString(),
      extension: 'sb2',
      files: [],
      type: 'zip',
    };

    // sb2 files have two ways of storing references to files.
    // In the online editor they use md5 hashes which point to an API destination.
    // In the offline editor they use separate accumlative file IDs for images and sounds.
    // The files served from the Scratch API don't contain the file IDs we need to export a valid .sb2, so we must create those ourselves.

    let soundAccumulator = 0;
    let imageAccumulator = 0;
    let projectData = null;

    // Gets the md5 and extension of an object.
    function md5Of(thing) {
      // Search for any of the possible md5 attributes, falling back to just stringifying the input.
      return thing.md5 || thing.baseLayerMD5 || thing.penLayerMD5 || thing.toString();
    }

    function claimAccumlatedID(extension) {
      if (IMAGE_EXTENSIONS.includes(extension)) {
        return imageAccumulator++;
      } else if (SOUND_EXTENSIONS.includes(extension)) {
        return soundAccumulator++;
      } else {
        throw new Error('unknown extension: ' + extension);
      }
    }

    function addAsset(asset) {
      progressHooks.newTask();

      const md5 = asset.md5;
      const extension = asset.extension;
      const accumlator = claimAccumlatedID(extension);
      const path = accumlator + '.' + extension;

      // Update IDs in all references to match the accumulator
      // Downloaded projects usually use -1 for all of these, but sometimes they exist and are just wrong since we're redoing them all.
      for (const reference of asset.references) {
        if ('baseLayerID' in reference) {
          reference.baseLayerID = accumlator;
        }
        if ('soundID' in reference) {
          reference.soundID = accumlator;
        }
        if ('penLayerID' in reference) {
          reference.penLayerID = accumlator;
        }
      }

      return fetch(ASSETS_API.replace('$path', md5))
        .then((request) => request.arrayBuffer())
        .then((buffer) => {
          result.files.push({
            path: path,
            data: buffer,
          });
          progressHooks.finishTask();
        });
    }

    // Processes a list of assets
    // Finds and groups duplicate assets.
    function processAssets(assets) {
      // Records a list of all unique asset md5s and stores all references to an asset.
      const md5s = {};

      for (const data of assets) {
        const md5ext = md5Of(data);
        if (!(md5ext in md5s)) {
          md5s[md5ext] = {
            md5: md5ext,
            extension: md5ext.split('.').pop(),
            references: [],
          };
        }
        md5s[md5ext].references.push(data);
      }

      return Object.values(md5s);
    }

    progressHooks.start();
    progressHooks.newTask();

    return fetch(PROJECTS_API.replace('$id', id))
      .then((request) => request.json())
      .then((pd) => {
        projectData = pd;
        const children = projectData.children.filter((c) => !c.listName && !c.target);
        const targets = [].concat.apply([], [projectData, children]);
        const costumes = [].concat.apply([], targets.map((c) => c.costumes || []));
        const sounds = [].concat.apply([], targets.map((c) => c.sounds || []));
        const assets = processAssets([].concat.apply([], [costumes, sounds, projectData]));
        return Promise.all(assets.map((a) => addAsset(a)));
      })
      .then(() => {
        // We must add the project JSON at the end because it was probably changed during the loading from updating asset IDs
        result.files.push({path: 'project.json', data: JSON.stringify(projectData)});
        sortFiles(result.files);
        progressHooks.finishTask();
        return result;
      });
  }

  // Loads a scratch 3 project
  function loadScratch3Project(id) {
    const PROJECTS_API = 'https://projects.scratch.mit.edu/$id';
    const ASSETS_API = 'https://assets.scratch.mit.edu/internalapi/asset/$path/get/';

    const result = {
      title: id.toString(),
      extension: 'sb3',
      files: [],
      type: 'zip',
    };

    function addFile(data) {
      progressHooks.newTask();
      const path = data.md5ext;
      return fetch(ASSETS_API.replace('$path', path))
        .then((request) => request.arrayBuffer())
        .then((buffer) => {
          result.files.push({path: data.md5ext, data: buffer});
          progressHooks.finishTask();
        });
    }

    // Removes assets with the same ID
    function dedupeAssets(assets) {
      const result = [];
      const knownIds = new Set();

      for (const i of assets) {
        const id = i.assetId;
        if (knownIds.has(id)) {
          continue;
        }
        knownIds.add(id);
        result.push(i);
      }

      return result;
    }

    progressHooks.start();
    progressHooks.newTask();

    return fetch(PROJECTS_API.replace('$id', id))
      .then((request) => request.json())
      .then((projectData) => {
        if (typeof projectData.objName === 'string') {
          throw new Error('Not a Scratch 3 project, found objName (probably a Scratch 2 project)');
        }
        if (!Array.isArray(projectData.targets)) {
          throw new Error('Not a Scratch 3 project, missing targets');
        }

        result.files.push({path: 'project.json', data: JSON.stringify(projectData)});

        const targets = projectData.targets;
        const costumes = [].concat.apply([], targets.map((t) => t.costumes || []));
        const sounds = [].concat.apply([], targets.map((t) => t.sounds || []));
        const assets = dedupeAssets([].concat.apply([], [costumes, sounds]));

        return Promise.all(assets.map((a) => addFile(a)));
      })
      .then(() => {
        sortFiles(result.files);
        progressHooks.finishTask();
        return result;
      });
  }

  // Adds a list of files to a JSZip archive.
  function createArchive(files, zip) {
    for (const file of files) {
      const path = file.path;
      const data = file.data;
      zip.file(path, data);
    }
    return zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
    });
  }

  // Loads a project, automatically choses the loader
  function loadProject(id, type) {
    const loaders = {
      sb: loadScratch1Project,
      sb2: loadScratch2Project,
      sb3: loadScratch3Project,
    };
    type = type.toString();
    if (!(type in loaders)) {
      return Promise.reject('Unknown type: ' + type);
    }
    return loaders[type](id);
  }

  return {
    loadScratch1Project: loadScratch1Project,
    loadScratch2Project: loadScratch2Project,
    loadScratch3Project: loadScratch3Project,
    loadProject: loadProject,
    createArchive: createArchive,
    progressHooks: progressHooks,
  };
}());
