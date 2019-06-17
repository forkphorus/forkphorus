// @ts-check
var P = P || {};

P.Player = (function() {
  'use strict';

  /**
   * @typedef {Object} PlayerOptions
   * @property {boolean} showControls
   * @property {'dark'|'light'} theme
   */

  /**
   * Wrapper around forkphorus to make playing projects easier and have an actual interface.
   * You should always use player.* instead of player.stage.* when possible to keep the interface in sync.
   * @param {PlayerOptions} options
   */
  function Player(options) {
    options = Object.setPrototypeOf(options, Player.DEFAULT_OPTIONS);

    this._messages = Player.getLocalization();

    /**
     * The root HTML element.
     */
    this.root = document.createElement('div');
    this.root.className = 'player-root';
    this.root.setAttribute('theme', options.theme);
    this.root.setAttribute('controls', options.showControls);
    this.root.setAttribute('turbo', 'false');
    this.root.setAttribute('running', 'false');
    this.fullscreen = false;

    this.stage = null;

    if (options.showControls) {
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

      if (P.audio.context) {
        this.mutedText = document.createElement('div');
        this.mutedText.innerText = this.getString('audio.muted');
        this.mutedText.className = 'player-label player-muted';
        this.controlsEl.appendChild(this.mutedText);

        P.audio.context.addEventListener('statechange', function() {
          this.root.setAttribute('audio-state', P.audio.context.state);
        }.bind(this));
        this.root.setAttribute('audio-state', P.audio.context.state);
      }

      if (P.config.hasTouchEvents) {
        function preventDefault(e) { e.preventDefault(); }
        this.flagButton.addEventListener('touchstart', this.startTouchFlag.bind(this));
        this.flagButton.addEventListener('touchend', this.clickFlag.bind(this));
        this.pauseButton.addEventListener('touchend', this.clickPause.bind(this));
        this.stopButton.addEventListener('touchend', this.clickStop.bind(this));
        this.fullscreenButton.addEventListener('touchend', this.clickFullscreen.bind(this));

        this.flagButton.addEventListener('touchstart', preventDefault);
        this.pauseButton.addEventListener('touchstart', preventDefault);
        this.stopButton.addEventListener('touchstart', preventDefault);
        this.fullscreenButton.addEventListener('touchstart', preventDefault);

        this.root.addEventListener('touchmove', function(e) {
          if (this.fullscreen) e.preventDefault();
        }.bind(this));
      } else {
        this.stopButton.addEventListener('click', this.clickStop.bind(this));
        this.pauseButton.addEventListener('click', this.clickPause.bind(this));
        this.flagButton.addEventListener('click', this.clickFlag.bind(this));
        this.fullscreenButton.addEventListener('click', this.clickFullscreen.bind(this));
      }

      this.root.appendChild(this.controlsEl);
    }

    window.addEventListener('resize', this.updateFullscreen.bind(this));

    /**
     * The HTML element that the project will use.
     */
    this.player = document.createElement('div');
    this.player.className = 'player-stage';
    this.root.appendChild(this.player);
  };

  /**
   * The default options.
   * @type {PlayerOptions}
   */
  Player.DEFAULT_OPTIONS = {
    showControls: true,
    theme: 'light',
  };

  /**
   * The API route to download projects from, where $id is replaced with the project's ID.
   */
  Player.PROJECT_API = 'https://projects.scratch.mit.edu/$id';

  /**
   * A large z-index that should place the player above anything else.
   */
  Player.Z_INDEX = '9999999999';

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
  }

  /**
   * Changes the turbo state of the stage.
   * @param {boolean} turbo
   */
  Player.prototype.setTurbo = function(turbo) {
    this.assertStage();
    this.stage.runtime.isTurbo = turbo;
    this.root.setAttribute('turbo', '' + turbo);
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
    } else {
      this.stage.runtime.pause();
    }
    this.root.setAttribute('running', '' + running);
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
   * Enters fullscreen
   * @param {boolean} realFullscreen Whether we should request full fullscreen that takes the entire monitor, instead of just the page.
   */
  Player.prototype.enterFullscreen = function(realFullscreen) {
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
    } else {
      document.body.classList.add('player-body-fullscreen');
      this.root.style.zIndex = Player.Z_INDEX;
    }
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
    this.root.style.width = '';
    this.root.style.height = '';
    this.root.style.zIndex = '';
    this.controlsEl.style.width = '';
    this.controlsEl.style.height = '';
    document.body.classList.remove('player-body-fullscreen');
    if (this.stage) {
      this.stage.setZoom(1);
    }
  };

  Player.prototype.updateFullscreen = function() {
    if (!this.stage) return;
    if (this.fullscreen) {
      window.scrollTo(0, 0);
      var padding = 8;
      var w = window.innerWidth - padding * 2;
      var h = window.innerHeight - padding - this.controlsEl.offsetHeight;
      w = Math.min(w, h / .75);
      h = w * .75 + this.controlsEl.offsetHeight;
      this.root.style.width = w + 'px';
      this.root.style.height = h + 'px';
      this.controlsEl.style.width = this.root.style.width;
      this.root.style.paddingLeft = (window.innerWidth - w) / 2 + 'px';
      this.root.style.paddingTop = (window.innerHeight - h - padding) / 2 + 'px';
      this.stage.setZoom(w / 480);
    }
  };

  /**
   * @param {MouseEvent} e
   */
  Player.prototype.clickStop = function(e) {
    this.assertStage();
    this.start();
    this.stage.runtime.stopAll();
    e.preventDefault();
  };

  /**
   * @param {MouseEvent} e
   */
  Player.prototype.clickPause = function(e) {
    this.toggleRunning();
  };

  /**
   * @param {MouseEvent} e
   */
  Player.prototype.clickFullscreen = function(e) {
    if (this.fullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen(!e.shiftKey);
    }
  };

  /**
   * @param {MouseEvent} e
   */
  Player.prototype.clickFlag = function(e) {
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

  /**
   * @param {TouchEvent} e
   */
  Player.prototype.startTouchFlag = function(e) {
    this.flagTouchTimeout = setTimeout(function() {
      this.flagTouchTimeout = true;
      this.setTurbo(!this.stage.runtime.isTurbo);
    }.bind(this), 500);
  }

  Player.prototype.handleError = function(error) {
    console.error(error);
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

  Player.prototype.startStage = function(stage) {
    if (!stage) {
      throw new Error('Stage is not valid');
    }
    this.stage = stage;
    stage.runtime.handleError = this.handleError;
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

  // var progressBar = document.querySelector('.progress-bar');

  // var error = document.querySelector('.internal-error');
  // var errorBugLink = document.querySelector('#error-bug-link');

  // function exitFullScreen(e) {
  //   if (isFullScreen && e.keyCode === 27) {
  //     fullScreenClick(e);
  //   }
  // }

  // document.addEventListener('fullscreenchange', function () {
  //   if (isFullScreen !== document.fullscreen) fullScreenClick();
  // });
  // document.addEventListener('mozfullscreenchange', function () {
  //   if (isFullScreen !== document.mozFullScreen) fullScreenClick();
  // });
  // document.addEventListener('webkitfullscreenchange', function () {
  //   if (isFullScreen !== document.webkitIsFullScreen) fullScreenClick();
  // });

  //   P.player.projectId = id;
  //   P.player.projectURL = id ? 'https://scratch.mit.edu/projects/' + id + '/' : '';

  // function createBugLink(before, after) {
  //   var url = P.player.projectURL || '(no url)';
  //   var id = P.player.projectId || '(no id)';
  //   var title = encodeURIComponent(P.player.projectTitle || P.player.projectURL || 'Project Bug');
  //   var baseBody = '\n\n\n----\nProject URL: ' + url + '\nProject ID: ' + id + '\n' + location.href + '\n' + navigator.userAgent + '\n';
  //   return 'https://github.com/forkphorus/forkphorus/issues/new?title=' + title + '&body=' + encodeURIComponent(before + baseBody + after) + '&labels=bug';
  // }

  // function showError(e) {
  //   showProgress();
  //   setProgress(1);
  //   progressBar.classList.add('error');
  //   error.style.display = 'block';
  //   errorBugLink.href = createBugLink('Describe what you were doing to cause this error:', '```\n' + P.utils.stringifyError(e) + '\n```');
  //   console.error(e);
  // }

  // // Install our progress hooks
  // var totalTasks = 0;
  // var finishedTasks = 0;
  // P.IO.progressHooks.new = function() {
  //   totalTasks++;
  //   setProgress(finishedTasks / totalTasks);
  // };
  // P.IO.progressHooks.end = function() {
  //   finishedTasks++;
  //   setProgress(finishedTasks / totalTasks);
  // };
  // P.IO.progressHooks.set = function(progress) {
  //   setProgress(progress);
  // };
  // P.IO.progressHooks.error = function(error) {
  //   showError(error);
  // };

  // function showProgress() {
  //   if (progressBar.classList.contains('error')) return;
  //   progressBar.style.display = 'block';
  //   progressBar.style.opacity = 1;
  //   setProgress(0);
  // }
  // function hideProgress() {
  //   if (progressBar.classList.contains('error')) return;
  //   progressBar.style.opacity = 0;
  // }
  // function setProgress(progress) {
  //   if (progressBar.classList.contains('error')) return;
  //   progressBar.style.width = (10 + progress * 90) + '%';
  // }
}());
