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
  /**
   * PlayerError is a special type of error where the Player has special handling for this class of error.
   * For example, it may display a help message instead of the error message in certain conditions such as unsupported project types.
   */
  export class PlayerError extends Error {
    public readonly handledByPlayer: boolean = true;
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

  export class CannotAccessProjectError extends PlayerError {
    constructor(public id: string) {
      super(`Cannot access project with ID ${id}`);
      this.name = 'CannotAccessProjectError';
    }
  }

  type ProjectType = 'sb' | 'sb2' | 'sb3';

  interface ProjectPlayer {
    /** Emitted when there has been an update on loading progress. */
    onprogress: Slot<number>;
    /** Emitted when a Stage has loaded and been added to the player. */
    onload: Slot<P.core.Stage>;
    /** Emitted when a project begins loading. */
    onstartload: Slot<never>;
    /** Emitted when the current stage is removed. */
    oncleanup: Slot<never>;
    /** Emitted when the theme of the player is changed. */
    onthemechange: Slot<Theme>;
    /** Emitted when there is an error. */
    onerror: Slot<any>;
    /** Emitted when a stage is started or resumed. */
    onresume: Slot<never>;
    /** Emitted when the stage is paused. */
    onpause: Slot<never>;
    /** Emitted when options change. The payload only includes the parts that changed. */
    onoptionschange: Slot<Partial<PlayerOptions>>;

    root: HTMLElement;
    controlsContainer: HTMLElement;
    playerContainer: HTMLElement;

    setOptions(options: Partial<PlayerOptions>): void;
    getOptions(): PlayerOptions;

    addControls(options: ControlsOptions): void;

    /** Remove the stage and cancel the loader */
    cleanup(): void;

    /** Resume or start the project's frame loop. */
    resume(): void;
    /** Pause the project's frame loop */
    pause(): void;
    /** Stop the project and the frame loop, akin to the stop sign in Scratch */
    stopAll(): void;
    /** Start the project's scripts and the frame loop, akin to the green flag in Scratch */
    triggerGreenFlag(): void;
    /** Whether the project's frame loop is running. */
    isRunning(): boolean;
    /** Toggle the project's frame loop status. */
    toggleRunning(): void;

    loadProjectById(id: string): Promise<void>;
    loadProjectFromFile(file: File): Promise<void>;
    loadProjectFromBuffer(buffer: ArrayBuffer, type: ProjectType): Promise<void>;

    hasStage(): boolean;
    getStage(): P.core.Stage;

    focus(): void;

    enterFullscreen(): void;
    exitFullscreen(): void;

    hasProjectMeta(): boolean;
    getProjectMeta(): ProjectMeta;
  }

  type Theme = 'light' | 'dark';
  type AutoplayPolicy = 'always' | 'if-audio-playable' | 'never';
  type CloudVariables = 'once' | 'ws' | 'localStorage' | 'off';
  type FullscreenMode = 'full' | 'window';
  interface PlayerOptions {
    theme: Theme;
    autoplayPolicy: AutoplayPolicy;
    turbo: boolean;
    fps: number;
    cloudVariables: CloudVariables;
    username: string;
    fullscreenMode: FullscreenMode;
    fullscreenPadding: number;
    fullscreenMaxWidth: number;
    imageSmoothing: boolean;
    focusOnLoad: boolean;
    spriteFencing: boolean;
    removeLimits: boolean;
    // $id is replaced with project ID
    projectHost: string;
    cloudHost: string[] | string;
  }

  interface ControlsOptions {
    enableFullscreen?: boolean;
    enableFlag?: boolean;
    enableTurbo?: boolean;
    enablePause?: boolean;
    enableStop?: boolean;
  }

  interface ProjectMeta {
    /**
     * Load the metadata. This may involve network requests, so the result is not immediately available.
     */
    load(): Promise<ProjectMeta>;
    /**
     * Returns the cached title loaded by loadMetadata(), if any
     */
    getTitle(): string | null;
    /**
     * Returns the project ID, if any.
     * A project ID is a unique identifier for a project.
     * Usually this is a project ID from scratch.mit.edu, but it could be anything, such as a filename.
     */
    getId(): string;
    /**
     * Whether this project was loaded from scratch.mit.edu
     */
    isFromScratch(): boolean;
    /**
     * A token to be used for downloading the project, if any.
     */
    getToken(): string | null;
    /**
     * Returns true if this is a project from scratch.mit.edu and it is probably unshared.
     */
    isUnshared(): boolean;
  }

  class LoaderIdentifier {
    private active: boolean = true;
    private loader: P.io.Loader | null = null;

    cancel() {
      if (!this.active) {
        throw new Error('cannot cancel: already cancelled');
      }
      this.active = false;
      if (this.loader) {
        this.loader.abort();
      }
    }

    setLoader(loader: P.io.Loader) {
      if (!this.active) {
        throw new Error('Loading aborted');
      }
      this.loader = loader;
    }

    isActive() {
      return this.active;
    }
  }

  type SlotFn<T> = (t: T) => void;
  class Slot<T> {
    private _listeners: SlotFn<T>[] = [];

    subscribe(fn: SlotFn<T>) {
      this._listeners.push(fn);
    }

    emit(value?: T) {
      for (const listener of this._listeners) {
        listener(value!);
      }
    }
  }

  class LocalProjectMeta implements ProjectMeta {
    constructor(private filename: string) {

    }

    load() {
      // No data to load
      return Promise.resolve(this);
    }

    getTitle() {
      return this.filename;
    }

    getId() {
      return this.filename;
    }

    isFromScratch() {
      return false;
    }

    getToken() {
      return null;
    }

    isUnshared() {
      return false;
    }
  }

  class BinaryProjectMeta implements ProjectMeta {
    load() {
      // No data to load
      return Promise.resolve(this);
    }

    getTitle() {
      return null;
    }

    getId() {
      // do not change -- that could break cloud variables for some projects in the packager.
      return '#buffer#';
    }

    isFromScratch() {
      return false;
    }
    
    getToken() {
      return null;
    }

    isUnshared() {
      return false;
    }
  }

  class RemoteProjectMeta implements ProjectMeta {
    private title: string | null = null;
    private token: string | null = null;
    private unshared: boolean = false;
    private loadCallbacks: Array<(meta: ProjectMeta) => void> = [];
    private startedLoading: boolean = false;

    constructor(private id: string) {

    }

    load() {
      if (!this.startedLoading) {
        this.startedLoading = true;
        const request = new P.io.Request([
          // Some school filters block turbowarp.org, so we'll try a few URLs. Hopefully one will work.
          'https://trampoline.turbowarp.org/api/projects/$id'.replace('$id', this.id),
          'https://trampoline.turbowarp.xyz/api/projects/$id'.replace('$id', this.id),
          'https://t.unsandboxed.org/api/projects/$id'.replace('$id', this.id),
        ]);
        request
          .setMaxAttempts(1)
          .ignoreErrors()
          .load('json')
          .then((data) => {
            if (request.getStatus() === 404) {
              this.unshared = true;
            } else {
              if (data.title) {
                this.title = data.title;
              }
              if (data.project_token) {
                this.token = data.project_token;
              }
            }
            for (const callback of this.loadCallbacks) {
              callback(this);
            }
            this.loadCallbacks.length = 0;
          })
          .catch((err) => {
            console.error(err);
            this.unshared = true;
            for (const callback of this.loadCallbacks) {
              callback(this);
            }
            this.loadCallbacks.length = 0;
          });
      }
      return new Promise<ProjectMeta>((resolve) => {
        this.loadCallbacks.push(resolve);
      })
    }

    getTitle() {
      return this.title;
    }

    getId() {
      return this.id;
    }

    isFromScratch() {
      return true;
    }

    getToken() {
      return this.token;
    }

    isUnshared() {
      return this.unshared;
    }
  }

  /**
   * Project player that makes using the forkphorus API less miserable.
   * You MUST ALWAYS use Player.* instead of Player.stage.* when possible to avoid UI desyncs and other weird behavior.
   */
  export class Player implements ProjectPlayer {
    public static readonly DEFAULT_OPTIONS: PlayerOptions = {
      autoplayPolicy: 'always',
      cloudVariables: 'ws',
      fps: 30,
      theme: 'light',
      turbo: false,
      username: '',
      fullscreenMode: 'full',
      fullscreenPadding: 8,
      fullscreenMaxWidth: Infinity,
      imageSmoothing: false,
      focusOnLoad: true,
      spriteFencing: false,
      removeLimits: false,
      projectHost: 'https://projects.scratch.mit.edu/$id',
      // cloudHost: 'ws://localhost:9080', // for cloud-server development
      cloudHost: ['wss://stratus.turbowarp.org', 'wss://stratus.turbowarp.xyz']
    };

    public onprogress = new Slot<number>();
    public onload = new Slot<P.core.Stage>();
    public onstartload = new Slot<never>();
    public oncleanup = new Slot<never>();
    public onthemechange = new Slot<Theme>();
    public onerror = new Slot<any>();
    public onresume = new Slot<never>();
    public onpause = new Slot<never>();
    public onoptionschange = new Slot<Partial<PlayerOptions>>();

    public root: HTMLElement;
    public playerContainer: HTMLElement;
    public controlsContainer: HTMLElement;

    /** Magic values. */
    public MAGIC = {
      // A large z-index, used for some fullscreen modes to display on top of everything.
      LARGE_Z_INDEX: '9999999999',
    };

    private options: Readonly<PlayerOptions>;
    private stage: P.core.Stage = null!; // making this nullable forces some very verbose type checking
    private projectMeta: ProjectMeta | null = null;
    private currentLoader: LoaderIdentifier | null = null;
    private fullscreenEnabled: boolean = false;
    private savedTheme: Theme;
    private clickToPlayContainer: HTMLElement | null = null;

    constructor(options: Partial<PlayerOptions> = {}) {
      this.root = document.createElement('div');
      this.root.className = 'player-root';

      this.playerContainer = document.createElement('div');
      this.playerContainer.className = 'player-stage';
      this.root.appendChild(this.playerContainer);

      this.setOptions({ ...options, ...Player.DEFAULT_OPTIONS });

      window.addEventListener('resize', () => this.updateFullscreen());
      document.addEventListener('fullscreenchange', () => this.onfullscreenchange());
      document.addEventListener('mozfullscreenchange', () => this.onfullscreenchange());
      document.addEventListener('webkitfullscreenchange', () => this.onfullscreenchange());

      this.handleError = this.handleError.bind(this);
    }

    // UI HELPERS

    private enableAttribute(name: string): void {
      this.root.setAttribute(name, '');
    }

    private disableAttribute(name: string): void {
      this.root.removeAttribute(name);
    }

    private setAttribute(name: string, enabled: boolean): void {
      if (enabled) {
        this.enableAttribute(name);
      } else {
        this.disableAttribute(name);
      }
    }

    // OPTIONS

    setOptions(changedOptions: Partial<PlayerOptions>): void {
      this.options = { ...this.options, ...changedOptions };

      // Sync some option values
      if (typeof changedOptions.turbo !== 'undefined') {
        this.setAttribute('turbo', changedOptions.turbo);
      }
      if (typeof changedOptions.theme !== 'undefined') {
        this.root.setAttribute('theme', changedOptions.theme);
        this.onthemechange.emit(changedOptions.theme);
      }
      if (this.hasStage()) {
        this.applyOptionsToStage();
      }

      this.onoptionschange.emit(changedOptions);
    }

    getOptions(): PlayerOptions {
      return this.options;
    }

    addControls(options: ControlsOptions = {}): void {
      if (this.controlsContainer) {
        throw new Error('This player already has controls.');
      }

      let flagTouchTimeout: number | null | undefined = undefined;

      const clickStop = (e: MouseEvent) => {
        this.throwWithoutStage();
        this.stopAll();
        this.stage.draw();
        e.preventDefault();
      };

      const clickPause = (e: MouseEvent) => {
        this.toggleRunning();
      };

      const clickFullscreen = (e: MouseEvent) => {
        this.throwWithoutStage();
        this.setOptions({ fullscreenMode: e.shiftKey ? 'window' : 'full' });
        if (this.fullscreenEnabled) {
          this.exitFullscreen();
        } else {
          this.enterFullscreen();
        }
      };

      const clickFlag = (e: MouseEvent) => {
        if (flagTouchTimeout === null) {
          return;
        }
        if (flagTouchTimeout) {
          clearTimeout(flagTouchTimeout);
        }
        this.throwWithoutStage();
        if (e.shiftKey) {
          this.setOptions({ turbo: !this.options.turbo });
        } else {
          this.triggerGreenFlag();
        }
        this.focus();
        e.preventDefault();
      };

      const startTouchFlag = (e: MouseEvent) => {
        flagTouchTimeout = setTimeout(() => {
          flagTouchTimeout = null;
          this.setOptions({ turbo: !this.options.turbo });
        }, 500);
      };

      const preventDefault = (e: Event) => {
        e.preventDefault();
      };

      this.controlsContainer = document.createElement('div');
      this.controlsContainer.className = 'player-controls';

      // prevent click events from firing on the project when using controls
      // only prevent if clicking on a button and not empty space
      this.controlsContainer.onmousedown = (e) => {
        if (e.target !== this.controlsContainer) {
          e.stopPropagation();
        }
      };
      this.controlsContainer.ontouchstart = (e) => {
        if (e.target !== this.controlsContainer) {
          e.stopPropagation();
        }
      };

      if (options.enableStop !== false) {
        var stopButton = document.createElement('span');
        stopButton.className = 'player-button player-stop';
        this.controlsContainer.appendChild(stopButton);
        stopButton.addEventListener('click', clickStop);
        stopButton.addEventListener('touchend', clickStop);
        stopButton.addEventListener('touchstart', preventDefault);
      }

      if (options.enablePause !== false) {
        var pauseButton = document.createElement('span');
        pauseButton.className = 'player-button player-pause';
        this.controlsContainer.appendChild(pauseButton);
        pauseButton.addEventListener('click', clickPause);
        pauseButton.addEventListener('touchend', clickPause);
        pauseButton.addEventListener('touchstart', preventDefault);
      }

      if (options.enableFlag !== false) {
        var flagButton = document.createElement('span');
        flagButton.className = 'player-button player-flag';
        flagButton.title = P.i18n.translate('player.controls.flag.title');
        this.controlsContainer.appendChild(flagButton);
        flagButton.addEventListener('click', clickFlag);
        flagButton.addEventListener('touchend', clickFlag)
        flagButton.addEventListener('touchstart', startTouchFlag);
        flagButton.addEventListener('touchstart', preventDefault);
      }

      if (options.enableTurbo !== false) {
        var turboText = document.createElement('span');
        turboText.innerText = P.i18n.translate('player.controls.turboIndicator');
        turboText.className = 'player-label player-turbo';
        this.controlsContainer.appendChild(turboText);

        this.onoptionschange.subscribe((options) => {
          if (flagButton && typeof options.turbo === 'boolean') {
            if (options.turbo) {
              flagButton.title = P.i18n.translate('player.controls.flag.title.enabled');
            } else {
              flagButton.title = P.i18n.translate('player.controls.flag.title.disabled');
            }
          }
        });
      }

      if (options.enableFullscreen !== false) {
        var fullscreenButton = document.createElement('span');
        fullscreenButton.className = 'player-button player-fullscreen-btn';
        fullscreenButton.title = P.i18n.translate('player.controls.fullscreen.title');
        this.controlsContainer.appendChild(fullscreenButton);
        fullscreenButton.addEventListener('click', clickFullscreen);
        fullscreenButton.addEventListener('touchend', clickFullscreen);
        fullscreenButton.addEventListener('touchstart', preventDefault);
      }

      this.root.addEventListener('touchmove', (e) => {
        if (this.fullscreenEnabled) {
          e.preventDefault();
        }
      });

      this.root.insertBefore(this.controlsContainer, this.root.firstChild);
    }

    /**
     * Apply local options to a stage
     */
    private applyOptionsToStage(): void {
      // Changing FPS involves restarting an interval, which may cause a noticeable interruption, so we only apply when necessary
      if (this.stage.runtime.framerate !== this.options.fps) {
        this.stage.runtime.framerate = this.options.fps;
        if (this.isRunning()) {
          this.stage.runtime.resetInterval();
        }
      }
      this.stage.username = this.options.username;
      this.stage.runtime.isTurbo = this.options.turbo;
      this.stage.useSpriteFencing = this.options.spriteFencing;
      this.stage.removeLimits = this.options.removeLimits;
      (this.stage.renderer as P.renderer.canvas2d.ProjectRenderer2D).imageSmoothingEnabled = this.options.imageSmoothing;
    }

    generateUsernameIfMissing() {
      if (!this.options.username) {
        this.setOptions({
          username: 'player' + Math.random().toFixed(10).substr(2, 6)
        });
      }
    }

    // COMMON OPERATIONS

    /**
     * Throw an error if there is no stage available.
     */
    private throwWithoutStage() {
      if (!this.stage) {
        throw new Error('Missing stage.');
      }
    }

    resume(): void {
      this.throwWithoutStage();
      if (this.isRunning()) {
        throw new Error('cannot resume: project is already running');
      }
      this.stage.runtime.start();
      this.enableAttribute('running');
      this.onresume.emit();
    }

    pause(): void {
      this.throwWithoutStage();
      if (!this.isRunning()) {
        throw new Error('cannot pause: project is already paused');
      }
      this.stage.runtime.pause();
      this.disableAttribute('running');
      this.onpause.emit();
    }

    isRunning() {
      if (!this.hasStage()) {
        return false;
      }
      return this.stage.runtime.isRunning;
    }

    toggleRunning(): void {
      this.throwWithoutStage();
      if (this.stage.runtime.isRunning) {
        this.pause();
      } else {
        this.resume();
      }
    }

    stopAll(): void {
      this.throwWithoutStage();
      this.pause();
      this.stage.runtime.stopAll();
    }

    triggerGreenFlag(): void {
      this.throwWithoutStage();
      if (!this.isRunning()) {
        this.resume();
      }
      this.stage.runtime.stopAll();
      this.stage.runtime.triggerGreenFlag();
      if (this.clickToPlayContainer) {
        this.removeClickToPlayContainer();
      }
    }

    cleanup() {
      // Stop any loader
      if (this.currentLoader) {
        this.currentLoader.cancel();
        this.currentLoader = null;
      }
      // Reset interface
      if (this.clickToPlayContainer) {
        this.removeClickToPlayContainer();
      }
      if (this.fullscreenEnabled) {
        this.exitFullscreen();
      }
      // Remove stage
      if (this.stage) {
        this.stage.destroy();
        this.stage = null!;
      }
      // Clear some additional data
      this.projectMeta = null;
      while (this.playerContainer.firstChild) {
        this.playerContainer.removeChild(this.playerContainer.firstChild);
      }
      this.oncleanup.emit();
    }

    focus() {
      this.stage.focus();
    }

    hasStage(): boolean {
      return !!this.stage;
    }

    getStage(): core.Stage {
      this.throwWithoutStage();
      return this.stage;
    }

    hasProjectMeta() {
      return !!this.projectMeta;
    }

    getProjectMeta() {
      if (!this.projectMeta) {
        throw new Error('no project meta');
      }
      return this.projectMeta;
    }

    private handleError(error: any) {
      console.error(error);
      this.onerror.emit(error);
    }

    // FULLSCREEN

    enterFullscreen() {
      // fullscreen requires dark theme
      this.savedTheme = this.root.getAttribute('theme') as Theme;
      this.setOptions({ theme: 'dark' });

      if (this.options.fullscreenMode === 'full') {
        if (this.root.requestFullScreenWithKeys) {
          this.root.requestFullScreenWithKeys();
        } else if (this.root.webkitRequestFullScreen) {
          this.root.webkitRequestFullScreen((Element as any).ALLOW_KEYBOARD_INPUT);
        } else if (this.root.requestFullscreen) {
          this.root.requestFullscreen();
        }
      }

      document.body.classList.add('player-body-fullscreen');
      this.root.style.zIndex = this.MAGIC.LARGE_Z_INDEX;
      this.enableAttribute('fullscreen');
      this.fullscreenEnabled = true;

      if (this.hasStage()) {
        if (!this.isRunning()) {
          this.stage.draw();
        }
        // TODO: remove this temporary fix for #192
        if (this.options.focusOnLoad) {
          this.focus();
        }
      }

      this.updateFullscreen();
    }

    exitFullscreen() {
      this.setOptions({ theme: this.savedTheme });
      this.disableAttribute('fullscreen');
      this.fullscreenEnabled = false;

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
      if (this.controlsContainer) {
        this.controlsContainer.style.width = '';
      }
      document.body.classList.remove('player-body-fullscreen');

      if (this.stage) {
        this.stage.setZoom(1);
        this.focus();
      }
    }

    /**
     * Updates the stage in fullscreen mode to ensure proper dimensions.
     */
    private updateFullscreen() {
      if (!this.fullscreenEnabled) {
        return;
      }
      this.throwWithoutStage();
      const controlsHeight = this.controlsContainer ? this.controlsContainer.offsetHeight : 0;
      window.scrollTo(0, 0);

      let w = window.innerWidth - this.options.fullscreenPadding * 2;
      let h = window.innerHeight - this.options.fullscreenPadding - controlsHeight;
      w = Math.min(w, h / 0.75);
      w = Math.min(w, this.options.fullscreenMaxWidth);
      h = w * 0.75 + controlsHeight;

      if (this.controlsContainer) {
        this.controlsContainer.style.width = w + 'px';
      }

      this.root.style.paddingLeft = (window.innerWidth - w) / 2 + 'px';
      this.root.style.paddingTop = (window.innerHeight - h - this.options.fullscreenPadding) / 2 + 'px';
      this.stage.setZoom(w / 480);
    }

    /**
     * Responds to changes in the browser's fullscreen state.
     */
    private onfullscreenchange() {
      // If the user closes fullscreen through some external method (probably pressing escape),
      // we will want to cleanup and go back to the normal display mode.
      if (typeof document.fullscreen === 'boolean' && document.fullscreen !== this.fullscreenEnabled) {
        this.exitFullscreen();
      } else if (typeof document.webkitIsFullScreen === 'boolean' && document.webkitIsFullScreen !== this.fullscreenEnabled) {
        this.exitFullscreen();
      }
    }

    // CLOUD VARIABLES

    private applyCloudVariablesSocket(stage: P.core.Stage, id: string) {
      this.generateUsernameIfMissing();
      const handler = new P.ext.cloud.WebSocketCloudHandler(stage, this.options.cloudHost, id);
      stage.setCloudHandler(handler);
    }

    private applyCloudVariablesLocalStorage(stage: P.core.Stage, id: string) {
      const handler = new P.ext.cloud.LocalStorageCloudHandler(stage, id);
      stage.setCloudHandler(handler);
    }

    private applyCloudVariables(policy: CloudVariables) {
      const stage = this.stage;
      const meta = this.projectMeta;
      if (!meta) {
        throw new Error('cannot apply cloud variable settings without projectMeta');
      }

      const hasCloudVariables = stage.cloudVariables.length > 0;
      if (!hasCloudVariables) {
        // if there are no cloud variables, none of the handlers will do anything anyways
        return;
      }

      switch (policy) {
        case 'ws':
          if (meta.isFromScratch()) {
            this.applyCloudVariablesSocket(stage, meta.getId());
          }
          break;
        case 'localStorage':
          this.applyCloudVariablesLocalStorage(stage, meta.getId());
          break;
      }
    }

    // AUTOPLAY POLICY

    /**
     * Apply an autoplay policy to the current stage.
     */
    private applyAutoplayPolicy(policy: AutoplayPolicy) {
      switch (policy) {
        case 'always': {
          this.triggerGreenFlag();
          break;
        }
        case 'if-audio-playable': {
          if (!P.audio.context || P.audio.context.state === 'running') {
            this.triggerGreenFlag();
          } else {
            this.showClickToPlayContainer();
          }
          break;
        }
        case 'never': {
          this.showClickToPlayContainer();
          break;
        }
      }
    }

    private showClickToPlayContainer() {
      if (this.clickToPlayContainer) {
        throw new Error('cannot show click-to-play interface: already shown');
      }
      this.clickToPlayContainer = document.createElement('div');
      this.clickToPlayContainer.className = 'player-click-to-play-container';
      this.clickToPlayContainer.onclick = () => {
        // As we are in a user gesture handler, we may as well try to resume the AudioContext.
        if (P.audio.context && P.audio.context.state !== 'running') {
          P.audio.context.resume();
        }
        this.removeClickToPlayContainer();
        this.triggerGreenFlag();
        this.focus();
      };

      const content = document.createElement('div');
      content.className = 'player-click-to-play-icon';
      this.clickToPlayContainer.appendChild(content);

      this.stage.ui.appendChild(this.clickToPlayContainer);
    }

    private removeClickToPlayContainer() {
      if (this.clickToPlayContainer === null) {
        throw new Error('cannot hide click-to-play interface: already hidden');
      }
      this.stage.ui.removeChild(this.clickToPlayContainer);
      this.clickToPlayContainer = null;
    }

    // PROJECT LOADERS & HELPERS

    /**
     * Begin loading a new project.
     * This gives you a LoaderIdentifier to use for identification and cancellation.
     * It also removes any existing stage to make room for the new one.
     */
    private beginLoadingProject(): { loaderId: LoaderIdentifier } {
      this.cleanup();
      this.onstartload.emit();
      const loaderId = new LoaderIdentifier();
      this.currentLoader = loaderId;
      return { loaderId };
    }

    /**
     * Determine project type by its data.
     * @param data The project's data (project.json)
     */
    private determineProjectType(data: any): 'sb2' | 'sb3' {
      if ('objName' in data) return 'sb2';
      if ('targets' in data) return 'sb3';
      throw new Error('Unknown project type');
    }

    /**
     * Determine if a project file is a Scratch 1 project.
     */
    private isScratch1Project(buffer: ArrayBuffer): boolean {
      const MAGIC = 'ScratchV0';
      const array = new Uint8Array(buffer);
      for (var i = 0; i < MAGIC.length; i++) {
        if (String.fromCharCode(array[i]) !== MAGIC[i]) {
          return false;
        }
      }
      return true;
    }

    /**
     * Convert a Scratch 1 project to a Scratch 2 project.
     * @param buffer The binary data of the Scratch 1 project.
     * @returns The binary data of the Scratch 2 project.
     */
    private convertScratch1Project(buffer: ArrayBuffer): Promise<ArrayBuffer> {
      const sb1 = new ScratchSB1Converter.SB1File(buffer);
      const projectData = sb1.json;
      const zipFiles = sb1.zip.files;

      const zip = new JSZip();
      zip.file('project.json', JSON.stringify(projectData));
      for (const fileName of Object.keys(zipFiles)) {
        zip.file(fileName, zipFiles[fileName].bytes);
      }
      return zip.generateAsync({ type: 'arraybuffer' });
    }

    /**
     * Download a project from the scratch.mit.edu using its ID.
     */
    private fetchProject(id: string, token: string | null): Promise<Blob> {
      let url = this.options.projectHost.replace('$id', id);
      if (token) {
        url += `?token=${token}`;
      }
      const request = new P.io.Request(url);
      return request
        .ignoreErrors()
        .load('blob')
        .then(function(response) {
          if (request.getStatus() === 404) {
            throw new ProjectDoesNotExistError(id);
          }
          if (request.getStatus() === 403) {
            throw new Error('Obtained token but permission was denied anyways. Try refreshing.');
          }
          return response;
        });
    }

    /**
     * Set the stage of this loader. Applies options to the stage, among other things.
     */
    private setStage(stage: P.core.Stage) {
      this.stage = stage;
      this.stage.runtime.handleError = this.handleError;
      this.applyOptionsToStage();

      this.playerContainer.appendChild(stage.root);
      if (this.options.focusOnLoad) {
        this.focus();
      }
      this.onload.emit(stage);

      this.stage.draw();

      this.applyCloudVariables(this.options.cloudVariables);
      this.applyAutoplayPolicy(this.options.autoplayPolicy);
    }

    /**
     * Sets the active loader of this stage.
     * @param loaderId LoaderIdentifier as given by startLoadingProject()
     * @param loader The new loader
     */
    private async loadLoader(loaderId: LoaderIdentifier, loader: P.io.Loader<P.core.Stage>): Promise<P.core.Stage> {
      loaderId.setLoader(loader);
      loader.onprogress = (progress) => {
        if (loaderId.isActive()) {
          this.onprogress.emit(progress);
        }
      };
      const stage = await loader.load();
      this.setStage(stage);
      this.currentLoader = null;
      loader.cleanup();
      return stage;
    }

    async loadProjectById(id: string): Promise<void> {
      const { loaderId } = this.beginLoadingProject();

      const getLoader = async (blob: Blob): Promise<P.io.Loader<P.core.Stage>> => {
        // When downloaded from scratch.mit.edu, there are two types of projects:
        // 1. "JSON projects" which are only the project.json of a sb2 or sb3 file.
        //    This is most projects, especially as this is the only format of Scratch 3 projects.
        // 2. "Binary projects" which are full binary .sb, .sb2, or .sb3 files. Examples:
        //    https://scratch.mit.edu/projects/250740608/ (sb2)
        //    https://scratch.mit.edu/projects/418795494/ (sb3)

        try {
          // We will try to read the project as JSON text.
          // This will error if this is not a JSON project.
          const projectText = await P.io.readers.toText(blob);
          const projectJson = P.json.parse(projectText);

          switch (this.determineProjectType(projectJson)) {
            case 'sb2': return new P.sb2.Scratch2Loader(projectJson);
            case 'sb3': return new P.sb3.Scratch3Loader(projectJson);
          }
        } catch (e) {
          // if the project cannot be loaded as JSON, it may be a binary project.
          let buffer = await P.io.readers.toArrayBuffer(blob);

          // Scratch 1 is converted to Scratch 2.
          if (this.isScratch1Project(buffer)) {
            buffer = await this.convertScratch1Project(buffer);
          } else {
              try {
              // Examine project.json to determine project type.
              const zip = await JSZip.loadAsync(buffer);
              const projectJSON = zip.file('project.json');
              if (!projectJSON) {
                throw new Error('zip is missing project.json');
              }
              const projectDataText = await projectJSON.async('text');
              const projectData = JSON.parse(projectDataText);
              if (this.determineProjectType(projectData) === 'sb3') {
                return new P.sb3.SB3FileLoader(buffer);
              }
            } catch (e) {
              // ignore
            }
          }

          return new P.sb2.SB2FileLoader(buffer);
        }
      };

      try {
        const meta = new RemoteProjectMeta(id);
        this.projectMeta = meta;

        const needsToken = this.options.projectHost.startsWith('https://projects.scratch.mit.edu/');
        let token: string | null = null;
        if (needsToken) {
          await meta.load();
          if (meta.isUnshared()) {
            throw new CannotAccessProjectError(id);
          }
          token = meta.getToken();
        }

        const blob = await this.fetchProject(id, token);
        const loader = await getLoader(blob);
        await this.loadLoader(loaderId, loader);
      } catch (e) {
        if (loaderId.isActive()) {
          this.handleError(e);
        }
      }
    }

    private async loadProjectFromBufferWithType(loaderId: LoaderIdentifier, buffer: ArrayBuffer, type: ProjectType): Promise<void> {
      let loader: P.io.Loader<P.core.Stage>;

      // Scratch 1 is converted to Scratch 2.
      if (type === 'sb') {
        buffer = await this.convertScratch1Project(buffer);
        type = 'sb2';
      }

      switch (type) {
        case 'sb2': loader = new P.sb2.SB2FileLoader(buffer); break;
        case 'sb3': loader = new P.sb3.SB3FileLoader(buffer); break;
        default: throw new Error('Unknown type: ' + type);
      }
      await this.loadLoader(loaderId, loader);
    }

    async loadProjectFromFile(file: File): Promise<void> {
      const { loaderId } = this.beginLoadingProject();

      try {
        this.projectMeta = new LocalProjectMeta(file.name);
        const extension = file.name.split('.').pop() || '';
        const buffer = await P.io.readers.toArrayBuffer(file);

        switch (extension) {
          case 'sb': return await this.loadProjectFromBufferWithType(loaderId, buffer, 'sb');
          case 'sb2': return await this.loadProjectFromBufferWithType(loaderId, buffer, 'sb2');
          case 'sb3': return await this.loadProjectFromBufferWithType(loaderId, buffer, 'sb3');
          default: throw new Error('Unrecognized file extension: ' + extension);
        }
      } catch (e) {
        if (loaderId.isActive()) {
          this.handleError(e);
        }
      }
    }

    async loadProjectFromBuffer(buffer: ArrayBuffer, type: ProjectType): Promise<void> {
      const { loaderId } = this.beginLoadingProject();

      try {
        this.projectMeta = new BinaryProjectMeta();
        return await this.loadProjectFromBufferWithType(loaderId, buffer, type);
      } catch (e) {
        if (loaderId.isActive()) {
          this.handleError(e);
        }
      }
    }
  }

  interface ErrorHandlerOptions {
    container?: HTMLElement;
  }

  /**
   * Error handler UI for Player
   */
  export class ErrorHandler {
    /**
     * The URL to report bugs to.
     * $title is replaced with the project title (URI encoded)
     * $body is replaced with the bug report body (URI encoded)
     */
    public static BUG_REPORT_LINK = 'https://forkphorus.github.io/bug_report.html?title=$title&body=$body';

    private errorEl: HTMLElement | null = null;
    private errorContainer: HTMLElement | null = null;
    public generatedErrorLink: string | null = null;

    constructor(public player: ProjectPlayer, options: ErrorHandlerOptions = {}) {
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
    private stringifyError(error: any): string {
      if (!error) {
        return 'unknown error';
      }
      if (error.stack) {
        return 'Message: ' + error.message + '\nStack:\n' + error.stack;
      }
      return '' + error;
    }

    /**
     * Generate the link to report a bug to, including project and device information.
     * @param error An error to include in the bug report
     */
    createBugReportLink(error?: any): string {
      const type = error ? '[Error]' : '[Bug]';
      const title = `${type} ${this.getBugReportTitle()}`;
      const body = this.getBugReportBody(error);

      return ErrorHandler.BUG_REPORT_LINK
        .replace('$title', encodeURIComponent(title))
        .replace('$body', encodeURIComponent(body));
    }

    /**
     * Get the title for bug reports.
     */
    private getBugReportTitle(): string {
      if (!this.player.hasProjectMeta()) {
        return 'Unknown Project';
      }
      const meta = this.player.getProjectMeta();
      const title = meta.getTitle();
      const id = meta.getId();
      if (title) {
        return title;
      }
      if (id) {
        return id;
      }
      return 'Unknown Project';
    }

    /**
     * Generate the body of an error report.
     * @param error An error to include, if any.
     */
    private getBugReportBody(error: any): string {
      const sections: {title: string; body: string;}[] = [];

      sections.push({
        title: 'Describe the bug, including any steps to reproduce it',
        body: '',
      });

      sections.push({
        title: 'Project ID, URL, or file',
        body: this.getProjectInformation(),
      });

      let debug = '';
      debug += location.href + '\n';
      debug += navigator.userAgent + '\n';
      if (error) {
        debug += '```\n' + this.stringifyError(error) + '\n```';
      }
      sections.push({
        title: 'Debug information <!-- DO NOT EDIT -->',
        body: debug,
      });

      return sections
        .map((i) => `**${i.title}**\n${i.body}\n`)
        .join('\n')
        .trim();
    }

    /**
     * Get the information to display to describe where to find the project.
     */
    private getProjectInformation(): string {
      if (!this.player.hasProjectMeta()) {
        return 'no project meta loaded';
      }
      const projectMeta = this.player.getProjectMeta();
      if (projectMeta.isFromScratch()) {
        if (projectMeta.getTitle()) {
          return 'https://scratch.mit.edu/projects/' + projectMeta.getId();
        } else {
          return 'https://scratch.mit.edu/projects/' + projectMeta.getId() + ' (probably unshared)';
        }
      }
      return 'Not from Scratch: ' + projectMeta.getId();
    }

    private oncleanup(): void {
      if (this.errorEl && this.errorEl.parentNode) {
        this.errorEl.parentNode.removeChild(this.errorEl);
        this.errorEl = null;
      }
      this.generatedErrorLink = null;
    }

    /**
     * Create an error element indicating that forkphorus has crashed, and where to report the bug.
     */
    handleError(error: any): HTMLElement {
      const el = document.createElement('div');
      const errorLink = this.createBugReportLink(error);
      this.generatedErrorLink = errorLink;
      const attributes = 'href="' + P.utils.escapeXML(errorLink) + '" target="_blank" ref="noopener"';
      // use of innerHTML is intentional and is safe
      el.innerHTML = P.i18n.translate('player.errorhandler.error').replace('$attrs', attributes);
      return el;
    }

    private handleCannotAccessProjectError(error: CannotAccessProjectError): HTMLElement {
      const el = document.createElement('div');

      const section1 = document.createElement('div');
      section1.textContent = "Can't access project token. This usually means the project is unshared, never existed, or the ID is invalid.";
      section1.style.marginBottom = '4px';
      el.appendChild(section1);

      const section2 = document.createElement('div');
      section2.textContent = "Unshared projects are no longer accessible using their project ID due to Scratch API changes. ";
      section2.appendChild(Object.assign(document.createElement('a'), {
        textContent: 'More information',
        href: 'https://docs.turbowarp.org/unshared-projects',
      }));
      section2.style.marginBottom = '4px';
      section2.appendChild(document.createTextNode('.'));
      el.appendChild(section2);

      const section3 = document.createElement('div');
      section3.textContent = 'If the project was shared recently, it may take a few minutes for this message to go away. If the project is actually shared, please report a bug.';
      el.appendChild(section3);

      return el;
    }

    /**
     * Create an error element indicating this project does not exist.
     */
    private handleDoesNotExistError(error: ProjectDoesNotExistError): HTMLElement {
      const el = document.createElement('div');
      el.textContent = P.i18n.translate('player.errorhandler.error.doesnotexist').replace('$id', error.id);
      return el;
    }

    private onerror(error: any): void {
      const el = document.createElement('div');
      el.className = 'player-error';
      // Special handling for certain errors to provide a better error message
      if (error instanceof CannotAccessProjectError) {
        el.appendChild(this.handleCannotAccessProjectError(error))
      } else if (error instanceof ProjectDoesNotExistError) {
        el.appendChild(this.handleDoesNotExistError(error));
      } else {
        el.appendChild(this.handleError(error));
      }
      if (this.errorContainer) {
        this.errorContainer.appendChild(el);
      } else if (this.player.hasStage()) {
        this.player.getStage().ui.appendChild(el);
      } else {
        this.player.playerContainer.appendChild(el);
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

    constructor(player: ProjectPlayer, options: ProgressBarOptions = {}) {
      this.el = document.createElement('div');
      this.el.className = 'player-progress';

      this.bar = document.createElement('div');
      this.bar.className = 'player-progress-fill';
      this.el.appendChild(this.bar);

      this.setTheme(player.getOptions().theme);

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
        if (!player.controlsContainer) {
          throw new Error('No controls to put progess bar in.');
        }
        player.controlsContainer.appendChild(this.el);
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
