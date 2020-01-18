/// <reference path="phosphorus.ts" />
/// <reference path="utils.ts" />
/// <reference path="i18n.ts" />

// We need to add some declarations for old browser APIs that we use.

interface Document {
  webkitIsFullScreen?: boolean;
  webkitFullscreenElement?: HTMLElement;
  mozCancelFullScreen?(): void;
  webkitCancelFullScreen?(): void;
  webkitExitFullscreen?(): void;
}

interface HTMLElement {
  webkitRequestFullScreen?(e: any): void;
  requestFullScreenWithKeys?(): void;
}

/**
 * Player is an interface and wrapper around the Forkphorus core classes.
 */
namespace P.player {
  export class PlayerError extends Error {
    public readonly handledByPlayer: boolean = true;
  }

  /**
   * An error that indicates that this project type is knowingly not supported.
   */
  export class ProjectNotSupportedError extends PlayerError {
    constructor(public type: string) {
      super('Project type (' + type + ') is not supported');
      this.name = 'ProjectNotSupportedError';
    }
  }

  /**
   * An error that indicates that this project does not exist.
   */
  export class ProjectDoesNotExistError extends PlayerError {
    constructor(public id: string) {
      super('Project with ID ' + id + ' does not exist');
      this.name = 'ProjectDoesNotExistError';
    }
  }

  type Theme = 'light' | 'dark';

  interface PlayerOptions {
    theme?: Theme;
  }

  interface ControlsOptions {
    enableFullscreen?: boolean;
    enableFlag?: boolean;
    enableTurbo?: boolean;
    enablePause?: boolean;
    enableStop?: boolean;
  }

  interface StageLoadOptions {
    start?: boolean;
    turbo?: boolean;
    fps?: number;
  }

  /**
   * Project player that makes using the forkphorus API less miserable.
   * You MUST ALWAYS use Player.* instead of Player.stage.* when possible to avoid UI desyncs and other weird behavior.
   * For controls and error handling, see the other moduels in P.player.
   */
  export class Player {
    public static readonly PROJECT_DATA_API = 'https://projects.scratch.mit.edu/$id';
    public static readonly PROJECT_LINK = 'https://scratch.mit.edu/projects/$id';
    public static readonly LARGE_Z_INDEX = '9999999999';
    public static readonly UNKNOWN_ID = '(no id)';
    public static readonly UNKNOWN_LINK = '(no link)';
    public static readonly UNKNOWN_TITLE = '(no title)';
    public static readonly PROJECT_API = 'https://scratch.garbomuffin.com/proxy/projects/$id';
    public static readonly CLOUD_API = 'https://scratch.garbomuffin.com/cloud-proxy/logs/$id?limit=100';

    /**
     * Determines the type of a project.
     */
    static getProjectType(data: any): 2 | 3 | null {
      if (!data) return null;
      if ('targets' in data) return 3;
      if ('objName' in data) return 2;
      return null;
    }

    static isCloudVariable(variableName: string): boolean {
      return variableName.startsWith('☁');
    };

    // Event hooks
    /** Emitted when there has been an update on loading progress. */
    public onprogress = new P.utils.Slot<number>();
    /** Emitted when a stage has loaded. (but has not yet been started) */
    public onload = new P.utils.Slot<P.core.Stage>();
    /** Emitted when a stage starts loading. */
    public onstartload = new P.utils.Slot();
    /** Emitted when the current stage is removed. */
    public oncleanup = new P.utils.Slot();
    /** Emitted when the theme of the player is changed. */
    public onthemechange = new P.utils.Slot<Theme>();
    /** Emitted when there is an error. */
    public onerror = new P.utils.Slot<any>();
    /** Emitted when a stage is started or resumed. */
    public onstart = new P.utils.Slot();
    /** Emitted when the stage is paused. */
    public onpause = new P.utils.Slot();
    /** Emitted when the stage enteres or leaves turbo mode. Does not emit when a turbo stage is removed. */
    public onturbochange = new P.utils.Slot<boolean>();

    public root: HTMLElement;
    public player: HTMLElement;

