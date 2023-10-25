/// <reference path="phosphorus.ts" />
/// <reference path="config.ts" />
/// <reference path="rendering/renderer.ts" />

// Phosphorus base classes
// Implements most functionality while leaving some specifics to implementations (P.sb2, P.sb3)
namespace P.core {
  interface RotatedBounds {
    // A----------+
    // |          |
    // |          |
    // +----------B
    // Where top is the scratchY of A,
    // bottom is the scratchY of B,
    // left is the scratchX of A,
    // and right is the scratchX of B

    top: number;
    bottom: number;
    left: number;
    right: number;
  }

  interface Listeners {
    whenClicked: P.runtime.Fn[];
    whenCloned: P.runtime.Fn[];
    whenGreenFlag: P.runtime.Fn[];
    whenIReceive: ObjectMap<P.runtime.Fn[]>;
    whenKeyPressed: ObjectMap<P.runtime.Fn[]>;
    whenSceneStarts: ObjectMap<P.runtime.Fn[]>;
    edgeActivated: P.runtime.Fn[];
  }

  export interface ActiveSound {
    stopped: boolean;
    node: AudioNode;
    base: P.runtime.Fn;
  }

  export interface Filters {
    color: number;
    fisheye: number;
    whirl: number;
    pixelate: number;
    mosaic: number;
    brightness: number;
    ghost: number;
  }

  export interface SoundFilters {
    pitch: number;
  }

  export const enum RotationStyle {
    /**
     * Indicates this sprite may rotate in any direction.
     */
    Normal,
    /**
     * Indicates this sprite can only rotate left or right.
     */
    LeftRight,
    /**
     * Indicates this sprite cannot rotate.
     */
    None,
  }

  export const enum SpecialObjects {
    Mouse = '_mouse_',
    Stage = '_stage_',
    Random = '_random_',
    Edge = '_edge_',
  }

  const enum PenMode { RGBA, HSLA, HSVA };

  export class PenColor {
    private x: number = 0;
    private y: number = 0;
    private z: number = 255;
    private a: number = 1;
    private mode: PenMode = PenMode.RGBA;
    private css: string = 'rgba(0, 0, 255, 1)';

    /**
     * Set this color to an RGB(A) color, encoded in a single number.
     */
    setRGBA(rgba: number) {
      this.x = rgba >> 16 & 0xff;
      this.y = rgba >> 8 & 0xff;
      this.z = rgba & 0xff;
      this.a = (rgba >> 24 & 0xff) / 0xff || 1;
      this.css = 'rgba(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.a + ')';
      this.mode = PenMode.RGBA;
    }

    /**
     * Set this color to an RGB(A) color, encoded in a single number, accounting for Scratch 3's inaccurate colors.
     */
    setShiftedRGBA(rgba: number) {
      this.setRGBA(rgba);
      // Scratch 3 internally stores all colors as HSV, and floors the RGB components resulting in the
      // actual color being displayed to sometimes be slightly different.
      // For example, set pen color to #ff00ff actually draws #ff00fe.... brilliant.
      this.toHSVA();
    }

    toHSLA() {
      switch (this.mode) {
        case PenMode.RGBA: {
          this.mode = PenMode.HSLA;
          const hsl = P.utils.rgbToHSL(this.x, this.y, this.z);
          this.x = hsl[0];
          this.y = hsl[1] * 100;
          this.z = hsl[2] * 100;
          break;
        }
        case PenMode.HSVA: {
          this.mode = PenMode.HSLA;
          const hsl = P.utils.hsvToHSL(this.x, this.y / 100, this.z / 100);
          this.x = hsl[0];
          this.y = hsl[1] * 100;
          this.z = hsl[2] * 100;
          break;
        }
      }
    }

    toHSVA() {
      switch (this.mode) {
        case PenMode.RGBA: {
          this.mode = PenMode.HSVA;
          const hsv = P.utils.rgbToHSV(this.x, this.y, this.z);
          this.x = hsv[0];
          this.y = hsv[1] * 100;
          this.z = hsv[2] * 100;
          break;
        }
        case PenMode.HSLA: {
          this.mode = PenMode.HSVA;
          const hsv = P.utils.hslToHSV(this.x, this.y / 100, this.z / 100);
          this.x = hsv[0];
          this.y = hsv[1] * 100;
          this.z = hsv[2] * 100;
          break;
        }
      }
    }

    /**
     * Convert this color to its RGBA parts
     * R, G, B [0-255]
     * A [0-1]
     */
    toParts(): [number, number, number, number] {
      switch (this.mode) {
        case PenMode.RGBA: {
          return [this.x, this.y, this.z, this.a];
        }
        case PenMode.HSVA: {
          const rgb = P.utils.hsvToRGB(this.x / 360, this.y / 100, this.z / 100);
          return [rgb[0], rgb[1], rgb[2], this.a];
        }
        case PenMode.HSLA: {
          const rgb = P.utils.hslToRGB(this.x / 360, this.y / 100, this.z / 100);
          return [rgb[0], rgb[1], rgb[2], this.a];
        }
      }
    }

    /**
     * Convert this color to a CSS color code of some sort.
     */
    toCSS(): string {
      switch (this.mode) {
        case PenMode.RGBA:
          return this.css;
        case PenMode.HSLA: {
          const rgb = P.utils.hslToRGB(this.x / 360, this.y / 100, this.z / 100);
          return 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + this.a + ')';
        }
        case PenMode.HSVA: {
          const rgb = P.utils.hsvToRGB(this.x / 360, this.y / 100, this.z / 100);
          return 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + this.a + ')';
        }
      }
    }

    setParam(param: string, value: number) {
      this.toHSVA();
      switch (param) {
        case 'color':
          this.x = (value * 360 / 100) % 360;
          if (this.x < 0) this.x += 360;
          break;
        case 'saturation':
          this.y = P.utils.clamp(value, 0, 100);
          break;
        case 'brightness':
          this.z = P.utils.clamp(value, 0, 100);
          break;
        case 'transparency':
          this.a = 1 - (value / 100);
          if (this.a > 1) this.a = 1;
          if (this.a < 0) this.a = 0;
          break;
      }
    }

    changeParam(param: string, value: number) {
      this.toHSVA();
      switch (param) {
        case 'color':
          this.x = (this.x + value * 360 / 100) % 360;
          if (this.x < 0) this.x += 360;
          break;
        case 'saturation':
          this.y = P.utils.clamp(this.y + value, 0, 100);
          break;
        case 'brightness':
          this.z = P.utils.clamp(this.z + value, 0, 100);
          break;
        case 'transparency':
          this.a = Math.max(0, Math.min(1, this.a - value / 100));
          break;
      }
    }

