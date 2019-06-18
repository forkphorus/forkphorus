// @ts-check
var P = P || {};

/**
 * P.Player is a wrapper around forkphorus that makes it easier to use, and provides a proper interface.
 */
P.Player = (function() {
  'use strict';

  /**
   * @typedef {Object} PlayerOptions
   * @property {'dark'|'light'} [theme]
   * @param {PlayerOptions} [options]
   */
  function Player(options) {
    options = options || {};

    this._messages = Player.getLocalization();

    /**
     * The root HTML element.
     */
    this.root = document.createElement('div');
    this.root.className = 'player-root';
    this.setTheme(options.theme || 'light');

    /**
     * The HTML element that the stage will be contained in.
     */
    this.player = document.createElement('div');
    this.player.className = 'player-stage';
    this.root.appendChild(this.player);

    /**
     * Is this player in some form of fullscreen?
     */
    this.fullscreen = false;

    /**
     * The stage this player is running, if any.
     */
    this.stage = null;

    this.projectId = Player.UNKNOWN_ID;
    this.projectLink = Player.UNKNOWN_LINK;

    this.totalTasks = 0;
    this.finishedTasks = 0;

    window.addEventListener('resize', this.updateFullscreen.bind(this));
    document.addEventListener('fullscreenchange', function() {
      if (this.fullscreen !== document.fullscreen) {
        this.exitFullscreen();
      }
    }.bind(this));
    document.addEventListener('mozfullscreenchange', function() {
      if (this.fullscreen !== document.fullscreen) {
        this.exitFullscreen();
      }
    }.bind(this));
    document.addEventListener('webkitfullscreenchange', function() {
      if (this.fullscreen !== document.fullscreen) {
        this.exitFullscreen();
      }
    }.bind(this));
  };

  Player.PROJECT_API = 'https://projects.scratch.mit.edu/$id';
  Player.PROJECT_LINK = 'https://scratch.mit.edu/projects/$id';
  Player.BUG_REPORT_LINK = 'https://github.com/forkphorus/forkphorus/issues/new?title=$title&body=$body';
  Player.LARGE_Z_INDEX = '9999999999';
  Player.UNKNOWN_ID = '(no id)';
  Player.UNKNOWN_LINK = '(no link)';

  /**
   * Determines the type of a project.
   * @param {any} data
   * @returns {2|3|null} 2 for sb2, 3 for sb3, null for uknown
   */
  Player.getProjectType = function(data) {
    if ('targets' in data) return 3;
    if ('objName' in data) return 2;
    return null;
  };

  /**
   * The user's languages.
   */
  Player.languages = (function() {
    var languages = /** @type {string[]} */ (navigator.languages) || [navigator.language];
    languages = languages.reduce(function(accumulator, value) {
      value = value.toLowerCase();
      accumulator.push(value);
      // if it has a country code, also push a non-country code version after
      if (value.indexOf('-') !== -1) accumulator.push(value.substring(0, value.indexOf('-')));
      return accumulator;
    }, []);
    // remove duplicates
    languages = languages.filter(function(value, index) {
      return languages.indexOf(value) === index;
    });
    return languages;
  }());

  /**
   * Gets the localization strings for the user's language
   */
  Player.getLocalization = function() {
    var languages = Player.languages;
    for (var i = 0; i < languages.length; i++) {
      var language = languages[i].substring(0, 2).toLowerCase();
      var messages = Player.i18n[language];
      if (messages) {
        // By setting the prototype to the en translations, missing strings won't appear as 'undefined'
        // but rather by their english translation
        if (language !== 'en') {
          Object.setPrototypeOf(messages, Player.i18n['en']);
        }
        return messages;
      }
    }
    return Player.i18n['en'];
  };

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
    },
    es: {
      'controls.turbo': 'Modo Turbo',
      'audio.muted': 'Silenciado',
    },
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
   * Get a translation string.
   */
  Player.prototype.getString = function(str) {
    if (this._messages[str]) {
      return this._messages[str];
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
      this.start();
      this.stage.runtime.stopAll();
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
    this.controlsEl.className = 'player-button player-controls';

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

    if (options.showMutedIndicator !== false && P.audio.context) {
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
   * @property {boolean} [transition]
   * @param {ProgressBarOptions} [options]
   */
  Player.prototype.addProgressBar = function(options) {
    options = options || {};

    this.progressContainer = document.createElement('div');
    this.progressContainer.className = 'player-progress';
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'player-progress-bar';
    this.progressContainer.appendChild(this.progressBar);

    options.position = options.position || 'controls';

    if (options.position === 'controls') {
      if (!this.controlsEl) {
        throw new Error('No controls to put progess bar in.');
      }
      this.controlsEl.appendChild(this.progressContainer);
    }

    function newTask() {
      this.totalTasks++;
      this.updateProgressBar();
    }
    function endTask() {
      this.finishedTasks++;
      this.updateProgressBar();
    }
    function set(progress) {
      // We'll ignore this for now.
      // this.totalTasks = 1;
      // this.finishedTasks = progress;
      // this.updateProgressBar();
    }

    P.IO.progressHooks.new = newTask.bind(this);
    P.IO.progressHooks.end = endTask.bind(this);
    P.IO.progressHooks.set = set.bind(this);
    P.IO.progressHooks.error = this.handleError.bind(this);
  };

  Player.prototype.updateProgressBar = function() {
    var progress = this.finishedTasks / this.totalTasks;
    if (isNaN(progress)) {
      progress = 0;
    }
    this.progressBar.style.width = (10 + progress * 90) + '%';
  };

  Player.prototype.resetLoading = function() {
    this.totalTasks = 0;
    this.finishedTasks = 0;
    if (this.progressContainer) {
      this.progressContainer.removeAttribute('loaded');
      this.updateProgressBar();
    }
  }

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
   * Changes the running state of the stage
   * @param {boolean} running
   */
  Player.prototype.setRunning = function(running) {
    this.assertStage();
    if (running) {
      this.stage.runtime.start();
      this.root.setAttribute('running', '');
    } else {
      this.stage.runtime.pause();
      this.root.removeAttribute('running');
    }
  };

  /**
   * Pause the project.
   */
  Player.prototype.pause = function() {
    this.setRunning(false);
  };

  /**
   * Start the project.
   */
  Player.prototype.start = function() {
    this.setRunning(true);
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
    if (document.fullscreenElement === this.root) {
      // fixing typescript errors
      var d = /** @type {any} */ (document);
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (d.mozCancelFullScreen) {
        d.mozCancelFullScreen();
      } else if (d.webkitCancelFullScreen) {
        d.webkitCancelFullScreen();
      }
    }
    this.root.style.paddingLeft = '';
    this.root.style.paddingTop = '';
    this.root.style.zIndex = '';
    this.controlsEl.style.width = '';
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
      window.scrollTo(0, 0);
      var padding = 8;
      var w = window.innerWidth - padding * 2;
      var h = window.innerHeight - padding - this.controlsEl.offsetHeight;
      w = Math.min(w, h / .75);
      h = w * .75 + this.controlsEl.offsetHeight;
      this.controlsEl.style.width = w + 'px';
      this.root.style.paddingLeft = (window.innerWidth - w) / 2 + 'px';
      this.root.style.paddingTop = (window.innerHeight - h - padding) / 2 + 'px';
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

  Player.prototype.createBugReportLink = function(title, body) {
    return Player.BUG_REPORT_LINK
      .replace('$title', encodeURIComponent(title))
      .replace('$body', encodeURIComponent(body));
  };

  Player.prototype.getBugReportTitle = function() {
    return this.projectLink;
  };

  Player.prototype.getBugReportMeta = function() {
    var meta = 'Project URL: ' + this.projectLink + '\n';
    meta += 'Project ID: ' + this.projectId + '\n';
    meta += location.href + '\n';
    meta += navigator.userAgent + '\n';
    return meta;
  }

  Player.prototype.createErrorLink = function(error) {
    var body = this.getString('bug.instructions');
    body += '\n\n\n-----\n' + this.getBugReportMeta();
    body += '```\n' + this.stringifyError(error) + '\n```';
    return this.createBugReportLink(this.getBugReportTitle(), body);
  };

  /**
   * Handles errors from the runtime.
   */
  Player.prototype.handleError = function(error) {
    console.error(error);
    var errorLink = this.createErrorLink(error);
    var errorEl = document.createElement('div');
    var attributes = 'href="' + errorLink + '" target="_blank" ref="noopener"';
    errorEl.className = 'player-error';
    errorEl.innerHTML = this.getString('bug.html').replace('$attrs', attributes);
    this.root.appendChild(errorEl);
  };

  /**
   * Completely remove the existing stage.
   */
  Player.prototype.destroyStage = function() {
    this.assertStage();
    this.stage.destroy();
    while (this.player.firstChild) {
      this.player.removeChild(this.player.firstChild);
    }
  };

  /**
   * Start a new Stage in this player.
   */
  Player.prototype.startStage = function(stage) {
    if (!stage) {
      throw new Error('Stage is not valid');
    }
    if (this.progressContainer) {
      this.progressContainer.setAttribute('loaded', '');
    }
    this.stage = stage;
    stage.runtime.handleError = this.handleError.bind(this);
    this.player.appendChild(stage.root);
    stage.focus();
    this.start();
    stage.runtime.triggerGreenFlag();
  };

  /**
   * Gets the project.json for a project
   */
  Player.prototype.getProjectData = function(id) {
    return new P.IO.JSONRequest(Player.PROJECT_API.replace('$id', id)).load();
  };

  /**
   * Load a remote project from its ID
   * @param {string} id
   * @returns {Promise<void>}
   */
  Player.prototype.loadProjectId = function(id) {
    if (this.stage) {
      this.destroyStage();
    }
    this.projectId = id;
    this.projectLink = Player.PROJECT_LINK.replace('$id', id);
    this.resetLoading();
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
        this.startStage(stage);
      }.bind(this));
  };

  return Player;

}());
