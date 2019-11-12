/// <reference path="phosphorus.ts" />
/// <reference path="utils.ts" />

interface Document {
  webkitIsFullScreen?: boolean;
  webkitFullscreenElement?: HTMLElement;
  mozCancelFullScreen?(): void;
  webkitCancelFullScreen?(): void;
  webkitExitFullscreen?(): void;
}

interface HTMLElement {
  webkitRequestFullScreen?(): void;
  requestFullScreenWithKeys?(): void;
}

/**
 * Player is an interface and wrapper around the Forkphorus core classes.
 */
namespace P.player {

  /**
   * An error that indicates that this project type is knowingly not supported.
   */
  export class ProjectNotSupportedError extends Error {
    constructor(public type: string) {
      super('Project type (' + type + ') is not supported');
      this.name = 'ProjectNotSupportedError';
    }
  }

  /**
   * An error that indicates that this project does not exist.
   */
  export class ProjectDoesNotExistError extends Error {
    constructor(public id: string) {
      super('Project with ID ' + id + ' does not exist');
      this.name = 'ProjectDoesNotExistError';
    }
  }

  type Theme = 'light' | 'dark';

  interface PlayerOptions {
    theme?: Theme,
  }

  export class Player {
    public static readonly PROJECT_DATA_API = 'https://projects.scratch.mit.edu/$id';
    public static readonly PROJECT_LINK = 'https://scratch.mit.edu/projects/$id';
    public static readonly LARGE_Z_INDEX = '9999999999';
    public static readonly UNKNOWN_ID = '(no id)';
    public static readonly UNKNOWN_LINK = '(no link)';
    public static readonly UNKNOWN_TITLE = '(no title)';

    public onprogress = new P.utils.Slot();
    public onload = new P.utils.Slot();
    public onstartload = new P.utils.Slot();
    public oncleanup = new P.utils.Slot();
    public onthemechange = new P.utils.Slot();
    public onerror = new P.utils.Slot();
    public onstart = new P.utils.Slot();
    public onpause = new P.utils.Slot();

    public root: HTMLElement;
    public player: HTMLElement;

    public fullscreen: boolean = false;
    public fullscreenPadding: number = 8;
    public fullscreenMaxWidth: number = Infinity;

    public stage: P.core.Stage | null = null;
    private stageId: number = 0;

    public projectId: string = Player.UNKNOWN_ID;
    public projectLink: string = Player.UNKNOWN_LINK;
    public projectTitle: string = Player.UNKNOWN_TITLE;

    private flagTouchTimeout: number | null | undefined = undefined;
    private controlsEl: HTMLElement;
    private mutedText: HTMLElement;
    private turboText: HTMLElement;
    private stopButton: HTMLElement;
    private pauseButton: HTMLElement;
    private flagButton: HTMLElement;
    private fullscreenButton: HTMLElement;

    private previousTheme: Theme | null;
    private theme: Theme;

    constructor(options: PlayerOptions = {}) {
      this.root = document.createElement('div');
      this.root.className = 'player-root';
      this.setTheme(options.theme || 'light');
      this.player = document.createElement('div');
      this.player.className = 'player-stage';
      this.root.appendChild(this.player);

      window.addEventListener('resize', () => this.updateFullscreen());

      document.addEventListener('fullscreenchange', () => this.onfullscreenchange());
      document.addEventListener('mozfullscreenchange', () => this.onfullscreenchange());
      document.addEventListener('webkitfullscreenchange', () => this.onfullscreenchange());
    }

    onfullscreenchange() {
      if (typeof document.fullscreen === 'boolean' && document.fullscreen !== this.fullscreen) {
        this.exitFullscreen();
      } else if (typeof document.webkitIsFullScreen === 'boolean' && document.webkitIsFullScreen !== this.fullscreen) {
        this.exitFullscreen();
      }
    }

    /**
     * Asserts that a stage is loaded, and throws otherwise.
     */
    assertStage() {
      if (!this.stage) {
        throw new Error('The player does not currently contain a stage to operate on.');
      }
    }

