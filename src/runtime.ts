/// <reference path="phosphorus.ts" />
/// <reference path="core.ts" />
/// <reference path="audio.ts" />

// The phosphorus runtime for Scratch
// Provides methods expected at runtime by scripts created by the compiler and an environment for Scratch scripts to run
namespace P.runtime {
  export type Fn = () => void;

  // Current runtime
  var runtime: Runtime;
  // Current stage
  var self: P.core.Stage;
  // Current sprite or stage
  var S: P.core.Base;
  // Current thread state.
  var R;
  // Stack of states (R) for this thread
  var STACK;
  // Current procedure call, if any. Contains arguments.
  var C: ThreadCall;
  // This thread's call (C) stack
  var CALLS;
  // If level of layers of "Run without screen refresh" we are in
  // Each level (usually procedures) of depth will increment and decrement as they start and stop.
  // As long as this is greater than 0, functions will run without waiting for the screen.
  var WARP: number;
  // BASE is the first ran function of a thread, used as an identifier
  var BASE;
  // The ID of the active thread in the Runtime's queue
  var THREAD: number;
  // The next function to run immediately after this one.
  var IMMEDIATE: Fn | null | undefined;
  // Has a "visual change" been made in this frame?
  var VISUAL: boolean;
  // Have the current thread been stopped (by either itself or another thread before it)?
  var STOPPED: boolean;

  // Note:
  // Your editor might warn you about "unused variables" or things like that.
  // Due to the nature of the runtime you should ignore these warnings.

  const epoch = Date.UTC(2000, 0, 1);
  const INSTRUMENTS = P.audio.instruments;
  const DRUMS = P.audio.drums;
  const DIGIT = /\d/;

  var bool = function(v) {
    return +v !== 0 && v !== '' && v !== 'false' && v !== false;
  };

  var compare = function(x, y) {
    if ((typeof x !== 'string' || DIGIT.test(x)) && (typeof y !== 'string' || DIGIT.test(y))) {
      var nx = +x;
      var ny = +y;
      if (nx === nx && ny === ny) {
        return nx < ny ? -1 : nx === ny ? 0 : 1;
      }
    }
    var xs = ('' + x).toLowerCase();
    var ys = ('' + y).toLowerCase();
    return xs < ys ? -1 : xs === ys ? 0 : 1;
  };

  var numLess = function(nx, y) {
    if (typeof y === 'number' || DIGIT.test(y)) {
      var ny = +y;
      if (ny === ny) {
        return nx < ny;
      }
    }
    var ys = ('' + y).toLowerCase();
    return '' + nx < ys;
  };

  var numGreater = function(nx, y) {
    if (typeof y === 'number' || DIGIT.test(y)) {
      var ny = +y;
      if (ny === ny) {
        return nx > ny;
      }
    }
    var ys = ('' + y).toLowerCase();
    return '' + nx > ys;
  };

  var equal = function(x: any, y: any) {
    if ((typeof x === 'number' || typeof x === 'boolean' || DIGIT.test(x)) && (typeof y === 'number' || typeof x === 'boolean' || DIGIT.test(y))) {
      var nx = +x;
      var ny = +y;
      if (nx === nx && ny === ny) {
        return nx === ny;
      }
    }
    var xs = ('' + x).toLowerCase();
    var ys = ('' + y).toLowerCase();
    return xs === ys;
  };

  // Equality testing optimized for the first argument always being a number.
  var numEqual = function(nx: number, y: any) {
    if (typeof y === 'number' || DIGIT.test(y)) {
      var ny = +y;
      return ny === ny && nx === ny;
    }
    return false;
  };

  var numEqualExperimental = function(nx: number, y: any) {
    var ny = +y;
    return ny === ny && nx === ny;
  };

  var numLessExperimental = function(nx: number, y: any) {
    var ny = +y;
    return ny === ny && nx < y;
  };

  var numGreaterExperimental = function(nx: number, y: any) {
    var ny = +y;
    return ny === ny && nx > y;
  };

