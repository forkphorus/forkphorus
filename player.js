// @ts-check
// @ts-ignore
var P = P || {};

/**
 * P.Player is a wrapper around forkphorus that makes it easier to use, and provides a proper interface.
 */
P.Player = (function() {
  'use strict';

  /**
   * @class
   * @typedef {Object} PlayerOptions
   * @property {'dark'|'light'} [theme]
   * @param {PlayerOptions} [options]
   */
  var Player = function(options) {
    options = options || {};

    this.onprogress = new P.utils.Slot();
    this.onload = new P.utils.Slot();
    this.onstartload = new P.utils.Slot();
    this.oncleanup = new P.utils.Slot();
    this.onthemechange = new P.utils.Slot();
    this.onerror = new P.utils.Slot();
    this.onstart = new P.utils.Slot();
    this.onpause = new P.utils.Slot();

    this.root = document.createElement('div');
    this.root.className = 'player-root';
    this.setTheme(options.theme || 'light');

    this.player = document.createElement('div');
    this.player.className = 'player-stage';
    this.root.appendChild(this.player);

    this.fullscreen = false;
    this.fullscreenPadding = 8;
    this.fullscreenMaxWidth = Infinity;

    this.stage = null;
    this.stageId = 0;

    this.projectId = Player.UNKNOWN_ID;
    this.projectLink = Player.UNKNOWN_LINK;
    this.projectTitle = Player.UNKNOWN_TITLE;

    window.addEventListener('resize', this.updateFullscreen.bind(this));
    var fullscreenChange = function(e) {
      if (typeof document.fullscreen === 'boolean' && document.fullscreen !== this.fullscreen) {
        this.exitFullscreen();
      }
      // @ts-ignore
      if (typeof document.webkitIsFullScreen === 'boolean' && document.webkitIsFullScreen !== this.fullscreen) {
        this.exitFullscreen();
      }
    }.bind(this);
    document.addEventListener('fullscreenchange', fullscreenChange);
    document.addEventListener('mozfullscreenchange', fullscreenChange);
    document.addEventListener('webkitfullscreenchange', fullscreenChange);
  };

  Player.PROJECT_DATA_API = 'https://projects.scratch.mit.edu/$id';
  Player.PROJECT_LINK = 'https://scratch.mit.edu/projects/$id';
  Player.LARGE_Z_INDEX = '9999999999';
  Player.UNKNOWN_ID = '(no id)';
  Player.UNKNOWN_LINK = '(no link)';
  Player.UNKNOWN_TITLE = '(no title)';

  /**
   * Determines the type of a project.
   * @param {any} data
   * @returns {2|3|null} 2 for sb2, 3 for sb3, null for unknown
   */
  Player.getProjectType = function(data) {
    if (!data) return null;
    if ('targets' in data) return 3;
    if ('objName' in data) return 2;
    return null;
  };

  /**
   * Asserts that a stage is loaded, and throws otherwise.
   */
  Player.prototype.assertStage = function() {
    if (!this.stage) {
      throw new Error('The player does not currently contain a stage to operate on.');
    }
  };

  /**
   * Add controls to the player.
   * @typedef ControlOptions
   * @property {boolean} [showMutedIndicator]
   * @param {ControlOptions} [options]
   */
  Player.prototype.addControls = function(options) {
    var clickStop = /** @param {MouseEvent} e */ function(e) {
      this.assertStage();
      this.pause();
      this.stage.runtime.stopAll();
      this.stage.draw();
      e.preventDefault();
    }.bind(this);

    var clickPause = /** @param {MouseEvent} e */ function(e) {
      this.toggleRunning();
    }.bind(this);

    var clickFullscreen = /** @param {MouseEvent} e */ function(e) {
      this.assertStage();
      if (this.fullscreen) {
        this.exitFullscreen();
      } else {
        this.enterFullscreen(!e.shiftKey);
      }
    }.bind(this);

    var clickFlag = /** @param {MouseEvent} e */ function(e) {
      // @ts-ignore
      if (this.flagTouchTimeout === true) return;
      if (this.flagTouchTimeout) {
        clearTimeout(this.flagTouchTimeout);
      }
      this.assertStage();
      if (e.shiftKey) {
        this.setTurbo(!this.stage.runtime.isTurbo);
      } else {
        this.start();
        this.stage.runtime.stopAll();
        this.stage.runtime.triggerGreenFlag();
      }
      this.stage.focus();
      e.preventDefault();
    }.bind(this);

    var startTouchFlag = /** @param {MouseEvent} e */ function(e) {
      this.flagTouchTimeout = setTimeout(function() {
        this.flagTouchTimeout = true;
        this.setTurbo(!this.stage.runtime.isTurbo);
      }.bind(this), 500);
    }.bind(this);

    if (this.controlsEl) {
      throw new Error('This player already has controls.');
    }
    options = options || {};

    this.controlsEl = document.createElement('div');
    this.controlsEl.className = 'player-controls';

    this.stopButton = document.createElement('span');
    this.stopButton.className = 'player-button player-stop';
    this.controlsEl.appendChild(this.stopButton);

    this.pauseButton = document.createElement('span');
    this.pauseButton.className = 'player-button player-pause';
    this.controlsEl.appendChild(this.pauseButton);

    this.flagButton = document.createElement('span');
    this.flagButton.className = 'player-button player-flag';
    this.flagButton.title = P.i18n.translate('player.controls.flag.title');
    this.controlsEl.appendChild(this.flagButton);

    this.turboText = document.createElement('span');
    this.turboText.innerText = P.i18n.translate('player.controls.turboIndicator');
    this.turboText.className = 'player-label player-turbo';
    this.controlsEl.appendChild(this.turboText);

    this.fullscreenButton = document.createElement('span');
    this.fullscreenButton.className = 'player-button player-fullscreen-btn';
    this.fullscreenButton.title = P.i18n.translate('player.controls.fullscreen.title');
    this.controlsEl.appendChild(this.fullscreenButton);

    if (options.showMutedIndicator && P.audio.context) {
      this.mutedText = document.createElement('div');
      this.mutedText.innerText = P.i18n.translate('player.controls.muted');
      this.mutedText.title = P.i18n.translate('player.controls.muted.title');
      this.mutedText.className = 'player-label player-muted';
      this.controlsEl.appendChild(this.mutedText);

      P.audio.context.addEventListener('statechange', function() {
        this.root.setAttribute('audio-state', P.audio.context.state);
      }.bind(this));
      this.root.setAttribute('audio-state', P.audio.context.state);
    }

    if (P.config.hasTouchEvents) {
      function preventDefault(e) { e.preventDefault(); }
      this.flagButton.addEventListener('touchstart', startTouchFlag);
      this.flagButton.addEventListener('touchend', clickFlag);
      this.pauseButton.addEventListener('touchend', clickPause);
      this.stopButton.addEventListener('touchend', clickStop);
      this.fullscreenButton.addEventListener('touchend', clickFullscreen);

      this.flagButton.addEventListener('touchstart', preventDefault);
      this.pauseButton.addEventListener('touchstart', preventDefault);
      this.stopButton.addEventListener('touchstart', preventDefault);
      this.fullscreenButton.addEventListener('touchstart', preventDefault);

      this.root.addEventListener('touchmove', function(e) {
        if (this.fullscreen) e.preventDefault();
      }.bind(this));
    } else {
      this.stopButton.addEventListener('click', clickStop);
      this.pauseButton.addEventListener('click', clickPause);
      this.flagButton.addEventListener('click', clickFlag);
      this.fullscreenButton.addEventListener('click', clickFullscreen);
    }

    this.root.insertBefore(this.controlsEl, this.root.firstChild);
  };


  /**
   * Changes the turbo state of the stage.
   * @param {boolean} turbo
   */
  Player.prototype.setTurbo = function(turbo) {
    this.assertStage();
    this.stage.runtime.isTurbo = turbo;
    if (turbo) {
      this.root.setAttribute('turbo', '');
    } else {
      this.root.removeAttribute('turbo');
    }
    if (this.flagButton) {
      if (turbo) {
        this.flagButton.title = P.i18n.translate('player.controls.flag.title.enabled');
      } else {
        this.flagButton.title = P.i18n.translate('player.controls.flag.title.disabled');
      }
    }
  };

  /**
   * Pause the runtime's event loop.
   */
  Player.prototype.pause = function() {
    this.assertStage();
    this.stage.runtime.pause();
    this.root.removeAttribute('running');
    this.onpause.emit();
  };

  /**
   * Start the runtime's event loop.
   */
  Player.prototype.start = function() {
    this.assertStage();
    this.stage.runtime.start();
    this.root.setAttribute('running', '');
    this.onstart.emit();
  };

  /**
   * Toggles the project between paused and running.
   */
  Player.prototype.toggleRunning = function() {
    this.assertStage();
    if (this.stage.runtime.isRunning) {
      this.pause();
    } else {
      this.start();
      this.stage.focus();
    }
  };

  /**
   * Change the visual theme.
   */
  Player.prototype.setTheme = function(theme) {
    this.theme = theme;
    this.root.setAttribute('theme', theme);
    this.onthemechange.emit(theme);
  };

  /**
   * Enters fullscreen
   * @param {boolean} realFullscreen Whether we should request full fullscreen that takes the entire monitor, instead of just the page.
   */
  Player.prototype.enterFullscreen = function(realFullscreen) {
    // fullscreen requires dark theme
    this.previousTheme = this.root.getAttribute('theme');
    this.setTheme('dark');

    if (realFullscreen) {
      var el = /** @type {any} */ (this.root);
      if (el.requestFullScreenWithKeys) {
        el.requestFullScreenWithKeys();
      } else if (el.webkitRequestFullScreen) {
        // @ts-ignore
        el.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
      } else if (el.requestFullscreen) {
        el.requestFullscreen();
      }
    }

    document.body.classList.add('player-body-fullscreen');
    this.root.style.zIndex = Player.LARGE_Z_INDEX;
    this.root.setAttribute('fullscreen', '');
    this.fullscreen = true;

    if (this.stage) {
      if (!this.stage.runtime.isRunning) {
        this.stage.draw();
      }
    }
    this.stage.focus();

    this.updateFullscreen();
  };

  /**
   * Exit fullscreen
   */
  Player.prototype.exitFullscreen = function() {
    this.setTheme(this.previousTheme);
    this.root.removeAttribute('fullscreen');
    this.fullscreen = false;
    // @ts-ignore
    if (document.fullscreenElement === this.root || document.webkitFullscreenElement === this.root) {
      // fixing typescript errors
      var d = /** @type {any} */ (document);
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (d.mozCancelFullScreen) {
        d.mozCancelFullScreen();
      } else if (d.webkitCancelFullScreen) {
        d.webkitCancelFullScreen();
      } else if (d.webkitExitFullscreen) {
        d.webkitExitFullscreen();
      }
    }
    this.root.style.paddingLeft = '';
    this.root.style.paddingTop = '';
    this.root.style.zIndex = '';
    if (this.controlsEl) {
      this.controlsEl.style.width = '';
    }
    document.body.classList.remove('player-body-fullscreen');
    if (this.stage) {
      this.stage.setZoom(1);
    }
    this.stage.focus();
  };

  /**
   * Update fullscreen handling.
   */
  Player.prototype.updateFullscreen = function() {
    if (!this.stage) return;
    if (this.fullscreen) {
      var controlsHeight = this.controlsEl ? this.controlsEl.offsetHeight : 0;
      window.scrollTo(0, 0);
      var w = window.innerWidth - this.fullscreenPadding * 2;
      var h = window.innerHeight - this.fullscreenPadding - controlsHeight;
      w = Math.min(w, h / .75);
      w = Math.min(w, this.fullscreenMaxWidth);
      h = w * .75 + controlsHeight;
      if (this.controlsEl) {
        this.controlsEl.style.width = w + 'px';
      }
      this.root.style.paddingLeft = (window.innerWidth - w) / 2 + 'px';
      this.root.style.paddingTop = (window.innerHeight - h - this.fullscreenPadding) / 2 + 'px';
      this.stage.setZoom(w / 480);
    }
  };

  /**
   * Handle errors and allow creating a bug report.
   */
  Player.prototype.handleError = function(error) {
    console.error(error);
    this.onerror.emit(error);
  };

  /**
   * Completely remove the stage, and restore this player to an (almost) fresh state.
   */
  Player.prototype.cleanup = function() {
    this.stageId++;

    this.projectId = Player.UNKNOWN_ID;
    this.projectLink = Player.UNKNOWN_LINK;
    this.projectTitle = Player.UNKNOWN_TITLE;

    if (this.stage) {
      this.stage.destroy();
      this.stage = null;
    }
    while (this.player.firstChild) {
      this.player.removeChild(this.player.firstChild);
    }
    if (this.fullscreen) {
      this.exitFullscreen();
    }

    this.oncleanup.emit();
  };

  Player.prototype.startLoadingNewProject = function() {
    this.cleanup();
    this.onstartload.emit();
  };

  Player.prototype.getNewStageId = function() {
    this.stageId++;
    return this.stageId;
  };

  Player.prototype.isStageActive = function(id) {
    return id === this.stageId;
  };

  /**
   * Start a new Stage in this player.
   * @typedef StageLoadOptions
   * @property {boolean} [start]
   * @property {boolean} [turbo]
   * @param {StageLoadOptions} [stageOptions]
   */
  Player.prototype.installStage = function(stage, stageOptions) {
    if (!stage) {
      throw new Error('Invalid stage.');
    }
    this.stage = stage;
    stage.runtime.handleError = this.handleError.bind(this);
    this.player.appendChild(stage.root);
    stage.focus();
    this.onload.emit(stage);
    this.start();
    stageOptions = stageOptions || {};
    if (stageOptions.start !== false) {
      stage.runtime.triggerGreenFlag();
    }
    if (stageOptions.turbo) {
      stage.runtime.isTurbo = true;
    }
  };

  /**
   * @param {ArrayBuffer} buffer
   */
  Player.prototype.isScratch1Project = function(buffer) {
    var MAGIC = 'ScratchV0';
    var array = new Uint8Array(buffer);
    for (var i = 0; i < MAGIC.length; i++) {
      if (String.fromCharCode(array[i]) !== MAGIC[i]) {
        return false;
      }
    }
    return true;
  };

  // wrappers around P.sb2 and P.sb3 for loading...

  Player.prototype._handleScratch3Loader = function(loader, stageId) {
    loader.onprogress.subscribe(function(progress) {
      if (this.isStageActive(stageId)) {
        this.onprogress.emit(progress);
      } else if (!loader.aborted) {
        loader.abort();
      }
    }.bind(this));
    return loader.load()
      .then(function(stage) {
        if (this.isStageActive(stageId)) return stage;
        return null;
      }.bind(this));
  };

  Player.prototype._handleScratch2Loader = function(stageId, load) {
    var totalTasks = 0;
    var finishedTasks = 0;
    var update = function() {
      if (this.isStageActive(stageId)) {
        var progress = finishedTasks / totalTasks || 0;
        this.onprogress.emit(progress);
      }
    }.bind(this);
    P.sb2.hooks.newTask = function() {
      totalTasks++;
      update();
    }.bind(this);
    P.sb2.hooks.endTask = function() {
      finishedTasks++;
      update();
    }.bind(this);
    return load()
      .then(function(stage) {
        if (this.isStageActive(stageId)) return stage;
        return null;
      }.bind(this));
  };

  Player.prototype._loadScratch3 = function(stageId, data) {
    var loader = new P.sb3.Scratch3Loader(data);
    return this._handleScratch3Loader(loader, stageId);
  };

  Player.prototype._loadScratch3File = function(stageId, buffer) {
    var loader = new P.sb3.SB3FileLoader(buffer);
    return this._handleScratch3Loader(loader, stageId);
  };

  Player.prototype._loadScratch2 = function(stageId, data) {
    return this._handleScratch2Loader(stageId, function() {
      return P.sb2.loadProject(data);
    });
  };

  Player.prototype._loadScratch2File = function(stageId, data) {
    return this._handleScratch2Loader(stageId, function() {
      return P.sb2.loadSB2Project(data);
    });
  };

  // The main methods you should use for loading things...

  /**
   * Load a remote project from its ID
   * @param {string} id
   * @param {StageLoadOptions} options
   * @returns {Promise}
   */
  Player.prototype.loadProjectId = function(id, options) {
    this.startLoadingNewProject();
    var stageId = this.getNewStageId();

    this.projectId = '' + id;
    this.projectLink = Player.PROJECT_LINK.replace('$id', id);

    var blob;
    return new P.IO.BlobRequest(Player.PROJECT_DATA_API.replace('$id', id)).load()
      .then(function(data) {
        blob = data;
        return P.IO.readers.toText(blob);
      }.bind(this))
      .then(function(text) {
        if (!this.isStageActive(stageId)) {
          return null;
        }
        try {
          var json = JSON.parse(text);
          var type = Player.getProjectType(json);
          if (type === 3) {
            return this._loadScratch3(stageId, json);
          } else if (type === 2) {
            return this._loadScratch2(stageId, json);
          } else {
            throw new Error('Project is valid JSON but of unknown type');
          }
        } catch (e) {
          // not json, but could be a zipped sb2
          return P.IO.readers.toArrayBuffer(blob)
            .then(function(buffer) {
              if (this.isScratch1Project(buffer)) {
                throw new P.Player.ProjectNotSupportedError('.sb / Scratch 1');
              }
              return P.sb2.loadSB2Project(buffer);
            }.bind(this));
        }
      }.bind(this))
      .then(function(stage) {
        if (stage) {
          this.installStage(stage, options);
        }
      }.bind(this))
      .catch(function(error) {
        if (this.isStageActive(stageId)) {
          this.handleError(error);
        }
      }.bind(this));
  };

  /**
   * Load a project from an ArrayBuffer of the compressed project.
   * @param {ArrayBuffer} buffer
   * @param {'sb2'|'sb3'} type
   * @param {StageLoadOptions} options
   */
  Player.prototype.loadProjectBuffer = function(buffer, type, options) {
    this.startLoadingNewProject();
    var stageId = this.getNewStageId();

    var startLoad = function() {
      if (type === 'sb3') {
        return this._loadScratch3File(stageId, buffer);
      } else if (type === 'sb2') {
        return this._loadScratch2File(stageId, buffer);
      } else {
        throw new Error('Unknown type: ' + type);
      }
    }.bind(this);

    return startLoad()
      .then(function(stage) {
        if (stage) {
          this.installStage(stage, options);
        }
      }.bind(this))
      .catch(function(error) {
        if (this.isStageActive(stageId)) {
          this.handleError(error);
        }
      }.bind(this));
  };

  /**
   * Load a project from a File or Blob of the compressed project.
   * @param {File} file
   * @param {StageLoadOptions} options
   * @returns {Promise}
   */
  Player.prototype.loadProjectFile = function(file, options) {
    var extension = file.name.split('.').pop();
    if (!['sb2', 'sb3'].includes(extension)) {
      throw new Error('Unrecognized file extension: ' + extension);
    }

    this.startLoadingNewProject();
    // we won't use this one, we just want to invalidate anything else
    this.getNewStageId();

    this.projectId = file.name;
    this.projectLink = file.name + '#local';

    return P.IO.readers.toArrayBuffer(file)
      .then(function(buffer) {
        return this.loadProjectBuffer(buffer, extension, options);
      }.bind(this));
  };

  return Player;

}());