    public fullscreen: boolean = false;
    public fullscreenPadding: number = 8;
    public fullscreenMaxWidth: number = Infinity;

    public stage: P.core.Stage;
    private stageId: number = 0;

    public projectId: string = Player.UNKNOWN_ID;
    public projectLink: string = Player.UNKNOWN_LINK;
    public projectTitle: string = Player.UNKNOWN_TITLE;

    private flagTouchTimeout: number | null | undefined = undefined;
    public controlsEl: HTMLElement;
    private turboText: HTMLElement;
    private stopButton: HTMLElement;
    private pauseButton: HTMLElement;
    private flagButton: HTMLElement;
    private fullscreenButton: HTMLElement;

    private previousTheme: Theme;
    public theme: Theme;

    constructor(options: PlayerOptions = {}) {
      this.root = document.createElement('div');
      this.root.className = 'player-root';

      this.player = document.createElement('div');
      this.player.className = 'player-stage';
      this.root.appendChild(this.player);

      this.setTheme(options.theme || 'light');

      window.addEventListener('resize', () => this.updateFullscreen());
      document.addEventListener('fullscreenchange', () => this.onfullscreenchange());
      document.addEventListener('mozfullscreenchange', () => this.onfullscreenchange());
      document.addEventListener('webkitfullscreenchange', () => this.onfullscreenchange());

      this.handleError = this.handleError.bind(this);
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
     * Add controls the Player.
     */
    addControls(options: ControlsOptions = {}) {
      if (this.controlsEl) {
        throw new Error('This player already has controls.');
      }

      const clickStop = (e: MouseEvent) => {
        this.assertStage();
        this.stopAll();
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
        } else {
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
        } else {
          this.start();
          // Use of runtime's stopAll is intentional as it won't pause the runtime.
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

      const preventDefault = (e: Event) => {
        e.preventDefault();
      };

      this.controlsEl = document.createElement('div');
      this.controlsEl.className = 'player-controls';

      if (options.enableStop !== false) {
        this.stopButton = document.createElement('span');
        this.stopButton.className = 'player-button player-stop';
        this.controlsEl.appendChild(this.stopButton);
        this.stopButton.addEventListener('click', clickStop);
        this.stopButton.addEventListener('touchend', clickStop);
        this.stopButton.addEventListener('touchstart', preventDefault);  
      }
      
      if (options.enablePause !== false) {
        this.pauseButton = document.createElement('span');
        this.pauseButton.className = 'player-button player-pause';
        this.controlsEl.appendChild(this.pauseButton);
        this.pauseButton.addEventListener('click', clickPause);
        this.pauseButton.addEventListener('touchend', clickPause);  
        this.pauseButton.addEventListener('touchstart', preventDefault);  
      }

      if (options.enableFlag !== false) {
        this.flagButton = document.createElement('span');
        this.flagButton.className = 'player-button player-flag';
        this.flagButton.title = P.i18n.translate('player.controls.flag.title');
        this.controlsEl.appendChild(this.flagButton);
        this.flagButton.addEventListener('click', clickFlag);
        this.flagButton.addEventListener('touchend', clickFlag)
        this.flagButton.addEventListener('touchstart', startTouchFlag);  
        this.flagButton.addEventListener('touchstart', preventDefault);  
      }

      if (options.enableTurbo !== false) {
        this.turboText = document.createElement('span');
        this.turboText.innerText = P.i18n.translate('player.controls.turboIndicator');
        this.turboText.className = 'player-label player-turbo';
        this.controlsEl.appendChild(this.turboText);
      }

      if (options.enableFullscreen !== false) {
        this.fullscreenButton = document.createElement('span');
        this.fullscreenButton.className = 'player-button player-fullscreen-btn';
        this.fullscreenButton.title = P.i18n.translate('player.controls.fullscreen.title');
        this.controlsEl.appendChild(this.fullscreenButton);
        this.fullscreenButton.addEventListener('click', clickFullscreen);
        this.fullscreenButton.addEventListener('touchend', clickFullscreen);
        this.fullscreenButton.addEventListener('touchstart', preventDefault);  
      }

      this.root.addEventListener('touchmove', (e) => {
        if (this.fullscreen) {
          e.preventDefault();
        }
      });

      this.root.insertBefore(this.controlsEl, this.root.firstChild);
    }

    /**
     * Change the turbo state of the stage.
     */
    setTurbo(turbo: boolean) {
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
      this.onturbochange.emit(turbo);
    }

    /**
     * Pause the stage's runtime.
     */
    pause() {
      this.assertStage();
      this.stage.runtime.pause();
      this.root.removeAttribute('running');
      this.onpause.emit();
    }

    /**
     * Start or resume the stage's runtime.
     */
    start() {
      this.assertStage();
      this.stage.runtime.start();
      this.root.setAttribute('running', '');
      this.onstart.emit();
    }

    /**
     * Active scripts triggered by the green flag.
     */
    triggerGreenFlag() {
      this.assertStage();
      this.stage.runtime.triggerGreenFlag();
    }

    /**
     * Stop all scripts in the runtime, and stop the runtime.
     */
    stopAll() {
      this.assertStage();
      this.pause();
      this.stage.runtime.stopAll();
    }

    /**
     * Whether the project is running.
     */
    isRunning() {
      if (!this.stage) {
        return false;
      }
      return this.stage.runtime.isRunning;
    }

    /**
     * Toggles the project between paused and running.
     */
    toggleRunning() {
      this.assertStage();
      if (this.isRunning()) {
        this.pause();
      } else {
        this.start();
        // TODO: is focus necessary? maybe move to start()
        this.stage.focus();
      }
    }

    /**
     * Change the theme of the player.
     * Should not affect the project.
     */
    setTheme(theme: Theme) {
      this.theme = theme;
      this.root.setAttribute('theme', theme);
      this.onthemechange.emit(theme);
    }

    /**
     * Enter fullscreen
     * TODO: fullscreen mode
     */
    enterFullscreen(realFullscreen: boolean) {
      // fullscreen requires dark theme
      this.previousTheme = this.root.getAttribute('theme') as Theme;
      this.setTheme('dark');
      if (realFullscreen) {
        if (this.root.requestFullScreenWithKeys) {
          this.root.requestFullScreenWithKeys();
        } else if (this.root.webkitRequestFullScreen) {
          this.root.webkitRequestFullScreen((Element as any).ALLOW_KEYBOARD_INPUT);
        } else if (this.root.requestFullscreen) {
          this.root.requestFullscreen();
        }
      }
      document.body.classList.add('player-body-fullscreen');
      this.root.style.zIndex = Player.LARGE_Z_INDEX;
      this.root.setAttribute('fullscreen', '');
      this.fullscreen = true;
      if (this.stage) {
        if (!this.isRunning()) {
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
     * Ensures that the fullscreened project always has proper dimensions.
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
        w = Math.min(w, h / 0.75);
        w = Math.min(w, this.fullscreenMaxWidth);
        h = w * 0.75 + controlsHeight;
        if (this.controlsEl) {
          this.controlsEl.style.width = w + 'px';
        }
        this.root.style.paddingLeft = (window.innerWidth - w) / 2 + 'px';
        this.root.style.paddingTop = (window.innerHeight - h - this.fullscreenPadding) / 2 + 'px';
        this.stage.setZoom(w / 480);
      }
    }

    private onfullscreenchange() {
      // If the user closes fullscreen through some external method (probably pressing escape),
      // we will want to cleanup and go back to the normal display mode.
      if (typeof document.fullscreen === 'boolean' && document.fullscreen !== this.fullscreen) {
        this.exitFullscreen();
      } else if (typeof document.webkitIsFullScreen === 'boolean' && document.webkitIsFullScreen !== this.fullscreen) {
        this.exitFullscreen();
      }
    }

    /**
     * Handle errors
     */
    private handleError(error: any) {
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
        this.stage = null!;
      }
      while (this.player.firstChild) {
        this.player.removeChild(this.player.firstChild);
      }
      if (this.fullscreen) {
        this.exitFullscreen();
      }
      this.oncleanup.emit();
    }

    private startLoadingNewProject() {
      this.cleanup();
      this.onstartload.emit();
    }

    /**
     * Get a new stage ID, and invalidate any old ones.
     */
    private getNewStageId() {
      this.stageId++;
      return this.stageId;
    }

    private isStageActive(id: number) {
      return id === this.stageId;
    }

    /**
     * Start a new Stage in this player
     */
    private installStage(stage: P.core.Stage, stageOptions: StageLoadOptions = {}) {
      if (!stage) {
        throw new Error('Cannot run an invalid stage');
      }

      this.stage = stage;
      this.stage.runtime.handleError = this.handleError;

      if (typeof stageOptions.fps !== 'undefined') {
        stage.runtime.framerate = stageOptions.fps;
      }
      this.onload.emit(stage);
      this.start();
      if (stageOptions.start !== false) {
        stage.runtime.triggerGreenFlag();
      }
      if (stageOptions.turbo) {
        stage.runtime.isTurbo = true;
      }
      this.player.appendChild(stage.root);
      stage.focus();
    }

    /**
     * Determine if a project file is a Scratch 1 project.
     */
    private isScratch1Project(buffer: ArrayBuffer) {
      const MAGIC = 'ScratchV0';
      const array = new Uint8Array(buffer);
      for (var i = 0; i < MAGIC.length; i++) {
        if (String.fromCharCode(array[i]) !== MAGIC[i]) {
          return false;
        }
      }
      return true;
    }

    // Wrappers around P.sb2 and P.sb3 for loading...

    private _handleScratch3Loader(loader: P.sb3.BaseSB3Loader, stageId: number) {
      loader.onprogress.subscribe(progress => {
        if (this.isStageActive(stageId)) {
          this.onprogress.emit(progress);
        } else if (!loader.aborted) {
          loader.abort();
        }
      });
      return loader.load().then(stage => {
        if (this.isStageActive(stageId)) return stage;
        return null;
      });
    }

    private _handleScratch2Loader(stageId: number, load: () => Promise<P.core.Stage>) {
      var totalTasks = 0;
      var finishedTasks = 0;
      const update = () => {
        if (this.isStageActive(stageId)) {
          var progress = finishedTasks / totalTasks || 0;
          this.onprogress.emit(progress);
        }
      };
      P.sb2.hooks.newTask = function() {
        totalTasks++;
        update();
      };
      P.sb2.hooks.endTask = function() {
        finishedTasks++;
        update();
      };
      return load().then((stage) => {
        if (this.isStageActive(stageId)) return stage;
        return null;
      });
    }

    private _loadScratch3(stageId: number, data: any) {
      var loader = new P.sb3.Scratch3Loader(data);
      return this._handleScratch3Loader(loader, stageId);
    }

    private _loadScratch3File(stageId: number, buffer: any) {
      var loader = new P.sb3.SB3FileLoader(buffer);
      return this._handleScratch3Loader(loader, stageId);
    }

    private _loadScratch2(stageId: number, data: any) {
      return this._handleScratch2Loader(stageId, function() {
        return P.sb2.loadProject(data);
      });
    }

    private _loadScratch2File(stageId: number, data: any) {
      return this._handleScratch2Loader(stageId, function() {
        return P.sb2.loadSB2Project(data);
      });
    }

    private _fetchProject(id: string) {
      var request = new P.IO.BlobRequest(Player.PROJECT_DATA_API.replace('$id', id), { rejectOnError: false });
      return request.load().then(function(response) {
        if (request.xhr.status === 404) {
          throw new ProjectDoesNotExistError(id);
        }
        return response;
      });
    }

    // The main methods you should use for loading things...

    /**
     * Load a remote project from its ID
     */
    loadProjectId(id: string, options: StageLoadOptions) {
      this.startLoadingNewProject();
      const stageId = this.getNewStageId();
      this.projectId = '' + id;
      this.projectLink = Player.PROJECT_LINK.replace('$id', id);
      let blob: Blob;
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
            } else if (type === 2) {
              return this._loadScratch2(stageId, json);
            } else {
              throw new Error('Project is valid JSON but of unknown type');
            }
          } catch (e) {
            // not json, but could be a zipped sb2
            return P.IO.readers.toArrayBuffer(blob).then((buffer) => {
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
            this.addCloudVariables(stage, id);
          }
        })
        .catch((error) => {
          if (this.isStageActive(stageId)) {
            this.handleError(error);
          }
        });
    }