  // Equality testing optimized for either argument never being number-like.
  var strEqual = function(a: any, b: any) {
    return (a + '').toLowerCase() === (b + '').toLowerCase();
  };

  var stringContains = function(baseString: string, needle: string) {
    return baseString.toLowerCase().indexOf(needle.toLowerCase()) > -1;
  };

  var mod = function(x, y) {
    var r = x % y;
    // need special behavior for handling negatives
    if (r / y < 0) {
      r += y;
    }
    return r;
  };

  var random = function(x, y) {
    var fractional =
      (typeof x === 'string' && !isNaN(+x) && x.indexOf('.') > -1) ||
      (typeof y === 'string' && !isNaN(+y) && y.indexOf('.') > -1);
    x = +x || 0;
    y = +y || 0;
    if (x > y) {
      var tmp = y;
      y = x;
      x = tmp;
    }
    if (!fractional && (x % 1 === 0 && y % 1 === 0)) {
      return Math.floor(Math.random() * (y - x + 1)) + x;
    }
    return Math.random() * (y - x) + x;
  };

  var random3 = function(x, y) {
    var fractional =
      (typeof x === 'string' && x.indexOf('.') > -1) ||
      (typeof y === 'string' && y.indexOf('.') > -1);
    x = +x || 0;
    y = +y || 0;
    if (x > y) {
      var tmp = y;
      y = x;
      x = tmp;
    }
    if (!fractional && (x % 1 === 0 && y % 1 === 0)) {
      return Math.floor(Math.random() * (y - x + 1)) + x;
    }
    return Math.random() * (y - x) + x;
  };

  // Clone a sprite
  var clone = function(name) {
    const parent = name === '_myself_' ? S : self.getObject(name);
    if (!parent || !P.core.isSprite(parent)) {
      // sprites that do not exist and stages cannot be cloned
      return;
    }
    const c = parent.clone();
    self.children.splice(self.children.indexOf(parent), 0, c);
    runtime.triggerFor(c, 'whenCloned');
    if (c.visible) {
      VISUAL = true;
    }
  };

  var getVars = function(name) {
    return self.vars[name] !== undefined ? self.vars : S.vars;
  };

  var getLists = function(name) {
    if (self.lists[name] !== undefined) return self.lists;
    if (S.lists[name] === undefined) {
      S.lists[name] = [];
    }
    return S.lists;
  };

  var listIndex = function(list, index, length) {
    var i = index | 0;
    if (i === index) return i > 0 && i <= length ? i - 1 : -1;
    if (index === 'random' || index === 'any') {
      return Math.random() * length | 0;
    }
    if (index === 'last') {
      return length - 1;
    }
    return i > 0 && i <= length ? i - 1 : -1;
  };

  var contentsOfList = function(list) {
    var isSingle = true;
    for (var i = list.length; i--;) {
      if (list[i].length !== 1) {
        isSingle = false;
        break;
      }
    }
    return list.join(isSingle ? '' : ' ');
  };
  var getLineOfList = function(list, index) {
    var i = listIndex(list, index, list.length);
    return i !== -1 ? list[i] : '';
  };
  var listContains = function(list, value) {
    for (var i = list.length; i--;) {
      if (equal(list[i], value)) return true;
    }
    return false;
  };
  var listIndexOf = function(list, value) {
    for (var i = 0; i < list.length; i++) {
      if (equal(list[i], value)) return i + 1;
    }
    return 0;
  };
  var appendToList = function(list, value) {
    list.push(value);
  };
  var deleteLineOfList = function(list, index) {
    if (index === 'all') {
      list.length = 0;
    } else {
      var i = listIndex(list, index, list.length);
      if (i === list.length - 1) {
        list.pop();
      } else if (i !== -1) {
        list.splice(i, 1);
      }
    }
  };
  var insertInList = function(list, index, value) {
    var i = listIndex(list, index, list.length + 1);
    if (i === list.length) {
      list.push(value);
    } else if (i !== -1) {
      list.splice(i, 0, value);
    }
  };
  var setLineOfList = function(list, index, value) {
    var i = listIndex(list, index, list.length);
    if (i !== -1) {
      list[i] = value;
    }
  };

