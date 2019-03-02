/// <reference path="phosphorus.ts" />
/// <reference path="config.ts" />
/// <reference path="renderer.ts" />

// Phosphorus Core
// Has some base classes that implement most functions while leaving some to implementations. (see P.sb2 and P.sb3)
namespace P.core {
  // Canvases used for various collision testing later on
  const collisionCanvas = document.createElement('canvas');
  const collisionRenderer = new P.renderer.CanvasRenderer(collisionCanvas);
  const secondaryCollisionCanvas = document.createElement('canvas');
  const secondaryCollisionRenderer = new P.renderer.CanvasRenderer(secondaryCollisionCanvas);

  interface RotatedBounds {
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
    whenSceneStarts: P.runtime.Fn[];
    // whenSensorGreaterThan: P.runtime.Fn[]
  }

  export abstract class Base {
    // The parent stage.
    public stage: Stage;

    // Is this object a clone of another?
    public isClone: boolean = false;
    // Is this object a stage?
    public isStage: boolean = false;
    // Is this object a sprite?
    public isSprite: boolean = false;

    // Is this sprite visible?
    public visible: boolean = true;

    // The sprite's X coordinate in Scratch space.
    public scratchX: number = 0;
    // The sprite's X coordinate in Scratch space.
    public scratchY: number = 0;

