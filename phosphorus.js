'use strict';

/*
The MIT License (MIT)

Copyright (c) 2019 Thomas Weber

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var P = {};

// phosphorus global config
P.config = {
  // The default zoom level of the canvas
  scale: window.devicePixelRatio || 1,
  // If the browser supports touch events (ie. is a mobile browser)
  hasTouchEvents: 'ontouchstart' in document,
  // The target framerate. Changing this value often has very little effect on real framerate.
  framerate: 30,
  // Is debug mode enabled?
  debug: window.location.search.includes("debug"),

  // API constants

  // The API to download project.json from scratch.mit.edu
  // Replace $id with the project ID.
  // Will respond with either a Scratch 2 json, Scratch 3 json, or 404.
  PROJECT_API: 'https://projects.scratch.mit.edu/$id',
};

// Utility methods
P.utils = (function(exports) {

  // Gets the keycode for a key name
  exports.getKeyCode = function(keyName) {
    const KEY_CODES = {
      space: 32,
      'left arrow': 37,
      'up arrow': 38,
      'right arrow': 39,
      'down arrow': 40,
      any: 'any'
    };

    return KEY_CODES[keyName.toLowerCase()] || keyName.toUpperCase().charCodeAt(0);
  };

  // Parses a json-ish
  exports.parseJSONish = function(json) {
    if (!/^\s*\{/.test(json)) throw new SyntaxError('Bad JSON');
    try {
      return JSON.parse(json);
    } catch (e) {}
    if (/[^,:{}\[\]0-9\.\-+EINaefilnr-uy \n\r\t]/.test(json.replace(/"(\\.|[^"\\])*"/g, ''))) {
      throw new SyntaxError('Bad JSON');
    }
    return (1, eval)('(' + json + ')');
  };

  // Returns the string representation of an error.
  exports.stringifyError = function(error) {
    if (!error) {
      return 'unknown error';
    }
    if (error.stack) {
      return 'Message: ' + error.message + '\nStack:\n' + error.stack;
    }
    return error.toString();
  }

  exports.createContinuation = function(source) {
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
    return P.runtime.scopedEval(result);
  };

  // Patches an SVG to make it behave more like Scratch.
  exports.patchSVG = function(svg, element) {
    const FONTS = {
      // TODO: Scratch 3
      '': 'Helvetica',
      Donegal: 'Donegal One',
      Gloria: 'Gloria Hallelujah',
      Marker: 'Permanent Marker',
      Mystery: 'Mystery Quest'
    };

    const LINE_HEIGHTS = {
      // TODO: Scratch 3
      Helvetica: 1.13,
      'Donegal One': 1.25,
      'Gloria Hallelujah': 1.97,
      'Permanent Marker': 1.43,
      'Mystery Quest': 1.37
    };

    if (element.nodeType !== 1) return;
    if (element.nodeName === 'text') {
      // Correct fonts
      var font = element.getAttribute('font-family') || '';
      font = FONTS[font] || font;
      if (font) {
        element.setAttribute('font-family', font);
        if (font === 'Helvetica') element.style.fontWeight = 'bold';
      }
      var size = +element.getAttribute('font-size');
      if (!size) {
        element.setAttribute('font-size', size = 18);
      }
      var bb = element.getBBox();
      var x = 4 - .6 * element.transform.baseVal.consolidate().matrix.a;
      var y = (element.getAttribute('y') - bb.y) * 1.1;
      element.setAttribute('x', x);
      element.setAttribute('y', y);
      var lines = element.textContent.split('\n');
      if (lines.length > 1) {
        element.textContent = lines[0];
        var lineHeight = LINE_HEIGHTS[font] || 1;
        for (var i = 1, l = lines.length; i < l; i++) {
          var tspan = document.createElementNS(null, 'tspan');
          tspan.textContent = lines[i];
          tspan.setAttribute('x', x);
          tspan.setAttribute('y', y + size * i * lineHeight);
          element.appendChild(tspan);
        }
      }
    } else if ((element.hasAttribute('x') || element.hasAttribute('y')) && element.hasAttribute('transform')) {
      element.setAttribute('x', 0);
      element.setAttribute('y', 0);
    }
    [].forEach.call(element.childNodes, exports.patchSVG.bind(null, svg));
  };

  // Converts an external string to an internally recognized rotation style.
  exports.asRotationStyle = function(style) {
    switch (style) {
      case 'left-right': return 'leftRight';
      case 'don\'t rotate': return 'none';
      case 'all around': return 'normal';
      default: return 'normal';
    }
  };

  // Determines the type of a project with its project.json data
  exports.projectType = function(data) {
    if (P.config.forcedLoader) {
      return P.config.forcedLoader;
    }
    if (data.targets) {
      return 3;
    }
    if (data.objName) {
      return 2;
    }
    throw new Error('unknown project: ' + JSON.stringify(data));
  };

  // Converts RGB to HSL
  exports.rgbToHSL = function(rgb) {
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
  }

  return exports;
})({});

// Methods for rendering sprites and eventually other objects
P.renderers = {};

// Renders sprites using a 2D canvas context.
P.renderers.canvas2d = (function() {
  class Renderer {
    constructor(canvas) {
      this.ctx = canvas.getContext('2d');
      this.canvas = canvas;
    }

    reset(scale) {
      // resizes and clears the canvas
      this.canvas.width = 480 * scale * P.config.scale;
      this.canvas.height = 360 * scale * P.config.scale;

      this.ctx.scale(scale * P.config.scale, scale * P.config.scale);
    }

    drawImage(image, x, y) {
      this.ctx.drawImage(image, x, y);
    }

    drawChild(c, noEffects) {
      var costume = c.costumes[c.currentCostumeIndex];
      if (costume) {
        this.ctx.save();

        var z = c.stage.zoom * P.config.scale;
        if (c.isSprite) {
          this.ctx.translate(((c.scratchX + 240) * z | 0) / z, ((180 - c.scratchY) * z | 0) / z);
          if (c.rotationStyle === 'normal') {
            this.ctx.rotate((c.direction - 90) * Math.PI / 180);
          } else if (c.rotationStyle === 'leftRight' && c.direction < 0) {
            this.ctx.scale(-1, 1);
          }
        }
        this.ctx.scale(c.scale, c.scale);
        this.ctx.scale(costume.scale, costume.scale);
        if (c.isSprite) {
          this.ctx.translate(-costume.rotationCenterX, -costume.rotationCenterY);
        }

        if (!noEffects) {
          this.ctx.globalAlpha = Math.max(0, Math.min(1, 1 - c.filters.ghost / 100));
        } else {
          this.ctx.globalAlpha = 1;
        }

        this.ctx.drawImage(costume.image, 0, 0);

        this.ctx.restore();
      }
    }
  }

  return {
    Renderer: Renderer,
  };
}());

// Phosphorus Core
P.core = (function(core) {

  // Canvases used for various collision testing later on
  var collisionCanvas = document.createElement('canvas');
  var collisionRenderer = new P.renderers.canvas2d.Renderer(collisionCanvas);
  var secondaryCollisionCanvas = document.createElement('canvas');
  var secondaryCollisionRenderer = new P.renderers.canvas2d.Renderer(secondaryCollisionCanvas);

  class Base {
    constructor() {
      this.stage = null;
      this.isClone = false;
      this.isStage = false;
      this.isSprite = false;

      this.name = '';
      this.costumes = [];
      this.currentCostumeIndex = 0;

      this.sounds = [];
      this.soundRefs = {};
      this.instrument = 0;
      this.volume = 1;

      // 'normal', 'leftRight', 'none'
      this.rotationStyle = 'normal';

      this.vars = {};
      this.watchers = {};
      this.lists = {};

      this.procedures = {};
      this.listeners = {
        whenClicked: [],
        whenCloned: [],
        whenGreenFlag: [],
        whenIReceive: {},
        whenKeyPressed: [],
        whenSceneStarts: [],
        whenSensorGreaterThan: []
      };
      for (var i = 0; i < 128; i++) {
        this.listeners.whenKeyPressed.push([]);
      }
      this.fns = [];

      this.filters = {
        color: 0,
        fisheye: 0,
        whirl: 0,
        pixelate: 0,
        mosaic: 0,
        brightness: 0,
        ghost: 0,
      };
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
        // I have no idea if this works.
        watcher = this.watchers[name] = new P.sb2.VariableWatcher(this.stage, this.objName, {
          x: stage.defaultWatcherX,
          y: stage.defaultWatcherY,
          target: this,
          label: (this.isStage ? '' : this.objName + ': ') + name,
          param: name,
        }, stage);
        stage.defaultWatcherY += 26;
        if (stage.defaultWatcherY >= 450) {
          stage.defaultWatcherY = 10;
          stage.defaultWatcherX += 150;
        }
        stage.allWatchers.push(watcher);
      }

      watcher.setVisible(visible);
    }

    showNextCostume() {
      this.currentCostumeIndex = (this.currentCostumeIndex + 1) % this.costumes.length;
      if (this.isStage) this.updateBackdrop();
      if (this.saying) this.updateBubble();
    }

    showPreviousCostume() {
      var length = this.costumes.length;
      this.currentCostumeIndex = (this.currentCostumeIndex + length - 1) % length;
      if (this.isStage) this.updateBackdrop();
      if (this.saying) this.updateBubble();
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
            if (this.isStage) this.updateBackdrop();
            if (this.saying) this.updateBubble();
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
      }
      var i = (Math.floor(costume) - 1 || 0) % this.costumes.length;
      if (i < 0) i += this.costumes.length;
      this.currentCostumeIndex = i;
      if (this.isStage) this.updateBackdrop();
      if (this.saying) this.updateBubble();
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
      if (this.isStage) this.updateFilters();
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
        if (this.isSprite && this.visible) {
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
  }

  // A stage object.
  class Stage extends Base {
    constructor() {
      super();

      this.stage = this;
      this.isStage = true;
      // Stage is always visible. This ensures that visual changes that check visiblity will work correctly.
      this.visible = true;

      // Maps broadcast display names to their ID
      // Scratch 3 uses unique IDs for broadcasts and the visual name for different things.
      this.broadcastReferences = {};

      this.children = [];
      this.dragging = {};

      this.allWatchers = [];
      this.defaultWatcherX = 10;
      this.defaultWatcherY = 10;

      this.info = {};
      this.answer = '';
      this.promptId = 0;
      this.nextPromptId = 0;
      this.tempoBPM = 60;
      this.videoAlpha = 1;
      this.zoom = 1;
      this.maxZoom = P.config.scale;
      this.baseNow = 0;
      this.baseTime = 0;
      this.timerStart = 0;

      this.keys = [];
      this.keys.any = 0;
      this.rawMouseX = 0;
      this.rawMouseY = 0;
      this.mouseX = 0;
      this.mouseY = 0;
      this.mousePressed = false;

      this.root = document.createElement('div');
      this.root.style.position = 'absolute';
      this.root.style.overflow = 'hidden';
      this.root.style.width = '480px';
      this.root.style.height = '360px';
      this.root.style.fontSize = '10px';
      this.root.style.background = '#fff';
      this.root.style.contain = 'strict';

      this.root.style.WebkitUserSelect =
        this.root.style.MozUserSelect =
        this.root.style.MSUserSelect =
        this.root.style.WebkitUserSelect = 'none';

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
      this.penRenderer = new P.renderers.canvas2d.Renderer(this.penCanvas);
      this.penRenderer.ctx.lineCap = 'round';
      this.penRenderer.ctx.scale(scale, scale);

      this.canvas = document.createElement('canvas');
      this.root.appendChild(this.canvas);
      this.renderer = new P.renderers.canvas2d.Renderer(this.canvas);

      this.ui = document.createElement('div');
      this.root.appendChild(this.ui);
      this.ui.style.pointerEvents = 'none';
      this.ui.style.contain = 'strict';

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
        this.ui.style.top = 0;

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

      this.root.addEventListener('keydown', function(e) {
        var c = e.keyCode;
        if (!this.keys[c]) this.keys.any++;
        this.keys[c] = true;
        if (e.ctrlKey || e.altKey || e.metaKey || c === 27) return;
        e.stopPropagation();
        if (e.target === this.canvas) {
          e.preventDefault();
          this.trigger('whenKeyPressed', c);
        }
      }.bind(this));

      this.root.addEventListener('keyup', function(e) {
        var c = e.keyCode;
        if (this.keys[c]) this.keys.any--;
        this.keys[c] = false;
        e.stopPropagation();
        if (e.target === this.canvas) {
          e.preventDefault();
        }
      }.bind(this));

      if (P.config.hasTouchEvents) {

        document.addEventListener('touchstart', this.onTouchStart = function(e) {
          this.mousePressed = true;
          for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            this.updateMouse(t);
            if (e.target === this.canvas) {
              this.clickMouse();
            } else if (e.target.dataset.button != null || e.target.dataset.slider != null) {
              this.watcherStart(t.identifier, t, e);
            }
          }
          if (e.target === this.canvas) e.preventDefault();
        }.bind(this));

        document.addEventListener('touchmove', this.onTouchMove = function(e) {
          this.updateMouse(e.changedTouches[0]);
          for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            this.watcherMove(t.identifier, t, e);
          }
        }.bind(this));

        document.addEventListener('touchend', this.onTouchEnd = function(e) {
          this.releaseMouse();
          for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            this.watcherEnd(t.identifier, t, e);
          }
        }.bind(this));

      } else {

        document.addEventListener('mousedown', this.onMouseDown = function(e) {
          this.updateMouse(e);
          this.mousePressed = true;

          if (e.target === this.canvas) {
            this.clickMouse();
            e.preventDefault();
            this.canvas.focus();
          } else {
            if (e.target.dataset.button != null || e.target.dataset.slider != null) {
              this.watcherStart('mouse', e, e);
            }
            if (e.target !== this.prompt) setTimeout(function() {
              this.canvas.focus();
            }.bind(this));
          }
        }.bind(this));

        document.addEventListener('mousemove', this.onMouseMove = function(e) {
          this.updateMouse(e);
          this.watcherMove('mouse', e, e);
        }.bind(this));

        document.addEventListener('mouseup', this.onMouseUp = function(e) {
          this.updateMouse(e);
          this.releaseMouse();
          this.watcherEnd('mouse', e, e);
        }.bind(this));
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
      this.prompt.style.MozBoxSizing =
      this.prompt.style.boxSizing = 'border-box';
      this.prompt.style.font = '1.3em sans-serif';
      this.prompt.style.padding = '0 '+(3/13)+'em';
      this.prompt.style.outline = '0';
      this.prompt.style.margin = '0';
      this.prompt.style.width = '100%';
      this.prompt.style.height = ''+(20/13)+'em';
      this.prompt.style.display = 'block';
      this.prompt.style.WebkitBorderRadius =
      this.prompt.style.borderRadius = '0';
      this.prompt.style.WebkitBoxShadow =
      this.prompt.style.boxShadow = 'inset '+(1/13)+'em '+(1/13)+'em '+(2/13)+'em rgba(0, 0, 0, .2), inset '+(-1/13)+'em '+(-1/13)+'em '+(1/13)+'em rgba(255, 255, 255, .2)';
      this.prompt.style.WebkitAppearance = 'none';

      this.promptButton = document.createElement('div');
      this.prompter.appendChild(this.promptButton);
      this.promptButton.style.width = '2.2em';
      this.promptButton.style.height = '2.2em';
      this.promptButton.style.position = 'absolute';
      this.promptButton.style.right = '.4em';
      this.promptButton.style.bottom = '.4em';
      this.promptButton.style.background = 'url(icons.svg) -16.5em -3.7em';
      this.promptButton.style.backgroundSize = '32.0em 9.6em';

      this.prompt.addEventListener('keydown', function(e) {
        if (e.keyCode === 13) {
          this.submitPrompt();
        }
      }.bind(this));

      this.promptButton.addEventListener(P.config.hasTouchEvents ? 'touchstart' : 'mousedown', this.submitPrompt.bind(this));

      this.initRuntime();
    }

    watcherStart(id, t, e) {
      var p = e.target;
      while (p && p.dataset.watcher == null) p = p.parentElement;
      if (!p) return;
      var w = this.allWatchers[p.dataset.watcher]
      this.dragging[id] = {
        watcher: w,
        offset: (e.target.dataset.button == null ? -w.button.offsetWidth / 2 | 0 : w.button.getBoundingClientRect().left - t.clientX) - w.slider.getBoundingClientRect().left
      };
    }
    watcherMove(id, t, e) {
      var d = this.dragging[id];
      if (!d) return;
      var w = d.watcher
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
      this.stopAll();
      this.pause();
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
      this.backdropCanvas.style.opacity = Math.max(0, Math.min(1, 1 - this.filters.ghost / 100));

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
        this.penRenderer.drawImage(canvas, 0, 0, 480 * zoom * P.config.scale, 360 * zoom * P.config.scale);
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
            this.triggerFor(c, 'whenClicked');
          }
          return;
        }
      }
      this.triggerFor(this, 'whenClicked');
    }

    releaseMouse() {
      this.mousePressed = false;
      if (this.mouseSprite) {
        this.mouseSprite.mouseUp();
        this.mouseSprite = undefined;
      }
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

    getObjects(name) {
      var result = [];
      for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].name === name) {
          result.push(this.children[i]);
        }
      }
      return result;
    }

    draw() {
      this.renderer.reset(this.zoom);

      this.drawChildren(this.renderer, false);

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

    drawChildren(renderer, noEffects, skip) {
      for (var i = 0; i < this.children.length; i++) {
        var c = this.children[i];
        if (c.isDragging) {
          c.moveTo(c.dragOffsetX + c.stage.mouseX, c.dragOffsetY + c.stage.mouseY);
        }
        if (c.visible && c !== skip) {
          renderer.drawChild(c, noEffects);
        }
      }
    }

    drawAll(renderer, noEffects, skip) {
      renderer.drawChild(this);
      renderer.drawImage(this.penCanvas, 0, 0);
      this.drawChildren(renderer, noEffects, skip);
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
  }

  // A sprite object.
  class Sprite extends Base {
    constructor(stage) {
      super();

      this.stage = stage;
      this.isSprite = true;

      // These fields should probably be overwritten by creators.
      this.scratchX = 0;
      this.scratchY = 0;
      this.direction = 90;
      this.isDraggable = false;
      this.indexInLibrary = -1;
      this.isDragging = false;
      this.rotationStyle = 'normal';
      this.scale = 1;
      this.visible = false;

      this.spriteInfo = {};
      this.penHue = 240;
      this.penSaturation = 100;
      this.penLightness = 50;
      this.penSize = 1;
      this.isPenDown = false;
      this.bubble = null;
      this.saying = false;
      this.thinking = false;
      this.sayId = 0;
    }

    clone() {
      var c = new Sprite(this.stage);
      c.isClone = true;

      // Copy data without passing reference
      var keys = Object.keys(this.vars);
      for (var i = keys.length; i--;) {
        var k = keys[i];
        c.vars[k] = this.vars[k];
      }

      var keys = Object.keys(this.lists);
      for (var i = keys.length; i--;) {
        var k = keys[i];
        c.lists[k] = this.lists[k].slice(0);
      }

      c.filters = {
        color: this.filters.color,
        fisheye: this.filters.fisheye,
        whirl: this.filters.whirl,
        pixelate: this.filters.pixelate,
        mosaic: this.filters.mosaic,
        brightness: this.filters.brightness,
        ghost: this.filters.ghost
      };

      // Copy scripts
      c.procedures = this.procedures;
      c.listeners = this.listeners;
      c.fns = this.fns;

      // Copy Data
      // These are all primatives which will not pass by reference.
      c.name = this.name;
      c.costumes = this.costumes;
      c.currentCostumeIndex = this.currentCostumeIndex;
      c.sounds = this.sounds;
      c.soundRefs = this.soundRefs;
      c.direction = this.direction;
      c.instrument = this.instrument;
      c.indexInLibrary = this.indexInLibrary;
      c.isDraggable = this.isDraggable;
      c.rotationStyle = this.rotationStyle;
      c.scale = this.scale;
      c.volume = this.volume;
      c.scratchX = this.scratchX;
      c.scratchY = this.scratchY;
      c.visible = this.visible;
      c.penColor = this.penColor;
      c.penCSS = this.penCSS;
      c.penHue = this.penHue;
      c.penSaturation = this.penSaturation;
      c.penLightness = this.penLightness;
      c.penSize = this.penSize;
      c.isPenDown = this.isPenDown;

      return c;
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
        this.stage.triggerFor(this, 'whenClicked');
      }
      this.isDragging = false;
    }

    // Implementing Scratch blocks

    forward(steps) {
      var d = (90 - this.direction) * Math.PI / 180;
      this.moveTo(this.scratchX + steps * Math.cos(d), this.scratchY + steps * Math.sin(d));
    }

    keepInView() {
      // Ensures that the sprite is in view of the stage.
      // See: https://github.com/LLK/scratch-flash/blob/72e4729b8189d11bbe51b6d94144b0a3c392ac9a/src/scratch/ScratchSprite.as#L191-L224

      var rb = this.rotatedBounds();
      var width = rb.right - rb.left;
      var height = rb.top - rb.bottom;
      // using 18 puts sprites 3 pixels too far from edges for some reason, 15 works fine
      var border = Math.min(15, Math.min(width, height) / 2);

      if (rb.right < -240 + border) {
        var difference = rb.right - (-240 + border);
        this.scratchX = Math.floor(this.scratchX - difference);
      }
      if (rb.left > 240 - border) {
        var difference = (240 - border) - rb.left;
        this.scratchX = Math.ceil(difference + this.scratchX);
      }
      if (rb.bottom > 180 - border) {
        var difference = (180 - border) - rb.bottom;
        this.scratchY = Math.ceil(difference + this.scratchY);
      }
      if (rb.top < -180 + border) {
        var difference = rb.top - (-180 + border);
        this.scratchY = Math.floor(this.scratchY - difference);
      }
    }

    moveTo(x, y) {
      var ox = this.scratchX;
      var oy = this.scratchY;
      if (ox === x && oy === y && !this.isPenDown) return;
      this.scratchX = x;
      this.scratchY = y;

      this.keepInView();

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

    dotPen() {
      var context = this.stage.penRenderer.ctx;
      var x = this.scratchX;
      var y = this.scratchY;
      context.fillStyle = this.penCSS || 'hsl(' + this.penHue + ',' + this.penSaturation + '%,' + (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness) + '%)';
      context.beginPath();
      context.arc(240 + x, 180 - y, this.penSize / 2, 0, 2 * Math.PI, false);
      context.fill();
    }

    stamp() {
      this.stage.penRenderer.drawChild(this);
    }

    setDirection(degrees) {
      var d = degrees % 360;
      if (d > 180) d -= 360;
      if (d <= -180) d += 360;
      this.direction = d;
      if (this.saying) this.updateBubble();
    }

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

          collisionRenderer.ctx.width = right - left;
          collisionRenderer.ctx.height = top - bottom;

          collisionRenderer.ctx.save();
          collisionRenderer.ctx.translate(-(left + 240), -(180 - top));

          collisionRenderer.drawChild(this, true);
          collisionRenderer.ctx.globalCompositeOperation = 'source-in';
          collisionRenderer.drawChild(sprite, true);

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

    touchingColor(rgb) {
      var b = this.rotatedBounds();

      collisionCanvas.width = b.right - b.left;
      collisionCanvas.height = b.top - b.bottom;

      collisionRenderer.ctx.save();
      collisionRenderer.ctx.translate(-(240 + b.left), -(180 - b.top));

      this.stage.drawAll(collisionRenderer, true, this);
      collisionRenderer.ctx.globalCompositeOperation = 'destination-in';
      collisionRenderer.drawChild(this, true);

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

      this.stage.drawAll(collisionRenderer, true, this);
      secondaryCollisionRenderer.drawChild(this, true);

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

    rotatedBounds() {
      var costume = this.costumes[this.currentCostumeIndex];

      var s = costume.scale * this.scale;
      var left = -costume.rotationCenterX * s;
      var top = costume.rotationCenterY * s;
      var right = left + costume.image.width * s;
      var bottom = top - costume.image.height * s;

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

      var mSin = Math.sin(this.direction * Math.PI / 180);
      var mCos = Math.cos(this.direction * Math.PI / 180);

      var tlX = mSin * left - mCos * top;
      var tlY = mCos * left + mSin * top;

      var trX = mSin * right - mCos * top;
      var trY = mCos * right + mSin * top;

      var blX = mSin * left - mCos * bottom;
      var blY = mCos * left + mSin * bottom;

      var brX = mSin * right - mCos * bottom;
      var brY = mCos * right + mSin * bottom;

      return {
        left: this.scratchX + Math.min(tlX, trX, blX, brX),
        right: this.scratchX + Math.max(tlX, trX, blX, brX),
        top: this.scratchY + Math.max(tlY, trY, blY, brY),
        bottom: this.scratchY + Math.min(tlY, trY, blY, brY)
      };
    }

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

    gotoObject(thing) {
      if (thing === '_mouse_') {
        this.moveTo(this.stage.mouseX, this.stage.mouseY);
      } else if (thing === '_random_') {
        var x = Math.round(480 * Math.random() - 240);
        var y = Math.round(360 * Math.random() - 180);
        this.moveTo(x, y);
      } else {
        var sprite = this.stage.getObject(thing);
        if (!sprite) return 0;
        this.moveTo(sprite.scratchX, sprite.scratchY);
      }
    }

    pointTowards(thing) {
      if (thing === '_mouse_') {
        var x = this.stage.mouseX;
        var y = this.stage.mouseY;
      } else {
        var sprite = this.stage.getObject(thing);
        if (!sprite) return 0;
        x = sprite.scratchX;
        y = sprite.scratchY;
      }
      var dx = x - this.scratchX;
      var dy = y - this.scratchY;
      this.direction = dx === 0 && dy === 0 ? 90 : Math.atan2(dx, dy) * 180 / Math.PI;
      if (this.saying) this.updateBubble();
    }

    say(text, thinking) {
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
        this.bubblePointer.style.height = ''+(21/14)+'em';
        this.bubblePointer.style.width = ''+(44/14)+'em';
        this.bubblePointer.style.background = 'url(icons.svg) '+(-195/14)+'em '+(-4/14)+'em';
        this.bubblePointer.style.backgroundSize = ''+(320/14)+'em '+(96/14)+'em';
        this.stage.ui.appendChild(this.bubble);
      }
      this.bubblePointer.style.backgroundPositionX = ((thinking ? -259 : -195)/14)+'em';
      this.bubble.style.display = 'block';
      this.bubbleText.nodeValue = text;
      this.updateBubble();
      return ++this.sayId;
    }

    setPenColor(color) {
      this.penColor = color;
      const r = this.penColor >> 16 & 0xff;
      const g = this.penColor >> 8 & 0xff;
      const b = this.penColor & 0xff;
      const a = this.penColor >> 24 & 0xff / 0xff || 1;
      this.penCSS = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
    }

    setPenColorHSL() {
      if (this.penCSS) {
        const hsl = P.utils.rgbToHSL(this.penColor);
        this.penHue = hsl[0];
        this.penSaturation = hsl[1];
        this.penLightness = hsl[2];
        this.penCSS = null;
      }
    }

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

  // A costume, either bitmap or SVG
  class Costume {
    constructor(costumeData) {
      this.index = costumeData.index;
      this.bitmapResolution = costumeData.bitmapResolution;
      this.scale = 1 / this.bitmapResolution;
      this.name = costumeData.name;
      this.rotationCenterX = costumeData.rotationCenterX;
      this.rotationCenterY = costumeData.rotationCenterY;
      this.layers = costumeData.layers;

      this.image = document.createElement('canvas');
      this.context = this.image.getContext('2d');

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
  class Sound {
    constructor(data) {
      this.name = data.name;
      this.buffer = data.buffer;
      this.duration = this.buffer ? this.buffer.duration : 0;
    }
  }

  // An abstract variable watcher
  class VariableWatcher {
    constructor(stage, targetName) {
      // The stage this variable watcher belongs to.
      this.stage = stage;
      // The name of the owner of this watcher, if any.
      this.targetName = targetName;
      // The owner of this watcher, if any. Set in init()
      this.target = null;
      // Is this a valid watcher? (no errrors, unrecognized opcode, etc.)
      this.valid = true;

      // X position
      this.x = 0;
      // Y position
      this.y = 0;
      // Visibility
      this.visible = true;
    }

    // Initializes the VariableWatcher. Called once.
    // Expected to be overidden, call super.init()
    init() {
      this.target = this.stage.getObject(this.targetName) || this.stage;
    }

    // Updates the VariableWatcher. Called every frame.
    // Expected to be overidden, call super.update()
    update() {
      throw new Error('VariableWatcher did not implement update()');
    }

    // Changes the visibility of the watcher.
    // Expected to be overidden, call super.setVisible(visible)
    setVisible(visible) {
      this.visible = visible;
    }
  }

  // An abstract callable procedure
  class Procedure {
    constructor(fn, warp, inputs) {
      this.fn = fn;
      this.warp = warp;
      this.inputs = inputs;
    }

    call(inputs) {
      throw new Error('Procedure did not implement call()');
    }
  }

  core.Base = Base;
  core.Stage = Stage;
  core.Sprite = Sprite;
  core.Costume = Costume;
  core.Sound = Sound;
  core.VariableWatcher = VariableWatcher;
  core.Procedure = Procedure;

  return core;
})({});

// Generic IO helpers
P.IO = (function(IO) {
  // Hooks that can be replaced by other scripts to hook into progress reports.
  IO.progressHooks = {
    // Indicates that a new task has started
    new() {},
    // Indicates that a task has finished successfully
    end() {},
    // Sets the current progress, should override new() and end()
    set(p) {},
    // Indicates an error has occurred and the project will likely fail to load
    error(error) {},
  };

  IO.fetch = function(url, opts) {
    P.IO.progressHooks.new();
    return fetch(url, opts)
      .then((r) => {
        P.IO.progressHooks.end();
        return r;
      })
      .catch((err) => {
        P.IO.progressHooks.error(err);
        throw err;
      });
  };

  IO.fileAsArrayBuffer = function(file) {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onloadend = function() {
        resolve(fileReader.result);
      };

      fileReader.onerror = function(err) {
        reject('Failed to load file');
      };

      fileReader.onprogress = function(progress) {
        P.IO.progressHooks.set(progress);
      };

      fileReader.readAsArrayBuffer(file);
    });
  };

  return IO;
})({});

// Loads Scratch 3 projects
P.sb3 = (function() {
  // The path to remote assets.
  // Replace $path with the md5ext of the file
  const ASSETS_API = 'https://assets.scratch.mit.edu/internalapi/asset/$path/get/';

  // Implements base SB3 loading logic.
  // Needs to be extended to add file loading methods.
  class BaseSB3Loader {
    constructor(buffer) {
      // Implementations are expected to set projectData in load() before calling super.load()
      this.projectData = null;
    }

    getAsText(path) {
      throw new Error('did not implement getAsText()');
    }

    getAsArrayBuffer(path) {
      throw new Error('did not implement getAsArrayBuffer()');
    }

    getAsImage(path) {
      throw new Error('did not implement getAsImage()');
    }

    // Loads and returns a costume from its sb3 JSON data
    getImage(path, format) {
      if (format === 'svg') {
        return this.getAsText(path)
          .then((source) => {
            const image = new Image();

            return new Promise((resolve, reject) => {
              image.onload = () => resolve(image);
              image.onerror = (err) => reject("Failed to load SVG image");
              image.src = 'data:image/svg+xml;base64,' + btoa(source);
            });
          });
      } else {
        return this.getAsImage(path, format);
      }
    }

    loadCostume(data, index) {
      /*
      data = {
        "assetId": "b61b1077b0ea1931abee9dbbfa7903ff",
        "name": "aaa",
        "bitmapResolution": 2,
        "md5ext": "b61b1077b0ea1931abee9dbbfa7903ff.png",
        "dataFormat": "png",
        "rotationCenterX": 480,
        "rotationCenterY": 360
      }
      */
      return this.getImage(data.md5ext, data.dataFormat)
        .then((image) => new P.core.Costume({
          index: index,
          bitmapResolution: data.bitmapResolution,
          name: data.name,
          rotationCenterX: data.rotationCenterX,
          rotationCenterY: data.rotationCenterY,
          layers: [image],
        }));
    }

    getAudioBuffer(path) {
      return this.getAsArrayBuffer(path)
        .then((buffer) => P.audio.decodeAudio(buffer));
    }

    loadSound(data) {
      /*
      data = {
        "assetId": "83a9787d4cb6f3b7632b4ddfebf74367",
        "name": "pop",
        "dataFormat": "wav",
        "format": "",
        "rate": 48000,
        "sampleCount": 1124,
        "md5ext": "83a9787d4cb6f3b7632b4ddfebf74367.wav"
      }
      */
      return this.getAudioBuffer(data.md5ext)
        .then((buffer) => new P.core.Sound({
          name: data.name,
          buffer: buffer,
        }));
    }

    loadWatcher(data, stage) {
      /*
      data = {
        "id": "`jEk@4|i[#Fk?(8x)AV.-my variable",
        "mode": "default",
        "opcode": "data_variable",
        "params": {
          "VARIABLE": "my variable"
        },
        "spriteName": null,
        "value": 4,
        "width": 0,
        "height": 0,
        "x": 5,
        "y": 5,
        "visible": true,
        "min": 0,
        "max": 100
      }
      */
      if (data.mode === 'list') {
        return null;
      }

      const watcher = new P.sb3.compiler.VariableWatcher(stage, data);

      return watcher;
    }

    loadTarget(data) {
      const variables = {};
      for (const id of Object.keys(data.variables)) {
        const variable = data.variables[id];
        variables[id] = variable[1];
      }

      const lists = {};
      for (const id of Object.keys(data.lists)) {
        const list = data.lists[id];
        lists[id] = list[1];
      }

      const broadcasts = {};
      for (const id of Object.keys(data.broadcasts)) {
        const name = data.broadcasts[id];
        broadcasts[name] = id;
      }

      const x = data.x;
      const y = data.y;
      const visible = data.visible;
      const direction = data.direction;
      const size = data.size;
      const draggable = data.draggable;

      var costumes;
      var sounds;

      const loadCostumes = Promise.all(data.costumes.map((c, i) => this.loadCostume(c, i)))
        .then((c) => costumes = c);

      const loadSounds = Promise.all(data.sounds.map((c) => this.loadSound(c)))
        .then((s) => sounds = s);

      return loadCostumes
        .then(() => loadSounds)
        .then(() => {
          const target = new (data.isStage ? P.core.Stage : P.core.Sprite);

          target.currentCostumeIndex = data.currentCostume;
          target.name = data.name;
          target.costumes = costumes;
          target.vars = variables;
          target.lists = lists;
          sounds.forEach((sound) => target.addSound(sound));

          if (data.isStage) {
            target.broadcastReferences = data.broadcasts;
          } else {
            target.scratchX = x;
            target.scratchY = y;
            target.direction = direction;
            target.isDraggable = draggable;
            // target.indexInLibrary = -1; // TODO
            target.rotationStyle = P.utils.asRotationStyle(data.rotationStyle);
            target.scale = size / 100;
            target.visible = visible;
          }

          target.sb3data = data;

          return target;
        });
    }

    load() {
      return Promise.all(this.projectData.targets.map((data) => this.loadTarget(data)))
        .then((targets) => {
          const stage = targets.filter((i) => i instanceof P.core.Stage)[0];
          if (!stage) {
            throw new Error('no stage object');
          }
          const sprites = targets.filter((i) => i instanceof P.core.Sprite);
          const watchers = this.projectData.monitors
            .map((data) => this.loadWatcher(data, stage))
            .filter((i) => i && i.valid);

          sprites.forEach((sprite) => sprite.stage = stage);
          targets.forEach((base) => P.sb3.compiler.compile(base, base.sb3data));
          stage.children = sprites;
          stage.allWatchers = watchers;
          watchers.forEach((watcher) => watcher.init());
          stage.updateBackdrop();

          return stage;
        });
    }
  }

  // Loads a .sb3 file
  class SB3FileLoader extends BaseSB3Loader {
    constructor(buffer) {
      super();
      this.buffer = buffer;
      this.zip = null;
    }

    getFile(path, type) {
      P.IO.progressHooks.new();
      return this.zip.file(path).async(type)
        .then((response) => {
          P.IO.progressHooks.end();
          return response;
        });
    }

    getAsText(path) {
      return this.getFile(path, 'string');
    }

    getAsArrayBuffer(path) {
      return this.getFile(path, 'arrayBuffer')
    }

    getAsBase64(path) {
      return this.getFile(path, 'base64');
    }

    getAsImage(path, format) {
      P.IO.progressHooks.new();
      return this.getAsBase64(path)
        .then((imageData) => {
          return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = function() {
              P.IO.progressHooks.end();
              resolve(image);
            };
            image.onerror = function(error) {
              P.IO.progressHooks.error(error);
              reject('Failed to load image: ' + path + '.' + format);
            };
            image.src = 'data:image/' + format + ';base64,' + imageData;
          });
        });
    }

    load() {
      return JSZip.loadAsync(this.buffer)
        .then((data) => {
          this.zip = data;
          return this.getAsText('project.json');
        })
        .then((project) => {
          this.projectData = JSON.parse(project);
        })
        .then(() => super.load());
    }
  }

  // Loads a Scratch 3 project from the scratch.mit.edu website
  // Uses either a loaded project.json or its ID
  class Scratch3Loader extends BaseSB3Loader {
    constructor(idOrData) {
      super();
      if (typeof idOrData === 'object') {
        this.projectData = idOrData;
        this.projectId = null;
      } else {
        this.projectId = idOrData;
      }
    }

    getAsText(path) {
      return P.IO.fetch(ASSETS_API.replace('$path', path))
        .then((request) => request.text());
    }

    getAsArrayBuffer(path) {
      return P.IO.fetch(ASSETS_API.replace('$path', path))
        .then((request) => request.arrayBuffer());
    }

    getAsImage(path, format) {
      P.IO.progressHooks.new();
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = function() {
          P.IO.progressHooks.end();
          resolve(image);
        };
        image.onerror = function(err) {
          P.IO.progressHooks.error(err);
          reject('Failed to load iamge');
        };
        image.crossOrigin = 'anonymous';
        image.src = ASSETS_API.replace('$path', path);
      });
    }

    load() {
      if (this.projectId) {
        return P.IO.fetch(P.config.PROJECTS_API.replace('$id', this.id))
          .then((request) => request.json())
          .then((data) => {
            this.projectData = data;
          })
          .then(() => super.load());
      } else {
        return super.load();
      }
    }
  }

  return {
    SB3FileLoader: SB3FileLoader,
    Scratch3Loader: Scratch3Loader,
  }
}());