  // "Watched" variants of the above that set modified=true
  var watchedAppendToList = function(list, value) {
    appendToList(list, value);
    if (!list.modified) list.modified = true;
  };
  var watchedDeleteLineOfList = function(list, index) {
    deleteLineOfList(list, index);
    if (!list.modified) list.modified = true;
  };
  var watchedDeleteAllOfList = function(list) {
    list.length = 0;
    if (!list.modified) list.modified = true;
  };
  var watchedInsertInList = function(list, index, value) {
    insertInList(list, index, value);
    if (!list.modified) list.modified = true;
  };
  var watchedSetLineOfList = function(list, index, value) {
    setLineOfList(list, index, value);
    if (!list.modified) list.modified = true;
  };

  var mathFunc = function(f, x) {
    switch (f) {
      case 'abs':
        return Math.abs(x);
      case 'floor':
        return Math.floor(x);
      case 'sqrt':
        return Math.sqrt(x);
      case 'ceiling':
        return Math.ceil(x);
      case 'cos':
        return Math.cos(x * Math.PI / 180);
      case 'sin':
        return Math.sin(x * Math.PI / 180);
      case 'tan':
        return Math.tan(x * Math.PI / 180);
      case 'asin':
        return Math.asin(x) * 180 / Math.PI;
      case 'acos':
        return Math.acos(x) * 180 / Math.PI;
      case 'atan':
        return Math.atan(x) * 180 / Math.PI;
      case 'ln':
        return Math.log(x);
      case 'log':
        return Math.log(x) / Math.LN10;
      case 'e ^':
        return Math.exp(x);
      case '10 ^':
        return Math.exp(x * Math.LN10);
    }
    return 0;
  };

  // https://github.com/LLK/scratch-vm/blob/3fcbc005d17ae1d09121cf63a678127c227c8b86/src/util/math-util.js#L48-L65
  var tan3 = function(angle) {
    angle = angle - Math.floor(angle / 360) * 360;
    if (angle === 90) return Infinity;
    if (angle === 270) return -Infinity;
    return Math.round(Math.tan(angle * Math.PI / 180) * 1e10) / 1e10;
  };

  var attribute = function(attr, objName) {
    // https://github.com/LLK/scratch-vm/blob/e236d29ff5e03f7c4d77a614751da860521771fd/src/blocks/scratch3_sensing.js#L280
    const o = self.getObject(objName);
    if (!o) return 0;
    if (P.core.isSprite(o)) {
      switch (attr) {
        case 'x position': return o.scratchX;
        case 'y position': return o.scratchY;
        case 'direction': return o.direction;
        case 'costume #': return o.currentCostumeIndex + 1;
        case 'costume name': return o.costumes[o.currentCostumeIndex].name;
        case 'size': return o.scale * 100;
        case 'volume': return o.volume * 100;
      }
    } else {
      switch (attr) {
        case 'background #':
        case 'backdrop #': return o.currentCostumeIndex + 1;
        case 'backdrop name': return o.costumes[o.currentCostumeIndex].name;
        case 'volume': return o.volume * 100;
      }
    }
    const value = o.vars[attr];
    if (value !== undefined) {
      return value;
    }
    return 0;
  };

  var timeAndDate = function(format: any): number {
    switch (format) {
      case 'year':
        return new Date().getFullYear();
      case 'month':
        return new Date().getMonth() + 1;
      case 'date':
        return new Date().getDate();
      case 'day of week':
        return new Date().getDay() + 1;
      case 'hour':
        return new Date().getHours();
      case 'minute':
        return new Date().getMinutes();
      case 'second':
        return new Date().getSeconds();
    }
    return 0;
  }