    // The name of the object.
    public name: string = '';
    // The costumes of the object.
    public costumes: Costume[] = [];
    // The index of the currently selected costume.
    public currentCostumeIndex: number = 0;
    // The sounds of the objects.
    public sounds: Sound[] = [];
    // Map of sound name to the Sound object. TODO: remove?
    public soundRefs: ObjectMap<Sound> = {};
    // Current instrument
    public instrument: number = 0;
    // Current volume, from 0-1
    public volume: number = 1;
    // This object's audio node.
    public node: GainNode;
    // The rotation style of the object.
    public rotationStyle: 'normal' | 'leftRight' | 'none' = 'normal';
    // Variables of the object.
    public vars: ObjectMap<any> = {};
    // Variable watchers of the object.
    public watchers: ObjectMap<VariableWatcher> = {};
    // Lists of the object.
    public lists: ObjectMap<Array<any>> = {};
    // Is this object saying something?
    public saying: boolean = false;
    // Procedures of the object.
    public procedures: ObjectMap<Procedure> = {};
    public listeners: Listeners = {
      whenClicked: [],
      whenCloned: [],
      whenGreenFlag: [],
      whenIReceive: {},
      whenKeyPressed: [],
      whenBackdropChanges: {},
      whenSceneStarts: [],
    };
    public fns: any[] = []; // TODO
    public filters = {
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

    addSound(sound) {
      this.soundRefs[sound.name] = sound;
      this.sounds.push(sound);
    }

    // Implementations of Scratch blocks

    showVariable(name, visible) {
      var watcher = this.watchers[name];
      var stage = this.stage;

      if (!watcher) {
        watcher = this.createVariableWatcher(this, name);
        if (!watcher) {
          return;
        }
        watcher.init();
        this.watchers[name] = watcher;
        stage.allWatchers.push(watcher);
      }

      watcher.setVisible(visible);
    }

    showNextCostume() {
      this.currentCostumeIndex = (this.currentCostumeIndex + 1) % this.costumes.length;
      if (isStage(this)) this.updateBackdrop();
      if (this.saying && isSprite(this)) this.updateBubble();
    }

    showPreviousCostume() {
      var length = this.costumes.length;
      this.currentCostumeIndex = (this.currentCostumeIndex + length - 1) % length;
      if (isStage(this)) this.updateBackdrop();
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
            if (isStage(this)) this.updateBackdrop();
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
      if (isStage(this)) this.updateBackdrop();
      if (isSprite(this) && this.saying) this.updateBubble();
    }

    setFilter(name, value) {
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
      if (isStage(this)) this.updateFilters();
    }

    changeFilter(name, value) {
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

    stopSounds() {
      if (this.node) {
        this.node.disconnect();
        this.node = null;
      }
      for (var i = this.sounds.length; i--;) {
        var s = this.sounds[i];
        if (s.node) {
          s.node.disconnect();
          s.node = null;
        }
      }
    }

    ask(question) {
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

    abstract rotatedBounds(): RotatedBounds;

    abstract createVariableWatcher(target: Base, variableName: string): VariableWatcher | null;
  }

  type KeyList = Array<boolean | undefined> & { any: number; };

  // A stage object
  export abstract class Stage extends Base {
    // We are our own stage.
    public stage = this;
    // We are a stage.
    public isStage = true;

    // Child sprites
    public children: Sprite[] = [];
    public dragging: any = {}; // TODO

    // All watchers in the Stage
    public allWatchers: VariableWatcher[] = [];

    public answer: string = '';
    public promptId: number = 0;
    public nextPromptId: number = 0;
    public hidePrompt: boolean = false;

    public tempoBPM: number = 60;

    public zoom: number = 1;
    public maxZoom: number = P.config.scale;

    public keys: KeyList;

    public rawMouseX: number = 0;
    public rawMouseY: number = 0;
    public mouseX: number = 0;
    public mouseY: number = 0;
    public mousePressed: boolean = false;

    public username: string = '';

    public runtime: P.runtime.Runtime;

    public root: HTMLElement;
    public ui: HTMLElement;
    public canvas: HTMLCanvasElement;
    public renderer: P.renderer.CanvasRenderer;
    public backdropCanvas: HTMLCanvasElement;
    public backdropContext: CanvasRenderingContext2D;
    public penCanvas: HTMLCanvasElement;
    public penRenderer: P.renderer.CanvasRenderer;
    public prompt: HTMLInputElement;
    public prompter: HTMLElement;
    public promptTitle: HTMLElement;
    public promptButton: HTMLElement;
    public bubble: HTMLElement;
    public mouseSprite: Sprite;

    private onTouchStart: EventListener;
    private onTouchEnd: EventListener;
    private onTouchMove: EventListener;
    private onMouseDown: EventListener;
    private onMouseUp: EventListener;
    private onMouseMove: EventListener;

    constructor() {
      super();

      this.keys = [] as KeyList;
      this.keys.any = 0;
      this.runtime = new P.runtime.Runtime(this);

      this.root = document.createElement('div');
      this.root.classList.add('forkphorus-root');
      this.root.style.position = 'absolute';
      this.root.style.overflow = 'hidden';
      this.root.style.userSelect = 'none';

      var scale = P.config.scale;

      this.backdropCanvas = document.createElement('canvas');
      this.root.appendChild(this.backdropCanvas);
      this.backdropCanvas.width = scale * 480;
      this.backdropCanvas.height = scale * 360;
      this.backdropContext = this.backdropCanvas.getContext('2d');

      this.penCanvas = document.createElement('canvas');
      this.root.appendChild(this.penCanvas);
      this.penCanvas.width = scale * 480;
      this.penCanvas.height = scale * 360;
      this.penRenderer = new P.renderer.CanvasRenderer(this.penCanvas);
      this.penRenderer.ctx.lineCap = 'round';
      this.penRenderer.ctx.scale(scale, scale);

      this.canvas = document.createElement('canvas');
      this.root.appendChild(this.canvas);
      this.renderer = new P.renderer.CanvasRenderer(this.canvas);

      this.ui = document.createElement('div');
      this.root.appendChild(this.ui);
      this.ui.style.pointerEvents = 'none';

      this.canvas.tabIndex = 0;
      this.canvas.style.outline = 'none';

      this.backdropCanvas.style.position =
        this.penCanvas.style.position =
        this.canvas.style.position =
        this.ui.style.position = 'absolute';

      this.backdropCanvas.style.left =
        this.penCanvas.style.left =
        this.canvas.style.left =
        this.ui.style.left =
        this.backdropCanvas.style.top =
        this.penCanvas.style.top =
        this.canvas.style.top =
        this.ui.style.top = '0';

      this.backdropCanvas.style.width =
        this.penCanvas.style.width =
        this.canvas.style.width =
        this.ui.style.width = '480px';

      this.backdropCanvas.style.height =
        this.penCanvas.style.height =
        this.canvas.style.height =
        this.ui.style.height = '360px';

      this.backdropCanvas.style.transform =
        this.penCanvas.style.transform =
        this.canvas.style.transform =
        this.ui.style.transform = 'translateZ(0)';

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

      if (P.config.hasTouchEvents) {

        document.addEventListener('touchstart', this.onTouchStart = (e: TouchEvent) => {
          this.mousePressed = true;
          const target = e.target as HTMLElement;

          for (var i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            this.updateMouse(t);
            if (e.target === this.canvas) {
              this.clickMouse();
            } else if (target.dataset.button != null || target.dataset.slider != null) {
              this.watcherStart(t.identifier, t, e);
            }
          }

          if (e.target === this.canvas) e.preventDefault();
        });

        document.addEventListener('touchmove', this.onTouchMove = (e: TouchEvent) => {
          this.updateMouse(e.changedTouches[0]);
          for (var i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            this.watcherMove(t.identifier, t, e);
          }
        });

        document.addEventListener('touchend', this.onTouchEnd = (e: TouchEvent) => {
          this.releaseMouse();
          for (var i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            this.watcherEnd(t.identifier, t, e);
          }
        });

      } else {

        document.addEventListener('mousedown', this.onMouseDown = (e) => {
          this.updateMouse(e);
          this.mousePressed = true;
          const target = e.target as HTMLElement;

          if (e.target === this.canvas) {
            this.clickMouse();
            e.preventDefault();
            this.canvas.focus();
          } else {
            if (target.dataset.button != null || target.dataset.slider != null) {
              this.watcherStart('mouse', e, e);
            }
          }
        });

        document.addEventListener('mousemove', this.onMouseMove = (e) => {
          this.updateMouse(e);
          this.watcherMove('mouse', e, e);
        });

        document.addEventListener('mouseup', this.onMouseUp = (e) => {
          this.updateMouse(e);
          this.releaseMouse();
          this.watcherEnd('mouse', e, e);
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

    // TODO: move to Scratch2Stage, it's not used in Scratch3Stage
    watcherStart(id, t, e) {
      var p = e.target;
      while (p && p.dataset.watcher == null) p = p.parentElement;
      if (!p) return;
      var w = this.allWatchers[p.dataset.watcher] as P.sb2.Scratch2VariableWatcher;
      this.dragging[id] = {
        watcher: w,
        offset: (e.target.dataset.button == null ? -w.button.offsetWidth / 2 | 0 : w.button.getBoundingClientRect().left - t.clientX) - w.slider.getBoundingClientRect().left
      };
    }
    watcherMove(id, t, e) {
      var d = this.dragging[id];
      if (!d) return;
      var w = d.watcher as P.sb2.Scratch2VariableWatcher;
      var sw = w.slider.offsetWidth;
      var bw = w.button.offsetWidth;
      var value = w.sliderMin + Math.max(0, Math.min(1, (t.clientX + d.offset) / (sw - bw))) * (w.sliderMax - w.sliderMin);
      w.target.vars[w.param] = w.isDiscrete ? Math.round(value) : Math.round(value * 100) / 100;
      w.update();
      e.preventDefault();
    }
    watcherEnd(id, t, e) {
      this.watcherMove(id, t, e);
      delete this.dragging[id];
    }

    destroy() {
      this.runtime.stopAll();
      this.runtime.pause();
      this.stopAllSounds();
      if (this.onTouchStart) document.removeEventListener('touchstart', this.onTouchStart);
      if (this.onTouchMove) document.removeEventListener('touchmove', this.onTouchMove);
      if (this.onTouchEnd) document.removeEventListener('touchend', this.onTouchEnd);
      if (this.onMouseDown) document.removeEventListener('mousedown', this.onMouseDown);
      if (this.onMouseMove) document.removeEventListener('mousemove', this.onMouseMove);
      if (this.onMouseUp) document.removeEventListener('mouseup', this.onMouseUp);
    }

    focus() {
      if (this.promptId < this.nextPromptId) {
        this.prompt.focus();
      } else {
        this.canvas.focus();
      }
    }

    updateMouse(e) {
      var bb = this.canvas.getBoundingClientRect();
      var x = (e.clientX - bb.left) / this.zoom - 240;
      var y = 180 - (e.clientY - bb.top) / this.zoom;
      this.rawMouseX = x;
      this.rawMouseY = y;
      if (x < -240) x = -240;
      if (x > 240) x = 240;
      if (y < -180) y = -180;
      if (y > 180) y = 180;
      this.mouseX = x;
      this.mouseY = y;
    }

    updateBackdrop() {
      this.backdropCanvas.width = this.zoom * P.config.scale * 480;
      this.backdropCanvas.height = this.zoom * P.config.scale * 360;
      var costume = this.costumes[this.currentCostumeIndex];
      this.backdropContext.save();
      var s = this.zoom * P.config.scale * costume.scale;
      this.backdropContext.scale(s, s);
      this.updateFilters();
      this.backdropContext.drawImage(costume.image, 0, 0);
      this.backdropContext.restore();
    }

    updateFilters() {
      this.backdropCanvas.style.opacity = '' + Math.max(0, Math.min(1, 1 - this.filters.ghost / 100));

      let filter = '';
      if (this.filters.brightness) {
        filter += 'brightness(' + (100 + this.filters.brightness) + '%) ';
      }
      if (this.filters.color) {
        filter += 'hue-rotate(' + this.filters.color / 200 * 360 + 'deg) ';
      }
      this.backdropCanvas.style.filter = filter;
    }

    setZoom(zoom) {
      if (this.zoom === zoom) return;
      if (this.maxZoom < zoom * P.config.scale) {
        this.maxZoom = zoom * P.config.scale;
        var canvas = document.createElement('canvas');
        canvas.width = this.penCanvas.width;
        canvas.height = this.penCanvas.height;
        canvas.getContext('2d').drawImage(this.penCanvas, 0, 0);
        this.penCanvas.width = 480 * zoom * P.config.scale;
        this.penCanvas.height = 360 * zoom * P.config.scale;
        this.penRenderer.ctx.drawImage(canvas, 0, 0, 480 * zoom * P.config.scale, 360 * zoom * P.config.scale);
        this.penRenderer.reset(this.maxZoom);
        this.penRenderer.ctx.lineCap = 'round';
      }
      this.root.style.width =
      this.canvas.style.width =
      this.backdropCanvas.style.width =
      this.penCanvas.style.width =
      this.ui.style.width = (480 * zoom | 0) + 'px';
      this.root.style.height =
      this.canvas.style.height =
      this.backdropCanvas.style.height =
      this.penCanvas.style.height =
      this.ui.style.height = (360 * zoom | 0) + 'px';
      this.root.style.fontSize = (zoom*10) + 'px';
      this.zoom = zoom;
      this.updateBackdrop();
    }

    clickMouse() {
      this.mouseSprite = undefined;
      for (var i = this.children.length; i--;) {
        var c = this.children[i];
        if (c.visible && c.filters.ghost < 100 && c.touching('_mouse_')) {
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

    // Gets an object with a name.
    // Does not return clones.
    // Can return the stage object itself if you pass '_stage_' or the name of the stage.
    getObject(name) {
      for (var i = 0; i < this.children.length; i++) {
        var c = this.children[i];
        if (c.name === name && !c.isClone) {
          return c;
        }
      }
      if (name === '_stage_' || name === this.name) {
        return this;
      }
    }

    // Gets all the objects with a name.
    // Includes the original object and any clones.
    // No special values like '_stage_' are supported.
    getObjects(name) {
      var result = [];
      for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].name === name) {
          result.push(this.children[i]);
        }
      }
      return result;
    }

    // Determines the position of an object from its name, with support for '_random_' and '_mouse_'
    // Returns {x: number, y: number} or null.
    getPosition(name) {
      if (name === '_mouse_') {
        return {
          x: this.mouseX,
          y: this.mouseY,
        };
      } else if (name === '_random_') {
        return {
          x: Math.round(480 * Math.random() - 240),
          y: Math.round(360 * Math.random() - 180),
        };
      } else {
        var sprite = this.getObject(name);
        if (!sprite) return null;
        return {
          x: sprite.scratchX,
          y: sprite.scratchY,
        };
      }
    }

    // Draws the project.
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

    // Draws all the children onto a renderer, optionally skipping an object.
    drawChildren(renderer: P.renderer.CanvasRenderer, skip?: Sprite) {
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

    // Draws all the objects onto a renderer, optionally skipping an object.
    drawAll(renderer: P.renderer.CanvasRenderer, skip?: Sprite) {
      renderer.drawChild(this);
      renderer.drawImage(this.penCanvas, 0, 0);
      this.drawChildren(renderer, skip);
    }

    // Determines a broadcast ID from it's name.
    // Name is simply what the broadcast block has for an input.
    abstract getBroadcastId(name: string): string;

    // Implementing Scratch blocks

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
      this.penRenderer.reset(this.maxZoom);
      this.penRenderer.ctx.lineCap = 'round';
    }

    rotatedBounds() {
      return {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      };
    }
  }

  // A sprite object
  export abstract class Sprite extends Base {
    public isSprite = true;
    public isClone = false;
    public direction: number = 0;
    public isDraggable: boolean = false;
    public isDragging: boolean = false;
    public scale: number = 1;
    public penHue: number = 240;
    public penSaturation: number = 100;
    public penLightness: number = 50;
    public penCSS: string = '';
    public penSize: number = 1;
    public penColor: number = 0x000000;
    public isPenDown: boolean = false;
    public bubble: HTMLElement;
    public thinking: boolean = false;
    public sayId: number = 0;
    public bubblePointer: HTMLElement;
    public bubbleText: Text;
    public dragStartX: number = 0;
    public dragStartY: number = 0;
    public dragOffsetX: number = 0;
    public dragOffsetY: number = 0;

    constructor(stage) {
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
      var right = left + costume.image.width * scale;
      var bottom = top - costume.image.height * scale;

      if (this.rotationStyle !== 'normal') {
        if (this.rotationStyle === 'leftRight' && this.direction < 0) {
          right = -left;
          left = right - costume.image.width * costume.scale * this.scale;
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
      this.stage.canvas.parentNode.appendChild(div);
    }

    // Implementing Scratch blocks

    createVariableWatcher(target: P.core.Base, variableName: string) {
      return this.stage.createVariableWatcher(target, variableName);
    }

    // Moves forward some number of steps in the current direction.
    forward(steps) {
      const d = (90 - this.direction) * Math.PI / 180;
      this.moveTo(this.scratchX + steps * Math.cos(d), this.scratchY + steps * Math.sin(d));
    }

    // Moves the sprite to a coordinate
    // Draws a line if the pen is currently down.
    moveTo(x, y) {
      var ox = this.scratchX;
      var oy = this.scratchY;
      if (ox === x && oy === y && !this.isPenDown) {
        return;
      }
      this.scratchX = x;
      this.scratchY = y;

      if (this.isPenDown && !this.isDragging) {
        var context = this.stage.penRenderer.ctx;
        if (this.penSize % 2 > .5 && this.penSize % 2 < 1.5) {
          ox -= .5;
          oy -= .5;
          x -= .5;
          y -= .5;
        }
        context.strokeStyle = this.penCSS || 'hsl(' + this.penHue + ',' + this.penSaturation + '%,' + (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness) + '%)';
        context.lineWidth = this.penSize;
        context.beginPath();
        context.moveTo(240 + ox, 180 - oy);
        context.lineTo(240 + x, 180 - y);
        context.stroke();
      }

      if (this.saying) {
        this.updateBubble();
      }
    }

    // Makes a pen dot at the current location.
    dotPen() {
      var context = this.stage.penRenderer.ctx;
      var x = this.scratchX;
      var y = this.scratchY;
      context.fillStyle = this.penCSS || 'hsl(' + this.penHue + ',' + this.penSaturation + '%,' + (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness) + '%)';
      context.beginPath();
      context.arc(240 + x, 180 - y, this.penSize / 2, 0, 2 * Math.PI, false);
      context.fill();
    }

    // Stamps the sprite onto the pen layer.
    stamp() {
      this.stage.penRenderer.drawChild(this);
    }

    // Faces in a direction.
    setDirection(degrees) {
      var d = degrees % 360;
      if (d > 180) d -= 360;
      if (d <= -180) d += 360;
      this.direction = d;
      if (this.saying) this.updateBubble();
    }

    // Clones this sprite.
    clone() {
      var clone = this._clone();
      clone.isClone = true;

      // Copy variables and lists without passing reference
      var keys = Object.keys(this.vars);
      for (var i = keys.length; i--;) {
        var k = keys[i];
        clone.vars[k] = this.vars[k];
      }

      var keys = Object.keys(this.lists);
      for (var i = keys.length; i--;) {
        var k = keys[i];
        clone.lists[k] = this.lists[k].slice(0);
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
    abstract _clone(): P.core.Sprite;

    // Determines if the sprite is touching an object.
    // thing is the name of the object, '_mouse_', or '_edge_'
    touching(thing) {
      var costume = this.costumes[this.currentCostumeIndex];

      if (thing === '_mouse_') {
        var bounds = this.rotatedBounds();
        var x = this.stage.rawMouseX;
        var y = this.stage.rawMouseY;
        if (x < bounds.left || y < bounds.bottom || x > bounds.right || y > bounds.top) {
          return false;
        }

        var cx = (x - this.scratchX) / this.scale;
        var cy = (this.scratchY - y) / this.scale;
        if (this.rotationStyle === 'normal' && this.direction !== 90) {
          var d = (90 - this.direction) * Math.PI / 180;
          var ox = cx;
          var s = Math.sin(d), c = Math.cos(d);
          cx = c * ox - s * cy;
          cy = s * ox + c * cy;
        } else if (this.rotationStyle === 'leftRight' && this.direction < 0) {
          cx = -cx;
        }

        var positionX = Math.round(cx * costume.bitmapResolution + costume.rotationCenterX);
        var positionY = Math.round(cy * costume.bitmapResolution + costume.rotationCenterY);
        var data = costume.context.getImageData(positionX, positionY, 1, 1).data;
        return data[3] !== 0;
      } else if (thing === '_edge_') {
        var bounds = this.rotatedBounds();
        return bounds.left <= -240 || bounds.right >= 240 || bounds.top >= 180 || bounds.bottom <= -180;
      } else {
        if (!this.visible) return false;
        var sprites = this.stage.getObjects(thing);

        for (var i = sprites.length; i--;) {
          var sprite = sprites[i];
          if (!sprite.visible) continue;

          var mb = this.rotatedBounds();
          var ob = sprite.rotatedBounds();

          if (mb.bottom >= ob.top || ob.bottom >= mb.top || mb.left >= ob.right || ob.left >= mb.right) {
            continue;
          }

          var left = Math.max(mb.left, ob.left);
          var top = Math.min(mb.top, ob.top);
          var right = Math.min(mb.right, ob.right);
          var bottom = Math.max(mb.bottom, ob.bottom);
          
          if (right - left < 1 || top - bottom < 1) {
            continue;
          }

          collisionRenderer.canvas.width = right - left;
          collisionRenderer.canvas.height = top - bottom;

          collisionRenderer.ctx.save();
          collisionRenderer.ctx.translate(-(left + 240), -(180 - top));

          collisionRenderer.noEffects = true;
          collisionRenderer.drawChild(this);
          collisionRenderer.ctx.globalCompositeOperation = 'source-in';
          collisionRenderer.drawChild(sprite);
          collisionRenderer.noEffects = false;

          collisionRenderer.ctx.restore();

          var data = collisionRenderer.ctx.getImageData(0, 0, right - left, top - bottom).data;

          var length = (right - left) * (top - bottom) * 4;
          for (var j = 0; j < length; j += 4) {
            if (data[j + 3]) {
              return true;
            }
          }
        }
        return false;
      }
    }

    // Determines if this Sprite is touching a color.
    touchingColor(rgb) {
      var b = this.rotatedBounds();

      collisionCanvas.width = b.right - b.left;
      collisionCanvas.height = b.top - b.bottom;

      collisionRenderer.ctx.save();
      collisionRenderer.ctx.translate(-(240 + b.left), -(180 - b.top));

      this.stage.drawAll(collisionRenderer, this);
      collisionRenderer.ctx.globalCompositeOperation = 'destination-in';
      collisionRenderer.drawChild(this);

      collisionRenderer.ctx.restore();

      var data = collisionRenderer.ctx.getImageData(0, 0, b.right - b.left, b.top - b.bottom).data;

      rgb = rgb & 0xffffff;
      var length = (b.right - b.left) * (b.top - b.bottom) * 4;
      for (var i = 0; i < length; i += 4) {
        if ((data[i] << 16 | data[i + 1] << 8 | data[i + 2]) === rgb && data[i + 3]) {
          return true;
        }
      }

      return false;
    }

    colorTouchingColor(sourceColor, touchingColor) {
      var rb = this.rotatedBounds();

      collisionCanvas.width = secondaryCollisionCanvas.width = rb.right - rb.left;
      collisionCanvas.height = secondaryCollisionCanvas.height = rb.top - rb.bottom;

      collisionRenderer.ctx.save();
      secondaryCollisionRenderer.ctx.save();
      collisionRenderer.ctx.translate(-(240 + rb.left), -(180 - rb.top));
      secondaryCollisionRenderer.ctx.translate(-(240 + rb.left), -(180 - rb.top));

      this.stage.drawAll(collisionRenderer, this);
      secondaryCollisionRenderer.drawChild(this);

      collisionRenderer.ctx.restore();

      var dataA = collisionRenderer.ctx.getImageData(0, 0, rb.right - rb.left, rb.top - rb.bottom).data;
      var dataB = secondaryCollisionRenderer.ctx.getImageData(0, 0, rb.right - rb.left, rb.top - rb.bottom).data;

      sourceColor = sourceColor & 0xffffff;
      touchingColor = touchingColor & 0xffffff;

      var length = dataA.length;
      for (var i = 0; i < length; i += 4) {
        var touchesSource = (dataB[i] << 16 | dataB[i + 1] << 8 | dataB[i + 2]) === sourceColor && dataB[i + 3];
        var touchesOther = (dataA[i] << 16 | dataA[i + 1] << 8 | dataA[i + 2]) === touchingColor && dataA[i + 3];
        if (touchesSource && touchesOther) {
          return true;
        }
      }

      return false;
    }

    // Bounces off an edge of the stage, if it is touching one.
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

    // Determines the distance to another object.
    // thing is the name of the object, or '_mouse_'
    distanceTo(thing) {
      if (thing === '_mouse_') {
        var x = this.stage.mouseX;
        var y = this.stage.mouseY;
      } else {
        var sprite = this.stage.getObject(thing);
        if (!sprite) return 10000;
        x = sprite.scratchX;
        y = sprite.scratchY;
      }
      return Math.sqrt((this.scratchX - x) * (this.scratchX - x) + (this.scratchY - y) * (this.scratchY - y));
    }

    // Goes to another object.
    // thing is anything that getPosition() accepts
    gotoObject(thing) {
      const position = this.stage.getPosition(thing);
      if (!position) {
        return 0;
      }
      this.moveTo(position.x, position.y);
    }

    // Points towards an object.
    // thing is anything that getPosition() accepts
    pointTowards(thing) {
      const position = this.stage.getPosition(thing);
      if (!position) {
        return 0;
      }
      const dx = position.x - this.scratchX;
      const dy = position.y - this.scratchY;
      this.direction = dx === 0 && dy === 0 ? 90 : Math.atan2(dx, dy) * 180 / Math.PI;
      if (this.saying) this.updateBubble();
    }

    // Says some text.
    say(text: string, thinking: boolean = false) {
      text = text.toString();
      if (!text) {
        this.saying = false;
        if (!this.bubble) return;
        this.bubble.style.display = 'none';
        return ++this.sayId;
      }
      this.saying = true;
      this.thinking = thinking;
      if (!this.bubble) {
        this.bubble = document.createElement('div');
        this.bubble.style.maxWidth = ''+(127/14)+'em';
        this.bubble.style.minWidth = ''+(48/14)+'em';
        this.bubble.style.padding = ''+(8/14)+'em '+(10/14)+'em';
        this.bubble.style.border = ''+(3/14)+'em solid rgb(160, 160, 160)';
        this.bubble.style.borderRadius = ''+(10/14)+'em';
        this.bubble.style.background = '#fff';
        this.bubble.style.position = 'absolute';
        this.bubble.style.font = 'bold 1.4em sans-serif';
        this.bubble.style.whiteSpace = 'pre-wrap';
        this.bubble.style.wordWrap = 'break-word';
        this.bubble.style.textAlign = 'center';
        this.bubble.style.cursor = 'default';
        this.bubble.style.pointerEvents = 'auto';
        this.bubble.appendChild(this.bubbleText = document.createTextNode(''));
        this.bubble.appendChild(this.bubblePointer = document.createElement('div'));
        this.bubblePointer.style.position = 'absolute';
        this.bubblePointer.style.height = (21 / 14) + 'em';
        this.bubblePointer.style.width = (44 / 14) + 'em';
        this.bubblePointer.style.background = 'url("icons.svg")';
        this.bubblePointer.style.backgroundSize = (384/14) + 'em ' + (64/14) + 'em';
        this.bubblePointer.style.backgroundPositionY = (-4/14) + 'em';
        this.stage.ui.appendChild(this.bubble);
      }
      this.bubblePointer.style.backgroundPositionX = (thinking ? -323 : -259) / 14 + 'em';
      this.bubble.style.display = 'block';
      this.bubbleText.nodeValue = text;
      this.updateBubble();
      return ++this.sayId;
    }

    // Sets the RGB color of the pen.
    setPenColor(color) {
      this.penColor = color;
      const r = this.penColor >> 16 & 0xff;
      const g = this.penColor >> 8 & 0xff;
      const b = this.penColor & 0xff;
      const a = this.penColor >> 24 & 0xff / 0xff || 1;
      this.penCSS = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
    }

    // Converts the pen's color to HSL
    setPenColorHSL() {
      if (this.penCSS) {
        const hsl = P.utils.rgbToHSL(this.penColor);
        this.penHue = hsl[0];
        this.penSaturation = hsl[1];
        this.penLightness = hsl[2];
        this.penCSS = '';
      }
    }

    // Sets a pen color HSL parameter.
    setPenColorParam(param, value) {
      this.setPenColorHSL();
      switch (param) {
        case 'color':
          this.penHue = value * 360 / 200;
          this.penSaturation = 100;
          break;
        case 'saturation':
          this.penSaturation = value;
          break;
        case 'brightness':
          this.penLightness = value % 200;
          if (this.penLightness < 0) {
            this.penLightness += 200;
          }
          this.penSaturation = 100;
          break;
      }
    }

    // Changes a pen color HSL parameter.
    changePenColorParam(param, value) {
      this.setPenColorHSL();
      switch (param) {
        case 'color':
          this.penHue += value * 360 / 200;
          this.penSaturation = 100;
          break;
        case 'saturation':
          this.penSaturation += value;
          break;
        case 'brightness':
          this.penLightness = (this.penLightness + value) % 200;
          if (this.penLightness < 0) {
            this.penLightness += 200;
          }
          this.penSaturation = 100;
          break;
      }
    }

    // Updates the text bubble.
    updateBubble() {
      if (!this.visible || !this.saying) {
        this.bubble.style.display = 'none';
        return;
      }
      var b = this.rotatedBounds();
      var left = 240 + b.right;
      var bottom = 180 + b.top;
      var width = this.bubble.offsetWidth / this.stage.zoom;
      var height = this.bubble.offsetHeight / this.stage.zoom;
      this.bubblePointer.style.top = ((height - 6) / 14) + 'em';
      if (left + width + 2 > 480) {
        this.bubble.style.right = ((240 - b.left) / 14) + 'em';
        this.bubble.style.left = 'auto';
        this.bubblePointer.style.right = (3/14)+'em';
        this.bubblePointer.style.left = 'auto';
        this.bubblePointer.style.backgroundPositionY = (-36/14)+'em';
      } else {
        this.bubble.style.left = (left / 14) + 'em';
        this.bubble.style.right = 'auto';
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
      this.bubble.style.bottom = (bottom / 14) + 'em';
    }

    // Deletes the Sprite
    remove() {
      if (this.bubble) {
        this.stage.ui.removeChild(this.bubble);
        this.bubble = null;
      }
      if (this.node) {
        this.node.disconnect();
        this.node = null;
      }
    }
  }

  // A costume
  export class Costume {
    public name: string;
    public rotationCenterX: number;
    public rotationCenterY: number;
    public layers: HTMLImageElement[];
    public image: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;
    public index: number;
    public bitmapResolution: number;
    public scale: number;

    constructor(costumeData) {
      this.index = costumeData.index;
      this.bitmapResolution = costumeData.bitmapResolution;
      this.scale = 1 / this.bitmapResolution;
      this.name = costumeData.name;
      this.rotationCenterX = costumeData.rotationCenterX;
      this.rotationCenterY = costumeData.rotationCenterY;
      this.layers = costumeData.layers;

      this.image = document.createElement('canvas');
      const context = this.image.getContext('2d');
      if (context) {
        this.context = context;
      } else {
        throw new Error('No canvas 2d context');
      }

      this.render();
    }

    render() {
      this.image.width = Math.max(this.layers[0].width, 1);
      this.image.height = Math.max(this.layers[0].height, 1);

      for (const layer of this.layers) {
        if (layer.width > 0 && layer.height > 0) {
          this.context.drawImage(layer, 0, 0);
        }
      }
    }
  }

  // A sound
  export class Sound {
    public name: string;
    public buffer: AudioBuffer;
    public duration: number;
    public node: AudioNode;

    constructor(data) {
      this.name = data.name;
      this.buffer = data.buffer;
      this.duration = this.buffer ? this.buffer.duration : 0;
    }
  }

  // An abstract variable watcher
  export abstract class VariableWatcher {
    public stage: Stage;
    public targetName: string;
    public target: Base;
    public valid: boolean = false;
    public x: number = 0;
    public y: number = 0;
    public visible: boolean = true;

    constructor(stage, targetName) {
      // The stage this variable watcher belongs to.
      this.stage = stage;

      // The name of the owner of this watcher, if any.
      this.targetName = targetName;
    }

    // Initializes the VariableWatcher. Called once.
    // Expected to be overridden.
    init() {
      this.target = this.stage.getObject(this.targetName) || this.stage;
    }

    // Changes the visibility of the watcher.
    // Expected to be overridden.
    setVisible(visible) {
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

    constructor(fn, warp, inputs) {
      this.fn = fn;
      this.warp = warp;
      this.inputs = inputs;
    }

    // Call takes a list of inputs and must return the proper arguments to set C.args to in the runtime.
    // Result can be anything as long as the compiler knows how to interpret it.
    abstract call(inputs: any[]): any;
  }

  export function isSprite(base: any): base is P.core.Sprite {
    return base.isSprite;
  }

  export function isStage(base: any): base is P.core.Stage {
    return base.isStage;
  }
}