// Compiler for .sb3 projects
P.sb3.compiler = (function() {
  // State variables, used/initialized later.
  let source;
  let currentTarget;
  let blocks;
  let fns;

  /*
  In Scratch 3 all blocks have a unique identifier.
  In the project.json blocks do not contain other blocks in the way a .sb2 file does, but rather they point to the IDs of other blocks.

  Blocks have "inputs", "fields", and "mutations". These are both types of data that change how blocks behave.
  Inputs accept any block as an input, while fields generally accept hard coded strings.
  For example in the block `set [ghost] effect to [100]` ghost is a field (cannot change) and 100 is an input (can change).
  Mutations are only used in custom block definitions and calls.

  This compiler differentiates between "statements", "expressions", "top levels", and "natives".
  Statements are things like `move [ ] steps`. They do something. Cannot be placed in other blocks.
  Expressions are things like `size`, `addition`, `and` etc. They return something. Cannot do anything on their own.
  Natives are things that are core parts of the runtime. This is stuff like strings, numbers, variable references, list references, colors.
  Top levels are top level blocks like `when green flag pressed`, they react to events.
  Each of these are separated and compiled differently and in different spots.
  */

  // Implements a Scratch 3 VariableWatcher.
  // Adds Scratch 3-like styling and implements most watchables.
  class Scratch3VariableWatcher extends P.core.VariableWatcher {
    constructor(stage, data) {
      super(stage, data.spriteName || '');

      // Unique ID
      this.id = data.id;
      // Operation code, similar to other parts of Scratch 3
      this.opcode = data.opcode;
      // 'default', '', ''
      this.mode = data.mode;
      // Watcher options, varies by opcode.
      this.params = data.params;

      // From VariableWatcher
      this.x = data.x;
      this.y = data.y;
      this.visible = typeof data.visible === 'boolean' ? data.visible : true;

      this.sliderMin = data.min;
      this.sliderMax = data.max;

      // Set by layout() at some point later on
      this.containerEl = null;
      this.valueEl = null;
      // Not guarunteed to exist.
      this.sliderEl = null;

      // Mark ourselves as invalid if the opcode is not recognized.
      if (!(this.opcode in watcherLibrary)) {
        console.warn('unknown watcher', this.opcode, this);
        this.valid = false;
      }
    }

    // Override
    update() {
      if (this.visible) {
        this.valueEl.textContent = this.getValue();
      }
    }

    // Override
    init() {
      super.init();

      // init() might not exist, call it if it does.
      // (most opcodes do not have an init())
      if (watcherLibrary[this.opcode].init) {
        watcherLibrary[this.opcode].init(this);
      }

      this.layout();
    }

    // Override
    setVisible(visible) {
      super.setVisible(visible);
      this.layout();
    }

    // Gets the label of the watcher.
    // Will include the sprite's name if any.
    // Example results are 'Sprite1: my variable' and 'timer'
    getLabel() {
      const label = watcherLibrary[this.opcode].getLabel(this);
      if (!this.target.isStage) {
        return this.targetName + ': ' + label;
      }
      return label;
    }

    // Gets the value of the watcher.
    // Could be anything, number, string, undefined, whatever. It's all fair game.
    getValue() {
      const value = watcherLibrary[this.opcode].evaluate(this);
      // Round off numbers to the thousandths to avoid excess precision
      if (typeof value === 'number') {
        return Math.round(value * 1000) / 1000;
      }
      return value;
    }

    // Updates the layout of the watcher.
    layout() {
      if (this.containerEl) {
        this.containerEl.style.display = this.visible ? 'flex' : 'none';
        return;
      }
      if (!this.visible) {
        return;
      }

      const container = document.createElement('div');
      container.classList.add('s3-watcher-container');
      container.setAttribute('opcode', this.opcode);
      container.style.top = this.y + 'px';
      container.style.left = this.x + 'px';

      const value = document.createElement('div');
      value.classList.add('s3-watcher-value');
      value.textContent = this.getValue();

      this.containerEl = container;
      this.valueEl = value;
      this.stage.ui.appendChild(container);

      const mode = this.mode;

      if (mode === 'large') {
        container.classList.add('s3-watcher-large');
      } else {
        // mode is probably 'normal', and we use that as a sensible fallback anyways.
        const label = document.createElement('div');
        container.classList.add('s3-watcher-normal');
        label.classList.add('s3-watcher-label');
        label.textContent = this.getLabel();
        container.appendChild(label);
      }

      container.appendChild(value);
    }
  }

  // Implements a Scratch 3 procedure.
  // Scratch 3 uses names as references for arguments (Scratch 2 uses indexes I believe)
  class Scratch3Procedure extends P.core.Procedure {
    call(inputs) {
      const args = {};
      for (var i = 0; i < this.inputs.length; i++) {
        args[this.inputs[i]] = inputs[i];
      }
      return args;
    }
  }

  // IDs of primative types
  // https://github.com/LLK/scratch-vm/blob/36fe6378db930deb835e7cd342a39c23bb54dd72/src/serialization/sb3.js#L60-L79
  const PRIMATIVE_TYPES = {
    // Any number (???)
    MATH_NUM: 4,
    // Any positive number (maybe including zero?)
    POSITIVE_NUM: 5,
    // Any whole number, including 0
    WHOLE_NUM: 6,
    // Any integer
    INTEGER_NUM: 7,
    // An angle
    ANGLE_NUM: 8,
    // A color
    COLOR_PICKER: 9,
    // A text string
    TEXT: 10,
    // A broadcast
    BROADCAST: 11,
    // A variable reference
    VAR: 12,
    // A list reference
    LIST: 13,
  };

  // Contains top level blocks.
  const topLevelLibrary = {
    // Events
    event_whenflagclicked(block, f) {
      currentTarget.listeners.whenGreenFlag.push(f);
    },
    event_whenkeypressed(block, f) {
      const key = block.fields.KEY_OPTION[0];
      if (key === 'any') {
        for (var i = 128; i--;) {
          currentTarget.listeners.whenKeyPressed[i].push(f);
        }
      } else {
        currentTarget.listeners.whenKeyPressed[P.utils.getKeyCode(key)].push(f);
      }
    },
    event_whenthisspriteclicked(block, f) {
      currentTarget.listeners.whenClicked.push(f);
    },
    event_whenstageclicked(block, f) {
      // same as "when this sprite clicked"
      currentTarget.listeners.whenClicked.push(f);
    },
    event_whenbackdropswitchesto(block, f) {
      const backdrop = block.fields.BACKDROP[0];
      // When backdrop switches to was previously known as "when scene starts"
      if (!currentTarget.listeners.whenSceneStarts[backdrop]) {
        currentTarget.listeners.whenSceneStarts[backdrop] = [];
      }
      currentTarget.listeners.whenSceneStarts[backdrop].push(f);
    },
    event_whenbroadcastreceived(block, f) {
      const optionId = block.fields.BROADCAST_OPTION[1];
      if (!currentTarget.listeners.whenIReceive[optionId]) {
        currentTarget.listeners.whenIReceive[optionId] = [];
      }
      currentTarget.listeners.whenIReceive[optionId].push(f);
    },

    // Control
    control_start_as_clone(block, f) {
      currentTarget.listeners.whenCloned.push(f);
    },

    // Procedures
    procedures_definition(block, f) {
      const customBlockId = block.inputs.custom_block[1];
      const mutation = blocks[customBlockId].mutation;

      const name = mutation.proccode;
      // Warp is either a boolean or a string representation of that boolean.
      const warp = typeof mutation.warp === 'string' ? mutation.warp === 'true' : mutation.warp;
      // It's a stringified JSON array.
      const argumentNames = JSON.parse(mutation.argumentnames);

      const procedure = new Scratch3Procedure(f, warp, argumentNames);
      currentTarget.procedures[name] = procedure;
    },
  };

  // Contains expressions.
  const expressionLibrary = {
    // Motion
    motion_goto_menu(block) {
      const to = block.fields.TO[0];
      return '"' + sanitize(to) + '"';
    },
    motion_pointtowards_menu(block) {
      const towards = block.fields.TOWARDS[0];
      return '"' + sanitize(towards) + '"';
    },
    motion_xposition(block) {
      return 'S.scratchX';
    },
    motion_yposition(block) {
      return 'S.scratchY';
    },
    motion_direction() {
      return 'S.direction';
    },

    // Looks
    looks_costume(block) {
      const costume = block.fields.COSTUME;
      return sanitize(costume[0], true);
    },
    looks_backdrops(block) {
      const backdrop = block.fields.BACKDROP[0];
      return '"' + sanitize(backdrop) + '"';
    },
    looks_costumenumbername(block) {
      const name = block.fields.NUMBER_NAME[0];
      if (name === 'number') {
        return 'S.currentCostumeIndex + 1';
      } else if (name === 'name') {
        return 'S.costumes[S.currentCostumeIndex].name';
      } else {
        throw new Error('unknown NUMBER_NAME: ' + name);
      }
    },
    looks_backdropnumbername(block) {
      const name = block.fields.NUMBER_NAME[0];
      if (name === 'number') {
        return 'self.currentCostumeIndex + 1';
      } else if (name === 'name') {
        return 'self.costumes[self.currentCostumeIndex].name';
      } else {
        throw new Error('unknown NUMBER_NAME: ' + name);
      }
    },
    looks_size() {
      return 'S.scale * 100';
    },

    // Sounds
    sound_sounds_menu(block) {
      const sound = block.fields.SOUND_MENU[0];
      return '"' + sanitize(sound) + '"';
    },
    sound_volume() {
      return '(S.volume * 100)'
    },

    // Control
    control_create_clone_of_menu(block) {
      const option = block.fields.CLONE_OPTION;
      return '"' + sanitize(option[0]) + '"';
    },

    // Sensing

    sensing_touchingobject(block) {
      const object = block.inputs.TOUCHINGOBJECTMENU;
      return 'S.touching(' + compileExpression(object) + ')';
    },
    sensing_touchingobjectmenu(block) {
      const object = block.fields.TOUCHINGOBJECTMENU;
      return '"' + sanitize(object[0]) + '"';
    },
    sensing_touchingcolor(block) {
      const color = block.inputs.COLOR;
      return 'S.touchingColor(' + compileExpression(color) + ')';
    },
    sensing_coloristouchingcolor(block) {
      const color = block.inputs.COLOR;
      const color2 = block.inputs.COLOR2;
      return 'S.colorTouchingColor(' + compileExpression(color) + ', ' + compileExpression(color2) + ')';
    },
    sensing_distanceto(block) {
      const menu = block.inputs.DISTANCETOMENU;
      return 'S.distanceTo(' + compileExpression(menu) + ')';
    },
    sensing_distancetomenu(block) {
      return sanitize(block.fields.DISTANCETOMENU[0], true);
    },
    sensing_answer(block) {
      return 'self.answer';
    },
    sensing_keypressed(block) {
      const key = block.inputs.KEY_OPTION;
      return '!!self.keys[P.utils.getKeyCode(' + compileExpression(key) + ')]';
    },
    sensing_keyoptions(block) {
      const key = block.fields.KEY_OPTION[0];
      return '"' + sanitize(key) + '"';
    },
    sensing_mousedown(block) {
      return 'self.mousePressed';
    },
    sensing_mousex(block) {
      return 'self.mouseX';
    },
    sensing_mousey(block) {
      return 'self.mouseY';
    },
    sensing_loudness(block) {
      // We don't implement loudness, we always return -1 which indicates that there is no microphone available.
      return '-1';
    },
    sensing_timer(block) {
      return '((self.now - self.timerStart) / 1000)';
    },
    sensing_of(block) {
      const property = block.fields.PROPERTY[0];
      const object = block.inputs.OBJECT;
      return 'attribute(' + sanitize(property, true) + ', ' + compileExpression(object, 'string') + ')';
    },
    sensing_of_object_menu(block) {
      const object = block.fields.OBJECT[0];
      return sanitize(object, true);
    },
    sensing_current(block) {
      const current = block.fields.CURRENTMENU[0];

      switch (current) {
        case 'YEAR': return 'new Date().getFullYear()';
        case 'MONTH': return 'new Date().getMonth() + 1';
        case 'DATE': return 'new Date().getDate()';
        case 'DAYOFWEEK': return 'new Date().getDay() + 1';
        case 'HOUR': return 'new Date().getHours()';
        case 'MINUTE': return 'new Date().getMinutes()';
        case 'SECOND': return 'new Date().getSeconds()';
      }

      console.warn('unknown CURRENTMENU: ' + current);
      return 0;
    },
    sensing_dayssince2000(block) {
      return '((Date.now() - epoch) / 86400000)';
    },
    sensing_username(block) {
      // TODO: let the user pick a username
      return '""';
    },

    // Operators
    operator_add(block) {
      const num1 = block.inputs.NUM1;
      const num2 = block.inputs.NUM2;
      return '(' + compileExpression(num1) + ' + ' + compileExpression(num2) + ' || 0)';
    },
    operator_subtract(block) {
      const num1 = block.inputs.NUM1;
      const num2 = block.inputs.NUM2;
      return '(' + compileExpression(num1) + ' - ' + compileExpression(num2) + ' || 0)';
    },
    operator_multiply(block) {
      const num1 = block.inputs.NUM1;
      const num2 = block.inputs.NUM2;
      return '(' + compileExpression(num1) + ' * ' + compileExpression(num2) + ' || 0)';
    },
    operator_divide(block) {
      const num1 = block.inputs.NUM1;
      const num2 = block.inputs.NUM2;
      return '(' + compileExpression(num1, 'number') + ' / ' + compileExpression(num2, 'number') + ' || 0)';
    },
    operator_random(block) {
      const from = block.inputs.FROM;
      const to = block.inputs.TO;
      return 'random(' + compileExpression(from) + ', ' + compileExpression(to) + ')';
    },
    operator_gt(block) {
      const operand1 = block.inputs.OPERAND1;
      const operand2 = block.inputs.OPERAND2;
      return 'numGreater(' + compileExpression(operand1) + ', ' + compileExpression(operand2) + ')';
    },
    operator_lt(block) {
      const operand1 = block.inputs.OPERAND1;
      const operand2 = block.inputs.OPERAND2;
      return 'numLess(' + compileExpression(operand1) + ', ' + compileExpression(operand2) + ')';
    },
    operator_equals(block) {
      const operand1 = block.inputs.OPERAND1;
      const operand2 = block.inputs.OPERAND2;
      return 'equal(' + compileExpression(operand1) + ', ' + compileExpression(operand2) + ')';
    },
    operator_and(block) {
      const operand1 = block.inputs.OPERAND1;
      const operand2 = block.inputs.OPERAND2;
      return '(' + compileExpression(operand1) + ' && ' + compileExpression(operand2) + ')';
    },
    operator_or(block) {
      const operand1 = block.inputs.OPERAND1;
      const operand2 = block.inputs.OPERAND2;
      return '(' + compileExpression(operand1) + ' || ' + compileExpression(operand2) + ')';
    },
    operator_not(block) {
      const operand = block.inputs.OPERAND;
      return '!(' + compileExpression(operand) + ')';
    },
    operator_join(block) {
      const string1 = block.inputs.STRING1;
      const string2 = block.inputs.STRING2;
      return '( "" + ' + compileExpression(string1) + ' + ' + compileExpression(string2) + ')';
    },
    operator_letter_of(block) {
      const string = block.inputs.STRING;
      const letter = block.inputs.LETTER;
      return '((' + compileExpression(string, 'string') + ')[(' + compileExpression(letter, 'number') + ' | 0) - 1] || "")';
    },
    operator_length(block) {
      const string = block.inputs.STRING;
      // TODO: parenthesis important?
      return '(' + compileExpression(string, 'string') + ').length';
    },
    operator_contains(block) {
      const string1 = block.inputs.STRING1;
      const string2 = block.inputs.STRING2;
      return compileExpression(string1, 'string') + '.includes(' + compileExpression(string2, 'string') + ')';
    },
    operator_mod(block) {
      const num1 = block.inputs.NUM1;
      const num2 = block.inputs.NUM2;
      return '(' + compileExpression(num1) + ' % ' + compileExpression(num2) + ' || 0)';
    },
    operator_round(block) {
      const num = block.inputs.NUM;
      return 'Math.round(' + compileExpression(num) + ')';
    },
    operator_mathop(block) {
      const operator = block.fields.OPERATOR[0];
      const num = block.inputs.NUM;
      // TODO: inline the function when possible for performance gain?
      return 'mathFunc("' + sanitize(operator) + '", ' + compileExpression(num) + ')';
    },

    // Data
    data_itemoflist(block) {
      const list = block.fields.LIST[1];
      const index = block.inputs.INDEX;
      return 'getLineOfList(' + listReference(list) + ', ' + compileExpression(index, 'number') + ')';
    },
    data_itemnumoflist(block) {
      const list = block.fields.LIST[1];
      const item = block.inputs.ITEM;
      return 'listIndexOf(' + listReference(list) + ', ' + compileExpression(item) + ')';
    },
    data_lengthoflist(block) {
      const list = block.fields.LIST[1];
      return listReference(list) + '.length';
    },
    data_listcontainsitem(block) {
      const list = block.fields.LIST[1];
      const item = block.inputs.ITEM;
      return 'listContains(' + listReference(list) + ', ' + compileExpression(item) + ')';
    },

    // Procedures/arguments
    argument_reporter_string_number(block) {
      const name = block.fields.VALUE[0];
      return 'C.args[' + sanitize(name, true) + ']';
    },
    argument_reporter_boolean(block) {
      const name = block.fields.VALUE[0];
      return asType('C.args[' + sanitize(name, true) + ']', 'boolean');
    },

    // Pen
    pen_menu_colorParam(block) {
      const colorParam = block.fields.colorParam[0];
      return sanitize(colorParam, true);
    },
  };

  // Contains statements.
  const statementLibrary = {
    // Motion
    motion_movesteps(block) {
      const steps = block.inputs.STEPS;
      source += 'S.forward(' + compileExpression(steps, 'number') + ');\n';
      visualCheck('drawing');
    },
    motion_turnright(block) {
      const degrees = block.inputs.DEGREES;
      source += 'S.setDirection(S.direction + ' + compileExpression(degrees, 'number') + ');\n';
      visualCheck('visible');
    },
    motion_turnleft(block) {
      const degrees = block.inputs.DEGREES;
      source += 'S.setDirection(S.direction - ' + compileExpression(degrees, 'number') + ');\n';
      visualCheck('visible');
    },
    motion_goto(block) {
      const to = block.inputs.TO;
      source += 'S.gotoObject(' + compileExpression(to) + ');\n';
      visualCheck('drawing');
    },
    motion_gotoxy(block) {
      const x = block.inputs.X;
      const y = block.inputs.Y;
      source += 'S.moveTo(' + compileExpression(x, 'number') + ', ' + compileExpression(y, 'number') + ');\n';
      visualCheck('drawing');
    },
    motion_glidesecstoxy(block) {
      const secs = block.inputs.SECS;
      const x = block.inputs.X;
      const y = block.inputs.Y;

      visualCheck('drawing');
      source += 'save();\n';
      source += 'R.start = self.now;\n';
      source += 'R.duration = ' + compileExpression(secs) + ';\n';
      source += 'R.baseX = S.scratchX;\n';
      source += 'R.baseY = S.scratchY;\n';
      source += 'R.deltaX = ' + compileExpression(x) + ' - S.scratchX;\n';
      source += 'R.deltaY = ' + compileExpression(y) + ' - S.scratchY;\n';
      const id = label();
      source += 'var f = (self.now - R.start) / (R.duration * 1000);\n';
      source += 'if (f > 1) f = 1;\n';
      source += 'S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);\n';
      source += 'if (f < 1) {\n';
      forceQueue(id);
      source += '}\n';
      source += 'restore();\n';
    },
    motion_pointindirection(block) {
      const direction = block.inputs.DIRECTION;
      visualCheck('visible');
      source += 'S.direction = ' + compileExpression(direction) + ';\n';
    },
    motion_pointtowards(block) {
      const towards = block.inputs.TOWARDS;
      source += 'S.pointTowards(' + compileExpression(towards) + ');\n';
      visualCheck('visible');
    },
    motion_changexby(block) {
      const dx = block.inputs.DX;
      source += 'S.moveTo(S.scratchX + ' + compileExpression(dx, 'number') + ', S.scratchY);\n';
      visualCheck('drawing');
    },
    motion_setx(block) {
      const x = block.inputs.X;
      source += 'S.moveTo(' + compileExpression(x, 'number') + ', S.scratchY);\n';
      visualCheck('drawing');
    },
    motion_changeyby(block) {
      const dy = block.inputs.DY;
      source += 'S.moveTo(S.scratchX, S.scratchY + ' + compileExpression(dy, 'number') + ');\n';
      visualCheck('drawing');
    },
    motion_sety(block) {
      const y = block.inputs.Y;
      source += 'S.moveTo(S.scratchX, ' + compileExpression(y, 'number') + ');\n';
      visualCheck('drawing');
    },
    motion_ifonedgebounce(block) {
      source += 'S.bounceOffEdge();\n';
    },
    motion_setrotationstyle(block) {
      const style = block.fields.STYLE[0];
      source += 'S.rotationStyle = "' + P.utils.asRotationStyle(style) + '";\n';
      visualCheck('visible');
    },

    // Looks
    looks_sayforsecs(block) {
      const message = block.inputs.MESSAGE;
      const secs = block.inputs.SECS;
      source += 'save();\n';
      source += 'R.id = S.say(' + compileExpression(message) + ', false);\n';
      source += 'R.start = self.now;\n';
      source += 'R.duration = ' + compileExpression(secs, 'number') + ';\n';
      const id = label();
      source += 'if (self.now - R.start < R.duration * 1000) {\n';
      forceQueue(id);
      source += '}\n';
      source += 'if (S.sayId === R.id) {\n';
      source += '  S.say("");\n';
      source += '}\n';
      source += 'restore();\n';
      visualCheck('visible');
    },
    looks_say(block) {
      const message = block.inputs.MESSAGE;
      source += 'S.say(' + compileExpression(message) + ', false);\n';
      visualCheck('visible');
    },
    looks_thinkforsecs(block) {
      const message = block.inputs.MESSAGE;
      const secs = block.inputs.SECS;
      source += 'save();\n';
      source += 'R.id = S.say(' + compileExpression(message) + ', true);\n';
      source += 'R.start = self.now;\n';
      source += 'R.duration = ' + compileExpression(secs, 'number') + ';\n';
      const id = label();
      source += 'if (self.now - R.start < R.duration * 1000) {\n';
      forceQueue(id);
      source += '}\n';
      source += 'if (S.sayId === R.id) {\n';
      source += '  S.say("");\n';
      source += '}\n';
      source += 'restore();\n';
      visualCheck('visible');
    },
    looks_think(block) {
      const message = block.inputs.MESSAGE;
      source += 'S.say(' + compileExpression(message) + ', true);\n';
      visualCheck('visible');
    },
    looks_switchcostumeto(block) {
      const costume = block.inputs.COSTUME;
      source += 'S.setCostume(' + compileExpression(costume) + ');\n';
      visualCheck('visible');
    },
    looks_nextcostume(block) {
      source += 'S.showNextCostume();\n';
      visualCheck('visible');
    },
    looks_switchbackdropto(block) {
      const backdrop = block.inputs.BACKDROP;
      source += 'self.setCostume(' + compileExpression(backdrop) + ');\n';
      visualCheck('always');
    },
    looks_nextbackdrop(block) {
      source += 'self.showNextCostume();\n';
      visualCheck('visible');
    },
    looks_changesizeby(block) {
      const change = block.inputs.CHANGE;
      source += 'var f = S.scale + ' + compileExpression(change) + ' / 100;\n';
      source += 'S.scale = f < 0 ? 0 : f;\n';
      visualCheck('visible');
    },
    looks_setsizeto(block) {
      const size = block.inputs.SIZE;
      source += 'var f = ' + compileExpression(size) + ' / 100;\n';
      source += 'S.scale = f < 0 ? 0 : f;\n';
      visualCheck('visible');
    },
    looks_changeeffectby(block) {
      const effect = block.fields.EFFECT[0];
      const change = block.inputs.CHANGE;
      source += 'S.changeFilter("' + sanitize(effect).toLowerCase() + '", ' + compileExpression(change, 'number') + ');\n';
      visualCheck('visible');
    },
    looks_seteffectto(block) {
      const effect = block.fields.EFFECT[0];
      const value = block.inputs.VALUE;
      // Effect is in all caps which is not what we want.
      source += 'S.setFilter("' + sanitize(effect).toLowerCase() + '", ' + compileExpression(value, 'number') + ');\n';
      visualCheck('visible');
    },
    looks_cleargraphiceffects(block) {
      source += 'S.resetFilters();\n';
      visualCheck('visible');
    },
    looks_show(block) {
      source += 'S.visible = true;\n';
      visualCheck('always');
      updateBubble();
    },
    looks_hide(block) {
      source += 'S.visible = false;\n';
      visualCheck('always');
      updateBubble();
    },
    looks_gotofrontback(block) {
      const frontBack = block.fields.FRONT_BACK[0];
      source += 'var i = self.children.indexOf(S);\n';
      source += 'if (i !== -1) self.children.splice(i, 1);\n';
      if (frontBack === 'front') {
        source += 'self.children.push(S);\n';
      } else if (frontBack === 'back') {
        source += 'self.children.unshift(S);\n';
      }
      visualCheck('visible');
    },
    looks_goforwardbackwardlayers(block) {
      const direction = block.fields.FORWARD_BACKWARD[0];
      const number = block.inputs.NUM;
      source += 'var i = self.children.indexOf(S);\n';
      source += 'if (i !== -1) {\n';
      source += '  self.children.splice(i, 1);\n';
      if (direction === 'backward') {
        source += '  self.children.splice(Math.max(0, i - ' + compileExpression(number) + '), 0, S);\n';
      } else if (direction === 'forward') {
        source += '  self.children.splice(Math.min(self.children.length - 1, i + ' + compileExpression(number) + '), 0, S);\n';
      } else {
        throw new Error('unknown direction: ' + direction);
      }
      source += '}\n';
      visualCheck('visible');
    },

    // Sounds
    sound_playuntildone(block) {
      const sound = block.inputs.SOUND_MENU;
      source += 'var sound = S.getSound(' + compileExpression(sound) + ');\n';
      source += 'if (sound) {\n';
      source += '  playSound(sound);\n';
      wait('sound.duration');
      source += '}\n';
    },
    sound_play(block) {
      const sound = block.inputs.SOUND_MENU;
      source += 'var sound = S.getSound(' + compileExpression(sound) + ');\n';
      source += 'if (sound) {\n';
      source += '  playSound(sound);\n';
      source += '}\n';
    },
    sound_stopallsounds(block) {
      if (P.audio.context) {
        source += 'self.stopAllSounds();\n';
      }
    },
    sound_changevolumeby(block) {
      const volume = block.inputs.VOLUME;
      source += 'S.volume = Math.max(0, Math.min(1, S.volume + ' + compileExpression(volume, 'number') + ' / 100));\n';
      source += 'if (S.node) S.node.gain.setValueAtTime(S.volume, audioContext.currentTime);\n';
      source += 'for (var sounds = S.sounds, i = sounds.length; i--;) {\n';
      source += '  var sound = sounds[i];\n';
      source += '  if (sound.node && sound.target === S) {\n';
      source += '    sound.node.gain.setValueAtTime(S.volume, audioContext.currentTime);\n';
      source += '  }\n';
      source += '}\n';
    },
    sound_setvolumeto(block) {
      const volume = block.inputs.VOLUME;
      source += 'S.volume = Math.max(0, Math.min(1, ' + compileExpression(volume, 'number') + ' / 100));\n';
      source += 'if (S.node) S.node.gain.setValueAtTime(S.volume, audioContext.currentTime);\n';
      source += 'for (var sounds = S.sounds, i = sounds.length; i--;) {\n';
      source += '  var sound = sounds[i];\n';
      source += '  if (sound.node && sound.target === S) {\n';
      source += '    sound.node.gain.setValueAtTime(S.volume, audioContext.currentTime);\n';
      source += '  }\n';
      source += '}\n';
    },

    // Event
    event_broadcast(block) {
      const input = block.inputs.BROADCAST_INPUT;
      source += 'var threads = broadcast(' + compileExpression(input) + ');\n';
      source += 'if (threads.indexOf(BASE) !== -1) {return;}\n';
    },
    event_broadcastandwait(block) {
      const input = block.inputs.BROADCAST_INPUT;
      source += 'save();\n';
      source += 'R.threads = broadcast(' + compileExpression(input) + ');\n';
      source += 'if (R.threads.indexOf(BASE) !== -1) {return;}\n';
      const id = label();
      source += 'if (running(R.threads)) {\n';
      forceQueue(id);
      source += '}\n';
      source += 'restore();\n';
    },

    // Control
    control_wait(block) {
      const duration = block.inputs.DURATION;
      source += 'save();\n';
      source += 'R.start = self.now;\n';
      source += 'R.duration = ' + compileExpression(duration) + ';\n';
      source += 'var first = true;\n';
      const id = label();
      source += 'if (self.now - R.start < R.duration * 1000 || first) {\n';
      source += '  var first;\n';
      forceQueue(id);
      source += '}\n';
      source += 'restore();\n';
    },
    control_repeat(block) {
      const times = block.inputs.TIMES;
      const substack = block.inputs.SUBSTACK;
      source += 'save();\n';
      source += 'R.count = ' + compileExpression(times) + ';\n';
      const id = label();
      source += 'if (R.count >= 0.5) {\n';
      source += '  R.count -= 1;\n';
      compileSubstack(substack);
      queue(id);
      source += '} else {\n';
      source += '  restore();\n';
      source += '}\n';
    },
    control_forever(block) {
      const substack = block.inputs.SUBSTACK;
      const id = label();
      compileSubstack(substack);
      forceQueue(id);
    },
    control_if(block) {
      const condition = block.inputs.CONDITION;
      const substack = block.inputs.SUBSTACK;
      source += 'if (' + compileExpression(condition) + ') {\n';
      compileSubstack(substack);
      source += '}\n';
    },
    control_if_else(block) {
      const condition = block.inputs.CONDITION;
      const substack1 = block.inputs.SUBSTACK;
      const substack2 = block.inputs.SUBSTACK2;
      source += 'if (' + compileExpression(condition) + ') {\n';
      compileSubstack(substack1);
      source += '} else {\n';
      compileSubstack(substack2);
      source += '}\n';
    },
    control_wait_until(block) {
      const condition = block.inputs.CONDITION;
      const id = label();
      source += 'if (!' + compileExpression(condition) + ') {\n';
      queue(id);
      source += '}\n';
    },
    control_repeat_until(block) {
      const condition = block.inputs.CONDITION;
      const substack = block.inputs.SUBSTACK;
      const id = label();
      source += 'if (!(' + compileExpression(condition, 'boolean') + ')) {\n'
      compileSubstack(substack);
      queue(id);
      source += '}\n';
    },
    control_while(block) {
      // Hacked block
      const condition = block.inputs.CONDITION;
      const substack = block.inputs.SUBSTACK;
      const id = label();
      source += 'if (' + compileExpression(condition, 'boolean') + ') {\n'
      compileSubstack(substack);
      queue(id);
      source += '}\n';
    },
    control_stop(block) {
      const option = block.fields.STOP_OPTION[0];
      source += 'switch (' + compileExpression(option) + ') {\n';
      source += '  case "all":\n';
      source += '    self.stopAll();\n';
      source += '    return;\n';
      source += '  case "this script":\n';
      source += '    endCall();\n';
      source += '    return;\n';
      source += '  case "other scripts in sprite":\n';
      source += '  case "other scripts in stage":\n';
      source += '    for (var i = 0; i < self.queue.length; i++) {\n';
      source += '      if (i !== THREAD && self.queue[i] && self.queue[i].sprite === S) {\n';
      source += '        self.queue[i] = undefined;\n';
      source += '      }\n';
      source += '    }\n';
      source += '    break;\n';
      source += '}\n';
    },
    control_create_clone_of(block) {
      const option = block.inputs.CLONE_OPTION;
      source += 'clone(' + compileExpression(option) + ');\n';
    },
    control_delete_this_clone(block) {
      source += 'if (S.isClone) {\n';
      source += '  S.remove();\n';
      source += '  var i = self.children.indexOf(S);\n';
      source += '  if (i !== -1) self.children.splice(i, 1);\n';
      source += '  for (var i = 0; i < self.queue.length; i++) {\n';
      source += '    if (self.queue[i] && self.queue[i].sprite === S) {\n';
      source += '      self.queue[i] = undefined;\n';
      source += '    }\n';
      source += '  }\n';
      source += '  return;\n';
      source += '}\n';
    },

    // Sensing
    sensing_askandwait(block) {
      const question = block.inputs.QUESTION;
      source += 'R.id = self.nextPromptId++;\n';
      // 1 - wait until we are next up for the asking
      const id1 = label();
      source += 'if (self.promptId < R.id) {\n';
      forceQueue(id1);
      source += '}\n';

      source += 'S.ask(' + compileExpression(question) + ');\n';
      // 2 - wait until the prompt has been answered
      const id2 = label();
      source += 'if (self.promptId === R.id) {\n';
      forceQueue(id2);
      source += '}\n';

      visualCheck('always');
    },
    sensing_setdragmode(block) {
      const dragMode = block.fields.DRAG_MODE[0];
      if (dragMode === 'draggable') {
        source += 'S.isDraggable = true;\n';
      } else {
        source += 'S.isDraggable = false;\n';
      }
    },
    sensing_resettimer(blocK) {
      source += 'self.timerStart = self.now;\n';
    },

    // Data
    data_setvariableto(block) {
      const variableId = block.fields.VARIABLE[1];
      const value = block.inputs.VALUE;
      source += variableReference(variableId) + ' = ' + compileExpression(value) + ';\n';
    },
    data_changevariableby(block) {
      const variableId = block.fields.VARIABLE[1];
      const value = block.inputs.VALUE;
      const ref = variableReference(variableId);
      source += ref + ' = (+' + ref + ' + +' + compileExpression(value) + ');\n';
    },
    data_showvariable(block) {
      const variable = block.fields.VARIABLE[1];
      const scope = variableScope(variable);
      source += scope + '.showVariable(' + sanitize(variable, true) + ', true);\n';
    },
    data_hidevariable(block) {
      const variable = block.fields.VARIABLE[1];
      const scope = variableScope(variable);
      source += scope + '.showVariable(' + sanitize(variable, true) + ', false);\n';
    },
    data_addtolist(block) {
      const list = block.fields.LIST[1];
      const item = block.inputs.ITEM;
      source += listReference(list) + '.push(' + compileExpression(item)  + ');\n';
    },
    data_deleteoflist(block) {
      const list = block.fields.LIST[1];
      const index = block.inputs.INDEX;
      source += 'deleteLineOfList(' + listReference(list) + ', ' + compileExpression(index, 'number') + ');\n';
    },
    data_deletealloflist(block) {
      const list = block.fields.LIST[1];
      source += listReference(list) + ' = [];\n';
    },
    data_insertatlist(block) {
      const list = block.fields.LIST[1];
      const item = block.inputs.ITEM;
      const index = block.inputs.INDEX;
      source += 'insertInList(' + listReference(list) + ', ' + compileExpression(index, 'number') + ',' + compileExpression(item) + ');\n';
    },
    data_replaceitemoflist(block) {
      const list = block.fields.LIST[1];
      const item = block.inputs.ITEM;
      const index = block.inputs.INDEX;
      source += 'setLineOfList(' + listReference(list) + ', ' + compileExpression(index, 'number') + ',' + compileExpression(item) + ');\n';
    },

    // Procedures
    procedures_call(block) {
      const mutation = block.mutation;
      const name = mutation.proccode;

      const id = nextLabel();
      source += 'call(S.procedures[' + sanitize(name, true) + '], ' + id + ', [\n';

      // The mutation has a stringified JSON list of input IDs... it's weird.
      const inputIds = JSON.parse(mutation.argumentids);
      for (const id of inputIds) {
        const input = block.inputs[id];
        source += '  ' + compileExpression(input) + ',\n';
      }

      source += ']);\n';

      delay();
    },

    // Pen (extension)
    pen_clear(block) {
      source += 'self.clearPen();\n';
      visualCheck('always');
    },
    pen_stamp(block) {
      source += 'S.stamp();\n';
      visualCheck('always');
    },
    pen_penDown(block) {
      source += 'S.isPenDown = true;\n';
      source += 'S.dotPen();\n';
      visualCheck('always');
    },
    pen_penUp(block) {
      source += 'S.isPenDown = false;\n';
      visualCheck('always');
    },
    pen_setPenColorToColor(block) {
      const color = block.inputs.COLOR;
      source += 'S.setPenColor(' + compileExpression(color, 'number') + ');\n';
    },
    pen_setPenHueToNumber(block) {
      const hue = block.inputs.HUE;
      source += 'S.setPenColorParam("color", ' + compileExpression(hue, 'number') + ');\n'
    },
    pen_changePenHueBy(block) {
      const hue = block.inputs.HUE;
      source += 'S.changePenColorParam("color", ' + compileExpression(hue, 'number') + ');\n';
    },
    pen_setPenShadeToNumber(block) {
      const shade = block.inputs.SHADE;
      source += 'S.setPenColorParam("brightness", ' + compileExpression(shade, 'number') + ');\n';
    },
    pen_changePenShadeBy(block) {
      const shade = block.inputs.SHADE;
      source += 'S.changePenColorParam("brightness", ' + compileExpression(shade, 'number') + ');\n';
    },
    pen_setPenColorParamTo(block) {
      const colorParam = block.inputs.COLOR_PARAM;
      const value = block.inputs.VALUE;
      source += 'S.setPenColorParam(' + compileExpression(colorParam, 'string') + ', ' + compileExpression(value, 'number') + ');\n';
    },
    pen_changePenColorParamBy(block) {
      const colorParam = block.inputs.COLOR_PARAM;
      const value = block.inputs.VALUE;
      source += 'S.changePenColorParam(' + compileExpression(colorParam, 'string') + ', ' + compileExpression(value, 'number') + ');\n';
    },
    pen_changePenSizeBy(block) {
      const size = block.inputs.SIZE;
      source += 'S.penSize = Math.max(1, S.penSize + ' + compileExpression(size, 'number') + ');\n';
    },
    pen_setPenSizeTo(block) {
      const size = block.inputs.SIZE;
      source += 'S.penSize = Math.max(1, ' + compileExpression(size, 'number') + ');\n';
    },
  };

  // Contains data used for variable watchers.
  const watcherLibrary = {
    // Maps watcher opcode to an object determining their behavior.
    // Objects must have an evalute(watcher) method that returns the current value of the watcher. (called every visible frame)
    // They also must have a getLabel(watcher) that returns the label for the watcher. (called once during initialization)
    // They optionally may have an init(watcher) that does any required initialization work.

    // Motion
    motion_xposition: {
      evaluate(watcher) { return watcher.target.scratchX; },
      getLabel() { return 'x position'; },
    },
    motion_yposition: {
      evaluate(watcher) { return watcher.target.scratchY; },
      getLabel() { return 'y position'; },
    },
    motion_direction: {
      evaluate(watcher) { return watcher.target.direction; },
      getLabel() { return 'direction'; },
    },
    // Looks
    looks_costumenumbername: {
      evaluate(watcher) {
        const target = watcher.target;
        const param = watcher.params.NUMBER_NAME;
        if (param === 'number') {
          return target.currentCostumeIndex + 1;
        } else if (param === 'name') {
          return target.costumes[target.currentCostumeIndex].name;
        }
      },
      getLabel(watcher) {
        return 'costume ' + watcher.params.NUMBER_NAME;
      },
    },
    looks_backdropnumbername: {
      evaluate(watcher) {
        const target = watcher.stage;
        const param = watcher.params.NUMBER_NAME;
        if (param === 'number') {
          return target.currentCostumeIndex + 1;
        } else if (param === 'name') {
          return target.costumes[target.currentCostumeIndex].name;
        }
      },
      getLabel(watcher) {
        return 'backdrop ' + watcher.params.NUMBER_NAME;
      },
    },
    looks_size: {
      evaluate(watcher) { return watcher.target.scale * 100; },
      getLabel() { return 'size'; },
    },
    // Sound
    sound_volume: {
      evaluate(watcher) { return watcher.target.volume * 100; },
      getLabel() { return 'volume'; },
    },
    // Sensing
    sensing_answer: {
      evaluate(watcher) { return watcher.stage.answer; },
      getLabel() { return 'answer'; },
    },
    sensing_loudness: {
      // We don't actually implement loudness.
      evaluate() { return -1; },
      getLabel() { return 'loudness'; },
    },
    sensing_timer: {
      evaluate(watcher) {
        return (watcher.stage.now - watcher.stage.timerStart) / 1000;
      },
      getLabel() { return 'timer'; },
    },
    sensing_current: {
      evaluate(watcher) {
        switch (watcher.params.CURRENTMENU) {
          case 'YEAR': return new Date().getFullYear();
          case 'MONTH': return new Date().getMonth() + 1;
          case 'DATE': return new Date().getDate();
          case 'DAYOFWEEK': return new Date().getDay() + 1;
          case 'HOUR': return new Date().getHours();
          case 'MINUTE': return new Date().getMinutes();
          case 'SECOND': return new Date().getSeconds();
        }
      },
      getLabel(watcher) {
        switch (watcher.params.CURRENTMENU) {
          case 'YEAR': return 'year';
          case 'MONTH': return 'month';
          case 'DATE': return 'date';
          case 'DAYOFWEEK': return 'day of week';
          case 'HOUR': return 'hour';
          case 'MINUTE': return 'minute';
          case 'SECOND': return 'second';
        }
      }
    },
    sensing_username: {
      evaluate(watcher) { return ''; },
      getLabel() { return 'username'; },
    },
    // Data
    data_variable: {
      init(watcher) {
        watcher.target.watchers[watcher.id] = watcher;
      },
      evaluate(watcher) {
        return watcher.target.vars[watcher.id];
      },
      getLabel(watcher) {
        return watcher.params.VARIABLE;
      },
    },
  };

  ///
  /// Helpers
  ///

  // Adds JS to update the speach bubble if necessary
  function updateBubble() {
    source += 'if (S.saying) S.updateBubble();\n';
  }

  // Adds JS to enable the VISUAL flag when necessary.
  // `variant` can be either 'drawing', 'visible', or 'always' to control when the flag gets enabled.
  // 'drawing' (default) will enable it if the sprite is visible or the pen is down (the sprite is drawing something)
  // 'visible' will enable it if the sprite is visible
  // 'always' will always enable it
  function visualCheck(variant) {
    const CASES = {
      drawing: 'if (S.visible || S.isPenDown) VISUAL = true;\n',
      visible: 'if (S.visible) VISUAL = true;\n',
      always: 'VISUAL = true;\n',
    };
    if (P.config.debug) {
      source += '/*visual:' + variant + '*/';
    }
    source += CASES[variant] || CASES.drawing;
  }

  // Forcibly queues something to run
  function forceQueue(id) {
    source += 'forceQueue(' + id + '); return;\n';
  }

  // Queues something to run (TODO: difference from forceQueue)
  function queue(id) {
    source += 'queue(' + id + '); return;\n';
  }

  // Adds a delay
  function delay() {
    source += 'return;\n';
    label();
  }

  // Gets the next label
  function nextLabel() {
    return fns.length + currentTarget.fns.length;
  }

  // Creates and returns a new label for the script's current state
  function label() {
    const id = nextLabel();
    fns.push(source.length);
    if (P.config.debug) {
      source += '/*label:' + id + '*/'
    }
    return id;
  }

  // Sanitizes a string to be used in a javascript string
  // If includeQuotes is true, it will be encapsulated in double quotes.
  function sanitize(thing, includeQuotes) {
    const quote = includeQuotes ? '"' : '';
    if (typeof thing === 'string') {
      return quote + thing
        .replace(/\\/g, '\\\\')
        .replace(/'/g, '\\\'')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\{/g, '\\x7b')
        .replace(/\}/g, '\\x7d') + quote;
    } else if (typeof thing === 'number') {
      return quote + thing.toString() + quote;
    } else {
      return sanitize(thing + '', includeQuotes);
    }
  }

  // Adds JS to wait for a duration.
  // `duration` is a valid compiled JS expression.
  function wait(duration) {
    source += 'save();\n';
    source += 'R.start = self.now;\n';
    source += 'R.duration = ' + duration + ';\n';
    source += 'var first = true;\n';
    const id = label();
    source += 'if (self.now - R.start < R.duration * 1000 || first) {\n';
    source += '  var first;\n';
    forceQueue(id);
    source += '}\n';
    source += 'restore();\n';
  }

  // Returns the runtime object that contains a variable ID.
  function variableScope(id) {
    if (id in currentTarget.stage.vars) {
      return 'self';
    } else {
      return 'S';
    }
  }

  // Returns a reference to a variable with an ID
  function variableReference(id) {
    const scope = variableScope(id);
    return scope + '.vars[' + compileExpression(id) + ']';
  }

  // Returns a reference to a list with a ID
  function listReference(id) {
    if (id in currentTarget.stage.lists) {
      return 'self.lists[' + compileExpression(id) + ']';
    }
    return 'S.lists[' + compileExpression(id) + ']';
  }

  ///
  /// Compiling Functions
  ///

  // Compiles a '#ABCDEF' color
  function convertColor(hexCode) {
    // Just remove the leading # and convert it to a hexadecimal string.
    const hex = hexCode.substr(1);
    // Ensure that the color is actually a hex number and not trying to sneak in some XSS/ACE/RCE/whatever.
    if (/^[0-9a-f]{6}$/g.test(hex)) {
      return '0x' + hex;
    } else {
      return '0';
    }
  }

  // Compiles a native expression (number, string, data) to a JavaScript string
  function compileNative(constant) {
    // Natives are arrays.
    // The first value is the type of the native, see PRIMATIVE_TYPES
    // TODO: use another library instead?
    const type = constant[0];

    switch (type) {
      // These all function as numbers. They are only differentiated so the editor can be more helpful.
      case PRIMATIVE_TYPES.MATH_NUM:
      case PRIMATIVE_TYPES.POSITIVE_NUM:
      case PRIMATIVE_TYPES.WHOLE_NUM:
      case PRIMATIVE_TYPES.INTEGER_NUM:
      case PRIMATIVE_TYPES.ANGLE_NUM:
        return +constant[1];

      case PRIMATIVE_TYPES.TEXT:
        // Text is compiled directly into a string.
        return sanitize(constant[1], true);

      case PRIMATIVE_TYPES.VAR:
        // For variable natives the second item is the name of the variable
        // and the third is the ID of the variable. We only care about the ID.
        return variableReference(constant[2]);

      case PRIMATIVE_TYPES.LIST:
        // See: variable references
        return listReference(constant[2]);

      case PRIMATIVE_TYPES.COLOR_PICKER:
        // Colors are stored as "#123456", so we must do some conversions.
        return convertColor(constant[1]);

      case PRIMATIVE_TYPES.BROADCAST:
        return compileExpression(constant[2]);

      default:
        console.warn('unknown constant', type, constant);
        return '""';
    }
  }

  // Compiles a block and adds it to the source. (Does not return source)
  function compile(block) {
    if (typeof block === 'string') {
      block = blocks[block];
    }
    if (!block) {
      return;
    }
    while (block) {
      const opcode = block.opcode;
      const compiler = statementLibrary[opcode];
      if (!compiler) {
        console.warn('unknown statement', opcode, block);
      } else {
        if (P.config.debug) {
          source += '/*' + opcode + '*/';
        }
        compiler(block);
      }
      block = blocks[block.next];
    }
  }

  // Compiles a substack (script inside of another block)
  function compileSubstack(substack) {
    // Substacks are statements inside of statements.
    // Substacks are a type of input. The first item is ofcourse type, the second is the ID of the child.

    // Substacks are not guarunteed to exist.
    if (!substack) {
      return;
    }

    // TODO: check type?
    // const type = substack[0];

    const id = substack[1];
    compile(id);
  }

  function asType(script, type) {
    if (type === 'string') {
      return '"" + ' + script;
    } else if (type === 'number') {
      return '+' + script;
    } else if (type === 'boolean') {
      return '!!' + script;
    } else {
      return script;
    }
  }

  function fallbackValue(type) {
    if (type === 'string') {
      return '""';
    } else if (type === 'number') {
      return '0';
    } else if (type === 'boolean') {
      return 'false';
    } else {
      return '""';
    }
  }

  // Returns a compiled expression as a JavaScript string.
  function compileExpression(expression, type) {
    // Expressions are also known as inputs.

    if (!expression) {
      return fallbackValue(type);
    }

    // TODO: use asType?
    if (typeof expression === 'string') {
      return sanitize(expression, true);
    }
    if (typeof expression === 'number') {
      return exprssion;
    }

    if (Array.isArray(expression[1])) {
      const native = expression[1];
      return asType(compileNative(native), type);
    }

    const id = expression[1];
    const block = blocks[id];
    if (!block) {
      return fallbackValue(type);
    }
    const opcode = block.opcode;

    const compiler = expressionLibrary[opcode];
    if (!compiler) {
      console.warn('unknown expression', opcode, block);
      return fallbackValue(type);
    }
    let result = compiler(block);
    if (P.config.debug) {
      result = '/*' + opcode + '*/' + result;
    }
    return asType(result, type);
  }

  function compileListener(topBlock) {
    let block = blocks[topBlock.next];
    source = '';

    /*
    block = {
      "opcode": "category_block",
      "next": "id_or_null",
      "parent": "id_or_null",
      "inputs": {},
      "fields": {},
      "shadow": false,
      "topLevel": false
    }
    */

    const topLevelOpCode = topBlock.opcode;
    if (!(topLevelOpCode in topLevelLibrary)) {
      // Since dangling blocks aren't that uncommon, only log warnings if it isn't otherwise recognized.
      if (!(topLevelOpCode in expressionLibrary) && !(topLevelOpCode in statementLibrary)) {
        console.warn('unknown top level block', topLevelOpCode, topBlock);
      }
      return;
    }

    compile(block);

    // Procedure defintions need special care to properly end calls.
    if (topLevelOpCode === 'procedures_definition') {
      source += 'endCall(); return\n';
    }

    return source;
  }

  function compileTarget(target, data) {
    currentTarget = target;
    blocks = data.blocks;
    const topLevelBlocks = Object.values(data.blocks).filter((block) => block.topLevel);

    for (const block of topLevelBlocks) {
      fns = [0];
      const source = compileListener(block);
      const topOpcode = block.opcode;

      if (!source) {
        continue;
      }

      const startFn = currentTarget.fns.length;
      for (var i = 0; i < fns.length; i++) {
        target.fns.push(P.utils.createContinuation(source.slice(fns[i])));
      }
      topLevelLibrary[topOpcode](block, target.fns[startFn]);

      if (P.config.debug) {
        console.log('compiled listener', block.opcode, source, target);
      }
    }
  }

  return {
    compile: compileTarget,
    Procedure: Scratch3Procedure,
    VariableWatcher: Scratch3VariableWatcher,
  };
}());

