/// <reference path="phosphorus.ts" />
/// <reference path="config.ts" />
/// <reference path="renderer.ts" />

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
    whenKeyPressed: P.runtime.Fn[][];
    whenBackdropChanges: ObjectMap<P.runtime.Fn[]>;
    whenSceneStarts: ObjectMap<P.runtime.Fn[]>;
    // whenSensorGreaterThan: P.runtime.Fn[]
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
     * Maps names (or ids) of variables or lists to their Watcher, if any.
     */
    public watchers: ObjectMap<Watcher> = {};
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
      whenKeyPressed: [],
      whenBackdropChanges: {},
      whenSceneStarts: {},
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

    constructor() {
      for (var i = 0; i < 128; i++) {
        this.listeners.whenKeyPressed.push([]);
      }
    }

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

    setCostume(costume) {
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
        if (!isFinite(costume)) {
          return;
        }
      }
      var i = (Math.floor(costume) - 1 || 0) % this.costumes.length;
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
    }

    getSound(name) {
      if (typeof name === 'string') {
        var s = this.soundRefs[name];
        if (s) return s;
        name = +name;
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
        this.node.disconnect();
        this.node = null;
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
      text = text.toString();

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
        this.bubblePointer.style.background = 'url("icons.svg")';
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

      const b = this.rotatedBounds();
      const left = 240 + b.right;
      var bottom = 180 + b.top;
      const width = this.bubbleContainer.offsetWidth / this.stage.zoom;
      const height = this.bubbleContainer.offsetHeight / this.stage.zoom;
      this.bubblePointer.style.top = ((height - 6) / 14) + 'em';
      if (left + width + 2 > 480) {
        this.bubbleContainer.style.right = ((240 - b.left) / 14) + 'em';
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

    /**
     * Tells this object to cleanup some of the things it may have created.
     */
    remove() {
      if (this.bubbleContainer) {
        this.stage.ui.removeChild(this.bubbleContainer);
        // I don't think doing this is necessary.
        delete this.bubbleContainer;
      }
      if (this.node) {
        this.node.disconnect();
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

    /**
     * Create a Watcher for a variable.
     * @param target The sprite that will own the watcher
     * @param variableName The name (or id) of the variable to monitor
     */
    abstract createVariableWatcher(target: Base, variableName: string): Watcher | null;
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

    public tempoBPM: number = 60;

    public zoom: number = 1;

    public keys: KeyList;

    public rawMouseX: number = 0;
    public rawMouseY: number = 0;
    public mouseX: number = 0;
    public mouseY: number = 0;
    public mousePressed: boolean = false;

    public username: string = '';

    public runtime: P.runtime.Runtime;

    public counter: number = 0;

    public root: HTMLElement;
    public ui: HTMLElement;

    public canvas: HTMLCanvasElement;
    public renderer: P.renderer.ProjectRenderer;

    public prompt: HTMLInputElement;
    public prompter: HTMLElement;
    public promptTitle: HTMLElement;
    public promptButton: HTMLElement;
    public mouseSprite: Sprite | undefined;

    private _currentCostumeIndex: number = this.currentCostumeIndex;

    constructor() {
      super();

      this.runtime = new P.runtime.Runtime(this);

      this.keys = [] as any;
      this.keys.any = 0;

      this.root = document.createElement('div');
      this.root.classList.add('forkphorus-root');

      const scale = P.config.scale;

      if (P.config.useWebGL) {
        this.renderer = new P.renderer.WebGLProjectRenderer(this);
      } else {
        this.renderer = new P.renderer.ProjectRenderer2D(this);
      }
      this.renderer.reset(scale);
      this.renderer.penResize(1);

      this.canvas = this.renderer.canvas;
      this.root.appendChild(this.renderer.stageLayer);
      this.root.appendChild(this.renderer.penLayer);
      this.root.appendChild(this.canvas);

      this.ui = document.createElement('div');
      this.root.appendChild(this.ui);
      this.ui.style.pointerEvents = 'none';

      this.canvas.tabIndex = 0;
      this.canvas.style.outline = 'none';

      this.root.addEventListener('keydown', (e) => {
        var c = e.keyCode;
        if (!this.keys[c]) this.keys.any++;
        this.keys[c] = true;
        if (e.ctrlKey || e.altKey || e.metaKey || c === 27) return;
        e.stopPropagation();
        if (e.target === this.canvas) {
          e.preventDefault();
          this.runtime.trigger('whenKeyPressed', c);
        }
      });

      this.root.addEventListener('keyup', (e) => {
        var c = e.keyCode;
        if (this.keys[c]) this.keys.any--;
        this.keys[c] = false;
        e.stopPropagation();
        if (e.target === this.canvas) {
          e.preventDefault();
        }
      });

      this.root.addEventListener('wheel', (e) => {
        // Scroll up/down triggers key listeners for up/down arrows, but without affecting "is key pressed?" blocks
        if (e.deltaY > 0) {
          // 40 = down arrow
          this.runtime.trigger('whenKeyPressed', 40);
        } else if (e.deltaY < 0) {
          // 38 = up arrow
          this.runtime.trigger('whenKeyPressed', 38);
        }
      }, { passive: true });

      if (P.config.hasTouchEvents) {
        document.addEventListener('touchstart', (e: TouchEvent) => {
          if (!this.runtime.isRunning) return;

          this.mousePressed = true;
          const target = e.target as HTMLElement;

          for (var i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            this.updateMousePosition(t);
            if (e.target === this.canvas) {
              this.clickMouse();
            }
            this.ontouch(e, t);
          }

          if (e.target === this.canvas) e.preventDefault();
        });

        document.addEventListener('touchmove', (e: TouchEvent) => {
          if (!this.runtime.isRunning) return;

          this.updateMousePosition(e.changedTouches[0]);
          for (var i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            this.ontouch(e, t);
          }
        });

        document.addEventListener('touchend', (e: TouchEvent) => {
          if (!this.runtime.isRunning) return;

          this.releaseMouse();
          for (var i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            this.ontouch(e, t);
          }
        });
      } else {
        document.addEventListener('mousedown', (e: MouseEvent) => {
          if (!this.runtime.isRunning) return;

          this.mousePressed = true;
          this.updateMousePosition(e);

          if (e.target === this.canvas) {
            this.clickMouse();
            e.preventDefault();
            this.canvas.focus();
          }

          this.onmousedown(e);
        });

        document.addEventListener('mousemove', (e: MouseEvent) => {
          if (!this.runtime.isRunning) return;
          this.updateMousePosition(e);
          this.onmousemove(e);
        });

        document.addEventListener('mouseup', (e: MouseEvent) => {
          if (!this.runtime.isRunning) return;
          this.updateMousePosition(e);
          this.releaseMouse();
          this.onmouseup(e);
        });
      }

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
      this.promptButton.style.background = 'url(icons.svg) -22.8em -0.4em';
      this.promptButton.style.backgroundSize = '38.4em 6.4em';

      this.prompt.addEventListener('keydown', (e) => {
        if (e.keyCode === 13) {
          this.submitPrompt();
        }
      });

      this.promptButton.addEventListener(P.config.hasTouchEvents ? 'touchstart' : 'mousedown', this.submitPrompt.bind(this));
    }

    // Event hooks for implementing stages to optionally use
    ontouch(e: TouchEvent, t: Touch) {

    }
    onmousedown(e: MouseEvent) {

    }
    onmouseup(e: MouseEvent) {

    }
    onmousemove(e: MouseEvent) {

    }

    /**
     * Delete the stage.
     */
    destroy() {
      this.runtime.stopAll();
      this.runtime.pause();
      this.stopAllSounds();
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
      this.mouseX = x;
      this.mouseY = y;
    }

    /**
     * Updates the backdrop canvas to match the current backdrop.
     */
    updateBackdrop() {
      if (!this.renderer) return;
      this.renderer.updateStage(this.zoom * P.config.scale);
    }

    /**
     * Changes the zoom level and resizes DOM elements.
     */
    setZoom(zoom: number) {
      if (this.zoom === zoom) return;
      this.renderer.penResize(zoom);
      this.root.style.width = (480 * zoom | 0) + 'px';
      this.root.style.height = (360 * zoom | 0) + 'px';
      this.root.style.fontSize = (zoom*10) + 'px';
      this.zoom = zoom;
      this.updateBackdrop();
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
      this.renderer.updateStageFilters();
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
      this.renderer.reset(this.zoom);

      this.drawChildren(this.renderer);

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

    /**
     * Draws all the children (not including the Stage itself or pen layers) of this Stage on a renderer
     * @param skip Optionally skip rendering of a single Sprite.
     */
    drawChildren(renderer: P.renderer.SpriteRenderer, skip?: Base) {
      for (var i = 0; i < this.children.length; i++) {
        const c = this.children[i];
        if (c.isDragging) {
          // TODO: move
          c.moveTo(c.dragOffsetX + c.stage.mouseX, c.dragOffsetY + c.stage.mouseY);
        }
        if (c.visible && c !== skip) {
          renderer.drawChild(c);
        }
      }
    }

    /**
     * Draws all parts of the Stage (including the stage itself and pen layers) on a renderer.
     * @param skip Optionally skip rendering of a single Sprite.
     */
    drawAll(renderer: P.renderer.SpriteRenderer, skip?: Base) {
      renderer.drawChild(this);
      renderer.drawLayer(this.renderer.penLayer);
      this.drawChildren(renderer, skip);
    }

    // Implement rotatedBounds() to return something.
    rotatedBounds() {
      return {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      };
    }

    // Override currentCostumeIndex to automatically update the backdrop when a change is made.
    get currentCostumeIndex() {
      return this._currentCostumeIndex;
    }
    set currentCostumeIndex(index: number) {
      this._currentCostumeIndex = index;
      this.updateBackdrop();
    }

    // Implementing Scratch blocks

    stopAllSounds() {
      for (var children = this.children, i = children.length; i--;) {
        children[i].stopSounds();
      }
      this.stopSounds();
      this.runtime.stopSounds = this.runtime.playingSounds;
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
      // do nothing -- stage cannot be moved
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

    // Pen data
    public penHue: number = 240;
    public penSaturation: number = 100;
    public penLightness: number = 50;
    public penAlpha: number = 1;
    public penCSS: string = '';
    public penSize: number = 1;
    public penColor: number = 0x000000;
    public isPenDown: boolean = false;

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

      if (this.isPenDown && !this.isDragging) {
        this.stage.renderer.penLine(this.getPenCSS(), this.penSize, ox, oy, x, y);
      }

      if (this.saying) {
        this.updateBubble();
      }
    }

    // Makes a pen dot at the current location.
    dotPen() {
      this.stage.renderer.penDot(this.getPenCSS(), this.penSize, this.scratchX, this.scratchY);
    }

    // Stamps the sprite onto the pen layer.
    stamp() {
      this.stage.renderer.penStamp(this);
    }

    getPenCSS() {
      // This is only temporary
      return this.penCSS || 'hsla(' + this.penHue + 'deg,' + this.penSaturation + '%,' + (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness) + '%, ' + this.penAlpha + ')';
    }

    // Faces in a direction.
    setDirection(degrees: number) {
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
      clone.penColor = this.penColor;
      clone.penCSS = this.penCSS;
      clone.penHue = this.penHue;
      clone.penSaturation = this.penSaturation;
      clone.penLightness = this.penLightness;
      clone.penSize = this.penSize;
      clone.isPenDown = this.isPenDown;

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

      b = this.rotatedBounds();
      var x = this.scratchX;
      var y = this.scratchY;
      if (b.left < -240) x += -240 - b.left;
      if (b.top > 180) y += 180 - b.top;
      if (b.right > 240) x += 240 - b.left;
      if (b.bottom < -180) y += -180 - b.top;
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
      this.direction = dx === 0 && dy === 0 ? 90 : Math.atan2(dx, dy) * 180 / Math.PI;
      if (this.saying) this.updateBubble();
    }

    /**
     * Set the RGB color of the pen.
     */
    setPenColor(color: number) {
      this.penColor = color;
      const r = this.penColor >> 16 & 0xff;
      const g = this.penColor >> 8 & 0xff;
      const b = this.penColor & 0xff;
      const a = (this.penColor >> 24 & 0xff) / 0xff || 1;
      this.penCSS = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
    }

    /**
     * Convert the pen's color from RGB to HSL
     */
    setPenColorHSL() {
      if (this.penCSS) {
        const hsl = P.utils.rgbToHSL(this.penColor);
        this.penHue = hsl[0];
        this.penSaturation = hsl[1];
        this.penLightness = hsl[2];
        this.penAlpha = (this.penColor >> 24 & 0xff) / 0xff || 1;
        this.penCSS = '';
      }
    }

    // Sets a pen color HSL parameter.
    setPenColorParam(param: string, value: number) {
      this.setPenColorHSL();
      switch (param) {
        case 'color':
          this.penHue = value * 360 / 100;
          break;
        case 'saturation':
          this.penSaturation = value;
          break;
        case 'brightness':
          this.penLightness = value % 200;
          if (this.penLightness < 0) {
            this.penLightness += 200;
          }
          break;
        case 'transparency':
          this.penAlpha -= value / 100;
          if (this.penAlpha > 1) this.penAlpha = 1;
          if (this.penAlpha < 0) this.penAlpha = 0;
          break;
      }
    }

    // Changes a pen color HSL parameter.
    changePenColorParam(param: string, value: number) {
      this.setPenColorHSL();
      switch (param) {
        case 'color':
          this.penHue += value * 360 / 100;
          break;
        case 'saturation':
          this.penSaturation += value;
          break;
        case 'brightness':
          this.penLightness = (this.penLightness + value) % 200;
          if (this.penLightness < 0) {
            this.penLightness += 200;
          }
          break;
        case 'transparency':
          this.penAlpha = Math.max(0, Math.min(1, value / 100));
          break;
      }
    }
  }

  interface CostumeOptions {
    name: string;
    bitmapResolution: number;
    rotationCenterX: number;
    rotationCenterY: number;
  }

  // A costume
  export abstract class Costume {
    public name: string;
    public rotationCenterX: number;
    public rotationCenterY: number;
    public bitmapResolution: number;
    public scale: number;

    public width: number;
    public height: number;

    constructor(costumeData: CostumeOptions) {
      this.bitmapResolution = costumeData.bitmapResolution;
      this.scale = 1 / this.bitmapResolution;
      this.name = costumeData.name;
      this.rotationCenterX = costumeData.rotationCenterX;
      this.rotationCenterY = costumeData.rotationCenterY;
    }

    /**
     * Gets a 2D context representation of the costume's source (1x zoom)
     */
    abstract getContext(): CanvasRenderingContext2D;

    /**
     * Gets a zoom level of the costume. The costume may provide a different zoom level than requested.
     */
    abstract get(scale: number): HTMLImageElement | HTMLCanvasElement;
  }

  export class BitmapCostume extends Costume {
    private _context: CanvasRenderingContext2D | null;
    private source: HTMLCanvasElement | HTMLImageElement;

    constructor(source: HTMLCanvasElement | HTMLImageElement, options: CostumeOptions) {
      super(options);
      this.source = source;
      if (source.tagName === 'CANVAS') {
        const ctx = (source as HTMLCanvasElement).getContext('2d');
        if (!ctx) {
          throw new Error('Cannot get 2d rendering context of costume source');
        }
        this._context = ctx;
      } else {
        this._context = null;
      }
      this.width = source.width;
      this.height = source.height;
    }

    get(scale: number) {
      // Bitmap costumes do not have different resolutions
      return this.source;
    }

    getContext() {
      if (this._context) return this._context;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('cannot get 2d rendering context');
      }
      canvas.width = this.width;
      canvas.height = this.height;
      ctx.drawImage(this.source, 0, 0);
      this._context = ctx;
      return ctx;
    }
  }

  export class VectorCostume extends Costume {
    private source: HTMLImageElement;
    private _context: CanvasRenderingContext2D;
    private scales: Array<HTMLCanvasElement> = [];

    constructor(svg: HTMLImageElement, options: CostumeOptions) {
      super(options);
      if (svg.height < 1 || svg.width < 1) {
        svg = new Image(1, 1);
      }
      this.width = svg.width;
      this.height = svg.height;
      this.source = svg;
      // calculate the 1x zoom before load because it'll most likely be used.
      // TODO: maybe don't do this?
      this.scales[0] = this.getScale(1);
    }

    private getScale(scale: number) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, this.width * scale);
      canvas.height = Math.max(1, this.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('cannot get 2d rendering context');
      }
      ctx.drawImage(this.source, 0, 0, canvas.width, canvas.height);
      return canvas;
    }

    get(scale: number) {
      scale = Math.min(8, Math.ceil(scale));
      const index = scale - 1;
      if (!this.scales[index]) {
        this.scales[index] = this.getScale(scale);
      }
      return this.scales[index];
    }

    getContext() {
      if (this._context) return this._context;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('cannot get 2d rendering context');
      }
      canvas.width = this.width;
      canvas.height = this.height;
      ctx.drawImage(this.source, 0, 0);
      this._context = ctx;
      return ctx;
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
      this.source = P.audio.context!.createBufferSource();
      this.source.buffer = this.buffer;
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