  /**
   * Converts the name of a key to its code
   */
  export function getKeyCode(keyName: any): string {
    keyName = keyName + '';
    switch (keyName.toLowerCase()) {
      case 'space': case '\x20': return P.core.SpecialKeys.Space;
      case 'left arrow': case '\x1C': return P.core.SpecialKeys.Left;
      case 'up arrow': case '\x1E': return P.core.SpecialKeys.Up;
      case 'right arrow': case '\x1D': return P.core.SpecialKeys.Right;
      case 'down arrow': case '\x1F': return P.core.SpecialKeys.Down;
      case 'any': return 'any';
      case '\x0D': return P.core.SpecialKeys.Enter;
      case '\x1B': return P.core.SpecialKeys.Escape;
      case '\x09': return P.core.SpecialKeys.Tab;
      case '\x08': return P.core.SpecialKeys.Backspace;
      case '\x7F': return P.core.SpecialKeys.Delete;
      case '': return P.core.SpecialKeys.Shift;
    }
    return '' + keyName.charCodeAt(0);
  }

  var getKeyCode3 = function(keyName: any): string {
    switch (keyName.toLowerCase()) {
      case 'space': case '\x20': return P.core.SpecialKeys.Space;
      case 'left arrow': return P.core.SpecialKeys.Left;
      case 'up arrow': return P.core.SpecialKeys.Up;
      case 'right arrow': return P.core.SpecialKeys.Right;
      case 'down arrow': return P.core.SpecialKeys.Down;
      case 'any': return 'any';
      // Scratch 3 added support for 'enter'
      case 'enter': return P.core.SpecialKeys.Enter;
      // Incomplete parity with TurboWarp
      case 'escape': return P.core.SpecialKeys.Escape;
      case 'backspace': return P.core.SpecialKeys.Backspace;
      case 'delete': return P.core.SpecialKeys.Delete;
      case 'insert': return P.core.SpecialKeys.Insert;
      case 'home': return P.core.SpecialKeys.Home;
      case 'end': return P.core.SpecialKeys.End;
      case 'page up': return P.core.SpecialKeys.PageUp;
      case 'page down': return P.core.SpecialKeys.PageDown;
      case 'control': return P.core.SpecialKeys.Control;
      case 'shift': return P.core.SpecialKeys.Shift;
    }
    return '' + keyName.toLowerCase().charCodeAt(0);
  };

  // Load audio methods if audio is supported
  const audioContext = P.audio.context;
  if (audioContext) {
    var playNote = function(key, duration) {
      var span;
      var spans = INSTRUMENTS[S.instrument];
      for (var i = 0, l = spans.length; i < l; i++) {
        span = spans[i];
        if (span.top >= key || span.top === 128) break;
      }
      return playSpan(span, key, duration);
    };

    var playSpan = function(span, key, duration) {
      const node = P.audio.playSpan(span, key, duration, S.getAudioNode());
      return {
        stopped: false,
        node,
        base: BASE,
      };
    };

    var applySoundEffects = function(node: AudioBufferSourceNode) {
      node.playbackRate.value = Math.pow(2, (S.soundFilters.pitch / 10 / 12));
    };

    var updateSoundEffectsOnAllSounds = function() {
      for (const sound of S.activeSounds) {
        if (sound.node) {
          applySoundEffects(sound.node as AudioBufferSourceNode);
        }
      }
    };

    var playSound = function(sound: P.core.Sound): P.core.ActiveSound {
      const node = sound.createSourceNode();
      applySoundEffects(node);
      node.connect(S.getAudioNode());
      return {
        stopped: false,
        node,
        base: BASE,
      };
    };

    var startSound = function(sound: P.core.Sound) {
      // todo: this is a hack, won't work with clones
      // https://github.com/forkphorus/forkphorus/issues/298
      for (const s of S.activeSounds) {
        if (s.node === sound.source) {
          s.stopped = true;
          break;
        }
      }
      const node = sound.createSourceNode();
      applySoundEffects(node);
      node.connect(S.getAudioNode());
    };
  }

  var save = function() {
    STACK.push(R);
    R = {};
  };

  var restore = function() {
    R = STACK.pop();
  };