// Loads Scratch 2 projects
P.sb2 = (function(sb2) {
  sb2.ASSET_URL = 'https://cdn.assets.scratch.mit.edu/internalapi/asset/';
  sb2.SOUNDBANK_URL = 'https://raw.githubusercontent.com/LLK/scratch-flash/v429/src/soundbank/';
  sb2.WAV_FILES = {
    'AcousticGuitar_F3': 'instruments/AcousticGuitar_F3_22k.wav',
    'AcousticPiano_As3': 'instruments/AcousticPiano(5)_A%233_22k.wav',
    'AcousticPiano_C4': 'instruments/AcousticPiano(5)_C4_22k.wav',
    'AcousticPiano_G4': 'instruments/AcousticPiano(5)_G4_22k.wav',
    'AcousticPiano_F5': 'instruments/AcousticPiano(5)_F5_22k.wav',
    'AcousticPiano_C6': 'instruments/AcousticPiano(5)_C6_22k.wav',
    'AcousticPiano_Ds6': 'instruments/AcousticPiano(5)_D%236_22k.wav',
    'AcousticPiano_D7': 'instruments/AcousticPiano(5)_D7_22k.wav',
    'AltoSax_A3': 'instruments/AltoSax_A3_22K.wav',
    'AltoSax_C6': 'instruments/AltoSax(3)_C6_22k.wav',
    'Bassoon_C3': 'instruments/Bassoon_C3_22k.wav',
    'BassTrombone_A2_2': 'instruments/BassTrombone_A2(2)_22k.wav',
    'BassTrombone_A2_3': 'instruments/BassTrombone_A2(3)_22k.wav',
    'Cello_C2': 'instruments/Cello(3b)_C2_22k.wav',
    'Cello_As2': 'instruments/Cello(3)_A%232_22k.wav',
    'Choir_F3': 'instruments/Choir(4)_F3_22k.wav',
    'Choir_F4': 'instruments/Choir(4)_F4_22k.wav',
    'Choir_F5': 'instruments/Choir(4)_F5_22k.wav',
    'Clarinet_C4': 'instruments/Clarinet_C4_22k.wav',
    'ElectricBass_G1': 'instruments/ElectricBass(2)_G1_22k.wav',
    'ElectricGuitar_F3': 'instruments/ElectricGuitar(2)_F3(1)_22k.wav',
    'ElectricPiano_C2': 'instruments/ElectricPiano_C2_22k.wav',
    'ElectricPiano_C4': 'instruments/ElectricPiano_C4_22k.wav',
    'EnglishHorn_D4': 'instruments/EnglishHorn(1)_D4_22k.wav',
    'EnglishHorn_F3': 'instruments/EnglishHorn(1)_F3_22k.wav',
    'Flute_B5_1': 'instruments/Flute(3)_B5(1)_22k.wav',
    'Flute_B5_2': 'instruments/Flute(3)_B5(2)_22k.wav',
    'Marimba_C4': 'instruments/Marimba_C4_22k.wav',
    'MusicBox_C4': 'instruments/MusicBox_C4_22k.wav',
    'Organ_G2': 'instruments/Organ(2)_G2_22k.wav',
    'Pizz_A3': 'instruments/Pizz(2)_A3_22k.wav',
    'Pizz_E4': 'instruments/Pizz(2)_E4_22k.wav',
    'Pizz_G2': 'instruments/Pizz(2)_G2_22k.wav',
    'SteelDrum_D5': 'instruments/SteelDrum_D5_22k.wav',
    'SynthLead_C4': 'instruments/SynthLead(6)_C4_22k.wav',
    'SynthLead_C6': 'instruments/SynthLead(6)_C6_22k.wav',
    'SynthPad_A3': 'instruments/SynthPad(2)_A3_22k.wav',
    'SynthPad_C6': 'instruments/SynthPad(2)_C6_22k.wav',
    'TenorSax_C3': 'instruments/TenorSax(1)_C3_22k.wav',
    'Trombone_B3': 'instruments/Trombone_B3_22k.wav',
    'Trumpet_E5': 'instruments/Trumpet_E5_22k.wav',
    'Vibraphone_C3': 'instruments/Vibraphone_C3_22k.wav',
    'Violin_D4': 'instruments/Violin(2)_D4_22K.wav',
    'Violin_A4': 'instruments/Violin(3)_A4_22k.wav',
    'Violin_E5': 'instruments/Violin(3b)_E5_22k.wav',
    'WoodenFlute_C5': 'instruments/WoodenFlute_C5_22k.wav',
    'BassDrum': 'drums/BassDrum(1b)_22k.wav',
    'Bongo': 'drums/Bongo_22k.wav',
    'Cabasa': 'drums/Cabasa(1)_22k.wav',
    'Clap': 'drums/Clap(1)_22k.wav',
    'Claves': 'drums/Claves(1)_22k.wav',
    'Conga': 'drums/Conga(1)_22k.wav',
    'Cowbell': 'drums/Cowbell(3)_22k.wav',
    'Crash': 'drums/Crash(2)_22k.wav',
    'Cuica': 'drums/Cuica(2)_22k.wav',
    'GuiroLong': 'drums/GuiroLong(1)_22k.wav',
    'GuiroShort': 'drums/GuiroShort(1)_22k.wav',
    'HiHatClosed': 'drums/HiHatClosed(1)_22k.wav',
    'HiHatOpen': 'drums/HiHatOpen(2)_22k.wav',
    'HiHatPedal': 'drums/HiHatPedal(1)_22k.wav',
    'Maracas': 'drums/Maracas(1)_22k.wav',
    'SideStick': 'drums/SideStick(1)_22k.wav',
    'SnareDrum': 'drums/SnareDrum(1)_22k.wav',
    'Tambourine': 'drums/Tambourine(3)_22k.wav',
    'Tom': 'drums/Tom(1)_22k.wav',
    'Triangle': 'drums/Triangle(1)_22k.wav',
    'Vibraslap': 'drums/Vibraslap(1)_22k.wav',
    'WoodBlock': 'drums/WoodBlock(1)_22k.wav'
  };

  class Scratch2VariableWatcher extends P.core.VariableWatcher {
    constructor(stage, targetName, data) {
      super(stage, targetName);

      this.cmd = data.cmd;
      this.type = data.type || 'var';
      if (data.color) {
        var c = (data.color < 0 ? data.color + 0x1000000 : data.color).toString(16);
        this.color = '#000000'.slice(0, -c.length) + c;
      } else {
        this.color = '#ee7d16';
      }

      this.isDiscrete = data.isDiscrete || true;
      this.label = data.label || '';
      this.mode = data.mode || 1;
      this.param = data.param;
      this.sliderMax = data.sliderMax == null ? 100 : data.sliderMax;
      this.sliderMin = data.sliderMin || 0;
      this.targetName = data.target;
      this.visible = data.visible == null ? true : data.visible;
      this.x = data.x || 0;
      this.y = data.y || 0;

      this.el = null;
      this.labelEl = null;
      this.readout = null;
      this.slider = null;
      this.button = null;
    }

    init() {
      super.init();
      if (this.target && this.cmd === 'getVar:') {
        this.target.watchers[this.param] = this;
      }
      if (!this.label) {
        this.label = this.getLabel();
        if (this.target.isSprite) this.label = this.target.objName + ': ' + this.label;
      }
      this.layout();
    }

    getLabel() {
      var WATCHER_LABELS = {
        'costumeIndex': 'costume #',
        'xpos': 'x position',
        'ypos': 'y position',
        'heading': 'direction',
        'scale': 'size',
        'backgroundIndex': 'background #',
        'sceneName': 'background name',
        'tempo': 'tempo',
        'volume': 'volume',
        'answer': 'answer',
        'timer': 'timer',
        'soundLevel': 'loudness',
        'isLoud': 'loud?',
        'xScroll': 'x scroll',
        'yScroll': 'y scroll'
      };
      switch (this.cmd) {
        case 'getVar:': return this.param;
        case 'sensor:': return this.param + ' sensor value';
        case 'sensorPressed': return 'sensor ' + this.param + '?';
        case 'timeAndDate': return this.param;
        case 'senseVideoMotion': return 'video ' + this.param;
      }
      return WATCHER_LABELS[this.cmd] || '';
    }

    setVisible(visible) {
      super.setVisible(visible);
      this.layout();
    }

    update() {
      var value = 0;
      if (!this.target) return;
      switch (this.cmd) {
        case 'answer':
          value = this.stage.answer;
          break;
        case 'backgroundIndex':
          value = this.stage.currentCostumeIndex + 1;
          break;
        case 'costumeIndex':
          value = this.target.currentCostumeIndex + 1;
          break;
        case 'getVar:':
          value = this.target.vars[this.param];
          break;
        case 'heading':
          value = this.target.direction;
          break;
        case 'scale':
          value = this.target.scale * 100;
          break;
        case 'sceneName':
          value = this.stage.getCostumeName();
          break;
        case 'senseVideoMotion':
          // TODO
          break;
        case 'soundLevel':
          // TODO
          break;
        case 'tempo':
          value = this.stage.tempoBPM;
          break;
        case 'timeAndDate':
          value = this.timeAndDate(this.param);
          break;
        case 'timer':
          value = Math.round((this.stage.rightNow() - this.stage.timerStart) / 100) / 10;
          break;
        case 'volume':
          value = this.target.volume * 100;
          break;
        case 'xpos':
          value = this.target.scratchX;
          break;
        case 'ypos':
          value = this.target.scratchY;
          break;
      }
      if (typeof value === 'number' && (value < 0.001 || value > 0.001)) {
        value = Math.round(value * 1000) / 1000;
      }
      this.readout.textContent = '' + value;
      if (this.slider) {
        this.buttonWrap.style.transform = 'translate('+((+value || 0) - this.sliderMin) / (this.sliderMax - this.sliderMin)*100+'%,0)';
      }
    }

    timeAndDate(format) {
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

    layout() {
      if (this.el) {
        this.el.style.display = this.visible ? 'block' : 'none';
        return;
      }
      if (!this.visible) return;

      this.el = document.createElement('div');
      this.el.dataset.watcher = this.stage.allWatchers.indexOf(this);
      this.el.style.whiteSpace = 'pre';
      this.el.style.position = 'absolute';
      this.el.style.left = this.el.style.top = '0';
      this.el.style.transform = 'translate('+(this.x|0)/10+'em,'+(this.y|0)/10+'em)';
      this.el.style.cursor = 'default';
      this.el.style.pointerEvents = 'auto';

      if (this.mode === 2) {
        this.el.appendChild(this.readout = document.createElement('div'));
        this.readout.style.minWidth = (38/15)+'em';
        this.readout.style.font = 'bold 1.5em/'+(19/15)+' sans-serif';
        this.readout.style.height = (19/15)+'em';
        this.readout.style.borderRadius = (4/15)+'em';
        this.readout.style.margin = (3/15)+'em 0 0 0';
        this.readout.style.padding = '0 '+(3/10)+'em';
      } else {
        this.el.appendChild(this.labelEl = document.createElement('div'), this.el.firstChild);
        this.el.appendChild(this.readout = document.createElement('div'));

        this.el.style.border = '.1em solid rgb(148,145,145)';
        this.el.style.borderRadius = '.4em';
        this.el.style.background = 'rgb(193,196,199)';
        this.el.style.padding = '.2em .6em .3em .5em';

        this.labelEl.textContent = this.label;
        // this.labelEl.style.marginTop = (1/11)+'em';
        this.labelEl.style.font = 'bold 1.1em/1 sans-serif';
        this.labelEl.style.display = 'inline-block';

        this.labelEl.style.verticalAlign =
        this.readout.style.verticalAlign = 'middle';

        this.readout.style.minWidth = (37/10)+'em';
        this.readout.style.padding = '0 '+(1/10)+'em';
        this.readout.style.font = 'bold 1.0em/'+(13/10)+' sans-serif';
        this.readout.style.height = (13/10)+'em';
        this.readout.style.borderRadius = (4/10)+'em';
        this.readout.style.marginLeft = (6/10)+'em';
      }
      this.readout.style.color = '#fff';
      var f = 1 / (this.mode === 2 ? 15 : 10);
      this.readout.style.border = f+'em solid #fff';
      this.readout.style.boxShadow = 'inset '+f+'em '+f+'em '+f+'em rgba(0,0,0,.5), inset -'+f+'em -'+f+'em '+f+'em rgba(255,255,255,.5)';
      this.readout.style.textAlign = 'center';
      this.readout.style.background = this.color;
      this.readout.style.display = 'inline-block';

      if (this.mode === 3) {
        this.el.appendChild(this.slider = document.createElement('div'));
        this.slider.appendChild(this.buttonWrap = document.createElement('div'));
        this.buttonWrap.appendChild(this.button = document.createElement('div'));

        this.slider.style.height =
        this.slider.style.borderRadius = '.5em';
        this.slider.style.background = 'rgb(192,192,192)';
        this.slider.style.margin = '.4em 0 .1em';
        this.slider.style.boxShadow = 'inset .125em .125em .125em rgba(0,0,0,.5), inset -.125em -.125em .125em rgba(255,255,255,.5)';
        this.slider.style.position = 'relative';
        this.slider.dataset.slider = '';

        this.slider.style.paddingRight =
        this.button.style.width =
        this.button.style.height =
        this.button.style.borderRadius = '1.1em';
        this.button.style.position = 'absolute';
        this.button.style.left = '0';
        this.button.style.top = '-.3em';
        this.button.style.background = '#fff';
        this.button.style.boxShadow = 'inset .3em .3em .2em -.2em rgba(255,255,255,.9), inset -.3em -.3em .2em -.2em rgba(0,0,0,.9), inset 0 0 0 .1em #777';
        this.button.dataset.button = '';
      }

      this.stage.ui.appendChild(this.el);
    }
  }
  sb2.VariableWatcher = Scratch2VariableWatcher;

  // loads an image from a URL
  sb2.loadImage = function(url) {
    P.IO.progressHooks.new();

    var image = new Image();
    image.crossOrigin = 'anonymous';

    return new Promise((resolve, reject) => {
      image.onload = function() {
        P.IO.progressHooks.end();
        resolve(image);
      };
      image.onerror = function(err) {
        reject('Failed to load image');
      };
      image.src = url;
    });
  };

  // Loads a .sb2 file from an ArrayBuffer containing the .sb2 file
  sb2.loadSB2Project = function(arrayBuffer) {
    return JSZip.loadAsync(arrayBuffer)
      .then((zip) => {
        sb2.zip = zip;
        return zip.file('project.json').async('text');
      })
      .then((text) => {
        const project = P.utils.parseJSONish(text);
        return sb2.loadProject(project);
      });
  };

  // Loads a project on the scratch.mit.edu website from its project.json
  sb2.loadProject = function(data) {
    var children;
    var stage;

    return Promise.all([
      sb2.loadWavs(),
      sb2.loadArray(data.children, sb2.loadObject).then((c) => children = c),
      sb2.loadBase(data, true).then((s) => stage = s),
    ]).then(() => {
      children = children.filter((i) => i);
      children.forEach((c) => c.stage = stage);
      var sprites = children.filter((i) => i instanceof P.core.Sprite);
      var watchers = children.filter((i) => i instanceof Scratch2VariableWatcher);

      stage.children = sprites;
      stage.allWatchers = watchers;
      stage.allWatchers.forEach((w) => w.init());
      stage.updateBackdrop();

      P.sb2.compiler(stage);
      return stage;
    });
  };

  sb2.wavBuffers = {};
  sb2.loadWavs = function() {
    // don't bother attempting to load audio if it can't even be played
    if (!P.audio.context) return Promise.resolve();

    const assets = [];
    for (var name in sb2.wavFiles) {
      if (!sb2.wavBuffers[name]) {
        assets.push(
          sb2.loadWavBuffer(name)
            .then((buffer) => sb2.wavBuffers[name] = buffer)
        );
      }
    }
    return Promise.all(assets);
  };

  sb2.loadWavBuffer = function(name) {
    return P.IO.fetch(sb2.SOUNDBANK_URL + sb2.wavFiles[name])
      .then((request) => request.arrayBuffer())
      .then((arrayBuffer) => P.audio.decodeAudio(arrayBuffer))
      .then((buffer) => sb2.wavBuffers[name] = buffer);
  };

  sb2.loadBase = function(data, isStage) {
    var costumes;
    var sounds;

    return Promise.all([
      sb2.loadArray(data.costumes, sb2.loadCostume).then((c) => costumes = c),
      sb2.loadArray(data.sounds, sb2.loadSound).then((s) => sounds = s),
    ]).then(() => {
      const variables = {};
      if (data.variables) {
        for (const variable of data.variables) {
          if (variable.isPeristent) {
            throw new Error('Cloud variables are not supported');
          }
          variables[variable.name] = variable.value;
        }
      }

      const lists = {};
      if (data.lists) {
        for (const list of data.lists) {
          if (list.isPeristent) {
            throw new Error('Cloud lists are not supported');
          }
          lists[list.listName] = list.contents;
        }
      }

      var object = new (isStage ? P.core.Stage : P.core.Sprite);

      object.name = data.objName;
      object.vars = variables;
      object.lists = lists;
      object.costumes = costumes;
      object.currentCostumeIndex = data.currentCostumeIndex;
      sounds.forEach((sound) => object.addSound(sound));

      if (isStage) {

      } else {
        object.scratchX = data.scratchX;
        object.scratchY = data.scratchY;
        object.direction = data.direction;
        object.isDraggable = data.isDraggable;
        object.indexInLibrary = data.indexInLibrary;
        object.rotationStyle = data.rotationStyle;
        object.scale = data.scale
        object.visible = data.visible;
      }

      // Dirty hack expected by the sb2 compiler, TODO: remove
      object.scripts = data.scripts || [];

      return object;
    });
  };

  // Array.map and Promise.all on steroids
  sb2.loadArray = function(data, process) {
    return Promise.all((data || []).map((i, ind) => process(i, ind)));
  };

  sb2.loadObject = function(data) {
    if (data.cmd) {
      return sb2.loadVariableWatcher(data);
    } else if (data.listName) {
      // list watcher TODO
    } else {
      return sb2.loadBase(data);
    }
  };

  sb2.loadVariableWatcher = function(data) {
    const targetName = data.target;
    return new Scratch2VariableWatcher(null, targetName, data);
  };

  sb2.loadCostume = function(data, index) {
    const promises = [
      sb2.loadMD5(data.baseLayerMD5, data.baseLayerID)
        .then((asset) => data.$image = asset)
    ];
    if (data.textLayerMD5) {
      promises.push(sb2.loadMD5(data.textLayerMD5, data.textLayerID)
        .then((asset) => data.$text = asset));
    }
    return Promise.all(promises)
      .then((layers) => {
        return new P.core.Costume({
          index: index,
          bitmapResolution: data.bitmapResolution,
          name: data.costumeName,
          rotationCenterX: data.rotationCenterX,
          rotationCenterY: data.rotationCenterY,
          layers: layers,
        });
      });
  };

  sb2.loadSound = function(data) {
    return sb2.loadMD5(data.md5, data.soundID, true)
      .then((buffer) => {
        return new P.core.Sound({
          name: data.soundName,
          buffer: buffer,
        });
      });
  };

  sb2.loadSVG = function(source) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(source, 'image/svg+xml');
    var svg = doc.documentElement;
    if (!svg.style) {
      doc = parser.parseFromString('<body>'+source, 'text/html');
      svg = doc.querySelector('svg');
    }
    svg.style.visibility = 'hidden';
    svg.style.position = 'absolute';
    svg.style.left = '-10000px';
    svg.style.top = '-10000px';
    document.body.appendChild(svg);
    var viewBox = svg.viewBox.baseVal;
    if (viewBox && (viewBox.x || viewBox.y)) {
      svg.width.baseVal.value = viewBox.width - viewBox.x;
      svg.height.baseVal.value = viewBox.height - viewBox.y;
      viewBox.x = 0;
      viewBox.y = 0;
      viewBox.width = 0;
      viewBox.height = 0;
    }
    P.utils.patchSVG(svg, svg);
    document.body.removeChild(svg);
    svg.style.visibility = svg.style.position = svg.style.left = svg.style.top = '';

    var canvas = document.createElement('canvas');
    var image = new Image();

    return new Promise((resolve, reject) => {
      canvg(canvas, new XMLSerializer().serializeToString(svg), {
        ignoreMouse: true,
        ignoreAnimation: true,
        ignoreClear: true,
        renderCallback: function() {
          if (canvas.width === 0 || canvas.height === 0) {
            resolve(new Image());
            return;
          }
          image.onload = () => resolve(image);
          image.onerror = (err) => reject('Failed to load SVG');
          image.src = canvas.toDataURL();
        }
      });
    });
  }

  sb2.loadMD5 = function(hash, id, isAudio) {
    if (sb2.zip) {
      var f = isAudio ? sb2.zip.file(id + '.wav') : sb2.zip.file(id + '.gif') || sb2.zip.file(id + '.png') || sb2.zip.file(id + '.jpg') || sb2.zip.file(id + '.svg');
      hash = f.name;
    }

    const ext = hash.split('.').pop();

    if (ext === 'svg') {
      if (sb2.zip) {
        return f.async('text')
          .then((text) => sb2.loadSVG(text));
      } else {
        return P.IO.fetch(sb2.ASSET_URL + hash + '/get/')
          .then((request) => request.text())
          .then((text) => sb2.loadSVG(text));
      }
    } else if (ext === 'wav') {
      if (sb2.zip) {
        return f.async('arrayBuffer')
          .then((buffer) => P.audio.decodeAudio(buffer));
      } else {
        return P.IO.fetch(sb2.ASSET_URL + hash + '/get/')
          .then((request) => request.arrayBuffer())
          .then((buffer) => P.audio.decodeAudio(buffer))
      }
    } else {
      if (sb2.zip) {
        return new Promise((resolve, reject) => {
          var image = new Image();
          image.onload = function() {
            resolve(image);
          };
          const data = f.async('binarystring')
            .then((data) => {
              image.src = 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' + btoa(data);
            });
        });
      } else {
        return sb2.loadImage(sb2.ASSET_URL + hash + '/get/');
      }
    }
  };

  return sb2;
}({}));