    /**
     * Add controls to the player.
     * @typedef ControlOptions
     * @property {boolean} [showMutedIndicator]
     * @param {ControlOptions} [options]
     */
    addControls(options) {
      const clickStop = (e: MouseEvent) => {
        this.assertStage();
        this.pause();
        this.stage.runtime.stopAll();
        this.stage.draw();
        e.preventDefault();
      };
      const clickPause = (e: MouseEvent) => {
        this.toggleRunning();
      };
      const clickFullscreen = (e: MouseEvent) => {
        this.assertStage();
        if (this.fullscreen) {
          this.exitFullscreen();
        }
        else {
          this.enterFullscreen(!e.shiftKey);
        }
      };
      const clickFlag = (e: MouseEvent) => {
        if (this.flagTouchTimeout === null) {
          return;
        }
        if (this.flagTouchTimeout) {
          clearTimeout(this.flagTouchTimeout);
        }
        this.assertStage();
        if (e.shiftKey) {
          this.setTurbo(!this.stage.runtime.isTurbo);
        }
        else {
          this.start();
          this.stage.runtime.stopAll();
          this.stage.runtime.triggerGreenFlag();
        }
        this.stage.focus();
        e.preventDefault();
      };
      const startTouchFlag = (e: MouseEvent) => {
        this.flagTouchTimeout = setTimeout(() => {
          this.flagTouchTimeout = null;
          this.setTurbo(!this.stage.runtime.isTurbo);
        }, 500);
      };
      const preventDefault = function (e: Event) {
        e.preventDefault();
      };
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
        P.audio.context.addEventListener('statechange', () => {
          this.root.setAttribute('audio-state', P.audio.context.state);
        });
        this.root.setAttribute('audio-state', P.audio.context.state);
      }
      this.stopButton.addEventListener('click', clickStop);
      this.pauseButton.addEventListener('click', clickPause);
      this.flagButton.addEventListener('click', clickFlag);
      this.fullscreenButton.addEventListener('click', clickFullscreen);
      this.flagButton.addEventListener('touchstart', startTouchFlag);
      this.flagButton.addEventListener('touchend', clickFlag);
      this.pauseButton.addEventListener('touchend', clickPause);
      this.stopButton.addEventListener('touchend', clickStop);
      this.fullscreenButton.addEventListener('touchend', clickFullscreen);
      this.flagButton.addEventListener('touchstart', preventDefault);
      this.pauseButton.addEventListener('touchstart', preventDefault);
      this.stopButton.addEventListener('touchstart', preventDefault);
      this.fullscreenButton.addEventListener('touchstart', preventDefault);
      this.root.addEventListener('touchmove', (e) => {
        if (this.fullscreen) {
          e.preventDefault();
        }
      });
      this.root.insertBefore(this.controlsEl, this.root.firstChild);
    }

    /**
     * Changes the turbo state of the stage.
     * @param {boolean} turbo
     */
    setTurbo(turbo) {
      this.assertStage();
      this.stage.runtime.isTurbo = turbo;
      if (turbo) {
        this.root.setAttribute('turbo', '');
      }
      else {
        this.root.removeAttribute('turbo');
      }
      if (this.flagButton) {
        if (turbo) {
          this.flagButton.title = P.i18n.translate('player.controls.flag.title.enabled');
        }
        else {
          this.flagButton.title = P.i18n.translate('player.controls.flag.title.disabled');
        }
      }
    }

    /**
     * Pause the runtime's event loop.
     */
    pause() {
      this.assertStage();
      this.stage.runtime.pause();
      this.root.removeAttribute('running');
      this.onpause.emit();
    }

    /**
     * Start the runtime's event loop.
     */
    start() {
      this.assertStage();
      this.stage.runtime.start();
      this.root.setAttribute('running', '');
      this.onstart.emit();
    }

    /**
     * Toggles the project between paused and running.
     */
    toggleRunning() {
      this.assertStage();
      if (this.stage.runtime.isRunning) {
        this.pause();
      } else {
        this.start();
        this.stage.focus();
      }
    }

    /**
     * Change the visual theme.
     */
    setTheme(theme) {
      this.theme = theme;
      this.root.setAttribute('theme', theme);
      this.onthemechange.emit(theme);
    }