  var call = function(procedure: P.core.Procedure, id, values) {
    if (procedure) {
      STACK.push(R);
      CALLS.push(C);
      C = {
        base: procedure.fn,
        fn: S.fns[id],
        args: procedure.call(values),
        numargs: [],
        boolargs: [],
        stack: STACK = [],
        warp: procedure.warp,
      };
      R = {};
      if (C.warp || WARP) {
        WARP++;
        IMMEDIATE = procedure.fn;
      } else {
        if (VISUAL) {
          // Look through the call stack and determine if this procedure has already been called once.
          // If so, we'll delay this thread until the next iteration instead of setting IMMEDIATE
          // See https://scratch.mit.edu/projects/337681947/ for an example
          // 5 is an arbitrary number that works good enough and limits the possible performance impact
          for (var i = CALLS.length, j = 5; i-- && j--;) {
            if (CALLS[i].base === procedure.fn) {
              runtime.queue[THREAD] = {
                sprite: S,
                base: BASE,
                fn: procedure.fn,
                calls: CALLS,
                warp: WARP,
                stopped: false
              };
              return;
            }
          }
        }
        IMMEDIATE = procedure.fn;
      }
    } else {
      IMMEDIATE = S.fns[id];
    }
  };

  var endCall = function() {
    if (CALLS.length) {
      if (WARP) WARP--;
      IMMEDIATE = C.fn;
      C = CALLS.pop();
      STACK = C.stack;
      R = STACK.pop();
    }
  };

  var cloudVariableChanged = function(name) {
    if (self.cloudHandler) {
      self.cloudHandler.variableChanged(name);
    }
  };

  var parseColor = function(color: any): number {
    return P.utils.parseColor(color);
  };

  var sceneChange = function() {
    return runtime.trigger('whenSceneStarts', self.getCostumeName());
  };

  var broadcast = function(name) {
    return runtime.trigger('whenIReceive', name);
  };

  var running = function(bases) {
    for (var j = 0; j < runtime.queue.length; j++) {
      if (runtime.queue[j] && bases.indexOf(runtime.queue[j]!.base) !== -1) return true;
    }
    return false;
  };

  var queue = function(id) {
    if (WARP) {
      IMMEDIATE = S.fns[id];
    } else {
      forceQueue(id);
    }
  };

  var forceQueue = function(id) {
    if (STOPPED) return;
    runtime.queue[THREAD] = {
      sprite: S,
      base: BASE,
      fn: S.fns[id],
      calls: CALLS,
      warp: WARP,
      stopped: false
    };
  };

  type ThreadResume = any;

  interface ThreadCall {
    fn?: Fn;
    stack: ThreadResume[];
    [s: string]: any;
  }

  interface Thread {
    sprite: P.core.Base;
    base: Fn;
    fn?: Fn;
    calls: ThreadCall[];
    warp: number;
    stopped: boolean;
  }

  export class Runtime {
    public queue: Array<Thread | undefined> = [];
    public isRunning: boolean = false;
    public timerStart: number = 0;
    public baseTime: number = 0;
    public baseNow: number = 0;
    public interval: number;
    public isTurbo: boolean = false;
    public framerate: number = 30;
    public currentMSecs: number = 0;
    public whenTimerMSecs: number = 0;

    constructor(public stage: P.core.Stage) {
      // Fix scoping
      this.onError = this.onError.bind(this);
      this.step = this.step.bind(this);
    }

    startThread(sprite: core.Base, base: Fn, replaceExisting: boolean) {
      const thread: Thread = {
        sprite: sprite,
        base: base,
        fn: base,
        calls: [{
          args: [],
          stack: [{}],
        }],
        warp: 0,
        stopped: false
      };

      // Find if this spread is already being executed.
      for (let i = 0; i < this.queue.length; i++) {
        const q = this.queue[i];
        if (q && q.sprite === sprite && q.base === base) {
          if (replaceExisting) {
            this.queue[i] = thread;
          }
          return;
        }
      }

      this.queue.push(thread);
    }