// Compiler for .sb2 projects
P.sb2.compiler = (function() {
  var LOG_PRIMITIVES;

  // Implements a Scratch 2 procedure.
  // Scratch 2 argument references just go by index, so its very simple.
  class Scratch2Procedure extends P.core.Procedure {
    call(inputs) {
      return inputs;
    }
  }

  var EVENT_SELECTORS = [
    'procDef',
    'whenClicked',
    'whenCloned',
    'whenGreenFlag',
    'whenIReceive',
    'whenKeyPressed',
    'whenSceneStarts',
    'whenSensorGreaterThan' // TODO
  ];

  var compileScripts = function(object) {
    for (var i = 0; i < object.scripts.length; i++) {
      compileListener(object, object.scripts[i][2]);
    }
  };

  var warnings;
  var warn = function(message) {
    warnings[message] = (warnings[message] || 0) + 1;
  };

  var compileListener = function(object, script) {
    if (!script[0] || EVENT_SELECTORS.indexOf(script[0][0]) === -1) return;

    var nextLabel = function() {
      return object.fns.length + fns.length;
    };

    var label = function() {
      var id = nextLabel();
      fns.push(source.length);
      visual = 0;
      return id;
    };

    var delay = function() {
      source += 'return;\n';
      label();
    };

    var queue = function(id) {
      source += 'queue(' + id + ');\n';
      source += 'return;\n';
    };

    var forceQueue = function(id) {
      source += 'forceQueue(' + id + ');\n';
      source += 'return;\n';
    };

    var seq = function(script) {
      if (!script) return;
      for (var i = 0; i < script.length; i++) {
        compile(script[i]);
      }
    };

    var varRef = function(name) {
      if (typeof name !== 'string') {
        return 'getVars(' + val(name) + ')[' + val(name) + ']';
      }
      var o = object.stage.vars[name] !== undefined ? 'self' : 'S';
      return o + '.vars[' + val(name) + ']';
    };

    var listRef = function(name) {
      if (typeof name !== 'string') {
        return 'getLists(' + val(name) + ')[' + val(name) + ']';
      }
      var o = object.stage.lists[name] !== undefined ? 'self' : 'S';
      if (o === 'S' && !object.lists[name]) {
        object.lists[name] = [];
      }
      return o + '.lists[' + val(name) + ']';
    };

    var param = function(name, usenum, usebool) {
      if (typeof name !== 'string') {
        throw new Error('Dynamic parameters are not supported');
      }

      if (!inputs) return '0';

      var i = inputs.indexOf(name);
      if (i === -1) {
        return '0';
      }

      var t = types[i];
      var kind =
        t === '%n' || t === '%d' || t === '%c' ? 'num' :
        t === '%b' ? 'bool' : '';

      if (kind === 'num' && usenum) {
        used[i] = true;
        return 'C.numargs[' + i + ']';
      }
      if (kind === 'bool' && usebool) {
        used[i] = true;
        return 'C.boolargs[' + i + ']';
      }

      var v = 'C.args[' + i + ']';
      if (usenum) return '(+' + v + ' || 0)';
      if (usebool) return 'bool(' + v + ')';
      return v;
    };

    var val2 = function(e) {
      var v;
      if (e[0] === 'costumeName') {

        return 'S.getCostumeName()';

      } else if (e[0] === 'sceneName') {

        return 'self.getCostumeName()';

      } else if (e[0] === 'readVariable') {

        return varRef(e[1]);

      } else if (e[0] === 'contentsOfList:') {

        return 'contentsOfList(' + listRef(e[1]) + ')';

      } else if (e[0] === 'getLine:ofList:') {

        return 'getLineOfList(' + listRef(e[2]) + ', ' + val(e[1]) + ')';

      } else if (e[0] === 'concatenate:with:') {

        return '("" + ' + val(e[1]) + ' + ' + val(e[2]) + ')';

      } else if (e[0] === 'letter:of:') {

        return '(("" + ' + val(e[2]) + ')[(' + num(e[1]) + ' | 0) - 1] || "")';

      } else if (e[0] === 'answer') { /* Sensing */

        return 'self.answer';

      } else if (e[0] === 'getAttribute:of:') {

        return 'attribute(' + val(e[1]) + ', ' + val(e[2]) + ')';

      } else if (e[0] === 'getUserId') {

        return '0';

      } else if (e[0] === 'getUserName') {

        return '""';

      } else {

        warn('Undefined val: ' + e[0]);

      }
    };

    var val = function(e, usenum, usebool) {
      var v;

      if (typeof e === 'number' || typeof e === 'boolean') {

        return '' + e;

      } else if (typeof e === 'string') {

        return '"' + e
          .replace(/\\/g, '\\\\')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/"/g, '\\"')
          .replace(/\{/g, '\\x7b')
          .replace(/\}/g, '\\x7d') + '"';

      } else if (e[0] === 'getParam') {

        return param(e[1], usenum, usebool);

      } else if ((v = numval(e)) != null || (v = boolval(e)) != null) {

        return v;

      } else {

        v = val2(e);
        if (usenum) return '(+' + v + ' || 0)';
        if (usebool) return 'bool(' + v + ')';
        return v;

      }
    };

    var numval = function(e) {

      if (e[0] === 'xpos') { /* Motion */

        return 'S.scratchX';

      } else if (e[0] === 'ypos') {

        return 'S.scratchY';

      } else if (e[0] === 'heading') {

        return 'S.direction';

      } else if (e[0] === 'costumeIndex') { /* Looks */

        return '(S.currentCostumeIndex + 1)';

      } else if (e[0] === 'backgroundIndex') {

        return '(self.currentCostumeIndex + 1)';

      } else if (e[0] === 'scale') {

        return '(S.scale * 100)';

      } else if (e[0] === 'volume') { /* Sound */

        return '(S.volume * 100)';

      } else if (e[0] === 'tempo') {

        return 'self.tempoBPM';

      } else if (e[0] === 'lineCountOfList:') { /* Data */

        return listRef(e[1]) + '.length';

      } else if (e[0] === '+') { /* Operators */

        return '(' + num(e[1]) + ' + ' + num(e[2]) + ' || 0)';

      } else if (e[0] === '-') {

        return '(' + num(e[1]) + ' - ' + num(e[2]) + ' || 0)';

      } else if (e[0] === '*') {

        return '(' + num(e[1]) + ' * ' + num(e[2]) + ' || 0)';

      } else if (e[0] === '/') {

        return '(' + num(e[1]) + ' / ' + num(e[2]) + ' || 0)';

      } else if (e[0] === 'randomFrom:to:') {

        return 'random(' + num(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e[0] === 'abs') {

        return 'Math.abs(' + num(e[1]) + ')';

      } else if (e[0] === 'sqrt') {

        return 'Math.sqrt(' + num(e[1]) + ')';

      } else if (e[0] === 'stringLength:') {

        return '("" + ' + val(e[1]) + ').length';

      } else if (e[0] === '%' || e[0] === '\\\\') {

        return 'mod(' + num(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e[0] === 'rounded') {

        return 'Math.round(' + num(e[1]) + ')';

      } else if (e[0] === 'computeFunction:of:') {

        if (typeof e[1] !== 'object') {
          switch ('' + e[1]) {
            case 'abs':
              return 'Math.abs(' + num(e[2]) + ')';
            case 'floor':
              return 'Math.floor(' + num(e[2]) + ')';
            case 'sqrt':
              return 'Math.sqrt(' + num(e[2]) + ')';
            case 'ceiling':
              return 'Math.ceil(' + num(e[2]) + ')';
            case 'cos':
              return 'Math.cos(' + num(e[2]) + ' * Math.PI / 180)';
            case 'sin':
              return 'Math.sin(' + num(e[2]) + ' * Math.PI / 180)';
            case 'tan':
              return 'Math.tan(' + num(e[2]) + ' * Math.PI / 180)';
            case 'asin':
              return 'Math.asin(' + num(e[2]) + ') * 180 / Math.PI';
            case 'acos':
              return 'Math.acos(' + num(e[2]) + ') * 180 / Math.PI';
            case 'atan':
              return 'Math.atan(' + num(e[2]) + ') * 180 / Math.PI';
            case 'ln':
              return 'Math.log(' + num(e[2]) + ')';
            case 'log':
              return 'Math.log(' + num(e[2]) + ') / Math.LN10';
            case 'e ^':
              return 'Math.exp(' + num(e[2]) + ')';
            case '10 ^':
              return 'Math.exp(' + num(e[2]) + ' * Math.LN10)';
          }
          return '0';
        }
        return 'mathFunc(' + val(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e[0] === 'mouseX') { /* Sensing */

        return 'self.mouseX';

      } else if (e[0] === 'mouseY') {

        return 'self.mouseY';

      } else if (e[0] === 'timer') {

        return '((self.now - self.timerStart) / 1000)';

      } else if (e[0] === 'distanceTo:') {

        return 'S.distanceTo(' + val(e[1]) + ')';

      // } else if (e[0] === 'soundLevel') {

      } else if (e[0] === 'timestamp') {

        return '((Date.now() - epoch) / 86400000)';

      } else if (e[0] === 'timeAndDate') {

        return 'timeAndDate(' + val(e[1]) + ')';

      // } else if (e[0] === 'sensor:') {

      }
    };

    var DIGIT = /\d/;
    var boolval = function(e) {

      if (e[0] === 'list:contains:') { /* Data */

        return 'listContains(' + listRef(e[1]) + ', ' + val(e[2]) + ')';

      } else if (e[0] === '<' || e[0] === '>') { /* Operators */

        if (typeof e[1] === 'string' && DIGIT.test(e[1]) || typeof e[1] === 'number') {
          var less = e[0] === '<';
          var x = e[1];
          var y = e[2];
        } else if (typeof e[2] === 'string' && DIGIT.test(e[2]) || typeof e[2] === 'number') {
          var less = e[0] === '>';
          var x = e[2];
          var y = e[1];
        }
        var nx = +x;
        if (x == null || nx !== nx) {
          return '(compare(' + val(e[1]) + ', ' + val(e[2]) + ') === ' + (e[0] === '<' ? -1 : 1) + ')';
        }
        return (less ? 'numLess' : 'numGreater') + '(' + nx + ', ' + val(y) + ')';

      } else if (e[0] === '=') {

        if (typeof e[1] === 'string' && DIGIT.test(e[1]) || typeof e[1] === 'number') {
          var x = e[1];
          var y = e[2];
        } else if (typeof e[2] === 'string' && DIGIT.test(e[2]) || typeof e[2] === 'number') {
          var x = e[2];
          var y = e[1];
        }
        var nx = +x;
        if (x == null || nx !== nx) {
          return '(equal(' + val(e[1]) + ', ' + val(e[2]) + '))';
        }
        return '(numEqual(' + nx + ', ' + val(y) + '))';

      } else if (e[0] === '&') {

        return '(' + bool(e[1]) + ' && ' + bool(e[2]) + ')';

      } else if (e[0] === '|') {

        return '(' + bool(e[1]) + ' || ' + bool(e[2]) + ')';

      } else if (e[0] === 'not') {

        return '!' + bool(e[1]) + '';

      } else if (e[0] === 'mousePressed') { /* Sensing */

        return 'self.mousePressed';

      } else if (e[0] === 'touching:') {

        return 'S.touching(' + val(e[1]) + ')';

      } else if (e[0] === 'touchingColor:') {

        return 'S.touchingColor(' + val(e[1]) + ')';

      } else if (e[0] === 'color:sees:') {

        return 'S.colorTouchingColor(' + val(e[1]) + ', ' + val(e[2]) + ')';

      } else if (e[0] === 'keyPressed:') {

        var v = typeof e[1] === 'object' ?
          'P.utils.getKeyCode(' + val(e[1]) + ')' : val(P.utils.getKeyCode(e[1]));
        return '!!self.keys[' + v + ']';

      // } else if (e[0] === 'isLoud') {

      // } else if (e[0] === 'sensorPressed:') {

      }
    };

    var bool = function(e) {
      if (typeof e === 'boolean') {
        return e;
      }
      if (typeof e === 'number' || typeof e === 'string') {
        return +e !== 0 && e !== '' && e !== 'false' && e !== false;
      }
      var v = boolval(e);
      return v != null ? v : val(e, false, true);
    };

    var num = function(e) {
      if (typeof e === 'number') {
        return e || 0;
      }
      if (typeof e === 'boolean' || typeof e === 'string') {
        return +e || 0;
      }
      var v = numval(e);
      return v != null ? v : val(e, true);
    };

    var beatHead = function(dur) {
      source += 'save();\n';
      source += 'R.start = self.now;\n';
      source += 'R.duration = ' + num(dur) + ' * 60 / self.tempoBPM;\n';
      source += 'var first = true;\n';
    };

    var beatTail = function(dur) {
      var id = label();
      source += 'if (self.now - R.start < R.duration * 1000 || first) {\n';
      source += '  var first;\n';
      forceQueue(id);
      source += '}\n';

      source += 'restore();\n';
    };

    var wait = function(dur) {
      source += 'save();\n';
      source += 'R.start = self.now;\n';
      source += 'R.duration = ' + dur + ';\n';
      source += 'var first = true;\n';

      var id = label();
      source += 'if (self.now - R.start < R.duration * 1000 || first) {\n';
      source += '  var first;\n';
      forceQueue(id);
      source += '}\n';

      source += 'restore();\n';
    };

    var noRGB = '';
    noRGB += 'if (S.penCSS) {\n';
    noRGB += '  var hsl = rgb2hsl(S.penColor & 0xffffff);\n';
    noRGB += '  S.penHue = hsl[0];\n';
    noRGB += '  S.penSaturation = hsl[1];\n';
    noRGB += '  S.penLightness = hsl[2];\n';
    noRGB += '  S.penCSS = null;';
    noRGB += '}\n';

    var visual = 0;
    var compile = function(block) {
      if (LOG_PRIMITIVES) {
        source += 'console.log(' + val(block[0]) + ');\n';
      }

      if (['turnRight:', 'turnLeft:', 'heading:', 'pointTowards:', 'setRotationStyle', 'lookLike:', 'nextCostume', 'say:duration:elapsed:from:', 'say:', 'think:duration:elapsed:from:', 'think:', 'changeGraphicEffect:by:', 'setGraphicEffect:to:', 'filterReset', 'changeSizeBy:', 'setSizeTo:', 'comeToFront', 'goBackByLayers:'].indexOf(block[0]) !== -1) {
        if (visual < 2) {
          source += 'if (S.visible) VISUAL = true;\n';
          visual = 2;
        } else if (P.config.debug) source += '/* visual: 2 */\n';
      } else if (['forward:', 'gotoX:y:', 'gotoSpriteOrMouse:', 'changeXposBy:', 'xpos:', 'changeYposBy:', 'ypos:', 'bounceOffEdge', 'glideSecs:toX:y:elapsed:from:'].indexOf(block[0]) !== -1) {
        if (visual < 1) {
          source += 'if (S.visible || S.isPenDown) VISUAL = true;\n';
          visual = 1;
        } else if (P.config.debug) source += '/* visual: 1 */\n';
      } else if (['showBackground:', 'startScene', 'nextBackground', 'nextScene', 'startSceneAndWait', 'show', 'hide', 'putPenDown', 'stampCostume', 'showVariable:', 'hideVariable:', 'doAsk', 'setVolumeTo:', 'changeVolumeBy:', 'setTempoTo:', 'changeTempoBy:'].indexOf(block[0]) !== -1) {
        if (visual < 3) {
          source += 'VISUAL = true;\n';
          visual = 3;
        } else if (P.config.debug) source += '/* visual: 3 */\n';
      }

      if (block[0] === 'forward:') { /* Motion */

        source += 'S.forward(' + num(block[1]) + ');\n';

      } else if (block[0] === 'turnRight:') {

        source += 'S.setDirection(S.direction + ' + num(block[1]) + ');\n';

      } else if (block[0] === 'turnLeft:') {

        source += 'S.setDirection(S.direction - ' + num(block[1]) + ');\n';

      } else if (block[0] === 'heading:') {

        source += 'S.setDirection(' + num(block[1]) + ');\n';

      } else if (block[0] === 'pointTowards:') {

        source += 'S.pointTowards(' + val(block[1]) + ');\n';

      } else if (block[0] === 'gotoX:y:') {

        source += 'S.moveTo(' + num(block[1]) + ', ' + num(block[2]) + ');\n';

      } else if (block[0] === 'gotoSpriteOrMouse:') {

        source += 'S.gotoObject(' + val(block[1]) + ');\n';

      } else if (block[0] === 'changeXposBy:') {

        source += 'S.moveTo(S.scratchX + ' + num(block[1]) + ', S.scratchY);\n';

      } else if (block[0] === 'xpos:') {

        source += 'S.moveTo(' + num(block[1]) + ', S.scratchY);\n';

      } else if (block[0] === 'changeYposBy:') {

        source += 'S.moveTo(S.scratchX, S.scratchY + ' + num(block[1]) + ');\n';

      } else if (block[0] === 'ypos:') {

        source += 'S.moveTo(S.scratchX, ' + num(block[1]) + ');\n';

      } else if (block[0] === 'bounceOffEdge') {

        source += 'S.bounceOffEdge();\n';

      } else if (block[0] === 'setRotationStyle') {

        // TODO: use P.utils.asRotationStyle()?
        source += 'var style = ' + val(block[1]) + ';\n';
        source += 'S.rotationStyle = style === "left-right" ? "leftRight" : style === "don\'t rotate" ? "none" : "normal";\n';

      } else if (block[0] === 'lookLike:') { /* Looks */

        source += 'S.setCostume(' + val(block[1]) + ');\n';

      } else if (block[0] === 'nextCostume') {

        source += 'S.showNextCostume();\n';

      } else if (block[0] === 'showBackground:' ||
                 block[0] === 'startScene') {

        source += 'self.setCostume(' + val(block[1]) + ');\n';
        source += 'var threads = sceneChange();\n';
        source += 'if (threads.indexOf(BASE) !== -1) {return;}\n';

      } else if (block[0] === 'nextBackground' ||
                 block[0] === 'nextScene') {

        source += 'S.showNextCostume();\n';
        source += 'var threads = sceneChange();\n';
        source += 'if (threads.indexOf(BASE) !== -1) {return;}\n';

      } else if (block[0] === 'startSceneAndWait') {

        source += 'save();\n';
        source += 'self.setCostume(' + val(block[1]) + ');\n';
        source += 'R.threads = sceneChange();\n';
        source += 'if (R.threads.indexOf(BASE) !== -1) {return;}\n';
        var id = label();
        source += 'if (!running(R.threads)) {\n';
        forceQueue(id);
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'say:duration:elapsed:from:') {

        source += 'save();\n';
        source += 'R.id = S.say(' + val(block[1]) + ', false);\n';
        source += 'R.start = self.now;\n';
        source += 'R.duration = ' + num(block[2]) + ';\n';

        var id = label();
        source += 'if (self.now - R.start < R.duration * 1000) {\n';
        forceQueue(id);
        source += '}\n';

        source += 'if (S.sayId === R.id) {\n';
        source += '  S.say("");\n';
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'say:') {

        source += 'S.say(' + val(block[1]) + ', false);\n';

      } else if (block[0] === 'think:duration:elapsed:from:') {

        source += 'save();\n';
        source += 'R.id = S.say(' + val(block[1]) + ', true);\n';
        source += 'R.start = self.now;\n';
        source += 'R.duration = ' + num(block[2]) + ';\n';

        var id = label();
        source += 'if (self.now - R.start < R.duration * 1000) {\n';
        forceQueue(id);
        source += '}\n';

        source += 'if (S.sayId === R.id) {\n';
        source += '  S.say("");\n';
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'think:') {

        source += 'S.say(' + val(block[1]) + ', true);\n';

      } else if (block[0] === 'changeGraphicEffect:by:') {

        source += 'S.changeFilter(' + val(block[1]) + ', ' + num(block[2]) + ');\n';

      } else if (block[0] === 'setGraphicEffect:to:') {

        source += 'S.setFilter(' + val(block[1]) + ', ' + num(block[2]) + ');\n';

      } else if (block[0] === 'filterReset') {

        source += 'S.resetFilters();\n';

      } else if (block[0] === 'changeSizeBy:') {

        source += 'var f = S.scale + ' + num(block[1]) + ' / 100;\n';
        source += 'S.scale = f < 0 ? 0 : f;\n';

      } else if (block[0] === 'setSizeTo:') {

        source += 'var f = ' + num(block[1]) + ' / 100;\n';
        source += 'S.scale = f < 0 ? 0 : f;\n';

      } else if (block[0] === 'show') {

        source += 'S.visible = true;\n';
        source += 'if (S.saying) S.updateBubble();\n';

      } else if (block[0] === 'hide') {

        source += 'S.visible = false;\n';
        source += 'if (S.saying) S.updateBubble();\n';

      } else if (block[0] === 'comeToFront') {

        source += 'var i = self.children.indexOf(S);\n';
        source += 'if (i !== -1) self.children.splice(i, 1);\n';
        source += 'self.children.push(S);\n';

      } else if (block[0] === 'goBackByLayers:') {

        source += 'var i = self.children.indexOf(S);\n';
        source += 'if (i !== -1) {\n';
        source += '  self.children.splice(i, 1);\n';
        source += '  self.children.splice(Math.max(0, i - ' + num(block[1]) + '), 0, S);\n';
        source += '}\n';

      // } else if (block[0] === 'setVideoState') {

      // } else if (block[0] === 'setVideoTransparency') {

      } else if (block[0] === 'playSound:') { /* Sound */

        if (P.audio.context) {
          source += 'var sound = S.getSound(' + val(block[1]) + ');\n';
          source += 'if (sound) playSound(sound);\n';
        }

      } else if (block[0] === 'doPlaySoundAndWait') {

        if (P.audio.context) {
          source += 'var sound = S.getSound(' + val(block[1]) + ');\n';
          source += 'if (sound) {\n';
          source += '  playSound(sound);\n';
          wait('sound.duration');
          source += '}\n';
        }

      } else if (block[0] === 'stopAllSounds') {

        if (P.audio.context) {
          source += 'self.stopAllSounds();\n';
        }

      // } else if (block[0] === 'drum:duration:elapsed:from:') {

      } else if (block[0] === 'playDrum') {

        beatHead(block[2]);
        if (P.audio.context) {
          source += 'playSpan(DRUMS[Math.round(' + num(block[1]) + ') - 1] || DRUMS[2], 60, 10);\n';
        }
        beatTail();

      } else if (block[0] === 'rest:elapsed:from:') {

        beatHead(block[1]);
        beatTail();

      } else if (block[0] === 'noteOn:duration:elapsed:from:') {

        beatHead(block[2]);
        if (P.audio.context) {
          source += 'playNote(' + num(block[1]) + ', R.duration);\n';
        }
        beatTail();

      // } else if (block[0] === 'midiInstrument:') {

      } else if (block[0] === 'instrument:') {

        source += 'S.instrument = Math.max(0, Math.min(INSTRUMENTS.length - 1, ' + num(block[1]) + ' - 1)) | 0;';

      } else if (block[0] === 'changeVolumeBy:' || block[0] === 'setVolumeTo:') {

        source += 'S.volume = Math.min(1, Math.max(0, ' + (block[0] === 'changeVolumeBy:' ? 'S.volume + ' : '') + num(block[1]) + ' / 100));\n';
        source += 'if (S.node) S.node.gain.setValueAtTime(S.volume, audioContext.currentTime);\n';
        source += 'for (var sounds = S.sounds, i = sounds.length; i--;) {\n';
        source += '  var sound = sounds[i];\n';
        source += '  if (sound.node && sound.target === S) {\n';
        source += '    sound.node.gain.setValueAtTime(S.volume, audioContext.currentTime);\n';
        source += '  }\n';
        source += '}\n';

      } else if (block[0] === 'changeTempoBy:') {

        source += 'self.tempoBPM += ' + num(block[1]) + ';\n';

      } else if (block[0] === 'setTempoTo:') {

        source += 'self.tempoBPM = ' + num(block[1]) + ';\n';

      } else if (block[0] === 'clearPenTrails') { /* Pen */

        source += 'self.clearPen();\n';

      } else if (block[0] === 'putPenDown') {

        source += 'S.isPenDown = true;\n';
        source += 'S.dotPen();\n';

      } else if (block[0] === 'putPenUp') {

        source += 'S.isPenDown = false;\n';

      } else if (block[0] === 'penColor:') {

        source += 'var c = ' + num(block[1]) + ';\n';
        source += 'S.penColor = c;\n';
        source += 'var a = (c >> 24 & 0xff) / 0xff;\n';
        source += 'S.penCSS = "rgba(" + (c >> 16 & 0xff) + "," + (c >> 8 & 0xff) + "," + (c & 0xff) + ", " + (a || 1) + ")";\n';

      } else if (block[0] === 'setPenHueTo:') {

        source += noRGB;
        source += 'S.penHue = ' + num(block[1]) + ' * 360 / 200;\n';
        source += 'S.penSaturation = 100;\n';

      } else if (block[0] === 'changePenHueBy:') {

        source += noRGB;
        source += 'S.penHue += ' + num(block[1]) + ' * 360 / 200;\n';
        source += 'S.penSaturation = 100;\n';

      } else if (block[0] === 'setPenShadeTo:') {

        source += noRGB;
        source += 'S.penLightness = ' + num(block[1]) + ' % 200;\n';
        source += 'if (S.penLightness < 0) S.penLightness += 200;\n';
        source += 'S.penSaturation = 100;\n';

      } else if (block[0] === 'changePenShadeBy:') {

        source += noRGB;
        source += 'S.penLightness = (S.penLightness + ' + num(block[1]) + ') % 200;\n';
        source += 'if (S.penLightness < 0) S.penLightness += 200;\n';
        source += 'S.penSaturation = 100;\n';

      } else if (block[0] === 'penSize:') {

        source += 'var f = ' + num(block[1]) + ';\n';
        source += 'S.penSize = f < 1 ? 1 : f;\n';

      } else if (block[0] === 'changePenSizeBy:') {

        source += 'var f = S.penSize + ' + num(block[1]) + ';\n';
        source += 'S.penSize = f < 1 ? 1 : f;\n';

      } else if (block[0] === 'stampCostume') {

        source += 'S.stamp();\n';

      } else if (block[0] === 'setVar:to:') { /* Data */

        source += varRef(block[1]) + ' = ' + val(block[2]) + ';\n';

      } else if (block[0] === 'changeVar:by:') {

        var ref = varRef(block[1]);
        source += ref + ' = (+' + ref + ' || 0) + ' + num(block[2]) + ';\n';

      } else if (block[0] === 'append:toList:') {

        source += 'appendToList(' + listRef(block[2]) + ', ' + val(block[1]) + ');\n';

      } else if (block[0] === 'deleteLine:ofList:') {

        source += 'deleteLineOfList(' + listRef(block[2]) + ', ' + val(block[1]) + ');\n';

      } else if (block[0] === 'insert:at:ofList:') {

        source += 'insertInList(' + listRef(block[3]) + ', ' + val(block[2]) + ', '+ val(block[1]) + ');\n';

      } else if (block[0] === 'setLine:ofList:to:') {

        source += 'setLineOfList(' + listRef(block[2]) + ', ' + val(block[1]) + ', '+ val(block[3]) + ');\n';

      } else if (block[0] === 'showVariable:' || block[0] === 'hideVariable:') {

        var isShow = block[0] === 'showVariable:';
        if (typeof block[1] !== 'string') {
          throw new Error('Dynamic variables are not supported');
        }
        var o = object.vars[block[1]] !== undefined ? 'S' : 'self';
        source += o + '.showVariable(' + val(block[1]) + ', ' + isShow + ');\n';

      // } else if (block[0] === 'showList:') {

      // } else if (block[0] === 'hideList:') {

      } else if (block[0] === 'broadcast:') { /* Control */

        source += 'var threads = broadcast(' + val(block[1]) + ');\n';
        source += 'if (threads.indexOf(BASE) !== -1) {return;}\n';

      } else if (block[0] === 'call') {

        if (P.config.debug && block[1] === 'phosphorus: debug') {
          source += 'debugger;\n';
        } else {
          source += 'call(S.procedures[' + val(block[1]) + '], ' + nextLabel() + ', [';
          for (var i = 2; i < block.length; i++) {
            if (i > 2) {
              source += ', ';
            }
            source += val(block[i]);
          }
          source += ']);\n';
          delay();
        }

      } else if (block[0] === 'doBroadcastAndWait') {

        source += 'save();\n';
        source += 'R.threads = broadcast(' + val(block[1]) + ');\n';
        source += 'if (R.threads.indexOf(BASE) !== -1) {return;}\n';
        var id = label();
        source += 'if (running(R.threads)) {\n';
        forceQueue(id);
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'doForever') {

        var id = label();
        seq(block[1]);
        forceQueue(id);

      } else if (block[0] === 'doForeverIf') {

        var id = label();

        source += 'if (' + bool(block[1]) + ') {\n';
        seq(block[2]);
        source += '}\n';

        forceQueue(id);

      // } else if (block[0] === 'doForLoop') {

      } else if (block[0] === 'doIf') {

        source += 'if (' + bool(block[1]) + ') {\n';
        seq(block[2]);
        source += '}\n';

      } else if (block[0] === 'doIfElse') {

        source += 'if (' + bool(block[1]) + ') {\n';
        seq(block[2]);
        source += '} else {\n';
        seq(block[3]);
        source += '}\n';

      } else if (block[0] === 'doRepeat') {

        source += 'save();\n';
        source += 'R.count = ' + num(block[1]) + ';\n';

        var id = label();

        source += 'if (R.count >= 0.5) {\n';
        source += '  R.count -= 1;\n';
        seq(block[2]);
        queue(id);
        source += '} else {\n';
        source += '  restore();\n';
        source += '}\n';

      } else if (block[0] === 'doReturn') {

        source += 'endCall();\n';
        source += 'return;\n';

      } else if (block[0] === 'doUntil') {

        var id = label();
        source += 'if (!' + bool(block[1]) + ') {\n';
        seq(block[2]);
        queue(id);
        source += '}\n';

      } else if (block[0] === 'doWhile') {

        var id = label();
        source += 'if (' + bool(block[1]) + ') {\n';
        seq(block[2]);
        queue(id);
        source += '}\n';

      } else if (block[0] === 'doWaitUntil') {

        var id = label();
        source += 'if (!' + bool(block[1]) + ') {\n';
        queue(id);
        source += '}\n';

      } else if (block[0] === 'glideSecs:toX:y:elapsed:from:') {

        source += 'save();\n';
        source += 'R.start = self.now;\n';
        source += 'R.duration = ' + num(block[1]) + ';\n';
        source += 'R.baseX = S.scratchX;\n';
        source += 'R.baseY = S.scratchY;\n';
        source += 'R.deltaX = ' + num(block[2]) + ' - S.scratchX;\n';
        source += 'R.deltaY = ' + num(block[3]) + ' - S.scratchY;\n';

        var id = label();
        source += 'var f = (self.now - R.start) / (R.duration * 1000);\n';
        source += 'if (f > 1) f = 1;\n';
        source += 'S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);\n';

        source += 'if (f < 1) {\n';
        forceQueue(id);
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'stopAll') {

        source += 'self.stopAll();\n';
        source += 'return;\n';

      } else if (block[0] === 'stopScripts') {

        source += 'switch (' + val(block[1]) + ') {\n';
        source += '  case "all":\n';
        source += '    self.stopAll();\n';
        source += '    return;\n';
        source += '  case "this script":\n';
        source += '    endCall();\n';
        source += '    return;\n';
        source += '  case "other scripts in sprite":\n';
        source += '  case "other scripts in stage":\n';
        source += '    for (var i = 0; i < self.queue.length; i++) {\n';
        source += '      if (i !== THREAD && self.queue[i] && self.queue[i].sprite === S) {\n';
        source += '        self.queue[i] = undefined;\n';
        source += '      }\n';
        source += '    }\n';
        source += '    break;\n';
        source += '}\n';

      } else if (block[0] === 'wait:elapsed:from:') {

        wait(num(block[1]));

      } else if (block[0] === 'warpSpeed') {

        source += 'WARP++;\n';
        seq(block[1]);
        source += 'WARP--;\n';

      } else if (block[0] === 'createCloneOf') {

        source += 'clone(' + val(block[1]) + ');\n';

      } else if (block[0] === 'deleteClone') {

        source += 'if (S.isClone) {\n';
        source += '  S.remove();\n';
        source += '  var i = self.children.indexOf(S);\n';
        source += '  if (i !== -1) self.children.splice(i, 1);\n';
        source += '  for (var i = 0; i < self.queue.length; i++) {\n';
        source += '    if (self.queue[i] && self.queue[i].sprite === S) {\n';
        source += '      self.queue[i] = undefined;\n';
        source += '    }\n';
        source += '  }\n';
        source += '  return;\n';
        source += '}\n';

      } else if (block[0] === 'doAsk') { /* Sensing */

        source += 'R.id = self.nextPromptId++;\n';

        var id = label();
        source += 'if (self.promptId < R.id) {\n';
        forceQueue(id);
        source += '}\n';

        source += 'S.ask(' + val(block[1]) + ');\n';

        var id = label();
        source += 'if (self.promptId === R.id) {\n';
        forceQueue(id);
        source += '}\n';

      } else if (block[0] === 'timerReset') {

        source += 'self.timerStart = self.now;\n';

      } else {

        warn('Undefined command: ' + block[0]);

      }
    };

    var source = '';
    var startfn = object.fns.length;
    var fns = [0];

    if (script[0][0] === 'procDef') {
      var inputs = script[0][2];
      var types = script[0][1].match(/%[snmdcb]/g) || [];
      var used = [];
    }

    for (var i = 1; i < script.length; i++) {
      compile(script[i]);
    }

    if (script[0][0] === 'procDef') {
      var pre = '';
      for (var i = types.length; i--;) if (used[i]) {
        var t = types[i];
        if (t === '%d' || t === '%n' || t === '%c') {
          pre += 'C.numargs[' + i + '] = +C.args[' + i + '] || 0;\n';
        } else if (t === '%b') {
          pre += 'C.boolargs[' + i + '] = bool(C.args[' + i + ']);\n';
        }
      }
      source = pre + source;
      for (var i = 1, l = fns.length; i < l; ++i) {
        fns[i] += pre.length;
      }
      source += 'endCall();\n';
      source += 'return;\n';
    }

    for (var i = 0; i < fns.length; i++) {
      object.fns.push(P.utils.createContinuation(source.slice(fns[i])));
    }

    var f = object.fns[startfn];

    if (script[0][0] === 'whenClicked') {
      object.listeners.whenClicked.push(f);
    } else if (script[0][0] === 'whenGreenFlag') {
      object.listeners.whenGreenFlag.push(f);
    } else if (script[0][0] === 'whenCloned') {
      object.listeners.whenCloned.push(f);
    } else if (script[0][0] === 'whenIReceive') {
      var key = script[0][1].toLowerCase();
      (object.listeners.whenIReceive[key] || (object.listeners.whenIReceive[key] = [])).push(f);
    } else if (script[0][0] === 'whenKeyPressed') {
      if (script[0][1] === 'any') {
        for (var i = 128; i--;) {
          object.listeners.whenKeyPressed[i].push(f);
        }
      } else {
        object.listeners.whenKeyPressed[P.utils.getKeyCode(script[0][1])].push(f);
      }
    } else if (script[0][0] === 'whenSceneStarts') {
      var key = script[0][1].toLowerCase();
      (object.listeners.whenSceneStarts[key] || (object.listeners.whenSceneStarts[key] = [])).push(f);
    } else if (script[0][0] === 'procDef') {
      const warp = script[0][4];
      object.procedures[script[0][1]] = new Scratch2Procedure(f, warp, inputs);
    } else {
      warn('Undefined event: ' + script[0][0]);
    }

    if (P.config.debug) {
      console.log('compiled scratch 2 script', source);
    }
  };

  return function(stage) {
    warnings = Object.create(null);

    compileScripts(stage);
    for (var i = 0; i < stage.children.length; i++) {
      compileScripts(stage.children[i]);
    }

    for (var key in warnings) {
      console.warn(key + (warnings[key] > 1 ? ' (repeated ' + warnings[key] + ' times)' : ''));
    }
  };
}());

// Related to playing or decoding sounds
P.audio = (function(audio) {
  if (window.AudioContext) {
    audio.context = new AudioContext();
  } else {
    audio.context = null;
  }

  const ADPCM_STEPS = [
    7, 8, 9, 10, 11, 12, 13, 14, 16, 17,
    19, 21, 23, 25, 28, 31, 34, 37, 41, 45,
    50, 55, 60, 66, 73, 80, 88, 97, 107, 118,
    130, 143, 157, 173, 190, 209, 230, 253, 279, 307,
    337, 371, 408, 449, 494, 544, 598, 658, 724, 796,
    876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066,
    2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358,
    5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
    15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767
  ];
  const ADPCM_INDEX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];

  audio.decodeADPCMAudio = function(ab, cb) {
    var dv = new DataView(ab);
    if (dv.getUint32(0) !== 0x52494646 || dv.getUint32(8) !== 0x57415645) {
      return cb(new Error('Unrecognized audio format'));
    }

    var blocks = {};
    var i = 12, l = dv.byteLength - 8;
    while (i < l) {
      blocks[String.fromCharCode(
        dv.getUint8(i),
        dv.getUint8(i + 1),
        dv.getUint8(i + 2),
        dv.getUint8(i + 3))] = i;
      i += 8 + dv.getUint32(i + 4, true);
    }

    var format        = dv.getUint16(20, true);
    var channels      = dv.getUint16(22, true);
    var sampleRate    = dv.getUint32(24, true);
    var byteRate      = dv.getUint32(28, true);
    var blockAlign    = dv.getUint16(32, true);
    var bitsPerSample = dv.getUint16(34, true);

    if (format === 17) {
      var samplesPerBlock = dv.getUint16(38, true);
      var blockSize = ((samplesPerBlock - 1) / 2) + 4;

      var frameCount = dv.getUint32(blocks.fact + 8, true);

      var buffer = P.audio.context.createBuffer(1, frameCount, sampleRate);
      var channel = buffer.getChannelData(0);

      var sample, index = 0;
      var step, code, delta;
      var lastByte = -1;

      var offset = blocks.data + 8;
      i = offset;
      var j = 0;
      while (true) {
        if ((((i - offset) % blockSize) == 0) && (lastByte < 0)) {
          if (i >= dv.byteLength) break;
          sample = dv.getInt16(i, true); i += 2;
          index = dv.getUint8(i); i += 1;
          i++;
          if (index > 88) index = 88;
          channel[j++] = sample / 32767;
        } else {
          if (lastByte < 0) {
            if (i >= dv.byteLength) break;
            lastByte = dv.getUint8(i); i += 1;
            code = lastByte & 0xf;
          } else {
            code = (lastByte >> 4) & 0xf;
            lastByte = -1;
          }
          step = ADPCM_STEPS[index];
          delta = 0;
          if (code & 4) delta += step;
          if (code & 2) delta += step >> 1;
          if (code & 1) delta += step >> 2;
          delta += step >> 3;
          index += ADPCM_INDEX[code];
          if (index > 88) index = 88;
          if (index < 0) index = 0;
          sample += (code & 8) ? -delta : delta;
          if (sample > 32767) sample = 32767;
          if (sample < -32768) sample = -32768;
          channel[j++] = sample / 32768;
        }
      }
      return cb(null, buffer);
    }
    cb(new Error('Unrecognized WAV format ' + format));
  };

  audio.decodeAudio = function(ab) {
    if (!audio.context) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // Attempt to decode it as ADPCM audio
      audio.decodeADPCMAudio(ab, function(err, buffer) {
        if (buffer) {
          resolve(buffer);
          return;
        }
        // Hope that the audio context will know what to do
        return audio.context.decodeAudioData(ab)
          .then((buffer) => resolve(buffer));
      });
    });
  };

  return audio;
}({}));