/**
 * An error that indicates that this project type is knowingly not supported.
 * @param {string} type A description of the type of project
 */
P.Player.ProjectNotSupportedError = function(type) {
  this.type = type;
  this.message = 'Project type (' + type + ') is not supported';
  this.stack = new Error().stack;
};
P.Player.ProjectNotSupportedError.prototype = new Error();
P.Player.ProjectNotSupportedError.prototype.name = 'ProjectNotSupportedError';

P.Player.ErrorHandler = (function() {
  /**
   * @typedef ErrorHandlerOptions
   * @property {HTMLElement} [container]
   */

  /**
   * @class
   * @param {ErrorHandlerOptions} options
   */
  var ErrorHandler = function(player, options) {
    options = options || {};

    this.player = player;
    player.onerror.subscribe(this.onerror.bind(this));
    player.oncleanup.subscribe(this.oncleanup.bind(this));
    this.errorEl = null;

    if (options.container) {
      this.errorContainer = options.container;
    } else {
      this.errorContainer = null;
    }
  };

  ErrorHandler.BUG_REPORT_LINK = 'https://github.com/forkphorus/forkphorus/issues/new?title=$title&body=$body';

  /**
   * Create a string representation of an error.
   */
  ErrorHandler.prototype.stringifyError = function(error) {
    if (!error) {
      return 'unknown error';
    }
    if (error.stack) {
      return 'Message: ' + error.message + '\nStack:\n' + error.stack;
    }
    return error.toString();
  };

  /**
   * Generate the link to report a bug to, including title and metadata.
   * @param {string} bodyBefore Text to appear before metadata
   * @param {string} bodyAfter Text to appear after metadata
   */
  ErrorHandler.prototype.createBugReportLink = function(bodyBefore, bodyAfter) {
    var title = this.getBugReportTitle();
    bodyAfter = bodyAfter || '';
    var body = bodyBefore + '\n\n\n-----\n' + this.getBugReportMetadata() + '\n' + bodyAfter;
    return ErrorHandler.BUG_REPORT_LINK
      .replace('$title', encodeURIComponent(title))
      .replace('$body', encodeURIComponent(body));
  };

  /**
   * Get the title for bug reports.
   */
  ErrorHandler.prototype.getBugReportTitle = function() {
    if (this.player.projectTitle !== P.Player.UNKNOWN_TITLE) {
      return this.player.projectTitle + ' (' + this.player.projectId + ')';
    }
    return this.player.projectLink;
  };

  /**
   * Get the metadata to include in bug reports.
   */
  ErrorHandler.prototype.getBugReportMetadata = function() {
    var meta = 'Project URL: ' + this.player.projectLink + '\n';
    meta += 'Project ID: ' + this.player.projectId + '\n';
    meta += location.href + '\n';
    meta += navigator.userAgent;
    return meta;
  };

  /**
   * Get the URL to report an error to.
   */
  ErrorHandler.prototype.createErrorLink = function(error) {
    var body = P.i18n.translate('report.crash.instructions');
    return this.createBugReportLink(body, '```\n' + this.stringifyError(error) + '\n```');
  };

  ErrorHandler.prototype.oncleanup = function() {
    if (this.errorEl && this.errorEl.parentNode) {
      this.errorEl.parentNode.removeChild(this.errorEl);
      this.errorEl = null;
    }
  };

  /**
   * Create an error element indicating that forkphorus has crashed, and where to report the bug.
   */
  ErrorHandler.prototype.createErrorElement = function(error) {
    var errorLink = this.createErrorLink(error);
    var el = document.createElement('div');
    var attributes = 'href="' + errorLink + '" target="_blank" ref="noopener"';
    el.className = 'player-error';
    // use of innerHTML intentional
    el.innerHTML = P.i18n.translate('report.crash.html').replace('$attrs', attributes);
    return el;
  };

  /**
   * Create an error element indicating this project is not supported.
   */
  ErrorHandler.prototype.projectNotSupportedError = function(error) {
    var el = document.createElement('div');
    el.className = 'player-error';
    // use of innerHTML intentional
    el.innerHTML = P.i18n.translate('report.crash.unsupported').replace('$type', error.type);
    return el;
  };

  ErrorHandler.prototype.onerror = function(error) {
    var el;
    if (error instanceof P.Player.ProjectNotSupportedError) {
      el = this.projectNotSupportedError(error);
    } else {
      el = this.createErrorElement(error);
    }
    if (this.errorContainer) {
      this.errorContainer.appendChild(el);
    } else if (this.player.stage) {
      this.player.stage.ui.appendChild(el);
    } else {
      this.player.player.appendChild(el);
    }
    this.errorEl = el;
  };

  return ErrorHandler;
}());