    /**
     * Triggers an event for a single sprite.
     */
    triggerFor(sprite: P.core.Base, event: string, arg?: any): Fn[] {
      let threads: Fn[];
      let replaceExisting = true;
      switch (event) {
        case 'whenClicked': threads = sprite.listeners.whenClicked; break;
        case 'whenCloned': threads = sprite.listeners.whenCloned; break;
        case 'whenGreenFlag': threads = sprite.listeners.whenGreenFlag; break;
        case 'whenKeyPressed':
          replaceExisting = false;
          threads = sprite.listeners.whenKeyPressed[arg] || [];
          if (arg !== 'any') {
            const anyThreads = sprite.listeners.whenKeyPressed.any;
            if (anyThreads) {
              threads = threads.concat(anyThreads);
            }
          }
          break;
        case 'whenSceneStarts': threads = sprite.listeners.whenSceneStarts[('' + arg).toLowerCase()]; break;
        case 'whenIReceive':
          arg = '' + arg;
          // TODO: remove toLowerCase() check?
          threads = sprite.listeners.whenIReceive[arg] || sprite.listeners.whenIReceive[arg.toLowerCase()];
          break;
        case 'edgeActivated': threads = sprite.listeners.edgeActivated; break;
        default: throw new Error('Unknown trigger event: ' + event);
      }
      if (threads) {
        for (let i = 0; i < threads.length; i++) {
          this.startThread(sprite, threads[i], replaceExisting);
        }
      }
      return threads || [];
    }

    /**
     * Triggers an event on all sprites.
     */
    trigger(event: string, arg?: any) {
      let threads: Fn[] = [];
      for (let i = this.stage.children.length; i--;) {
        threads = threads.concat(this.triggerFor(this.stage.children[i], event, arg));
      }
      return threads.concat(this.triggerFor(this.stage, event, arg));
    }

    /**
     * Trigger's the project's green flag.
     */
    triggerGreenFlag() {
      this.timerStart = this.now();
      this.trigger('whenGreenFlag');
      this.trigger('edgeActivated');
    }

    /**
     * Begins the runtime's event loop.
     * Does not start any scripts.
     */
    start() {
      this.isRunning = true;
      if (this.interval) return;
      window.addEventListener('error', this.onError);
      this.baseTime = Date.now();
      this.interval = setInterval(this.step, 1000 / this.framerate);
      if (audioContext) audioContext.resume();
      this.stage.startExtensions();
    }

    /**
     * Pauses the event loop
     */
    pause() {
      if (this.interval) {
        this.baseNow = this.now();
        clearInterval(this.interval);
        this.interval = 0;
        window.removeEventListener('error', this.onError);
        if (audioContext) audioContext.suspend();
        this.stage.pauseExtensions();
      }
      this.isRunning = false;
    }

    /**
     * Resets the interval loop without the effects of pausing/starting
     */
    resetInterval() {
      if (!this.isRunning) {
        throw new Error('Cannot restart interval when paused');
      }
      if (this.interval) {
        clearInterval(this.interval);
      }
      this.interval = setInterval(this.step, 1000 / this.framerate);
    }

    /**
     * Stops this runtime.
     * - marks all threads as stopped, to let them finish running within this step before they get removed
     * - removes all clones
     * - resets filters, speech bubbles, sounds
     * - Does *NOT* stop the event loop. Use pause() for that.
     */
    stopAll() {
      this.stage.hidePrompt = false;
      this.stage.prompter.style.display = 'none';
      this.stage.promptId = this.stage.nextPromptId = 0;
      for (var i = 0; i < this.queue.length; i++) {
        const thread = this.queue[i];
        if (thread) {
          thread.stopped = true;
        }
      }
      STOPPED = true;
      this.stage.resetFilters();
      this.stage.stopSounds();
      for (var i = 0; i < this.stage.children.length; i++) {
        const c = this.stage.children[i];
        if (c.isClone) {
          c.remove();
          this.stage.children.splice(i, 1);
          i -= 1;
        } else {
          c.resetFilters();
          if (c.saying && P.core.isSprite(c)) c.say('');
          c.stopSounds();
        }
      }
    }

