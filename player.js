// @ts-check
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
  function Player(options) {
    options = options || {};

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

    this.totalTasks = 0;
    this.finishedTasks = 0;

    P.IO.progressHooks.new = function() {
      this.totalTasks++;
      this.updateProgressBar();
    }.bind(this);
    P.IO.progressHooks.end = function() {
      this.finishedTasks++;
      this.updateProgressBar();
    }.bind(this);
    P.IO.progressHooks.set = function(progress) {
      this.setProgress(progress);
    }.bind(this);
    P.IO.progressHooks.error = this.handleError.bind(this);

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
  Player.BUG_REPORT_LINK = 'https://github.com/forkphorus/forkphorus/issues/new?title=$title&body=$body';
  Player.LARGE_Z_INDEX = '9999999999';
  Player.UNKNOWN_ID = '(no id)';
  Player.UNKNOWN_LINK = '(no link)';

  /**
   * Internationalization.
   * Maps languages to the strings for that language.
   * When a language has no mapping for a string, it will fallback to english translations.
   */
  Player.i18n = {
    en: {
      'controls.turbo': 'Turbo Mode',
      'controls.flag.title': 'Shift+click to enable turbo mode.',
      'controls.flag.title.enabled': 'Turbo is enabled. Shift+click to disable turbo mode.',
      'controls.flag.title.disabled': 'Turbo is disabled. Shift+click to enable turbo mode.',
      'audio.muted': 'Muted',
      'audio.muted.title': 'Your browser isn\'t allowing us to play audio. You may need to interact with the page before audio can be played.',
      'bug.html': 'An internal error occurred. <a $attrs>Click here</a> to file a bug report.',
      'bug.instructions': 'Describe what you were doing to cause this error:',
      'bug.manual.instructions': 'Describe the issue:',
    },
    es: {
      'controls.turbo': 'Modo Turbo',
      'audio.muted': 'Silenciado',
    },
  };

  /**
   * Determines the type of a project.
   * @param {any} data
   * @returns {2|3|null} 2 for sb2, 3 for sb3, null for uknown
   */
  Player.getProjectType = function(data) {
    if (!data) return null;
    if ('targets' in data) return 3;
    if ('objName' in data) return 2;
    return null;
  };

  /**
   * The user's languages, in order of preference.
   */
  Player.languages = (function() {
    var languages = navigator.languages || [navigator.language];
    var langs = [];
    for (var i = 0; i < languages.length; i++) {
      var value = languages[i].toLowerCase();
      // We don't care about country codes.
      if (value.indexOf('-') !== -1) {
        value = value.substring(0, value.indexOf('-'));
      }
      langs.push(value);
    }
    langs.push('en');
    langs = langs.filter(function(value, index) {
      // removing duplicates
      if (langs.indexOf(value) !== index) return false;
      // removing unrecognized languages
      if (!Player.i18n[value]) return false;
      return true;
    });
    return langs;
  }());

  /**
   * Asserts that a stage is loaded, and throws otherwise.
   */
  Player.prototype.assertStage = function() {
    if (!this.stage) {
      throw new Error('The player does not currently contain a stage to operate on.');
    }
  };

  /**
   * Get a translated string.
   */
  Player.prototype.getString = function(str) {
    for (var i = 0; i < Player.languages.length; i++) {
      var lang = Player.languages[i];
      var messages = Player.i18n[lang];
      if (str in messages) {
        return messages[str];
      }
    }
    throw new Error('Unknown translation string: ' + str);
  };

  /**
   * Add controls to the player.
   * @typedef ControlOptions
   * @property {boolean} [showMutedIndicator]
   * @param {ControlOptions} [options]
   */
  Player.prototype.addControls = function(options) {
    /** @param {MouseEvent} e */
    function clickStop(e) {
      this.assertStage();
      this.pause();
      this.stage.runtime.stopAll();
      this.stage.draw();
      e.preventDefault();
    };

    /** @param {MouseEvent} e */
    function clickPause(e) {
      this.toggleRunning();
    };

    /** @param {MouseEvent} e */
    function clickFullscreen(e) {
      if (this.fullscreen) {
        this.exitFullscreen();
      } else {
        this.enterFullscreen(!e.shiftKey);
      }
    };

    /** @param {MouseEvent} e */
    function clickFlag(e) {
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
    };

    /** @param {MouseEvent} e */
    function startTouchFlag(e) {
      this.flagTouchTimeout = setTimeout(function() {
        this.flagTouchTimeout = true;
        this.setTurbo(!this.stage.runtime.isTurbo);
      }.bind(this), 500);
    }

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
    this.flagButton.title = this.getString('controls.flag.title');
    this.controlsEl.appendChild(this.flagButton);

    this.turboText = document.createElement('span');
    this.turboText.innerText = this.getString('controls.turbo');
    this.turboText.className = 'player-label player-turbo';
    this.controlsEl.appendChild(this.turboText);

    this.fullscreenButton = document.createElement('span');
    this.fullscreenButton.className = 'player-button player-fullscreen-btn';
    this.controlsEl.appendChild(this.fullscreenButton);

    if (options.showMutedIndicator && P.audio.context) {
      this.mutedText = document.createElement('div');
      this.mutedText.innerText = this.getString('audio.muted');
      this.mutedText.title = this.getString('audio.muted.title');
      this.mutedText.className = 'player-label player-muted';
      this.controlsEl.appendChild(this.mutedText);

      P.audio.context.addEventListener('statechange', function() {
        this.root.setAttribute('audio-state', P.audio.context.state);
      }.bind(this));
      this.root.setAttribute('audio-state', P.audio.context.state);
    }

    if (P.config.hasTouchEvents) {
      function preventDefault(e) { e.preventDefault(); }
      this.flagButton.addEventListener('touchstart', startTouchFlag.bind(this));
      this.flagButton.addEventListener('touchend', clickFlag.bind(this));
      this.pauseButton.addEventListener('touchend', clickPause.bind(this));
      this.stopButton.addEventListener('touchend', clickStop.bind(this));
      this.fullscreenButton.addEventListener('touchend', clickFullscreen.bind(this));

      this.flagButton.addEventListener('touchstart', preventDefault);
      this.pauseButton.addEventListener('touchstart', preventDefault);
      this.stopButton.addEventListener('touchstart', preventDefault);
      this.fullscreenButton.addEventListener('touchstart', preventDefault);

      this.root.addEventListener('touchmove', function(e) {
        if (this.fullscreen) e.preventDefault();
      }.bind(this));
    } else {
      this.stopButton.addEventListener('click', clickStop.bind(this));
      this.pauseButton.addEventListener('click', clickPause.bind(this));
      this.flagButton.addEventListener('click', clickFlag.bind(this));
      this.fullscreenButton.addEventListener('click', clickFullscreen.bind(this));
    }

    this.root.insertBefore(this.controlsEl, this.root.firstChild);
  };

  /**
   * Add a progress bar to the player.
   * @typedef ProgressBarOptions
   * @property {'controls'|HTMLElement} [position]
   * @param {ProgressBarOptions} [options]
   */
  Player.prototype.addProgressBar = function(options) {
    options = options || {};

    this.progressBar = document.createElement('div');
    this.progressBar.className = 'player-progress';
    this.progressBar.setAttribute('theme', this.theme);

    this.progressBarFill = document.createElement('div');
    this.progressBarFill.className = 'player-progress-fill';
    this.progressBar.appendChild(this.progressBarFill);

    options.position = options.position || 'controls';

    if (options.position === 'controls') {
      if (!this.controlsEl) {
        throw new Error('No controls to put progess bar in.');
      }
      this.controlsEl.appendChild(this.progressBar);
    } else {
      options.position.appendChild(this.progressBar);
    }
  };

  Player.prototype.updateProgressBar = function() {
    var progress = (this.finishedTasks / this.totalTasks) || 0;
    this.setProgress(progress);
  };

  /**
   * Set the size of the progress bar, if any.
   * @param {number} progress The progress from 0-1
   */
  Player.prototype.setProgress = function(progress) {
    if (this.progressBarFill) {
      this.progressBarFill.style.width = (10 + progress * 90) + '%';
    }
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
        this.flagButton.title = this.getString('controls.flag.title.enabled');
      } else {
        this.flagButton.title = this.getString('controls.flag.title.disabled');
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
  };

  /**
   * Start the runtime's event loop.
   */
  Player.prototype.start = function() {
    this.assertStage();
    this.stage.runtime.start();
    this.root.setAttribute('running', '');
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
    }
  };

  /**
   * Change the visual theme.
   */
  Player.prototype.setTheme = function(theme) {
    this.theme = theme;
    this.root.setAttribute('theme', theme);
    if (this.progressBar) {
      this.progressBar.setAttribute('theme', theme);
    }
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
   * Create a string representation of an error.
   */
  Player.prototype.stringifyError = function(error) {
    if (!error) {
      return 'unknown error';
    }
    if (error.stack) {
      return 'Message: ' + error.message + '\nStack:\n' + error.stack;
    }
    return error.toString();
  };

  Player.prototype.createBugReportLink = function(bodyBefore, bodyAfter) {
    var title = this.getBugReportTitle();
    bodyAfter = bodyAfter || '';
    var body = bodyBefore + '\n\n\n-----\n' + this.getBugReportMeta() + '\n' + bodyAfter;
    return Player.BUG_REPORT_LINK
      .replace('$title', encodeURIComponent(title))
      .replace('$body', encodeURIComponent(body));
  };

  /**
   * Get the title for bug reports.
   */
  Player.prototype.getBugReportTitle = function() {
    return this.projectLink;
  };

  /**
   * Get the metadata to include in bug reports.
   */
  Player.prototype.getBugReportMeta = function() {
    var meta = 'Project URL: ' + this.projectLink + '\n';
    meta += 'Project ID: ' + this.projectId + '\n';
    meta += location.href + '\n';
    meta += navigator.userAgent;
    return meta;
  };

  /**
   * Get the URL to report an error to.
   */
  Player.prototype.createErrorLink = function(error) {
    var body = this.getString('bug.instructions');
    return this.createBugReportLink(body, '```\n' + this.stringifyError(error) + '\n```');
  };

  /**
   * Handle errors and allow creating a bug report.
   */
  Player.prototype.handleError = function(error) {
    console.error(error);
    var errorLink = this.createErrorLink(error);
    var errorEl = document.createElement('div');
    var attributes = 'href="' + errorLink + '" target="_blank" ref="noopener"';
    errorEl.className = 'player-error';
    errorEl.innerHTML = this.getString('bug.html').replace('$attrs', attributes);
    this.addErrorMessage(errorEl);
    if (this.progressBar) {
      this.progressBar.setAttribute('state', 'error');
    }
  };

  /**
   * Add an error report link to the player
   */
  Player.prototype.addErrorMessage = function(element) {
    this.root.appendChild(element);
  };

  /**
   * Completely remove the stage, and restore this player to an (almost) fresh state.
   */
  Player.prototype.cleanup = function() {
    this.totalTasks = 0;
    this.finishedTasks = 0;
    this.stageId++;

    if (this.stage) {
      this.stage.destroy();
      while (this.player.firstChild) {
        this.player.removeChild(this.player.firstChild);
      }
    }

    if (this.fullscreen) {
      this.exitFullscreen();
    }

    this.oncleanup();
  };

  Player.prototype.startLoad = function() {
    if (this.progressBar) {
      this.progressBar.removeAttribute('state');
    }
  };

  /**
   * Start a new Stage in this player.
   * @typedef StageLoadOptions
   * @property {boolean} [start]
   * @property {boolean} [turbo]
   * @param {StageLoadOptions} [stageOptions]
   */
  Player.prototype.loadStage = function(stage, stageOptions) {
    if (!stage) {
      throw new Error('Invalid stage.');
    }
    if (this.progressBar) {
      this.progressBar.setAttribute('state', 'loaded');
    }
    this.root.classList.add('player-has-stage');
    this.stage = stage;
    stage.runtime.handleError = this.handleError.bind(this);
    this.player.appendChild(stage.root);
    stage.focus();
    this.onload(stage);
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
   * Gets the project.json for a project
   */
  Player.prototype.getProjectData = function(id) {
    return new P.IO.JSONRequest(Player.PROJECT_DATA_API.replace('$id', id)).load();
  };

  /**
   * Load a remote project from its ID
   * @param {string} id
   * @param {StageLoadOptions} options
   * @returns {Promise}
   */
  Player.prototype.loadProjectId = function(id, options) {
    this.cleanup();
    this.startLoad();
    var stageId = this.stageId;
    this.projectId = id;
    this.projectLink = Player.PROJECT_LINK.replace('$id', id);
    return this.getProjectData(id)
      .then(function(json) {
        const type = Player.getProjectType(json);
        if (type === 3) {
          return (new P.sb3.Scratch3Loader(json)).load();
        } else if (type === 2) {
          return P.sb2.loadProject(json);
        } else {
          throw new Error('Unknown project type');
        }
      }.bind(this))
      .then(function(stage){
        if (this.stageId !== stageId) {
          return null;
        }
        this.loadStage(stage, options);
        return stage;
      }.bind(this))
      .catch(this.handleError.bind(this))
  };

  /**
   * Load a project from a File object
   * @param {File} file
   * @param {StageLoadOptions} options
   * @returns {Promise}
   */
  Player.prototype.loadProjectFile = function(file, options) {
    var extension = file.name.split('.').pop();
    if (!['sb2', 'sb3'].includes(extension)) {
      throw new Error('Unrecognized file extension: ' + extension);
    }
    this.cleanup();
    this.startLoad();
    var stageId = this.stageId;
    this.projectId = file.name;
    this.projectLink = file.name + '#local';
    return P.IO.readers.toArrayBuffer(file)
      .then(function(buffer) {
        if (extension === 'sb2') {
          return P.sb2.loadSB2Project(buffer);
        } else if (extension === 'sb3') {
          var loader = new P.sb3.SB3FileLoader(buffer);
          return loader.load();
        }
      })
      .then(function(stage) {
        if (this.stageId !== stageId) {
          return null;
        }
        this.loadStage(stage, options);
        return stage;
      }.bind(this))
      .catch(this.handleError.bind(this));
  };

  Player.prototype.onload = function(stage) {};
  Player.prototype.oncleanup = function() {};

  return Player;

}());