    copy(other: PenColor) {
      this.x = other.x;
      this.y = other.y;
      this.z = other.z;
      this.a = other.a;
      this.css = other.css;
      this.mode = other.mode;
    }
  }

  export const enum SpecialKeys {
    Enter = 'enter',
    Space = 'space',
    Left = 'left arrow',
    Up = 'up arrow',
    Right = 'right arrow',
    Down = 'down arrow',
    Tab = 'tab',
    Backspace = 'backspace',
    Delete = 'delete',
    Insert = 'insert',
    Home = 'home',
    End = 'end',
    PageUp = 'page up',
    PageDown = 'page down',
    Escape = 'esc',
    Control = 'control',
    Shift = '_shift', // Using 'shift' causes issues because of it's prototypes
  }

  export abstract class Base {
    /**
     * The stage this object belongs to.
     */
    public stage: Stage;
    /**
     * Is this a stage?
     */
    public isStage: boolean = false;
    /**
     * Is this a sprite?
     */
    public isSprite: boolean = false;
    /**
     * Was this Sprite created as a clone of another?
     */
    public isClone: boolean = false;
    /**
     * Is this object visible?
     */
    public visible: boolean = true;
    /**
     * The sprite's X coordinate on the Scratch grid.
     */
    public scratchX: number = 0;
    /**
     * The sprite's Y coordinate on the Scratch grid.
     */
    public scratchY: number = 0;
    /**
     * The name of this object.
     */
    public name: string = '';
    /**
     * Costumes that belong to this object.
     */
    public costumes: Costume[] = [];
    /**
     * The index of the currently selected costume in its costume list.
     */
    public currentCostumeIndex: number = 0;
    /**
     * Sounds that belong to this object.
     */
    public sounds: Sound[] = [];
    /**
     * Maps the names of sounds to the corresponding Sound
     */
    public soundRefs: ObjectMap<Sound> = {};
    /**
     * Currently selected instrument
     */
    public instrument: number = 0;
    /**
     * The volume of this object, where 1.0 === 100% volume
     */
    public volume: number = 1;
    /**
     * The audio node that this object outputs to.
     */
    public node: GainNode | null = null;
    /**
     * Actively playing sounds started with "play until done"
     */
    public activeSounds: Set<ActiveSound> = new Set();
    /**
     * Variable watchers that this object owns.
     */
    public watchers: ObjectMap<Watcher> = {};
    /**
     * List watchers that this object owns.
     */
    public listWatchers: ObjectMap<Watcher> = {};
    /**
     * Variables of this object.
     * Maps variable names (or ids) to their value.
     * Values can be of any type and should likely be converted first.
     */
    public vars: ObjectMap<any> = {};
    /**
     * Lists of this object.
     * Maps list names (or ids) to their list.
     * Each list can contain objects of any type, and should be converted first.
     */
    public lists: ObjectMap<Array<any>> = {};
    /**
     * Is this object saying something?
     */
    public saying: boolean = false;
    /**
     * Should this object's speech bubble be a thinking bubble instead?
     */
    public thinking: boolean = false;
    /**
     * The ID of the last thing said.
     */
    public sayId: number = 0;
    public bubbleContainer: HTMLElement;
    public bubblePointer: HTMLElement;
    public bubbleText: Text;
    /**
     * Maps procedure names (usually includes parameters) to the Procedure object
     */
    public procedures: ObjectMap<Procedure> = {};
    public listeners: Listeners = {
      whenClicked: [],
      whenCloned: [],
      whenGreenFlag: [],
      whenIReceive: {},
      whenKeyPressed: {},
      whenSceneStarts: {},
      edgeActivated: [],
    };
    public fns: P.runtime.Fn[] = [];
    public filters: Filters = {
      color: 0,
      fisheye: 0,
      whirl: 0,
      pixelate: 0,
      mosaic: 0,
      brightness: 0,
      ghost: 0,
    };
    public soundFilters: SoundFilters = {
      pitch: 0,
    };

    // Pen data
    public penSize: number = 1;
    public penColor: PenColor = new PenColor();
    public isPenDown: boolean = false;

    // Data/Loading methods

    addSound(sound: Sound) {
      this.soundRefs[sound.name] = sound;
      this.sounds.push(sound);
    }

    // Implementations of Scratch blocks

    showVariable(name: string, visible: boolean) {
      let watcher = this.watchers[name];
      // Create watchers that might not exist
      if (!watcher) {
        const newWatcher = this.createVariableWatcher(this, name);
        if (!newWatcher) {
          return;
        }
        newWatcher.init();
        this.watchers[name] = watcher = newWatcher;
        this.stage.allWatchers.push(watcher);
      }
      watcher.setVisible(visible);
    }

    showList(name: string, visible: boolean) {
      let watcher = this.listWatchers[name];
      if (!watcher) {
        const newWatcher = this.createListWatcher(this, name);
        if (!newWatcher) {
          return;
        }
        newWatcher.init();
        this.listWatchers[name] = watcher = newWatcher;
        this.stage.allWatchers.push(watcher);
      }
      watcher.setVisible(visible);
    }

    showNextCostume() {
      this.currentCostumeIndex = (this.currentCostumeIndex + 1) % this.costumes.length;
      if (this.saying && isSprite(this)) this.updateBubble();
    }

    showPreviousCostume() {
      var length = this.costumes.length;
      this.currentCostumeIndex = (this.currentCostumeIndex + length - 1) % length;
      if (this.saying && isSprite(this)) this.updateBubble();
    }

    getCostumeName() {
      return this.costumes[this.currentCostumeIndex] ? this.costumes[this.currentCostumeIndex].name : '';
    }

    setCostume(costume: any) {
      if (typeof costume !== 'number') {
        costume = '' + costume;
        for (var i = 0; i < this.costumes.length; i++) {
          if (this.costumes[i].name === costume) {
            this.currentCostumeIndex = i;
            if (this.saying && isSprite(this)) this.updateBubble();
            return;
          }
        }
        if (costume === (this.isSprite ? 'next costume' : 'next backdrop')) {
          this.showNextCostume();
          return;
        }
        if (costume === (this.isSprite ? 'previous costume' : 'previous backdrop')) {
          this.showPreviousCostume();
          return;
        }
        if (!isFinite(costume) || !/\d/.test(costume)) {
          return;
        }
      }

      if (Number.isNaN(costume) || costume === Infinity || costume === -Infinity) {
        costume = 1;
      }
      var i = (Math.floor(costume) - 1) % this.costumes.length;
      if (i < 0) i += this.costumes.length;
      this.currentCostumeIndex = i;
      if (isSprite(this) && this.saying) this.updateBubble();
    }

    setFilter(name: string, value: number) {
      switch (name) {
        case 'ghost':
          if (value < 0) value = 0;
          if (value > 100) value = 100;
          break;
        case 'brightness':
          if (value < -100) value = -100;
          if (value > 100) value = 100;
          break;
        case 'color':
          if (value === Infinity) {
            break;
          }
          value = value % 200;
          if (value < 0) value += 200;
          break;
      }
      this.filters[name] = value;
    }

    changeFilter(name: string, value: number) {
      this.setFilter(name, this.filters[name] + value);
    }

    resetFilters() {
      this.filters = {
        color: 0,
        fisheye: 0,
        whirl: 0,
        pixelate: 0,
        mosaic: 0,
        brightness: 0,
        ghost: 0
      };
      this.soundFilters = {
        pitch: 0
      };
    }

    setSoundFilter(name: string, value: number) {
      // convert NaN to 0
      // todo: NaN should never even be able to get here, see if this is necessary
      value = value || 0;
      switch (name.toLowerCase()) {
        case 'pitch':
          this.soundFilters.pitch = value;
          if (!this.stage.removeLimits) {
            if (this.soundFilters.pitch > 360) this.soundFilters.pitch = 360;
            if (this.soundFilters.pitch < -360) this.soundFilters.pitch = -360;
          }
          break;
      }
    }

    changeSoundFilter(name: string, value: number) {
      switch (name.toLowerCase()) {
        case 'pitch':
          this.soundFilters.pitch += value;
          if (!this.stage.removeLimits) {
            if (this.soundFilters.pitch > 360) this.soundFilters.pitch = 360;
            if (this.soundFilters.pitch < -360) this.soundFilters.pitch = -360;
          }
          break;
      }
    }

    resetSoundFilters() {
      this.soundFilters = {
        pitch: 0,
      };
    }

    getSound(name) {
      if (typeof name === 'string') {
        var s = this.soundRefs[name];
        if (s) return s;
        name = parseInt(name, 10);
      }
      var l = this.sounds.length;
      if (l && typeof name === 'number' && name === name) {
        var i = Math.round(name - 1) % l;
        if (i < 0) i += l;
        return this.sounds[i];
      }
    }

    /**
     * Stops all sounds in this object.
     */
    stopSounds() {
      if (this.node) {
        for (const sound of this.activeSounds) {
          sound.stopped = true;
          if (sound.node) {
            sound.node.disconnect();
          }
        }
        this.activeSounds.clear();
        this.node.disconnect();
        this.node = null;
      }
    }

    stopSoundsExcept(originBase: P.runtime.Fn) {
      if (this.node) {
        for (const sound of this.activeSounds) {
          if (sound.base !== originBase) {
            if (sound.node) {
              sound.node.disconnect();
            }
            sound.stopped = true;
            this.activeSounds.delete(sound);
          }
        }
      }
    }

    ask(question: string) {
      var stage = this.stage;
      if (question) {
        if (this.visible && isSprite(this)) {
          this.say(question);
          stage.promptTitle.style.display = 'none';
        } else {
          stage.promptTitle.style.display = 'block';
          stage.promptTitle.textContent = question;
        }
      } else {
        stage.promptTitle.style.display = 'none';
      }
      stage.hidePrompt = false;
      stage.prompter.style.display = 'block';
      stage.prompt.value = '';
      stage.prompt.focus();
    }

    /**
     * Makes this object say some text.
     * @param text The text to say
     * @param thinking If the text box should be in the thinking style or just speaking
     * @returns A unique ID for this bubble
     */
    say(text: string, thinking: boolean = false): number {
      text = '' + text;

      // Empty strings disable saying anything.
      if (text.length === 0) {
        this.saying = false;
        if (this.bubbleContainer) this.bubbleContainer.style.display = 'none';
        return ++this.sayId;
      }

      this.saying = true;
      this.thinking = thinking;
      if (!this.bubbleContainer) {
        this.bubbleContainer = document.createElement('div');
        this.bubbleContainer.style.maxWidth = (127/14)+'em';
        this.bubbleContainer.style.minWidth = (48/14)+'em';
        this.bubbleContainer.style.padding = (8/14)+'em '+(10/14)+'em';
        this.bubbleContainer.style.border = (3/14)+'em solid rgb(160, 160, 160)';
        this.bubbleContainer.style.borderRadius = (10/14)+'em';
        this.bubbleContainer.style.background = '#fff';
        this.bubbleContainer.style.position = 'absolute';
        this.bubbleContainer.style.font = 'bold 1.4em sans-serif';
        this.bubbleContainer.style.whiteSpace = 'pre-wrap';
        this.bubbleContainer.style.wordWrap = 'break-word';
        this.bubbleContainer.style.textAlign = 'center';
        this.bubbleContainer.style.cursor = 'default';
        this.bubbleContainer.style.pointerEvents = 'auto';
        this.bubbleContainer.appendChild(this.bubbleText = document.createTextNode(''));
        this.bubbleContainer.appendChild(this.bubblePointer = document.createElement('div'));
        this.bubblePointer.style.position = 'absolute';
        this.bubblePointer.style.height = (21 / 14) + 'em';
        this.bubblePointer.style.width = (44 / 14) + 'em';
        this.bubblePointer.style.background = `url("${P.io.config.localPath}icons.svg")`;
        this.bubblePointer.style.backgroundSize = (384/14) + 'em ' + (64/14) + 'em';
        this.bubblePointer.style.backgroundPositionY = (-4/14) + 'em';
        this.stage.ui.appendChild(this.bubbleContainer);
      }
      this.bubblePointer.style.backgroundPositionX = (thinking ? -323 : -259) / 14 + 'em';
      this.bubbleContainer.style.display = 'block';
      this.bubbleText.nodeValue = text;
      this.updateBubble();
      return ++this.sayId;
    }

    /**
     * Updates the position of the speech bubble, or hides it.
     */
    updateBubble() {
      if (!this.visible || !this.saying) {
        this.bubbleContainer.style.display = 'none';
        return;
      }

      this.bubbleContainer.style.display = 'block';
      const b = this.rotatedBounds();
      const left = 240 + b.right;
      var bottom = 180 + b.top;
      const bcr = this.bubbleContainer.getBoundingClientRect();
      const height = (bcr.bottom - bcr.top) / this.stage.zoom;
      const width = (bcr.right - bcr.left) / this.stage.zoom;
      this.bubblePointer.style.top = ((height - 6) / 14) + 'em';
      if (left + width + 2 > 480) {
        var d = (240 - b.left) / 14;
        if (d > 25) d = 25;
        this.bubbleContainer.style.right = d + 'em';
        this.bubbleContainer.style.left = 'auto';
        this.bubblePointer.style.right = (3/14)+'em';
        this.bubblePointer.style.left = 'auto';
        this.bubblePointer.style.backgroundPositionY = (-36/14)+'em';
      } else {
        this.bubbleContainer.style.left = (left / 14) + 'em';
        this.bubbleContainer.style.right = 'auto';
        this.bubblePointer.style.left = (3/14)+'em';
        this.bubblePointer.style.right = 'auto';
        this.bubblePointer.style.backgroundPositionY = (-4/14)+'em';
      }
      if (bottom + height + 2 > 360) {
        bottom = 360 - height - 2;
      }
      if (bottom < 19) {
        bottom = 19;
      }
      this.bubbleContainer.style.bottom = (bottom / 14) + 'em';
    }

    remove() {
      if (this.bubbleContainer) {
        this.stage.ui.removeChild(this.bubbleContainer);
      }
      if (this.node && this.isClone && !this.isStage) {
        // Continue playing sounds started with "start sound" after this sprite has been removed.
        for (const sound of this.activeSounds) {
          if (sound.node) {
            sound.node.disconnect();
          }
          sound.stopped = true;
        }
        this.activeSounds.clear();
        this.node.disconnect();
        this.node.connect(this.stage.getAudioNode());
        this.node = null;
      }
    }

    /**
     * Gets this object's AudioNode, or creates it if it doesn't exist.
     * @throws Error if there is no audio context.
     */
    getAudioNode(): AudioNode {
      if (this.node) {
        return this.node;
      }
      if (!P.audio.context) {
        throw new Error('No audio context');
      }
      this.node = P.audio.context.createGain();
      this.node.gain.value = this.volume;
      P.audio.connectNode(this.node);
      return this.node;
    }

    /**
     * Gets the rectangular bounds that contain this sprite in its entirety.
     */
    abstract rotatedBounds(): RotatedBounds;

    abstract forward(steps: number): void;

    abstract moveTo(x: number, y: number): void;

    abstract touching(thing: string): boolean;

    abstract touchingColor(color: number): boolean;

    abstract colorTouchingColor(sourceColor: number, touchingColor: number): boolean;

    /**
     * Create a Watcher for a variable.
     * @param target The sprite that will own the watcher
     * @param variableName The name (or id) of the variable to monitor
     */
    createVariableWatcher(target: Base, variableName: string): Watcher | null {
      return null;
    }

    /**
     * Create a Watcher for a list.
     * @param target The sprite that will own the watcher
     * @param listName The name (or id) of the variable to monitor
     */
    createListWatcher(target: Base, listName: string): Watcher | null {
      return null;
    }

    /**
     * Create a dot on the pen layer at this object's location
     */
    dotPen() {
      this.stage.renderer.penDot(this.penColor, this.penSize, this.scratchX, this.scratchY);
    }

    /**
     * Create a stamp of this object, as it currently appears, on the pen layer.
     */
    stamp() {
      this.stage.renderer.penStamp(this);
    }

    addWhenKeyPressedHandler(key: string, fn: P.runtime.Fn) {
      if (this.listeners.whenKeyPressed[key]) {
        this.listeners.whenKeyPressed[key].push(fn);
      } else {
        this.listeners.whenKeyPressed[key] = [fn];
      }
    }
  }

  type KeyList = Array<boolean | undefined> & { any: number; };

  // A stage object
  export abstract class Stage extends Base {
    public stage = this;
    public isStage = true;

    /**
     * Sprites inside of this stage.
     */
    public children: Sprite[] = [];

    /**
     * All variable watchers in this stage.
     */
    public allWatchers: Watcher[] = [];

    public answer: string = '';
    public promptId: number = 0;
    public nextPromptId: number = 0;
    public hidePrompt: boolean = false;

    public zoom: number = 1;

    // rawMouseX/rawMouseY = mouse x/y, in Scratch coordinate space, before clamping or rounding
    public rawMouseX: number = 0;
    public rawMouseY: number = 0;
    // mouseX/mouseY = mouse x/y, in Scratch coordinate space, rounded and clamped to the stage bounds
    public mouseX: number = 0;
    public mouseY: number = 0;
    public mousePressed: boolean = false;

    public tempoBPM: number = 60;
    public keys: KeyList;
    public username: string = '';
    public counter: number = 0;

    public runtime: P.runtime.Runtime;

    public canvas: HTMLCanvasElement;
    public renderer: P.renderer.ProjectRenderer;

    public root: HTMLElement;
    public ui: HTMLElement;

    public prompt: HTMLInputElement;
    public prompter: HTMLElement;
    public promptTitle: HTMLElement;
    public promptButton: HTMLElement;
    public mouseSprite: Sprite | undefined;

    public cloudHandler: P.ext.cloud.CloudHandler | null = null;
    public cloudVariables: string[] = [];

    private videoElement: HTMLVideoElement;
    public microphone: P.ext.microphone.MicrophoneExtension | null = null;
    public tts: P.ext.tts.TextToSpeechExtension | null = null;
    private extensions: P.ext.Extension[] = [];

    public useSpriteFencing: boolean = false;
    public removeLimits: boolean = false;

    constructor() {
      super();

      this.runtime = new P.runtime.Runtime(this);

      this.keys = [] as any;
      this.keys.any = 0;

      this.root = document.createElement('div');
      this.root.classList.add('forkphorus-root');

      if (P.config.useWebGL) {
        this.renderer = new P.renderer.webgl.WebGLProjectRenderer(this);
      } else {
        this.renderer = new P.renderer.canvas2d.ProjectRenderer2D(this);
      }
      this.renderer.resize(1);
      this.renderer.init(this.root);
      this.canvas = this.renderer.canvas;

      this.ui = document.createElement('div');
      this.root.appendChild(this.ui);
      this.ui.style.pointerEvents = 'none';

      this.canvas.tabIndex = 0;
      this.canvas.style.outline = 'none';

      this.prompter = document.createElement('div');
      this.ui.appendChild(this.prompter);
      this.prompter.style.zIndex = '1';
      this.prompter.style.pointerEvents = 'auto';
      this.prompter.style.position = 'absolute';
      this.prompter.style.left =
      this.prompter.style.right = '1.4em';
      this.prompter.style.bottom = '.6em';
      this.prompter.style.padding = '.5em 3.0em .5em .5em';
      this.prompter.style.border = '.3em solid rgb(46, 174, 223)';
      this.prompter.style.borderRadius = '.8em';
      this.prompter.style.background = '#fff';
      this.prompter.style.display = 'none';

      this.promptTitle = document.createElement('div');
      this.prompter.appendChild(this.promptTitle);
      this.promptTitle.textContent = '';
      this.promptTitle.style.cursor = 'default';
      this.promptTitle.style.font = 'bold 1.3em sans-serif';
      this.promptTitle.style.margin = '0 '+(-25/13)+'em '+(5/13)+'em 0';
      this.promptTitle.style.whiteSpace = 'pre';
      this.promptTitle.style.overflow = 'hidden';
      this.promptTitle.style.textOverflow = 'ellipsis';

      this.prompt = document.createElement('input');
      this.prompter.appendChild(this.prompt);
      this.prompt.style.border = '0';
      this.prompt.style.background = '#eee';
      this.prompt.style.boxSizing = 'border-box';
      this.prompt.style.font = '1.3em sans-serif';
      this.prompt.style.padding = '0 '+(3/13)+'em';
      this.prompt.style.outline = '0';
      this.prompt.style.margin = '0';
      this.prompt.style.width = '100%';
      this.prompt.style.height = ''+(20/13)+'em';
      this.prompt.style.display = 'block';
      this.prompt.style.borderRadius = '0';
      this.prompt.style.boxShadow = 'inset '+(1/13)+'em '+(1/13)+'em '+(2/13)+'em rgba(0, 0, 0, .2), inset '+(-1/13)+'em '+(-1/13)+'em '+(1/13)+'em rgba(255, 255, 255, .2)';
      this.prompt.style.webkitAppearance = 'none';

      this.promptButton = document.createElement('div');
      this.prompter.appendChild(this.promptButton);
      this.promptButton.style.width = '2.2em';
      this.promptButton.style.height = '2.2em';
      this.promptButton.style.position = 'absolute';
      this.promptButton.style.right = '.4em';
      this.promptButton.style.bottom = '.4em';
      this.promptButton.style.background = `url("${P.io.config.localPath}icons.svg") -22.8em -0.4em`;
      this.promptButton.style.backgroundSize = '38.4em 6.4em';

      this.addEventListeners();
    }

    private addEventListeners() {
      // Global listeners need to have their methods redefined like this so that we can removeEventListener() later
      this._onmousedown = this._onmousedown.bind(this);
      this._onmouseup = this._onmouseup.bind(this);
      this._onmousemove = this._onmousemove.bind(this);
      this._ontouchstart = this._ontouchstart.bind(this);
      this._ontouchend = this._ontouchend.bind(this);
      this._ontouchmove = this._ontouchmove.bind(this);

      document.addEventListener('mousedown', this._onmousedown);
      document.addEventListener('mouseup', this._onmouseup);
      document.addEventListener('mousemove', this._onmousemove);

      document.addEventListener('touchstart', this._ontouchstart, { passive: false });
      document.addEventListener('touchend', this._ontouchend);
      document.addEventListener('touchmove', this._ontouchmove);

      this.root.addEventListener('wheel', this._onwheel.bind(this));
      this.root.addEventListener('keyup', this._onkeyup.bind(this));
      this.root.addEventListener('keydown', this._onkeydown.bind(this));

      this.promptButton.addEventListener('touchstart', this.submitPrompt.bind(this));
      this.promptButton.addEventListener('mousedown', this.submitPrompt.bind(this));
      this.prompt.addEventListener('keydown', (e) => {
        if (e.keyCode === 13) this.submitPrompt();
      });
    }

    private removeEventListeners() {
      // We only need to remove the global handlers that were attached to document
      document.removeEventListener('mousedown', this._onmousedown);
      document.removeEventListener('mouseup', this._onmouseup);
      document.removeEventListener('mousemove', this._onmousemove);
      document.removeEventListener('touchstart', this._ontouchstart);
      document.removeEventListener('touchend', this._ontouchend);
      document.removeEventListener('touchmove', this._ontouchmove);
    }

    private _onwheel(e: WheelEvent) {
      // Scroll up/down triggers key listeners for up/down arrows, but without affecting "is key pressed?" blocks
      if (e.deltaY > 0) {
        this.runtime.trigger('whenKeyPressed', SpecialKeys.Down);
      } else if (e.deltaY < 0) {
        this.runtime.trigger('whenKeyPressed', SpecialKeys.Up);
      }
    }

    private keyEventToCode(e: KeyboardEvent): string | null {
      const key = e.key || '';
      switch (key) {
        case ' ': return SpecialKeys.Space;
        case 'Enter': return SpecialKeys.Enter;
        case 'ArrowLeft': case 'Left': return SpecialKeys.Left;
        case 'ArrowUp': case 'Up': return SpecialKeys.Up;
        case 'ArrowRight': case 'Right': return SpecialKeys.Right;
        case 'ArrowDown': case 'Down': return SpecialKeys.Down;
        case 'Escape': return SpecialKeys.Escape;
        case 'Tab': return SpecialKeys.Tab;
        case 'Backspace': return SpecialKeys.Backspace;
        case 'Delete': return SpecialKeys.Delete;
        case 'Shift': return SpecialKeys.Shift;
        case 'Control': return SpecialKeys.Control;
        case 'Insert': return SpecialKeys.Insert;
        case 'Home': return SpecialKeys.Home;
        case 'End': return SpecialKeys.End;
        case 'PageUp': return SpecialKeys.PageUp;
        case 'PageDown': return SpecialKeys.PageDown;
      }
      if (key.length !== 1) {
        // Additional keys that we don't care about such as volume keys (AudioVolumeUp/Down) and modifier keys
        return null;
      }
      return '' + key.toLowerCase().charCodeAt(0);
    }

    private _onkeyup(e: KeyboardEvent) {
      const c = this.keyEventToCode(e);
      if (c === null) return;
      if (this.keys[c]) this.keys.any--;
      this.keys[c] = false;
      e.stopPropagation();
      if (e.target === this.canvas) {
        e.preventDefault();
      }
    }

    private _onkeydown(e: KeyboardEvent) {
      const c = this.keyEventToCode(e);
      if (c === null) return;
      if (c == SpecialKeys.Tab && !e.shiftKey) return;
      if (!this.keys[c]) this.keys.any++;
      this.keys[c] = true;
      if (e.ctrlKey || e.altKey || e.metaKey || c === SpecialKeys.Escape) return;
      e.stopPropagation();
      if (e.target === this.canvas) {
        e.preventDefault();
        this.runtime.trigger('whenKeyPressed', c);
      }
    }

    private _onmousedown(e: MouseEvent) {
      if (!this.runtime.isRunning) return;

      this.updateMousePosition(e);
      this.mousePressed = true;

      if (e.target === this.canvas) {
        this.clickMouse();
        e.preventDefault();
        this.canvas.focus();
      }

      this.onmousedown(e);
    }

    private _onmouseup(e: MouseEvent) {
      if (!this.runtime.isRunning) return;

      this.updateMousePosition(e);
      this.releaseMouse();
      this.onmouseup(e);
    }

    private _onmousemove(e: MouseEvent) {
      if (!this.runtime.isRunning) return;

      this.updateMousePosition(e);
      this.onmousemove(e);
    }

    private _ontouchend(e: TouchEvent) {
      if (!this.runtime.isRunning) return;

      this.releaseMouse();
      for (var i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        this.ontouch(e, t);
      }
    }

    private _ontouchstart(e: TouchEvent) {
      if (!this.runtime.isRunning) return;

      this.mousePressed = true;

      for (var i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        this.updateMousePosition(t);
        if (e.target === this.canvas) {
          this.clickMouse();
        }
        this.ontouch(e, t);
      }

      if (e.target === this.canvas) e.preventDefault();
    }

    private _ontouchmove(e: TouchEvent) {
      if (!this.runtime.isRunning) return;

      this.updateMousePosition(e.changedTouches[0]);
      for (var i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        this.ontouch(e, t);
      }
    }

    // Event hooks for responding to user actions
    // These are designed to be used by implementors
    ontouch(e: TouchEvent, t: Touch) {}
    onmousedown(e: MouseEvent) {}
    onmouseup(e: MouseEvent) {}
    onmousemove(e: MouseEvent) {}

    /**
     * Delete the stage.
     */
    destroy() {
      this.runtime.stopAll();
      this.runtime.pause();
      this.stopAllSounds();
      for (const extension of this.extensions) {
        extension.destroy();
      }
      this.renderer.destroy();
      this.removeEventListeners();
    }

    pauseExtensions() {
      for (const extension of this.extensions) {
        extension.onpause();
      }
    }

    startExtensions() {
      for (const extension of this.extensions) {
        extension.onstart();
      }
    }

    updateExtensions() {
      if (this.extensions.length) {
        for (const extension of this.extensions) {
          extension.update();
        }
      }
    }

    /**
     * Give browser focus to the Stage.
     */
    focus() {
      if (this.promptId < this.nextPromptId) {
        this.prompt.focus();
      } else {
        this.canvas.focus();
      }
    }

    updateMousePosition(e) {
      var rect = this.canvas.getBoundingClientRect();
      var x = (e.clientX - rect.left) / this.zoom - 240;
      var y = 180 - (e.clientY - rect.top) / this.zoom;
      this.rawMouseX = x;
      this.rawMouseY = y;
      if (x < -240) x = -240;
      if (x > 240) x = 240;
      if (y < -180) y = -180;
      if (y > 180) y = 180;
      this.mouseX = Math.round(x);
      this.mouseY = Math.round(y);
    }

    /**
     * Changes the zoom level and resizes DOM elements.
     */
    setZoom(zoom: number) {
      if (this.zoom === zoom) return;
      this.renderer.resize(zoom);
      this.root.style.width = (480 * zoom | 0) + 'px';
      this.root.style.height = (360 * zoom | 0) + 'px';
      this.root.style.fontSize = (zoom*10) + 'px';
      this.zoom = zoom;
      // Temporary fix to make Scratch 3 list watchers properly resize
      for (const watcher of this.allWatchers) {
        if (watcher instanceof P.sb3.Scratch3ListWatcher) {
          watcher.updateList();
        }
      }
    }

    clickMouse() {
      this.mouseSprite = undefined;
      for (var i = this.children.length; i--;) {
        var c = this.children[i];
        if (c.visible && c.filters.ghost < 100 && c.touching(SpecialObjects.Mouse)) {
          if (c.isDraggable) {
            this.mouseSprite = c;
            c.mouseDown();
          } else {
            this.runtime.triggerFor(c, 'whenClicked');
          }
          return;
        }
      }
      this.runtime.triggerFor(this, 'whenClicked');
    }

    releaseMouse() {
      this.mousePressed = false;
      if (this.mouseSprite) {
        this.mouseSprite.mouseUp();
        this.mouseSprite = undefined;
      }
    }

    setFilter(name: string, value: number) {
      // Override setFilter() to update the filters on the real stage.
      super.setFilter(name, value);
      this.renderer.onStageFiltersChanged();
    }

    resetFilters() {
      super.resetFilters();
      this.renderer.onStageFiltersChanged();
    }

    /**
     * Gets an object with its name, ignoring clones.
     * SpecialObjects.Stage will point to the stage.
     */
    getObject(name: string): Base | null {
      for (var i = 0; i < this.children.length; i++) {
        var c = this.children[i];
        if (c.name === name && !c.isClone) {
          return c;
        }
      }
      if (name === SpecialObjects.Stage || name === this.name) {
        return this;
      }
      return null;
    }

    /**
     * Gets all the objects with a name, including clones.
     * Special values are not supported.
     */
    getObjects(name: string): P.core.Base[] {
      const result: P.core.Base[] = [];
      for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].name === name) {
          result.push(this.children[i]);
        }
      }
      return result;
    }

    /**
     * Determines the position of an object, with support for special values.
     */
    getPosition(name: string): {x: number, y: number} | null {
      switch (name) {
        case SpecialObjects.Mouse: return {
          x: this.mouseX,
          y: this.mouseY,
        };
        case SpecialObjects.Random: return {
          x: Math.round(480 * Math.random() - 240),
          y: Math.round(360 * Math.random() - 180),
        };
      }

      const sprite = this.getObject(name);
      if (!sprite) return null;
      return {
        x: sprite.scratchX,
        y: sprite.scratchY,
      };
    }

    /**
     * Draws this stage on it's renderer.
     */
    draw() {
      this.renderer.drawFrame();

      for (var i = this.allWatchers.length; i--;) {
        var w = this.allWatchers[i];
        if (w.visible) {
          w.update();
        }
      }

      if (this.hidePrompt) {
        this.hidePrompt = false;
        this.prompter.style.display = 'none';
        this.canvas.focus();
      }
    }

    showVideo(visible: boolean) {
      if (P.config.supportVideoSensing) {
        if (visible) {
          if (!this.videoElement) {
            this.videoElement = document.createElement('video');
            this.videoElement.onloadedmetadata = () => {
              this.videoElement.play();
            };
            this.videoElement.style.opacity = '0.5';
            this.root.insertBefore(this.videoElement, this.canvas);
            navigator.mediaDevices.getUserMedia({video: true, audio: false})
              .then((stream) => this.videoElement.srcObject = stream);
          }
          this.videoElement.style.display = 'block';
        } else {
          if (this.videoElement) {
            this.videoElement.style.display = 'none';
          }
        }
      }
    }

    addExtension(extension: P.ext.Extension) {
      this.extensions.push(extension);
    }

    initMicrophone() {
      if (!this.microphone) {
        this.microphone = new P.ext.microphone.MicrophoneExtension(this);
        this.addExtension(this.microphone);
      }
    }

    initTextToSpeech() {
      if (!this.tts) {
        this.tts = new P.ext.tts.TextToSpeechExtension(this);
        this.addExtension(this.tts);
      }
    }

    setCloudHandler(cloudHandler: P.ext.cloud.CloudHandler) {
      this.cloudHandler = cloudHandler;
      this.addExtension(cloudHandler);
    }

    stopAllSounds() {
      for (var children = this.children, i = children.length; i--;) {
        children[i].stopSounds();
      }
      this.stopSounds();
    }

    removeAllClones() {
      var i = this.children.length;
      while (i--) {
        if (this.children[i].isClone) {
          this.children[i].remove();
          this.children.splice(i, 1);
        }
      }
    }

    moveTo() {
      // no-op
    }

    gotoObject() {
      // no-op
    }

    forward() {
      // no-op
    }

    setDirection(direction: number) {
      // no-op
    }

    rotatedBounds() {
      // no-op
      return {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      };
    }

    touching(thing: string) {
      if (thing == SpecialObjects.Mouse) {
        return true;
      }
      return false;
    }

    touchingColor(color: number) {
      // no-op
      return false;
    }

    colorTouchingColor(colorA: number, colorB: number) {
      // no-op
      return false;
    }

    submitPrompt() {
      if (this.promptId < this.nextPromptId) {
        this.answer = this.prompt.value;
        this.promptId += 1;
        if (this.promptId >= this.nextPromptId) {
          this.hidePrompt = true;
        }
      }
    }

    clearPen() {
      this.renderer.penClear();
    }
  }

  // A sprite object
  export abstract class Sprite extends Base {
    public isSprite = true;
    /**
     * Is this Sprite a clone of another Sprite?
     */
    public isClone = false;
    /**
     * The direction this Sprite is facing.
     * 0 is directly up, and 90 is directly right.
     */
    public direction: number = 90;
    /**
     * How this object rotates.
     */
    public rotationStyle: RotationStyle = RotationStyle.Normal;
    /**
     * Can this Sprite be dragged?
     */
    public isDraggable: boolean = false;
    /**
     * Is this Sprite currently being dragged?
     */
    public isDragging: boolean = false;
    /**
     * This sprite's size, with 1 being 100% (normal size)
     * Sprites are scaled from their costume's center
     */
    public scale: number = 1;

    // It's related to dragging sprites.
    public dragStartX: number = 0;
    public dragStartY: number = 0;
    public dragOffsetX: number = 0;
    public dragOffsetY: number = 0;

    constructor(stage: Stage) {
      super();
      this.stage = stage;
    }

    mouseDown() {
      this.dragStartX = this.scratchX;
      this.dragStartY = this.scratchY;
      this.dragOffsetX = this.scratchX - this.stage.mouseX;
      this.dragOffsetY = this.scratchY - this.stage.mouseY;
      this.isDragging = true;
    }

    mouseUp() {
      // We consider a sprite to be clicked if it has been dragged to the same start & end points
      if (this.isDragging && this.scratchX === this.dragStartX && this.scratchY === this.dragStartY) {
        this.stage.runtime.triggerFor(this, 'whenClicked');
      }
      this.isDragging = false;
    }

    // Determines the rotated bounds of the sprite.
    rotatedBounds() {
      const costume = this.costumes[this.currentCostumeIndex];

      const scale = costume.scale * this.scale;
      var left = -costume.rotationCenterX * scale;
      var top = costume.rotationCenterY * scale;
      var right = left + costume.width * scale;
      var bottom = top - costume.height * scale;

      if (this.rotationStyle !== RotationStyle.Normal) {
        if (this.rotationStyle === RotationStyle.LeftRight && this.direction < 0) {
          right = -left;
          left = right - costume.width * costume.scale * this.scale;
        }
        return {
          left: this.scratchX + left,
          right: this.scratchX + right,
          top: this.scratchY + top,
          bottom: this.scratchY + bottom
        };
      }

      const mSin = Math.sin(this.direction * Math.PI / 180);
      const mCos = Math.cos(this.direction * Math.PI / 180);

      // Top left
      const tlX = mSin * left - mCos * top;
      const tlY = mCos * left + mSin * top;

      // Top right
      const trX = mSin * right - mCos * top;
      const trY = mCos * right + mSin * top;

      // Bottom left
      const blX = mSin * left - mCos * bottom;
      const blY = mCos * left + mSin * bottom;

      // Bottom right
      const brX = mSin * right - mCos * bottom;
      const brY = mCos * right + mSin * bottom;

      return {
        left: this.scratchX + Math.min(tlX, trX, blX, brX),
        right: this.scratchX + Math.max(tlX, trX, blX, brX),
        top: this.scratchY + Math.max(tlY, trY, blY, brY),
        bottom: this.scratchY + Math.min(tlY, trY, blY, brY)
      };
    }

    // Shows the rotated bounds of the sprite. For debugging.
    showRotatedBounds() {
      var bounds = this.rotatedBounds();
      var div = document.createElement('div');
      div.style.outline = '1px solid red';
      div.style.position = 'absolute';
      div.style.left = (240 + bounds.left) + 'px';
      div.style.top = (180 - bounds.top) + 'px';
      div.style.width = (bounds.right - bounds.left) + 'px';
      div.style.height = (bounds.top - bounds.bottom) + 'px';
      this.stage.canvas.parentNode!.appendChild(div);
    }

    // Implementing Scratch blocks

    createVariableWatcher(target: P.core.Base, variableName: string) {
      // Asking our parent to handle it is easier.
      return this.stage.createVariableWatcher(target, variableName);
    }

    // Moves forward some number of steps in the current direction.
    forward(steps: number) {
      const d = (90 - this.direction) * Math.PI / 180;
      this.moveTo(this.scratchX + steps * Math.cos(d), this.scratchY + steps * Math.sin(d));
    }

    keepInView() {
      const rb = this.rotatedBounds();
      const width = rb.right - rb.left;
      const height = rb.top - rb.bottom;

      const bounds = Math.min(15, Math.floor(Math.min(width, height) / 2));

      if (rb.right - bounds < -240) {
        this.scratchX -= rb.right - bounds + 240;
      }
      if (rb.left + bounds > 240) {
        this.scratchX -= rb.left + bounds - 240;
      }
      if (rb.bottom + bounds > 180) {
        this.scratchY -= rb.bottom + bounds - 180;
      }
      if (rb.top - bounds < -180) {
        this.scratchY -= rb.top - bounds + 180;
      }
    }

    // Moves the sprite to a coordinate
    // Draws a line if the pen is currently down.
    moveTo(x: number, y: number) {
      var ox = this.scratchX;
      var oy = this.scratchY;
      if (ox === x && oy === y && !this.isPenDown) {
        return;
      }
      this.scratchX = x;
      this.scratchY = y;

      if (this.stage.useSpriteFencing) {
        this.keepInView();
      }

      if (this.isPenDown && !this.isDragging) {
        this.stage.renderer.penLine(this.penColor, this.penSize, ox, oy, x, y);
      }

      if (this.saying) {
        this.updateBubble();
      }
    }

    // Faces in a direction.
    setDirection(degrees: number) {
      if (!isFinite(degrees)) return;
      var d = degrees % 360;
      if (d > 180) d -= 360;
      if (d <= -180) d += 360;
      this.direction = d;
      if (this.saying) this.updateBubble();
    }

    // Clones this sprite.
    clone() {
      const clone = this._clone();
      clone.isClone = true;

      // Copy variables and lists without passing reference
      for (const key of Object.keys(this.vars)) {
        clone.vars[key] = this.vars[key];
      }
      for (const key of Object.keys(this.lists)) {
        clone.lists[key] = this.lists[key].slice(0);
      }

      clone.filters = {
        color: this.filters.color,
        fisheye: this.filters.fisheye,
        whirl: this.filters.whirl,
        pixelate: this.filters.pixelate,
        mosaic: this.filters.mosaic,
        brightness: this.filters.brightness,
        ghost: this.filters.ghost
      };

      // Copy scripts
      clone.procedures = this.procedures;
      clone.listeners = this.listeners;
      clone.fns = this.fns;

      // Copy Data
      clone.name = this.name;
      clone.costumes = this.costumes;
      clone.currentCostumeIndex = this.currentCostumeIndex;
      clone.sounds = this.sounds;
      clone.soundRefs = this.soundRefs;
      clone.direction = this.direction;
      clone.instrument = this.instrument;
      clone.isDraggable = this.isDraggable;
      clone.rotationStyle = this.rotationStyle;
      clone.scale = this.scale;
      clone.volume = this.volume;
      clone.scratchX = this.scratchX;
      clone.scratchY = this.scratchY;
      clone.visible = this.visible;
      clone.penSize = this.penSize;
      clone.penColor.copy(this.penColor);
      clone.isPenDown = this.isPenDown;
      clone.watchers = this.watchers;
      clone.listWatchers = this.listWatchers;

      return clone;
    }

    // Must return a new instance of this Sprite's constructor. Data copying will be handled in clone()
    protected abstract _clone(): P.core.Sprite;

    /**
     * Determines if this sprite is touching another object.
     * @param thing The name of the other object(s)
     */
    touching(thing: string) {
      if (thing === SpecialObjects.Mouse) {
        const x = this.stage.rawMouseX;
        const y = this.stage.rawMouseY;
        return this.stage.renderer.spriteTouchesPoint(this, x, y);
      } else if (thing === SpecialObjects.Edge) {
        const bounds = this.rotatedBounds();
        return bounds.left <= -240 || bounds.right >= 240 || bounds.top >= 180 || bounds.bottom <= -180;
      } else {
        if (!this.visible) return false;
        const sprites = this.stage.getObjects(thing);
        return this.stage.renderer.spritesIntersect(this, sprites);
      }
    }

    /**
     * Determines if this Sprite is touching a color.
     * @param color RGB color, as a single number.
     */
    touchingColor(color: number) {
      return this.stage.renderer.spriteTouchesColor(this, color);
    }

    /**
     * Determines if one of this Sprite's colors are touching another color.
     * @param sourceColor This sprite's color, as an RGB color.
     * @param touchingColor The other color, as an RGB color.
     */
    colorTouchingColor(sourceColor: number, touchingColor: number) {
      return this.stage.renderer.spriteColorTouchesColor(this, sourceColor, touchingColor);
    }

    /**
     * Bounces this Sprite off of an edge of the Stage, if this Sprite is touching one.
     */
    bounceOffEdge() {
      var b = this.rotatedBounds();
      var dl = 240 + b.left;
      var dt = 180 - b.top;
      var dr = 240 - b.right;
      var db = 180 + b.bottom;

      var d = Math.min(dl, dt, dr, db);
      if (d > 0) return;

      var dir = this.direction * Math.PI / 180;
      var dx = Math.sin(dir);
      var dy = -Math.cos(dir);

      switch (d) {
        case dl: dx = Math.max(0.2, Math.abs(dx)); break;
        case dt: dy = Math.max(0.2, Math.abs(dy)); break;
        case dr: dx = -Math.max(0.2, Math.abs(dx)); break;
        case db: dy = -Math.max(0.2, Math.abs(dy)); break;
      }

      this.direction = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      if (this.saying) this.updateBubble();
    }

    /**
     * Determines the distance from this Sprite's center to another position.
     * @param thing The name of any position or Sprite, as accepted by getPosition()
     */
    distanceTo(thing: string) {
      const p = this.stage.getPosition(thing);
      if (!p) {
        return 10000;
      }
      const x = p.x;
      const y = p.y;
      return Math.sqrt((this.scratchX - x) * (this.scratchX - x) + (this.scratchY - y) * (this.scratchY - y));
    }

    /**
     * Makes this Sprite go to another Sprite
     * @param thing The name of any position or Sprite, as accepted by getPosition()
     */
    gotoObject(thing: string) {
      const position = this.stage.getPosition(thing);
      if (!position) {
        return 0;
      }
      this.moveTo(position.x, position.y);
    }

    /**
     * Makes this Sprite point towards another object.
     * @param thing The name of any position or Sprite, as accepted by getPosition()
     */
    pointTowards(thing: string) {
      const position = this.stage.getPosition(thing);
      if (!position) {
        return 0;
      }
      const dx = position.x - this.scratchX;
      const dy = position.y - this.scratchY;
      const dir = dx === 0 && dy === 0 ? 90 : Math.atan2(dx, dy) * 180 / Math.PI;
      if (!isFinite(dir)) return;
      this.direction = dir;
      if (this.saying) this.updateBubble();
    }
  }

  export interface CostumeOptions {
    name: string;
    bitmapResolution: number;
    rotationCenterX: number;
    rotationCenterY: number;
  }

  export abstract class Costume {
    public name: string;
    public rotationCenterX: number;
    public rotationCenterY: number;
    public scale: number;

    public width: number;
    public height: number;
    public isScalable: boolean;

    constructor(costumeData: CostumeOptions) {
      this.name = costumeData.name;
      this.scale = 1 / costumeData.bitmapResolution;
      this.rotationCenterX = costumeData.rotationCenterX;
      this.rotationCenterY = costumeData.rotationCenterY;
    }

    /**
     * Renderers will inform the Costume of the scale requested using requestSize()
     * The Costume will choose whether it needs to rerender or simply do nothing.
     * Only called if isScalable = true
     * TODO: return a boolean to indicate whether texture needs reupload?
     * @param scale The scale factor
     */
    abstract requestSize(scale: number): void;

    /**
     * Get a 2d rendering context for the base image.
     */
    abstract getContext(): CanvasRenderingContext2D;

    /**
     * Get the current image.
     * The image may be scaled in arbitrary ways, the renderer must handle this.
     */
    abstract getImage(): HTMLImageElement | HTMLCanvasElement;
  }

  export class BitmapCostume extends Costume {
    private ctx: CanvasRenderingContext2D;
    private image: HTMLCanvasElement | HTMLImageElement;

    constructor(image: HTMLCanvasElement | HTMLImageElement, options: CostumeOptions) {
      super(options);
      if (image.tagName === 'CANVAS') {
        const ctx = (image as HTMLCanvasElement).getContext('2d');
        if (!ctx) {
          throw new Error(`Cannot get 2d rendering context of costume image, despite it already being a canvas "${this.name}"`);
        }
        this.ctx = ctx;
      }
      this.image = image;
      this.width = image.width;
      this.height = image.height;
      this.isScalable = false;
    }

    getContext() {
      if (this.ctx) {
        return this.ctx;
      }
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error(`cannot get 2d rendering context in getContext on Bitmap "${this.name}"`);
      }
      canvas.width = this.width;
      canvas.height = this.height;
      ctx.drawImage(this.image, 0, 0);
      this.ctx = ctx;
      return ctx;
    }

    getImage() {
      return this.image;
    }

    requestSize(scale: number) {
      throw new Error(`requestSize is not implemented on BitmapCostume "${this.name}" isScalable=${this.isScalable}`);
    }
  }

  export class VectorCostume extends Costume {
    /** Maximum scale factor of a Vector costume. */
    public static MAX_SCALE = 16;
    /** Maximum width or height of a Vector costume. Overrides MAX_SCALE. */
    public static MAX_SIZE = 2048;

    private svg: HTMLImageElement;
    public currentScale: number;
    public maxScale: number;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(svg: HTMLImageElement, options: CostumeOptions) {
      super(options);
      if (svg.height < 1 || svg.width < 1) {
        svg = new Image(1, 1);
      }
      this.isScalable = true;
      this.width = svg.width;
      this.height = svg.height;
      this.svg = svg;
      this.maxScale = this.calculateMaxScale();
      this.currentScale = Math.min(1, this.maxScale);
    }

    private calculateMaxScale(): number {
      if (VectorCostume.MAX_SIZE / this.width < VectorCostume.MAX_SCALE) {
        return VectorCostume.MAX_SIZE / this.width;
      }
      if (VectorCostume.MAX_SIZE / this.height < VectorCostume.MAX_SCALE) {
        return VectorCostume.MAX_SIZE / this.height;
      }
      return VectorCostume.MAX_SCALE;
    }

    private render() {
      const width = Math.floor(Math.max(1, this.width * this.currentScale));
      const height = Math.floor(Math.max(1, this.height * this.currentScale));

      if (!this.canvas) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const fmt = (n: number) => Math.round(n * 100) / 100;
          throw new Error(`cannot get 2d rendering context in initCanvas on Vector "${this.name}" @ ${fmt(this.currentScale)}/${fmt(this.maxScale)} | ${width}x${height}`);
        }
        this.canvas = canvas;
        this.ctx = ctx;
      } else {
        this.canvas.width = width;
        this.canvas.height = height;
      }

      this.ctx.drawImage(this.svg, 0, 0, width, height);
    }

    // This only has effect when uploading svg directly to WebGL texture
    private resizeSvg() {
      this.svg.width = Math.floor(Math.max(1, this.width * this.currentScale));
      this.svg.height = Math.floor(Math.max(1, this.height * this.currentScale));
    }

    requestSize(costumeScale: number) {
      const scale = Math.min(Math.ceil(costumeScale), this.maxScale);
      if (this.currentScale < scale) {
        this.currentScale = scale;
        if (P.config.useWebGL) {
          this.resizeSvg();
        } else if (P.config.allowRasterizeVectors) {
          this.render();
        }
      }
    }

    getContext(): CanvasRenderingContext2D {
      if (this.ctx) {
        return this.ctx;
      }
      this.render();
      return this.ctx;
    }

    getImage() {
      if (!P.config.allowRasterizeVectors) {
        return this.svg;
      }
      if (this.canvas) {
        return this.canvas;
      }
      this.render();
      return this.canvas;
    }
  }

  interface SoundOptions {
    buffer: AudioBuffer;
    name: string;
  }
  // A sound
  export class Sound {
    // TODO: Sound doesn't truly need name
    public name: string;
    public buffer: AudioBuffer;
    public duration: number;
    public source: AudioBufferSourceNode | null = null;

    constructor(data: SoundOptions) {
      if (!data.buffer) throw new Error('no AudioBuffer');
      this.name = data.name;
      this.buffer = data.buffer;
      this.duration = this.buffer.duration;
    }

    createSourceNode() {
      if (this.source) {
        this.source.disconnect();
      }
      const source = P.audio.context!.createBufferSource();
      this.source = source;
      this.source.buffer = this.buffer;
      this.source.addEventListener('ended', () => {
        // @ts-expect-error
        source.ended = true;
      });
      this.source.start();
      return this.source;
    }
  }

  export abstract class Watcher {
    public stage: Stage;
    public targetName: string;
    public target: Base;
    public valid: boolean = true;
    public visible: boolean = true;
    public x: number = 0;
    public y: number = 0;

    constructor(stage: Stage, targetName: string) {
      // The stage this variable watcher belongs to.
      this.stage = stage;

      // The name of the owner of this watcher, if any.
      this.targetName = targetName;
    }

    // Initializes the Watcher. Called once.
    // Expected to be overridden.
    init() {
      this.target = this.stage.getObject(this.targetName) || this.stage;
    }

    // The intended way to change visibility
    setVisible(visible: boolean) {
      this.visible = visible;
    }

    // Updates the VariableWatcher. Called every frame.
    abstract update(): void;
  }

  // An abstract callable procedure
  export abstract class Procedure {
    public fn: P.runtime.Fn;
    public warp: boolean;
    public inputs: any[];

    constructor(fn: runtime.Fn, warp: boolean, inputs: any[]) {
      this.fn = fn;
      this.warp = warp;
      this.inputs = inputs;
    }

    // Call takes a list of inputs and must return the proper arguments to set C.args to in the runtime.
    // Result can be anything as long as the compiler knows how to interpret it.
    abstract call(inputs: any[]): any;
  }

  /**
   * Determines if an object is a sprite
   * Can be used to ease type assertions.
   */
  export function isSprite(base: P.core.Base): base is P.core.Sprite {
    return base.isSprite;
  }
}
