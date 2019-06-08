/// <reference path="phosphorus.ts" />
/// <reference path="core.ts" />
/// <reference path="audio.ts" />

// The phosphorus runtime for Scratch
// Provides methods expected at runtime by scripts created by the compiler and an environment for Scratch scripts to run
namespace P.runtime {
  export type Fn = () => void;

  // The runtime is really weird and hard to understand.
  // The upside: it's fast as hell.

  // Global variables expected by scripts at runtime:
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
  // ??
  var BASE;
  // The ID of the active thread in the Runtime's queue
  var THREAD: number;
  // The next function to run immediately after this one.
  var IMMEDIATE: Fn | null | undefined;
  // Has a "visual change" been made in this frame?
  var VISUAL: boolean;

  const epoch = Date.UTC(2000, 0, 1);
  const INSTRUMENTS = P.audio.instruments;
  const DRUMS = P.audio.drums;
  const DIGIT = /\d/;

  // Converts a value to its boolean equivalent
  var bool = function(v) {
    return +v !== 0 && v !== '' && v !== 'false' && v !== false;
  };

  // Compares two values. Returns -1 if x < y, 1 if x > y, 0 if x === y
  var compare = function(x, y) {
    if ((typeof x === 'number' || DIGIT.test(x)) && (typeof y === 'number' || DIGIT.test(y))) {
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

  // Determines if y is less than nx
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

  // Determines if y is greater than nx
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

  // Determines if x is equal to y
  var equal = function(x, y) {
    // numbers, booleans, and strings that look like numbers will go through the number comparison
    if ((typeof x === 'number' || typeof x === 'boolean' || DIGIT.test(x)) && (typeof y === 'number' || typeof x === 'boolean' || DIGIT.test(y))) {
      var nx = +x;
      var ny = +y;
      // if either is NaN, don't do the comparison
      if (nx === nx && ny === ny) {
        return nx === ny;
      }
    }
    var xs = ('' + x).toLowerCase();
    var ys = ('' + y).toLowerCase();
    return xs === ys;
  };

  // Determines if x (number) and y (number) are equal to each other
  var numEqual = function(nx, y) {
    if (typeof y === 'number' || DIGIT.test(y)) {
      var ny = +y;
      return ny === ny && nx === ny;
    }
    return false;
  };

  // Modulo
  var mod = function(x, y) {
    var r = x % y;
    if (r / y < 0) {
      r += y;
    }
    return r;
  };

  // Random number in range
  var random = function(x, y) {
    x = +x || 0;
    y = +y || 0;
    if (x > y) {
      var tmp = y;
      y = x;
      x = tmp;
    }
    if (x % 1 === 0 && y % 1 === 0) {
      return Math.floor(Math.random() * (y - x + 1)) + x;
    }
    return Math.random() * (y - x) + x;
  };

  // Converts an RGB color as a number to HSL
  var rgb2hsl = function(rgb) {
    // TODO: P.utils.rgb2hsl?
    var r = (rgb >> 16 & 0xff) / 0xff;
    var g = (rgb >> 8 & 0xff) / 0xff;
    var b = (rgb & 0xff) / 0xff;

    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);

    if (min === max) {
      return [0, 0, r * 100];
    }

    var c = max - min;
    var l = (min + max) / 2;
    var s = c / (1 - Math.abs(2 * l - 1));

    var h;
    switch (max) {
      case r: h = ((g - b) / c + 6) % 6; break;
      case g: h = (b - r) / c + 2; break;
      case b: h = (r - g) / c + 4; break;
    }
    h *= 60;

    return [h, s * 100, l * 100];
  };

  // Clone a sprite
  var clone = function(name) {
    const parent = name === '_myself_' ? S : self.getObject(name);
    if (!parent) {
      throw new Error('No parent!');
    }
    if (!P.core.isSprite(parent)) {
      throw new Error('Cannot clone non-sprite object');
    }
    const c = parent.clone();
    self.children.splice(self.children.indexOf(parent), 0, c);
    runtime.triggerFor(c, 'whenCloned');
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
    for (var i = list.length; i--;) {
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
  export function getKeyCode(keyName: string): number | 'any' {
    switch (keyName.toLowerCase()) {
      case 'space': return 32;
      case 'left arrow': return 37;
      case 'up arrow': return 38;
      case 'right arrow': return 39;
      case 'down arrow': return 40;
      case 'any': return 'any';
    }

    return keyName.toUpperCase().charCodeAt(0);
  }

  // Load audio methods if audio is supported
  const audioContext = P.audio.context;
  if (audioContext) {
    var playNote = function(key, duration) {
      if (!S.node) {
        S.node = audioContext.createGain();
        S.node.gain.value = S.volume;
        P.audio.connect(S.node);
      }

      var span;
      var spans = INSTRUMENTS[S.instrument];
      for (var i = 0, l = spans.length; i < l; i++) {
        span = spans[i];
        if (span.top >= key || span.top === 128) break;
      }

      P.audio.playSpan(span, key, duration, S.node);
    };

    var playSpan = function(span, key, duration) {
      if (!S.node) {
        S.node = audioContext.createGain();
        S.node.gain.value = S.volume;
        P.audio.connect(S.node);
      }
      P.audio.playSpan(span, key, duration, S.node);
    };

    var playSound = function(sound) {
      if (!sound.node) {
        sound.node = audioContext.createGain();
        sound.node.gain.value = S.volume;
        P.audio.connect(sound.node);
      }
      sound.target = S;
      sound.node.gain.setValueAtTime(S.volume, audioContext.currentTime);
      P.audio.playSound(sound);
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
        for (var i = CALLS.length, j = 5; i-- && j--;) {
          if (CALLS[i].base === procedure.fn) {
            runtime.queue[THREAD] = new Thread(S, BASE, procedure.fn, CALLS);
            break;
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

  var sceneChange = function() {
    return runtime.trigger('whenSceneStarts', self.getCostumeName());
  };

  var backdropChange = function() {
    return runtime.trigger('whenBackdropChanges', self.getCostumeName());
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
    runtime.queue[THREAD] = new Thread(S, BASE, S.fns[id], CALLS);
  };

  type ThreadResume = any;

  interface ThreadCall {
    fn?: Fn;
    stack: ThreadResume[];
    [s: string]: any;
  }

  class Thread {
    constructor(
      public sprite: P.core.Base,
      public base: Fn,
      public fn: Fn,
      public calls: ThreadCall[],
    ) {

    }
  }

  export class Runtime {
    public queue: Array<Thread | undefined> = [];
    public isRunning: boolean = false;
    public timerStart: number = 0;
    public baseTime: number = 0;
    public baseNow: number = 0;
    public now: number = 0;
    public interval: number;
    public isTurbo: boolean = false;
    public framerate: number = 30;

    constructor(public stage: P.core.Stage) {
      // Fix scoping
      this.onError = this.onError.bind(this);
      this.step = this.step.bind(this);
    }

    startThread(sprite: core.Base, base: Fn) {
      const thread = new Thread(sprite, base, base, [{
        args: [],
        stack: [{}],
      }]);

      // Replace an existing thread instead of adding a new one when possible.
      for (let i = 0; i < this.queue.length; i++) {
        const q = this.queue[i];
        if (q && q.sprite === sprite && q.base === base) {
          this.queue[i] = thread;
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
      switch (event) {
        case 'whenClicked': threads = sprite.listeners.whenClicked; break;
        case 'whenCloned': threads = sprite.listeners.whenCloned; break;
        case 'whenGreenFlag': threads = sprite.listeners.whenGreenFlag; break;
        case 'whenKeyPressed': threads = sprite.listeners.whenKeyPressed[arg]; break;
        case 'whenSceneStarts': threads = sprite.listeners.whenSceneStarts[('' + arg).toLowerCase()]; break;
        case 'whenBackdropChanges': threads = sprite.listeners.whenBackdropChanges['' + arg]; break;
        case 'whenIReceive':
          arg = '' + arg;
          // TODO: remove toLowerCase() check?
          threads = sprite.listeners.whenIReceive[arg] || sprite.listeners.whenIReceive[arg.toLowerCase()];
          break;
        default: throw new Error('Unknown trigger event: ' + event);
      }
      if (threads) {
        for (let i = 0; i < threads.length; i++) {
          this.startThread(sprite, threads[i]);
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
      this.timerStart = this.rightNow();
      this.trigger('whenGreenFlag');
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
    }

    /**
     * Pauses the event loop
     */
    pause() {
      if (this.interval) {
        this.baseNow = this.rightNow();
        clearInterval(this.interval);
        this.interval = 0;
        window.removeEventListener('error', this.onError);
        if (audioContext) audioContext.suspend();
      }
      this.isRunning = false;
    }

    /**
     * Resets the interval loop without the effects of pausing/starting
     */
    resetInterval() {
      if (!this.isRunning) {
        throw new Error('cannot restart interval when paused');
      }
      if (this.interval) {
        clearInterval(this.interval);
      }
      this.interval = setInterval(this.step, 1000 / this.framerate);
    }

    stopAll() {
      this.stage.hidePrompt = false;
      this.stage.prompter.style.display = 'none';
      this.stage.promptId = this.stage.nextPromptId = 0;
      this.queue.length = 0;
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
    rightNow(): number {
      return this.baseNow + Date.now() - this.baseTime;
    }

    /**
     * Advances one frame into the future.
     */
    step() {
      // Reset runtime variables
      self = this.stage;
      runtime = this;
      VISUAL = false;

      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const start = Date.now();
      const queue = this.queue;
      do {
        this.now = this.rightNow();
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
            queue[THREAD] = undefined;
            WARP = 0;

            while (IMMEDIATE) {
              const fn = IMMEDIATE;
              IMMEDIATE = null;
              fn();
            }

            STACK.push(R);
            CALLS.push(C);
          }
        }

        // Remove empty elements in the queue list
        for (let i = queue.length; i--;) {
          if (!queue[i]) {
            queue.splice(i, 1);
          }
        }
      } while ((this.isTurbo || !VISUAL) && Date.now() - start < 1000 / this.framerate && queue.length);

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

  // Very dirty temporary hack to get a crashmonitor installed w/o affecting performance
  if (P.config.useCrashMonitor) {
    Runtime.prototype.step = function() {
      // Reset runtime variables
      self = this.stage;
      runtime = this;
      VISUAL = false;

      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const start = Date.now();
      const queue = this.queue;
      do {
        this.now = this.rightNow();
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
            queue[THREAD] = undefined;
            WARP = 0;

            while (IMMEDIATE) {
              if (Date.now() - start > 5000) {
                const el = document.createElement('pre');
                el.textContent += 'crash monitor debug:\n';
                el.textContent += `S: ${S.name} (isClone=${S.isClone},isStage=${S.isStage})\n`;
                el.textContent += `IMMEDIATE: ${IMMEDIATE.toString()} // (${S.fns.indexOf(IMMEDIATE)})\n`;
                document.querySelector('#app')!.appendChild(el);
                alert('forkphorus has crashed. please include the debug information at the bottom of the page.')
                this.pause();
                this.stopAll();
                return;
              }
              const fn = IMMEDIATE;
              IMMEDIATE = null;
              fn();
            }

            STACK.push(R);
            CALLS.push(C);
          }
        }

        // Remove empty elements in the queue list
        for (let i = queue.length; i--;) {
          if (!queue[i]) {
            queue.splice(i, 1);
          }
        }
      } while ((this.isTurbo || !VISUAL) && Date.now() - start < 1000 / this.framerate && queue.length);

      this.stage.draw();
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