    /**
     * Load a project from an ArrayBuffer of the project file.
     */
    loadProjectBuffer(buffer: ArrayBuffer, type: 'sb2' | 'sb3', options: StageLoadOptions) {
      this.startLoadingNewProject();
      const stageId = this.getNewStageId();
      const startLoad = () => {
        if (type === 'sb3') {
          return this._loadScratch3File(stageId, buffer);
        } else if (type === 'sb2') {
          return this._loadScratch2File(stageId, buffer);
        } else {
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
     * Load a project from a File or Blob of the project file.
     */
    loadProjectFile(file: File, options: StageLoadOptions) {
      var extension = file.name.split('.').pop() || '';
      if (['sb2', 'sb3'].indexOf(extension) === -1) {
        throw new Error('Unrecognized file extension: ' + extension);
      }
      this.startLoadingNewProject();
      // we won't use this one, we just want to invalidate anything else
      this.getNewStageId();
      this.projectId = file.name;
      this.projectLink = file.name + '#local';
      return P.IO.readers.toArrayBuffer(file).then(buffer => {
        return this.loadProjectBuffer(buffer, extension as any, options);
      });
    }

    /**
     * Get the title of a project.
     */
    getProjectTitle(id: string): Promise<string> {
      return new P.IO.JSONRequest(Player.PROJECT_API.replace('$id', id), { rejectOnError: false }).load()
        .then((data) => data.title || '');
    }

    getCloudVariables(id: string) {
      // To get the cloud variables of a project, we will fetch the history logs and essentially replay the latest changes.
      // This is primarily designed so that highscores in projects can remain up-to-date, and nothing more than that.
      return new P.IO.JSONRequest(Player.CLOUD_API.replace('$id', id)).load()
        .then((data) => {
          const variables = Object.create(null);
          for (const entry of data.reverse()) {
            const { verb, name, value } = entry;
            // Make sure that the cloud logs are only affecting cloud variables and not regular variables
            if (!Player.isCloudVariable(name)) {
              console.warn('cloud variable logs affecting non-cloud variable, skipping', name);
              continue;
            }
            switch (verb) {
              case 'create_var':
              case 'set_var':
                variables[name] = value;
                break;
              case 'del_var':
                delete variables[name];
                break;
              case 'rename_var':
                variables[value] = variables[name];
                delete variables[name];
                break;
              default:
                console.warn('unknown cloud variable log verb', verb);
            }
          }
          return variables;
        });
    }

    private addCloudVariables(stage: P.core.Stage, id: string) {
      const variables = Object.keys(stage.vars);
      const hasCloudVariables = variables.some(Player.isCloudVariable);
      if (!hasCloudVariables) {
        return;
      }
      this.getCloudVariables(id).then((variables) => {
        for (const name of Object.keys(variables)) {
          // Ensure that the variables we are setting are known to the stage before setting them.
          if (name in stage.vars) {
            stage.vars[name] = variables[name];
          } else {
            console.warn('not applying unknown cloud variable:', name);
          }
        }
      });
    }
  }

  interface ErrorHandlerOptions {
    container?: HTMLElement;
  }

  /**
   * Error handler UI for Player
   */
  export class ErrorHandler {
    public static BUG_REPORT_LINK = 'https://github.com/forkphorus/forkphorus/issues/new?title=$title&body=$body';

    private errorEl: HTMLElement | null;
    private errorContainer: HTMLElement | null;

    constructor(public player: Player, options: ErrorHandlerOptions = {}) {
      this.player = player;
      player.onerror.subscribe(this.onerror.bind(this));
      player.oncleanup.subscribe(this.oncleanup.bind(this));
      this.errorEl = null;
      if (options.container) {
        this.errorContainer = options.container;
      } else {
        this.errorContainer = null;
      }
    }

    /**
     * Create a string representation of an error.
     */
    stringifyError(error: any) {
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
     */
    createBugReportLink(bodyBefore: string, bodyAfter: string) {
      var title = this.getBugReportTitle();
      bodyAfter = bodyAfter || '';
      var body =
        bodyBefore +
        '\n\n\n-----\n' +
        this.getBugReportMetadata() +
        '\n' +
        bodyAfter;
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
    createErrorLink(error: any) {
      var body = P.i18n.translate('player.errorhandler.instructions');
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
    handleError(error: any) {
      var el = document.createElement('div');
      var errorLink = this.createErrorLink(error);
      var attributes = 'href="' + errorLink + '" target="_blank" ref="noopener"';
      // use of innerHTML intentional
      el.innerHTML = P.i18n.translate('player.errorhandler.error').replace('$attrs', attributes);
      return el;
    }

    /**
     * Create an error element indicating this project is not supported.
     */
    handleNotSupportedError(error: ProjectNotSupportedError) {
      var el = document.createElement('div');
      // use of innerHTML intentional
      el.innerHTML = P.i18n.translate('player.errorhandler.error.unsupported').replace('$type', error.type);
      return el;
    }

    /**
     * Create an error element indicating this project does not exist.
     */
    handleDoesNotExistError(error: ProjectDoesNotExistError) {
      var el = document.createElement('div');
      el.textContent = P.i18n.translate('player.errorhandler.error.doesnotexist').replace('$id', error.id);
      return el;
    }

    onerror(error: any) {
      var el = document.createElement('div');
      el.className = 'player-error';
      // Special handling for certain errors to provide a better error message
      if (error instanceof ProjectNotSupportedError) {
        el.appendChild(this.handleNotSupportedError(error));
      } else if (error instanceof ProjectDoesNotExistError) {
        el.appendChild(this.handleDoesNotExistError(error));
      } else {
        el.appendChild(this.handleError(error));
      }
      if (this.errorContainer) {
        this.errorContainer.appendChild(el);
      } else if (this.player.stage) {
        this.player.stage.ui.appendChild(el);
      } else {
        this.player.player.appendChild(el);
      }
      this.errorEl = el;
    }
  }

  interface ProgressBarOptions {
    position?: 'controls' | HTMLElement;
  }

  /**
   * Loading progress bar for Player
   */
  export class ProgressBar {
    private el: HTMLElement;
    private bar: HTMLElement;

    constructor(player: Player, options: ProgressBarOptions = {}) {
      this.el = document.createElement('div');
      this.el.className = 'player-progress';

      this.bar = document.createElement('div');
      this.bar.className = 'player-progress-fill';
      this.el.appendChild(this.bar);

      this.setTheme(player.theme);

      player.onthemechange.subscribe((theme) => this.setTheme(theme));
      player.onprogress.subscribe((progress) => this.setProgress(progress));
      player.onstartload.subscribe(() => {
        this.el.setAttribute('state', 'loading');
        this.setProgress(0);
      });
      player.onload.subscribe(() => {
        this.el.setAttribute('state', 'loaded');
      });
      player.oncleanup.subscribe(() => {
        this.el.setAttribute('state', '');
        this.bar.style.width = '0%';
      });
      player.onerror.subscribe(() => {
        this.el.setAttribute('state', 'error');
        this.bar.style.width = '100%';
      });

      if (options.position === 'controls' || options.position === undefined) {
        if (!player.controlsEl) {
          throw new Error('No controls to put progess bar in.');
        }
        player.controlsEl.appendChild(this.el);
      } else {
        options.position.appendChild(this.el);
      }
    }

    private setTheme(theme: Theme) {
      this.el.setAttribute('theme', theme);
    }

    setProgress(progress: number) {
      this.bar.style.width = 10 + progress * 90 + '%';
    }
  }
}