    /**
     * The current time in the project
     */
    now(): number {
      return this.baseNow + Date.now() - this.baseTime;
    }

    resetTimer() {
      this.timerStart = this.now();
      this.whenTimerMSecs = 0;
    }

    evaluateExpression(sprite: P.core.Base, fn: () => any) {
      // We will load a few runtime values for this.
      // These are the values that are most commonly used in expressions, in addition the runtime methods.
      self = this.stage;
      runtime = this;
      S = sprite;
      try {
        return fn();
      } catch (e) {
        return undefined;
      }
    }

    /**
     * Advances one frame into the future.
     */
    step() {
      // Reset runtime variables
      self = this.stage;
      runtime = this;
      VISUAL = false;

      // TODO: instead of looping through all sprites, maintain a separate list of draggable sprites?
      for (var i = 0; i < this.stage.children.length; i++) {
        const c = this.stage.children[i];
        if (c.isDragging) {
          c.moveTo(c.dragOffsetX + c.stage.mouseX, c.dragOffsetY + c.stage.mouseY);
        }
      }

      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const start = Date.now();
      this.currentMSecs = this.whenTimerMSecs = this.now();
      const queue = this.queue;
      do {
        for (THREAD = 0; THREAD < queue.length; THREAD++) {
          const thread = queue[THREAD];
          if (thread) {
            // Load thread data
            S = thread.sprite;
            IMMEDIATE = thread.fn;
            BASE = thread.base;
            CALLS = thread.calls;
            C = CALLS.pop();
            STACK = C.stack;
            R = STACK.pop();
            WARP = thread.warp;
            STOPPED = thread.stopped;
            thread.stopped = true;

            while (IMMEDIATE) {
              const fn = IMMEDIATE;
              IMMEDIATE = null;
              fn();
            }

            STACK.push(R);
            CALLS.push(C);
          }
        }

        // Remove empty and stopped elements in the queue list
        for (let i = queue.length; i--;) {
          const thread = queue[i];
          if (!thread || thread.stopped) {
            queue.splice(i, 1);
          }
        }
      } while ((this.isTurbo || !VISUAL) && Date.now() - start < 1000 / this.framerate && queue.length);

      this.stage.updateExtensions();

      this.stage.draw();
    }

    onError(e) {
      clearInterval(this.interval);
      this.handleError(e.error);
    }

    handleError(e) {
      // Default error handler
      console.error(e);
    }
  }

  export function createContinuation(source: string): P.runtime.Fn {
    // TODO: make understandable
    var result = '(function() {\n';
    var brackets = 0;
    var delBrackets = 0;
    var shouldDelete = false;
    var here = 0;
    var length = source.length;
    while (here < length) {
      var i = source.indexOf('{', here);
      var j = source.indexOf('}', here);
      var k = source.indexOf('return;', here);
      if (k === -1) k = length;
      if (i === -1 && j === -1) {
        if (!shouldDelete) {
          result += source.slice(here, k);
        }
        break;
      }
      if (i === -1) i = length;
      if (j === -1) j = length;
      if (shouldDelete) {
        if (i < j) {
          delBrackets++;
          here = i + 1;
        } else {
          delBrackets--;
          if (!delBrackets) {
            shouldDelete = false;
          }
          here = j + 1;
        }
      } else {
        if (brackets === 0 && k < i && k < j) {
          result += source.slice(here, k);
          break;
        }
        if (i < j) {
          result += source.slice(here, i + 1);
          brackets++;
          here = i + 1;
        } else {
          result += source.slice(here, j);
          here = j + 1;
          if (source.substr(j, 8) === '} else {') {
            if (brackets > 0) {
              result += '} else {';
              here = j + 8;
            } else {
              shouldDelete = true;
              delBrackets = 0;
            }
          } else {
            if (brackets > 0) {
              result += '}';
              brackets--;
            }
          }
        }
      }
    }
    result += '})';
    return scopedEval(result);
  }

  // Evaluate JavaScript within the scope of the runtime.
  export function scopedEval(source: string): any {
    return eval(source);
  }
}