    enterFullscreen(realFullscreen: boolean) {
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
        this.stage.focus();
      }
      this.updateFullscreen();
    }

    /**
     * Exit fullscreen
     */
    exitFullscreen() {
      this.setTheme(this.previousTheme);
      this.root.removeAttribute('fullscreen');
      this.fullscreen = false;
      if (document.fullscreenElement === this.root || document.webkitFullscreenElement === this.root) {
        // fixing typescript errors
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
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
        this.stage.focus();
      }
    }

    /**
     * Update fullscreen handling.
     */
    updateFullscreen() {
      if (!this.stage) {
        return;
      }
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
    }

    /**
     * Handle errors and allow creating a bug report.
     */
    handleError(error) {
      console.error(error);
      this.onerror.emit(error);
    }

    /**
     * Completely remove the stage, and restore this player to an (almost) fresh state.
     */
    cleanup() {
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
    }

    startLoadingNewProject() {
      this.cleanup();
      this.onstartload.emit();
    }

    getNewStageId() {
      this.stageId++;
      return this.stageId;
    }

    isStageActive(id) {
      return id === this.stageId;
    }

    /**
     * Start a new Stage in this player.
     * @typedef StageLoadOptions
     * @property {boolean} [start]
     * @property {boolean} [turbo]
     * @property {number} [fps]
     * @param {StageLoadOptions} [stageOptions]
     */
    installStage(stage, stageOptions) {
      if (!stage) {
        throw new Error('Invalid stage.');
      }
      this.stage = stage;
      stageOptions = stageOptions || {};
      stage.runtime.handleError = this.handleError.bind(this);
      if (typeof stageOptions.fps !== 'undefined') {
        stage.runtime.framerate = stageOptions.fps;
      }
      this.player.appendChild(stage.root);
      stage.focus();
      this.onload.emit(stage);
      this.start();
      if (stageOptions.start !== false) {
        stage.runtime.triggerGreenFlag();
      }
      if (stageOptions.turbo) {
        stage.runtime.isTurbo = true;
      }
    }

    /**
     * @param {ArrayBuffer} buffer
     */
    isScratch1Project(buffer) {
      var MAGIC = 'ScratchV0';
      var array = new Uint8Array(buffer);
      for (var i = 0; i < MAGIC.length; i++) {
        if (String.fromCharCode(array[i]) !== MAGIC[i]) {
          return false;
        }
      }
      return true;
    }

    // wrappers around P.sb2 and P.sb3 for loading...
    _handleScratch3Loader(loader, stageId) {
      loader.onprogress.subscribe((progress) => {
        if (this.isStageActive(stageId)) {
          this.onprogress.emit(progress);
        }
        else if (!loader.aborted) {
          loader.abort();
        }
      });
      return loader.load()
        .then((stage) => {
          if (this.isStageActive(stageId))
            return stage;
          return null;
        });
    }

    _handleScratch2Loader(stageId, load) {
      var totalTasks = 0;
      var finishedTasks = 0;
      const update = () => {
        if (this.isStageActive(stageId)) {
          var progress = finishedTasks / totalTasks || 0;
          this.onprogress.emit(progress);
        }
      };
      P.sb2.hooks.newTask = function () {
        totalTasks++;
        update();
      };
      P.sb2.hooks.endTask = function () {
        finishedTasks++;
        update();
      };
      return load()
        .then((stage) => {
          if (this.isStageActive(stageId))
            return stage;
          return null;
        });
    }

    _loadScratch3(stageId, data) {
      var loader = new P.sb3.Scratch3Loader(data);
      return this._handleScratch3Loader(loader, stageId);
    }

    _loadScratch3File(stageId, buffer) {
      var loader = new P.sb3.SB3FileLoader(buffer);
      return this._handleScratch3Loader(loader, stageId);
    }

    _loadScratch2(stageId, data) {
      return this._handleScratch2Loader(stageId, function () {
        return P.sb2.loadProject(data);
      });
    }

    _loadScratch2File(stageId, data) {
      return this._handleScratch2Loader(stageId, function () {
        return P.sb2.loadSB2Project(data);
      });
    }

    _fetchProject(id) {
      var request = new P.IO.BlobRequest(Player.PROJECT_DATA_API.replace('$id', id), { rejectOnError: false });
      return request.load()
        .then(function (response) {
          if (request.xhr.status === 404) {
            throw new ProjectDoesNotExistError(id);
          }
          return response;
        });
    }

    // The main methods you should use for loading things...

    /**
     * Load a remote project from its ID
     * @param {string} id
     * @param {StageLoadOptions} options
     * @returns {Promise}
     */
    loadProjectId(id, options) {
      this.startLoadingNewProject();
      var stageId = this.getNewStageId();
      this.projectId = '' + id;
      this.projectLink = Player.PROJECT_LINK.replace('$id', id);
      var blob;
      return this._fetchProject(id)
        .then((data) => {
          blob = data;
          return P.IO.readers.toText(blob);
        })
        .then((text) => {
          if (!this.isStageActive(stageId)) {
            return null;
          }
          try {
            var json = JSON.parse(text);
            var type = Player.getProjectType(json);
            if (type === 3) {
              return this._loadScratch3(stageId, json);
            }
            else if (type === 2) {
              return this._loadScratch2(stageId, json);
            }
            else {
              throw new Error('Project is valid JSON but of unknown type');
            }
          }
          catch (e) {
            // not json, but could be a zipped sb2
            return P.IO.readers.toArrayBuffer(blob)
              .then((buffer) => {
                if (this.isScratch1Project(buffer)) {
                  throw new ProjectNotSupportedError('.sb / Scratch 1');
                }
                return P.sb2.loadSB2Project(buffer);
              });
          }
        })
        .then((stage) => {
          if (stage) {
            this.installStage(stage, options);
          }
        })
        .catch((error) => {
          if (this.isStageActive(stageId)) {
            this.handleError(error);
          }
        });
    }

    /**
     * Load a project from an ArrayBuffer of the compressed project.
     * @param {ArrayBuffer} buffer
     * @param {'sb2'|'sb3'} type
     * @param {StageLoadOptions} options
     */
    loadProjectBuffer(buffer, type, options) {
      this.startLoadingNewProject();
      var stageId = this.getNewStageId();
      var startLoad = () => {
        if (type === 'sb3') {
          return this._loadScratch3File(stageId, buffer);
        }
        else if (type === 'sb2') {
          return this._loadScratch2File(stageId, buffer);
        }
        else {
          throw new Error('Unknown type: ' + type);
        }
      };
      return startLoad()
        .then((stage) => {
          if (stage) {
            this.installStage(stage, options);
          }
        })
        .catch((error) => {
          if (this.isStageActive(stageId)) {
            this.handleError(error);
          }
        });
    }

    /**
     * Load a project from a File or Blob of the compressed project.
     * @param {File} file
     * @param {StageLoadOptions} options
     * @returns {Promise}
     */
    loadProjectFile(file, options) {
      var extension = file.name.split('.').pop();
      if (['sb2', 'sb3'].indexOf(extension) === -1) {
        throw new Error('Unrecognized file extension: ' + extension);
      }
      this.startLoadingNewProject();
      // we won't use this one, we just want to invalidate anything else
      this.getNewStageId();
      this.projectId = file.name;
      this.projectLink = file.name + '#local';
      return P.IO.readers.toArrayBuffer(file)
        .then((buffer) => {
          return this.loadProjectBuffer(buffer, extension, options);
        });
    }

    /**
     * Determines the type of a project.
     * @param {any} data
     * @returns {2|3|null} 2 for sb2, 3 for sb3, null for unknown
     */
    static getProjectType(data) {
      if (!data)
        return null;
      if ('targets' in data)
        return 3;
      if ('objName' in data)
        return 2;
      return null;
    }
  }

  export class ErrorHandler {
    public static BUG_REPORT_LINK = 'https://github.com/forkphorus/forkphorus/issues/new?title=$title&body=$body';

    private errorEl: HTMLElement | null;
    private errorContainer: HTMLElement | null;

    constructor(public player, options) {
      options = options || {};
      this.player = player;
      player.onerror.subscribe(this.onerror.bind(this));
      player.oncleanup.subscribe(this.oncleanup.bind(this));
      this.errorEl = null;
      if (options.container) {
        this.errorContainer = options.container;
      }
      else {
        this.errorContainer = null;
      }
    }
    /**
       * Create a string representation of an error.
       */
    stringifyError(error) {
      if (!error) {
        return 'unknown error';
      }
      if (error.stack) {
        return 'Message: ' + error.message + '\nStack:\n' + error.stack;
      }
      return error.toString();
    }
    /**
       * Generate the link to report a bug to, including title and metadata.
       * @param {string} bodyBefore Text to appear before metadata
       * @param {string} bodyAfter Text to appear after metadata
       */
    createBugReportLink(bodyBefore, bodyAfter) {
      var title = this.getBugReportTitle();
      bodyAfter = bodyAfter || '';
      var body = bodyBefore + '\n\n\n-----\n' + this.getBugReportMetadata() + '\n' + bodyAfter;
      return ErrorHandler.BUG_REPORT_LINK
        .replace('$title', encodeURIComponent(title))
        .replace('$body', encodeURIComponent(body));
    }
    /**
       * Get the title for bug reports.
       */
    getBugReportTitle() {
      if (this.player.projectTitle !== Player.UNKNOWN_TITLE) {
        return this.player.projectTitle + ' (' + this.player.projectId + ')';
      }
      return this.player.projectLink;
    }
    /**
       * Get the metadata to include in bug reports.
       */
    getBugReportMetadata() {
      var meta = 'Project URL: ' + this.player.projectLink + '\n';
      meta += 'Project ID: ' + this.player.projectId + '\n';
      meta += location.href + '\n';
      meta += navigator.userAgent;
      return meta;
    }
    /**
       * Get the URL to report an error to.
       */
    createErrorLink(error) {
      var body = P.i18n.translate('report.crash.instructions');
      return this.createBugReportLink(body, '```\n' + this.stringifyError(error) + '\n```');
    }
    oncleanup() {
      if (this.errorEl && this.errorEl.parentNode) {
        this.errorEl.parentNode.removeChild(this.errorEl);
        this.errorEl = null;
      }
    }
    /**
       * Create an error element indicating that forkphorus has crashed, and where to report the bug.
       */
    createErrorElement(error) {
      var el = document.createElement('div');
      var errorLink = this.createErrorLink(error);
      var attributes = 'href="' + errorLink + '" target="_blank" ref="noopener"';
      // use of innerHTML intentional
      el.innerHTML = P.i18n.translate('report.crash.html').replace('$attrs', attributes);
      return el;
    }
    /**
       * Create an error element indicating this project is not supported.
       */
    projectNotSupportedError(error) {
      var el = document.createElement('div');
      // use of innerHTML intentional
      el.innerHTML = P.i18n.translate('report.crash.unsupported').replace('$type', error.type);
      return el;
    }
    projectDoesNotExistError(error) {
      var el = document.createElement('div');
      el.textContent = P.i18n.translate('report.crash.doesnotexist').replace('$id', error.id);
      return el;
    }
    onerror(error) {
      var el = document.createElement('div');
      el.className = 'player-error';
      // Special handling for certain errors to provide a better error message
      if (error instanceof ProjectNotSupportedError) {
        el.appendChild(this.projectNotSupportedError(error));
      }
      else if (error instanceof ProjectDoesNotExistError) {
        el.appendChild(this.projectDoesNotExistError(error));
      }
      else {
        el.appendChild(this.createErrorElement(error));
      }
      if (this.errorContainer) {
        this.errorContainer.appendChild(el);
      }
      else if (this.player.stage) {
        this.player.stage.ui.appendChild(el);
      }
      else {
        this.player.player.appendChild(el);
      }
      this.errorEl = el;
    }
  }

  /**
   * @typedef ProgressBarOptions
   * @property {'controls'|HTMLElement} [position]
   */

  /**
   * @class
   * @param {ProgressBarOptions} options
   */
  export class ProgressBar {
    private el: HTMLElement;
    private bar: HTMLElement;

    constructor(player, options) {
      options = options || {};
      options.position = options.position || 'controls';
      this.el = document.createElement('div');
      this.el.className = 'player-progress';
      this.bar = document.createElement('div');
      this.bar.className = 'player-progress-fill';
      this.el.appendChild(this.bar);
      this.setTheme(player.theme);
      player.onthemechange.subscribe(this.setTheme.bind(this));
      player.onstartload.subscribe(() => {
        this.el.setAttribute('state', 'loading');
        this.setProgress(0);
      });
      player.onload.subscribe(() => {
        this.el.setAttribute('state', 'loaded');
      });
      player.onprogress.subscribe((progress) => this.setProgress(progress));
      player.oncleanup.subscribe(() => {
        this.el.setAttribute('state', '');
        this.bar.style.width = '0%';
      });
      player.onerror.subscribe(() => {
        this.el.setAttribute('state', 'error');
        this.bar.style.width = '100%';
      });
      if (options.position === 'controls') {
        if (!player.controlsEl) {
          throw new Error('No controls to put progess bar in.');
        }
        player.controlsEl.appendChild(this.el);
      }
      else {
        options.position.appendChild(this.el);
      }
    }
    setTheme(theme) {
      this.el.setAttribute('theme', theme);
    }
    setProgress(progress) {
      this.bar.style.width = (10 + progress * 90) + '%';
    }
  }
}