// The phosphorus Scratch runtime
// Provides methods expected at runtime by scripts created by the compiler and an environment for Scratch scripts to run
P.runtime = (function() {
  // The runtime is really weird and hard to understand.
  // The upside: it's fast as hell.

  // Global variables expected by scripts at runtime:

  // The stage object
  var self;
  // Current sprite or stage
  var S;
  // Used for resuming state
  var R;
  // Stack of states (??)
  var STACK;
  // Current procedure call, if any
  var C;
  // If level of layers of "Run without screen refresh" we are in
  // Each subsequent procedure call will increment and decrement as they start and stop.
  var WARP;
  // ??
  var CALLS;
  // ??
  var BASE;
  // ??
  var THREAD;
  // ??
  var IMMEDIATE;
  // Has a "visual change" been made?
  var VISUAL;

  // Converts a value to its boolean equivalent
  var bool = function(v) {
    return +v !== 0 && v !== '' && v !== 'false' && v !== false;
  };

  var DIGIT = /\d/;
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

  var equal = function(x, y) {
    if ((typeof x === 'number' || DIGIT.test(x)) && (typeof y === 'number' || DIGIT.test(y))) {
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
  var numEqual = function(nx, y) {
    if (typeof y === 'number' || DIGIT.test(y)) {
      var ny = +y;
      return ny === ny && nx === ny;
    }
    return false;
  };

  var mod = function(x, y) {
    var r = x % y;
    if (r / y < 0) {
      r += y;
    }
    return r;
  };

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

  var rgb2hsl = function(rgb) {
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

  var clone = function(name) {
    var parent = name === '_myself_' ? S : self.getObject(name);
    var c = parent.clone();
    self.children.splice(self.children.indexOf(parent), 0, c);
    self.triggerFor(c, 'whenCloned');
  };

  var epoch = Date.UTC(2000, 0, 1);

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
    var o = self.getObject(objName);
    if (!o) return 0;
    if (o.isSprite) {
      switch (attr) {
        case 'x position': return o.scratchX;
        case 'y position': return o.scratchY;
        case 'direction': return o.direction;
        case 'costume #': return o.currentCostumeIndex + 1;
        case 'costume name': return o.costumes[o.currentCostumeIndex].name;
        case 'size': return o.scale * 100;
        case 'volume': return 0; // TODO
      }
    } else {
      switch (attr) {
        case 'background #':
        case 'backdrop #': return o.currentCostumeIndex + 1;
        case 'backdrop name': return o.costumes[o.currentCostumeIndex].name;
        case 'volume': return 0; // TODO
      }
    }
    var value = o.vars[attr];
    if (value !== undefined) {
      return value;
    }
    return 0;
  };

  var VOLUME = 0.3;

  var audioContext = P.audio.context;
  if (audioContext) {
    // TODO: move wavBuffers to IO
    var wavBuffers = P.sb2.wavBuffers;

    var volumeNode = audioContext.createGain();
    volumeNode.gain.value = VOLUME;
    volumeNode.connect(audioContext.destination);

    var playNote = function(id, duration) {
      var spans = INSTRUMENTS[S.instrument];
      for (var i = 0, l = spans.length; i < l; i++) {
        var span = spans[i];
        if (span.top >= id || span.top === 128) break;
      }
      playSpan(span, Math.max(0, Math.min(127, id)), duration);
    };

    var playSpan = function(span, id, duration) {
      if (!S.node) {
        S.node = audioContext.createGain();
        S.node.gain.value = S.volume;
        S.node.connect(volumeNode);
      }

      var source = audioContext.createBufferSource();
      var note = audioContext.createGain();
      var buffer = wavBuffers[span.name];
      if (!buffer) return;

      source.buffer = buffer;
      if (source.loop = span.loop) {
        source.loopStart = span.loopStart;
        source.loopEnd = span.loopEnd;
      }

      source.connect(note);
      note.connect(S.node);

      var time = audioContext.currentTime;
      source.playbackRate.value = Math.pow(2, (id - 69) / 12) / span.baseRatio;

      var gain = note.gain;
      gain.value = 0;
      gain.setValueAtTime(0, time);
      if (span.attackEnd < duration) {
        gain.linearRampToValueAtTime(1, time + span.attackEnd);
        if (span.decayTime > 0 && span.holdEnd < duration) {
          gain.linearRampToValueAtTime(1, time + span.holdEnd);
          if (span.decayEnd < duration) {
            gain.linearRampToValueAtTime(0, time + span.decayEnd);
          } else {
            gain.linearRampToValueAtTime(1 - (duration - holdEnd) / span.decayTime, time + duration);
          }
        } else {
          gain.linearRampToValueAtTime(1, time + duration);
        }
      } else {
        gain.linearRampToValueAtTime(1, time + duration);
      }
      gain.linearRampToValueAtTime(0, time + duration + 0.02267573696);

      source.start(time);
      source.stop(time + duration + 0.02267573696);
    };

    var playSound = function(sound) {
      if (!sound.buffer) return;
      if (!sound.node) {
        sound.node = audioContext.createGain();
        sound.node.gain.value = S.volume;
        sound.node.connect(volumeNode);
      }
      sound.target = S;
      sound.node.gain.setValueAtTime(S.volume, audioContext.currentTime);

      if (sound.source) {
        sound.source.disconnect();
      }
      sound.source = audioContext.createBufferSource();
      sound.source.buffer = sound.buffer;
      sound.source.connect(sound.node);

      sound.source.start(audioContext.currentTime);
    };
  }

  var save = function() {
    STACK.push(R);
    R = {};
  };

  var restore = function() {
    R = STACK.pop();
  };

  var call = function(procedure, id, values) {
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
            var recursive = true;
            break;
          }
        }
        if (recursive) {
          self.queue[THREAD] = {
            sprite: S,
            base: BASE,
            fn: procedure.fn,
            calls: CALLS
          };
        } else {
          IMMEDIATE = procedure.fn;
        }
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
    return self.trigger('whenSceneStarts', self.costumes[self.currentCostumeIndex].name);
  };

  var broadcast = function(name) {
    return self.trigger('whenIReceive', name);
  };

  var running = function(bases) {
    for (var j = 0; j < self.queue.length; j++) {
      if (self.queue[j] && bases.indexOf(self.queue[j].base) !== -1) return true;
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
    self.queue[THREAD] = {
      sprite: S,
      base: BASE,
      fn: S.fns[id],
      calls: CALLS
    };
  };

  // Extend the stage with new methods related to running the project.

  P.core.Stage.prototype.initRuntime = function() {
    this.queue = [];
    this.onError = this.onError.bind(this);
  };

  P.core.Stage.prototype.startThread = function(sprite, base) {
    var thread = {
      sprite: sprite,
      base: base,
      fn: base,
      calls: [{args: [], stack: [{}]}]
    };
    for (var i = 0; i < this.queue.length; i++) {
      var q = this.queue[i];
      if (q && q.sprite === sprite && q.base === base) {
        this.queue[i] = thread;
        return;
      }
    }
    this.queue.push(thread);
  };

  P.core.Stage.prototype.triggerFor = function(sprite, event, arg) {
    var threads;
    if (event === 'whenClicked') {
      threads = sprite.listeners.whenClicked;
    } else if (event === 'whenCloned') {
      threads = sprite.listeners.whenCloned;
    } else if (event === 'whenGreenFlag') {
      threads = sprite.listeners.whenGreenFlag;
    } else if (event === 'whenIReceive') {
      // Scratch 2 compiler uses case insensitive broadcast names
      // while scratch 3 compiler currently uses case sensitive IDs (to change)
      arg = arg.toString();
      threads = sprite.listeners.whenIReceive[arg] || sprite.listeners.whenIReceive[arg.toLowerCase()];
    } else if (event === 'whenKeyPressed') {
      threads = sprite.listeners.whenKeyPressed[arg];
    } else if (event === 'whenSceneStarts') {
      threads = sprite.listeners.whenSceneStarts[('' + arg).toLowerCase()];
    }
    if (threads) {
      for (var i = 0; i < threads.length; i++) {
        this.startThread(sprite, threads[i]);
      }
    }
    return threads || [];
  };

  P.core.Stage.prototype.trigger = function(event, arg) {
    var threads = [];
    for (var i = this.children.length; i--;) {
      threads = threads.concat(this.triggerFor(this.children[i], event, arg));
    }
    return threads.concat(this.triggerFor(this, event, arg));
  };

  P.core.Stage.prototype.triggerGreenFlag = function() {
    this.timerStart = this.rightNow();
    this.trigger('whenGreenFlag');
  };

  P.core.Stage.prototype.start = function() {
    this.isRunning = true;
    if (this.interval) return;
    addEventListener('error', this.onError);
    this.baseTime = Date.now();
    this.interval = setInterval(this.step.bind(this), 1000 / P.config.framerate);
    if (audioContext) audioContext.resume();
  };

  P.core.Stage.prototype.pause = function() {
    if (this.interval) {
      this.baseNow = this.rightNow();
      clearInterval(this.interval);
      delete this.interval;
      removeEventListener('error', this.onError);
      if (audioContext) audioContext.suspend();
    }
    this.isRunning = false;
  };

  P.core.Stage.prototype.stopAll = function() {
    this.hidePrompt = false;
    this.prompter.style.display = 'none';
    this.promptId = this.nextPromptId = 0;
    this.queue.length = 0;
    this.resetFilters();
    this.stopSounds();
    for (var i = 0; i < this.children.length; i++) {
      var c = this.children[i];
      if (c.isClone) {
        c.remove();
        this.children.splice(i, 1);
        i -= 1;
      } else {
        c.resetFilters();
        if (c.saying) c.say('');
        c.stopSounds();
      }
    }
  };

  P.core.Stage.prototype.rightNow = function() {
    return this.baseNow + Date.now() - this.baseTime;
  };

  P.core.Stage.prototype.step = function() {
    self = this;
    VISUAL = false;
    var start = Date.now();
    do {
      var queue = this.queue;
      this.now = this.rightNow();
      for (THREAD = 0; THREAD < queue.length; THREAD++) {
        if (queue[THREAD]) {
          S = queue[THREAD].sprite;
          IMMEDIATE = queue[THREAD].fn;
          BASE = queue[THREAD].base;
          CALLS = queue[THREAD].calls;
          C = CALLS.pop();
          STACK = C.stack;
          R = STACK.pop();
          queue[THREAD] = undefined;
          WARP = 0;
          while (IMMEDIATE) {
            var fn = IMMEDIATE;
            IMMEDIATE = null;
            // if (P.config.debug) {
            //   console.log('running', fn);
            // }
            fn();
          }
          STACK.push(R);
          CALLS.push(C);
        }
      }
      for (var i = queue.length; i--;) {
        if (!queue[i]) queue.splice(i, 1);
      }
    } while ((self.isTurbo || !VISUAL) && Date.now() - start < 1000 / P.config.framerate && queue.length);
    this.draw();
    S = null;
  };

  P.core.Stage.prototype.onError = function(e) {
    this.handleError(e.error);
    clearInterval(this.interval);
  };

  P.core.Stage.prototype.handleError = function(e) {
    console.error(e);
  };

  /*
    copy(JSON.stringify(instruments.map(function(g) {
      return g.map(function(r) {
        var attackTime = r[5] ? r[5][0] * 0.001 : 0;
        var holdTime = r[5] ? r[5][1] * 0.001 : 0;
        var decayTime = r[5] ? r[5][2] : 0;
        var baseRatio = Math.pow(2, (r[2] - 69) / 12);
        if (r[3] !== -1) {
          var length = r[4] - r[3];
          baseRatio = 22050 * Math.round(length * 440 * baseRatio / 22050) / length / 440;
        }
        return {
          top: r[0],
          name: r[1],
          baseRatio: baseRatio,
          loop: r[3] !== -1,
          loopStart: r[3] / 22050,
          loopEnd: r[4] / 22050,
          attackEnd: attackTime,
          holdEnd: attackTime + holdTime,
          decayEnd: attackTime + holdTime + decayTime
        }
      })
    }))
  */
  // TODO: generate these big arrays at runtime?
  var INSTRUMENTS = [
    [
      {top:38,name:'AcousticPiano_As3',baseRatio:0.5316313272700484,loop:true,loopStart:0.465578231292517,loopEnd:0.7733786848072562,attackEnd:0,holdEnd:0.1,decayEnd:22.1},
      {top:44,name:'AcousticPiano_C4',baseRatio:0.5905141892259927,loop:true,loopStart:0.6334693877551021,loopEnd:0.8605442176870748,attackEnd:0,holdEnd:0.1,decayEnd:20.1},
      {top:51,name:'AcousticPiano_G4',baseRatio:0.8843582887700535,loop:true,loopStart:0.5532879818594104,loopEnd:0.5609977324263039,attackEnd:0,holdEnd:0.08,decayEnd:18.08},
      {top:62,name:'AcousticPiano_C6',baseRatio:2.3557692307692304,loop:true,loopStart:0.5914739229024943,loopEnd:0.6020861678004535,attackEnd:0,holdEnd:0.08,decayEnd:16.08},
      {top:70,name:'AcousticPiano_F5',baseRatio:1.5776515151515151,loop:true,loopStart:0.5634920634920635,loopEnd:0.5879818594104308,attackEnd:0,holdEnd:0.04,decayEnd:14.04},
      {top:77,name:'AcousticPiano_Ds6',baseRatio:2.800762112139358,loop:true,loopStart:0.560907029478458,loopEnd:0.5836281179138322,attackEnd:0,holdEnd:0.02,decayEnd:10.02},
      {top:85,name:'AcousticPiano_Ds6',baseRatio:2.800762112139358,loop:true,loopStart:0.560907029478458,loopEnd:0.5836281179138322,attackEnd:0,holdEnd:0,decayEnd:8},
      {top:90,name:'AcousticPiano_Ds6',baseRatio:2.800762112139358,loop:true,loopStart:0.560907029478458,loopEnd:0.5836281179138322,attackEnd:0,holdEnd:0,decayEnd:6},
      {top:96,name:'AcousticPiano_D7',baseRatio:5.275119617224881,loop:true,loopStart:0.3380498866213152,loopEnd:0.34494331065759637,attackEnd:0,holdEnd:0,decayEnd:3},
      {top:128,name:'AcousticPiano_D7',baseRatio:5.275119617224881,loop:true,loopStart:0.3380498866213152,loopEnd:0.34494331065759637,attackEnd:0,holdEnd:0,decayEnd:2}
    ], [
      {top:48,name:'ElectricPiano_C2',baseRatio:0.14870515241435123,loop:true,loopStart:0.6956009070294784,loopEnd:0.7873015873015873,attackEnd:0,holdEnd:0.08,decayEnd:10.08},
      {top:74,name:'ElectricPiano_C4',baseRatio:0.5945685670261941,loop:true,loopStart:0.5181859410430839,loopEnd:0.5449433106575964,attackEnd:0,holdEnd:0.04,decayEnd:8.04},
      {top:128,name:'ElectricPiano_C4',baseRatio:0.5945685670261941,loop:true,loopStart:0.5181859410430839,loopEnd:0.5449433106575964,attackEnd:0,holdEnd:0,decayEnd:6}
    ], [
      {top:128,name:'Organ_G2',baseRatio:0.22283731584620914,loop:true,loopStart:0.05922902494331066,loopEnd:0.1510204081632653,attackEnd:0,holdEnd:0,decayEnd:0}
    ],[{top:40,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:15},
      {top:56,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:13.5},
      {top:60,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:12},
      {top:67,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:8.5},
      {top:72,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:7},
      {top:83,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:5.5},
      {top:128,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:4.5}
    ], [
      {top:40,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358,attackEnd:0,holdEnd:0,decayEnd:15},
      {top:56,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:13.5},
      {top:60,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:12},
      {top:67,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:8.5},
      {top:72,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:7},
      {top:83,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:5.5},
      {top:128,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:4.5}
    ], [
      {top:34,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:17},
      {top:48,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:14},
      {top:64,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:12},
      {top:128,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:10}
    ], [
      {top:38,name:'Pizz_G2',baseRatio:0.21979665071770335,loop:true,loopStart:0.3879365079365079,loopEnd:0.3982766439909297,attackEnd:0,holdEnd:0,decayEnd:5},
      {top:45,name:'Pizz_G2',baseRatio:0.21979665071770335,loop:true,loopStart:0.3879365079365079,loopEnd:0.3982766439909297,attackEnd:0,holdEnd:0.012,decayEnd:4.012},
      {top:56,name:'Pizz_A3',baseRatio:0.503654636820466,loop:true,loopStart:0.5197278911564626,loopEnd:0.5287528344671202,attackEnd:0,holdEnd:0,decayEnd:4},
      {top:64,name:'Pizz_A3',baseRatio:0.503654636820466,loop:true,loopStart:0.5197278911564626,loopEnd:0.5287528344671202,attackEnd:0,holdEnd:0,decayEnd:3.2},
      {top:72,name:'Pizz_E4',baseRatio:0.7479647218453188,loop:true,loopStart:0.7947845804988662,loopEnd:0.7978231292517007,attackEnd:0,holdEnd:0,decayEnd:2.8},
      {top:80,name:'Pizz_E4',baseRatio:0.7479647218453188,loop:true,loopStart:0.7947845804988662,loopEnd:0.7978231292517007,attackEnd:0,holdEnd:0,decayEnd:2.2},
      {top:128,name:'Pizz_E4',baseRatio:0.7479647218453188,loop:true,loopStart:0.7947845804988662,loopEnd:0.7978231292517007,attackEnd:0,holdEnd:0,decayEnd:1.5}
    ], [
      {top:41,name:'Cello_C2',baseRatio:0.14870515241435123,loop:true,loopStart:0.3876643990929705,loopEnd:0.40294784580498866,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:52,name:'Cello_As2',baseRatio:0.263755980861244,loop:true,loopStart:0.3385487528344671,loopEnd:0.35578231292517004,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:62,name:'Violin_D4',baseRatio:0.6664047388781432,loop:true,loopStart:0.48108843537414964,loopEnd:0.5151927437641723,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:75,name:'Violin_A4',baseRatio:0.987460815047022,loop:true,loopStart:0.14108843537414967,loopEnd:0.15029478458049886,attackEnd:0.07,holdEnd:0.07,decayEnd:0.07},
      {top:128,name:'Violin_E5',baseRatio:1.4885238523852387,loop:true,loopStart:0.10807256235827664,loopEnd:0.1126530612244898,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:30,name:'BassTrombone_A2_3',baseRatio:0.24981872564125807,loop:true,loopStart:0.061541950113378686,loopEnd:0.10702947845804989,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:40,name:'BassTrombone_A2_2',baseRatio:0.24981872564125807,loop:true,loopStart:0.08585034013605441,loopEnd:0.13133786848072562,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:55,name:'Trombone_B3',baseRatio:0.5608240680183126,loop:true,loopStart:0.12,loopEnd:0.17673469387755103,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:88,name:'Trombone_B3',baseRatio:0.5608240680183126,loop:true,loopStart:0.12,loopEnd:0.17673469387755103,attackEnd:0.05,holdEnd:0.05,decayEnd:0.05},
      {top:128,name:'Trumpet_E5',baseRatio:1.4959294436906376,loop:true,loopStart:0.1307936507936508,loopEnd:0.14294784580498865,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:128,name:'Clarinet_C4',baseRatio:0.5940193965517241,loop:true,loopStart:0.6594104308390023,loopEnd:0.7014965986394558,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:40,name:'TenorSax_C3',baseRatio:0.2971698113207547,loop:true,loopStart:0.4053968253968254,loopEnd:0.4895238095238095,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:50,name:'TenorSax_C3',baseRatio:0.2971698113207547,loop:true,loopStart:0.4053968253968254,loopEnd:0.4895238095238095,attackEnd:0.02,holdEnd:0.02,decayEnd:0.02},
      {top:59,name:'TenorSax_C3',baseRatio:0.2971698113207547,loop:true,loopStart:0.4053968253968254,loopEnd:0.4895238095238095,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},
      {top:67,name:'AltoSax_A3',baseRatio:0.49814747876378096,loop:true,loopStart:0.3875736961451247,loopEnd:0.4103854875283447,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:75,name:'AltoSax_A3',baseRatio:0.49814747876378096,loop:true,loopStart:0.3875736961451247,loopEnd:0.4103854875283447,attackEnd:0.02,holdEnd:0.02,decayEnd:0.02},
      {top:80,name:'AltoSax_A3',baseRatio:0.49814747876378096,loop:true,loopStart:0.3875736961451247,loopEnd:0.4103854875283447,attackEnd:0.02,holdEnd:0.02,decayEnd:0.02},
      {top:128,name:'AltoSax_C6',baseRatio:2.3782742681047764,loop:true,loopStart:0.05705215419501134,loopEnd:0.0838095238095238,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:61,name:'Flute_B5_2',baseRatio:2.255113636363636,loop:true,loopStart:0.08430839002267573,loopEnd:0.10244897959183673,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:128,name:'Flute_B5_1',baseRatio:2.255113636363636,loop:true,loopStart:0.10965986394557824,loopEnd:0.12780045351473923,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:128,name:'WoodenFlute_C5',baseRatio:1.1892952324548416,loop:true,loopStart:0.5181859410430839,loopEnd:0.7131065759637188,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:57,name:'Bassoon_C3',baseRatio:0.29700969827586204,loop:true,loopStart:0.11011337868480725,loopEnd:0.19428571428571428,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:67,name:'Bassoon_C3',baseRatio:0.29700969827586204,loop:true,loopStart:0.11011337868480725,loopEnd:0.19428571428571428,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},
      {top:76,name:'Bassoon_C3',baseRatio:0.29700969827586204,loop:true,loopStart:0.11011337868480725,loopEnd:0.19428571428571428,attackEnd:0.08,holdEnd:0.08,decayEnd:0.08},
      {top:84,name:'EnglishHorn_F3',baseRatio:0.39601293103448276,loop:true,loopStart:0.341859410430839,loopEnd:0.4049886621315193,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},
      {top:128,name:'EnglishHorn_D4',baseRatio:0.6699684005833739,loop:true,loopStart:0.22027210884353743,loopEnd:0.23723356009070296,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:39,name:'Choir_F3',baseRatio:0.3968814788643197,loop:true,loopStart:0.6352380952380953,loopEnd:1.8721541950113378,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:50,name:'Choir_F3',baseRatio:0.3968814788643197,loop:true,loopStart:0.6352380952380953,loopEnd:1.8721541950113378,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},
      {top:61,name:'Choir_F3',baseRatio:0.3968814788643197,loop:true,loopStart:0.6352380952380953,loopEnd:1.8721541950113378,attackEnd:0.06,holdEnd:0.06,decayEnd:0.06},
      {top:72,name:'Choir_F4',baseRatio:0.7928898424161845,loop:true,loopStart:0.7415419501133786,loopEnd:2.1059410430839,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:128,name:'Choir_F5',baseRatio:1.5879576065654504,loop:true,loopStart:0.836281179138322,loopEnd:2.0585487528344673,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:38,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.1,decayEnd:8.1},
      {top:48,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.1,decayEnd:7.6},
      {top:59,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.06,decayEnd:7.06},
      {top:70,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.04,decayEnd:6.04},
      {top:78,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.02,decayEnd:5.02},
      {top:86,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0,decayEnd:4},
      {top:128,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0,decayEnd:3}
    ], [
      {top:128,name:'MusicBox_C4',baseRatio:0.5937634640241276,loop:true,loopStart:0.6475283446712018,loopEnd:0.6666666666666666,attackEnd:0,holdEnd:0,decayEnd:2}
    ], [
      {top:128,name:'SteelDrum_D5',baseRatio:1.3660402567543959,loop:false,loopStart:-0.000045351473922902495,loopEnd:-0.000045351473922902495,attackEnd:0,holdEnd:0,decayEnd:2}
    ],[
      {top:128,name:'Marimba_C4',baseRatio:0.5946035575013605,loop:false,loopStart:-0.000045351473922902495,loopEnd:-0.000045351473922902495,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:80,name:'SynthLead_C4',baseRatio:0.5942328422565577,loop:true,loopStart:0.006122448979591836,loopEnd:0.06349206349206349,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:128,name:'SynthLead_C6',baseRatio:2.3760775862068964,loop:true,loopStart:0.005623582766439909,loopEnd:0.01614512471655329,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:38,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.05,holdEnd:0.05,decayEnd:0.05},
      {top:50,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.08,holdEnd:0.08,decayEnd:0.08},
      {top:62,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.11,holdEnd:0.11,decayEnd:0.11},
      {top:74,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.15,holdEnd:0.15,decayEnd:0.15},
      {top:86,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.2,holdEnd:0.2,decayEnd:0.2},
      {top:128,name:'SynthPad_C6',baseRatio:2.3820424708835755,loop:true,loopStart:0.11678004535147392,loopEnd:0.41732426303854875,attackEnd:0,holdEnd:0,decayEnd:0}
    ]
  ];

  /*
    copy(JSON.stringify(drums.map(function(d) {
      var decayTime = d[4] || 0;
      var baseRatio = Math.pow(2, (60 - d[1] - 69) / 12);
      if (d[2]) {
        var length = d[3] - d[2];
        baseRatio = 22050 * Math.round(length * 440 * baseRatio / 22050) / length / 440;
      }
      return {
        name: d[0],
        baseRatio: baseRatio,
        loop: !!d[2],
        loopStart: d[2] / 22050,
        loopEnd: d[3] / 22050,
        attackEnd: 0,
        holdEnd: 0,
        decayEnd: decayTime
      }
    }))
  */
  var DRUMS = [
    {name:'SnareDrum',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Tom',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'SideStick',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Crash',baseRatio:0.8908987181403393,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'HiHatOpen',baseRatio:0.9438743126816935,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'HiHatClosed',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Tambourine',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Clap',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Claves',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'WoodBlock',baseRatio:0.7491535384383408,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Cowbell',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Triangle',baseRatio:0.8514452780229479,loop:true,loopStart:0.7638548752834468,loopEnd:0.7825396825396825,attackEnd:0,holdEnd:0,decayEnd:2},
    {name:'Bongo',baseRatio:0.5297315471796477,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Conga',baseRatio:0.7954545454545454,loop:true,loopStart:0.1926077097505669,loopEnd:0.20403628117913833,attackEnd:0,holdEnd:0,decayEnd:2},
    {name:'Cabasa',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'GuiroLong',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Vibraslap',baseRatio:0.8408964152537145,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Cuica',baseRatio:0.7937005259840998,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0}
  ];

  // Evaluated JavaScript within the scope of the runtime.
  function scopedEval(source) {
    return eval(source);
  }

  return {
    scopedEval: scopedEval,
  };
}());