P.Player.ProgressBar = (function() {
  /**
   * @typedef ProgressBarOptions
   * @property {'controls'|HTMLElement} [position]
   */

  /**
   * @class
   * @param {ProgressBarOptions} options
   */
  var ProgressBar = function(player, options) {
    options = options || {};
    options.position = options.position || 'controls';

    this.el = document.createElement('div');
    this.el.className = 'player-progress';
    this.bar = document.createElement('div');
    this.bar.className = 'player-progress-fill';
    this.el.appendChild(this.bar);

    this.setTheme(player.theme);
    player.onthemechange.subscribe(this.setTheme.bind(this));

    player.onstartload.subscribe(function() {
      this.el.setAttribute('state', 'loading');
      this.setProgress(0);
    }.bind(this));

    player.onload.subscribe(function() {
      this.el.setAttribute('state', 'loaded');
    }.bind(this));

    player.onprogress.subscribe(this.setProgress.bind(this));

    player.oncleanup.subscribe(function() {
      this.el.setAttribute('state', '');
      this.bar.style.width = '0%';
    }.bind(this));

    player.onerror.subscribe(function() {
      this.el.setAttribute('state', 'error');
      this.bar.style.width = '100%';
    }.bind(this));

    if (options.position === 'controls') {
      if (!player.controlsEl) {
        throw new Error('No controls to put progess bar in.');
      }
      player.controlsEl.appendChild(this.el);
    } else {
      options.position.appendChild(this.el);
    }
  };

  ProgressBar.prototype.setTheme = function(theme) {
    this.el.setAttribute('theme', theme);
  };

  ProgressBar.prototype.setProgress = function(progress) {
    this.bar.style.width = (10 + progress * 90) + '%';
  };

  return ProgressBar;
}());
