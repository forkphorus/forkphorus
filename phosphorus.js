var P = (function() {
  'use strict';

  var hasOwnProperty = {}.hasOwnProperty;

  var hasTouchEvents = 'ontouchstart' in document;

  var inherits = function(cla, sup) {
    cla.prototype = Object.create(sup.prototype);
    cla.parent = sup;
    cla.base = function(self, method /*, args... */) {
      return sup.prototype[method].call(self, [].slice.call(arguments, 2));
    };
  };

  var addEvents = function(cla /*, events... */) {
    [].slice.call(arguments, 1).forEach(function(event) {
      addEvent(cla, event);
    });
  };

  var addEvent = function(cla, event) {
    var capital = event[0].toUpperCase() + event.substr(1);

    cla.prototype.addEventListener = cla.prototype.addEventListener || function(event, listener) {
      var listeners = this['$' + event] = this['$' + event] || [];
      listeners.push(listener);
      return this;
    };

    cla.prototype.removeEventListener = cla.prototype.removeEventListener || function(event, listener) {
      var listeners = this['$' + event];
      if (listeners) {
        var i = listeners.indexOf(listener);
        if (i > -1) {
          listeners.splice(i, 1);
        }
      }
      return this;
    };

    cla.prototype.dispatchEvent = cla.prototype.dispatchEvent || function(event, arg) {
      var listeners = this['$' + event];
      if (listeners) {
        listeners.forEach(function(listener) {
          listener(arg);
        });
      }
      var listener = this['on' + event];
      if (listener) {
        listener(arg);
      }
      return this;
    };

    cla.prototype['on' + capital] = function(listener) {
      this.addEventListener(event, listener);
      return this;
    };

    cla.prototype['dispatch' + capital] = function(arg) {
      this.dispatchEvent(event, arg);
      return this;
    };
  };

  var Request = function() {
    this.loaded = 0;
  };
  addEvents(Request, 'load', 'progress', 'error');

  Request.prototype.progress = function(loaded, total, lengthComputable) {
    this.loaded = loaded;
    this.total = total;
    this.lengthComputable = lengthComputable;
    this.dispatchProgress({
      loaded: loaded,
      total: total,
      lengthComputable: lengthComputable
    });
  };

  Request.prototype.load = function(result) {
    this.result = result;
    this.isDone = true;
    this.dispatchLoad(result);
  };

  Request.prototype.error = function(error) {
    this.result = error;
    this.isError = true;
    this.isDone = true;
    this.dispatchError(error);
  };

  var CompositeRequest = function() {
    this.requests = [];
    this.isDone = true;
    this.update = this.update.bind(this);
    this.error = this.error.bind(this);
  };
  inherits(CompositeRequest, Request);

  CompositeRequest.prototype.add = function(request) {
    if (request instanceof CompositeRequest) {
      for (var i = 0; i < request.requests.length; i++) {
        this.add(request.requests[i]);
      }
    } else {
      this.requests.push(request);
      request.addEventListener('progress', this.update);
      request.addEventListener('load', this.update);
      request.addEventListener('error', this.error);
      this.update();
    }
  };

  CompositeRequest.prototype.update = function() {
    if (this.isError) return;
    var requests = this.requests;
    var i = requests.length;
    var total = 0;
    var loaded = 0;
    var lengthComputable = true;
    var uncomputable = 0;
    var done = 0;
    while (i--) {
      var r = requests[i];
      loaded += r.loaded;
      if (r.isDone) {
        total += r.loaded;
        done += 1;
      } else if (r.lengthComputable) {
        total += r.total;
      } else {
        lengthComputable = false;
        uncomputable += 1;
      }
    }
    if (!lengthComputable && uncomputable !== requests.length) {
      var each = total / (requests.length - uncomputable) * uncomputable;
      i = requests.length;
      total = 0;
      loaded = 0;
      lengthComputable = true;
      while (i--) {
        var r = requests[i];
        if (r.lengthComputable) {
          loaded += r.loaded;
          total += r.total;
        } else {
          total += each;
          if (r.isDone) loaded += each;
        }
      }
    }
    this.progress(loaded, total, lengthComputable);
    this.doneCount = done;
    this.isDone = done === requests.length;
    if (this.isDone && !this.defer) {
      this.load(this.getResult());
    }
  };

  CompositeRequest.prototype.getResult = function() {
    throw new Error('Users must implement getResult()');
  };

  var IO = {};

  IO.PROJECT_URL = 'http://projects.scratch.mit.edu/internalapi/project/';
  IO.ASSET_URL = 'http://scratch.mit.edu/internalapi/asset/';

  IO.PROXY_URL = 'proxy.php?u=';

  IO.FONTS = {
    '': 'Helvetica',
    'Donegal': 'Donegal One',
    'Gloria': 'Gloria Hallelujah',
    'Marker': 'Permanent Marker',
    'Mystery': 'Mystery Quest'
  };

  IO.init = function(request) {
    IO.projectRequest = request;
    IO.zip = null;
  };

  IO.parseJSONish = function(json) {
    if (/[^,:{}\[\]0-9\.\-+EINaefilnr-uy \n\r\t]/.test(json.replace(/"(\\.|[^"\\])*"/g, ''))) {
      throw new SyntaxError('Bad JSON');
    }
    return (1, eval)('(' + json + ')');
  };

  IO.load = function(url, callback, self, type) {
    var request = new Request;
    var xhr = new XMLHttpRequest;
    xhr.open('GET', IO.PROXY_URL + encodeURIComponent(url), true);
    xhr.onprogress = function(e) {
      request.progress(e.loaded, e.total, e.lengthComputable);
    };
    xhr.onload = function() {
      if (xhr.status === 200) {
        request.load(xhr.response);
      } else {
        request.error(new Error('HTTP ' + xhr.status + ': ' + xhr.statusText));
      }
    };
    xhr.onerror = function() {
      request.error(new Error('XHR Error'));
    };
    xhr.responseType = type;
    setTimeout(xhr.send.bind(xhr));

    if (callback) request.onLoad(callback.bind(self));
    return request;
  };

  IO.loadImage = function(url, callback, self) {
    var request = new Request;
    var image = new Image;
    image.src = url;
    image.onload = function() {
      request.load(image);
    };
    image.onerror = function() {
      request.error(new Error('Failed to load image: ' + url));
    };
    if (callback) request.onLoad(callback.bind(self));
    return request;
  };

  IO.loadScratchr2Project = function(id, callback, self) {
    var request = new CompositeRequest;
    IO.init(request);

    request.defer = true;
    var url = IO.PROJECT_URL + id + '/get/?' + Math.random().toString().slice(2);
    request.add(IO.load(url).onLoad(function(contents) {
      try {
        var json = IO.parseJSONish(contents);
      } catch (e) {
        request.add(IO.load(url, null, null, 'arraybuffer').onLoad(function(ab) {
          var request2 = new Request;
          request.add(request2);
          request.add(IO.loadSB2Project(ab, function(stage) {
            request.getResult = function() {
              return stage;
            };
            request2.load();
          }));
          request.defer = false;
        }));
        return;
      }
      try {
        IO.loadProject(json);
        if (callback) request.onLoad(callback.bind(self));
        if (request.isDone) {
          request.load(new Stage().fromJSON(json));
        } else {
          request.defer = false;
          request.getResult = function() {
            return new Stage().fromJSON(json);
          };
        }
      } catch (e) {
        request.error(e);
      }
    }));

    return request;
  };

  IO.loadScratchr2ProjectTitle = function(id, callback, self) {
    var request = new CompositeRequest;

    request.defer = true;
    request.add(P.IO.load('http://scratch.mit.edu/projects/' + id + '/').onLoad(function(data) {
      var m = /<title>\s*(.+?)(\s+on\s+Scratch)?\s*<\/title>/.exec(data);
      if (callback) request.onLoad(callback.bind(self));
      if (m) {
        var d = document.createElement('div');
        d.innerHTML = m[1];
        request.load(d.innerText);
      } else {
        request.error(new Error('No title'));
      }
    }));

    return request;
  };

  IO.loadJSONProject = function(json, callback, self) {
    var request = new CompositeRequest;
    IO.init(request);

    try {
      IO.loadProject(json);
      if (callback) request.onLoad(callback.bind(self));
      if (request.isDone) {
        request.load(new Stage().fromJSON(json));
      } else {
        request.defer = false;
        request.getResult = function() {
          return new Stage().fromJSON(json);
        };
      }
    } catch (e) {
      request.error(e);
    }

    return request;
  };

  IO.loadSB2Project = function(ab, callback, self) {
    var request = new CompositeRequest;
    IO.init(request);

    try {
      IO.zip = new JSZip(ab);
      var json = IO.parseJSONish(IO.zip.file('project.json').asText());

      IO.loadProject(json);
      if (callback) request.onLoad(callback.bind(self));
      if (request.isDone) {
        request.load(new Stage().fromJSON(json));
      } else {
        request.defer = false;
        request.getResult = function() {
          return new Stage().fromJSON(json);
        };
      }
    } catch (e) {
      request.error(e);
    }

    return request;
  };

  IO.loadSB2File = function(f, callback, self) {
    var cr = new CompositeRequest;
    cr.defer = true;
    var request = new Request;
    cr.add(request);
    var reader = new FileReader;
    reader.onloadend = function() {
      cr.defer = true;
      cr.add(IO.loadSB2Project(reader.result, function(result) {
        cr.defer = false;
        cr.getResult = function() {
          return result;
        };
        cr.update();
      }));
      request.load();
    };
    reader.onprogress = function(e) {
      request.progress(e.loaded, e.total, e.lengthComputable);
    };
    reader.readAsArrayBuffer(f);
    if (callback) cr.onLoad(callback.bind(self));
    return cr;
  };

  IO.loadProject = function(data) {
    IO.loadArray(data.children, IO.loadObject);
    IO.loadBase(data);
  };

  IO.loadBase = function(data) {
    data.scripts = data.scripts || [];
    data.costumes = IO.loadArray(data.costumes, IO.loadCostume);
    data.sounds = IO.loadArray(data.sounds, IO.loadSound);
    data.variables = data.variables || [];
    data.lists = data.lists || [];
  };

  IO.loadArray = function(data, process) {
    if (!data) return [];
    for (var i = 0; i < data.length; i++) {
      process(data[i]);
    }
    return data;
  };

  IO.loadObject = function(data) {
    if (!data.cmd && !data.listName) {
      IO.loadBase(data);
    }
  };

  IO.loadCostume = function(data) {
    IO.loadMD5(data.baseLayerMD5, data.baseLayerID, function(asset) {
      data.$image = asset;
    });
    if (data.textLayerMD5) {
      IO.loadMD5(data.textLayerMD5, data.textLayerID, function(asset) {
        data.$text = asset;
      });
    }
  };

  IO.loadSound = function() {
    // TODO
  };

  IO.fixSVG = function(svg, element) {
    if (element.nodeType !== 1) return;
    if (element.nodeName == 'text') {
      var font = IO.FONTS[element.getAttribute('font-family') || ''];
      if (font) {
        element.setAttribute('font-family', font);
      }
      if (!element.getAttribute('font-size')) {
        element.setAttribute('font-size', 18);
      }
      var bb = element.getBBox();
      element.setAttribute('y', (element.getAttribute('y') - bb.y) * 1.1);
      element.setAttribute('x', 4 - .6 * element.transform.baseVal.consolidate().matrix.a);
      // svg.style.cssText = '';
      // console.log(element.textContent, 'data:image/svg+xml;base64,' + btoa(svg.outerHTML));
    } else if ((element.hasAttribute('x') || element.hasAttribute('y')) && element.hasAttribute('transform')) {
      element.setAttribute('x', 0);
      element.setAttribute('y', 0);
    }
    [].forEach.call(element.childNodes, IO.fixSVG.bind(null, svg));
  };

  IO.loadMD5 = function(md5, id, callback) {
    var ext = md5.split('.').pop();
    if (ext === 'svg') {
      var cb = function(source) {
        var div = document.createElement('div');
        div.innerHTML = source;
        var svg = div.getElementsByTagName('svg')[0];
        svg.style.visibility = 'hidden';
        svg.style.position = 'absolute';
        svg.style.left = '-10000px';
        svg.style.top = '-10000px';
        document.body.appendChild(svg);
        var viewBox = svg.viewBox.baseVal;
        if (viewBox.x || viewBox.y) {
          viewBox.x = 0;
          viewBox.y = 0;
          viewBox.width = 0;
          viewBox.height = 0;
        }
        IO.fixSVG(svg, svg);
        while (div.firstChild) div.removeChild(div.lastChild);
        div.appendChild(svg);
        svg.style.visibility = 'visible';

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var image = new Image;
        callback(image);
        // console.log(md5, 'data:image/svg+xml;base64,' + btoa(div.innerHTML.trim()));
        canvg(canvas, div.innerHTML.trim(), {
          ignoreMouse: true,
          ignoreAnimation: true,
          ignoreClear: true,
          renderCallback: function() {
            image.src = canvas.toDataURL();
          }
        })
      };
      if (IO.zip) {
        cb(IO.zip.file(id + '.svg').asText());
      } else {
        IO.projectRequest.add(IO.load(IO.ASSET_URL + md5 + '/get/', cb));
      }
    } else {
      if (IO.zip) {
        var request = new Request;
        var f = IO.zip.file(id + '.' + ext).asBinary();
        var image = new Image;
        image.onload = function() {
          if (callback) callback(image);
          request.load();
        };
        image.src = 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' + btoa(f);
        IO.projectRequest.add(request);
      } else {
        IO.projectRequest.add(
          IO.loadImage(IO.PROXY_URL + encodeURIComponent(IO.ASSET_URL + md5 + '/get/'), function(result) {
            callback(result);
          }));
      }
    }
  };

  var Base = function() {
    this.isClone = false;
    this.costumes = [];
    this.currentCostumeIndex = 0;
    this.objName = '';
    this.sounds = [];

    this.varRefs = {};
    this.listRefs = {};

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
    for (var i = 0; i < 256; i++) {
      this.listeners.whenKeyPressed.push([]);
    }
    this.fns = [];
    this.scripts = [];

    this.filters = {
      color: 0,
      fisheye: 0,
      whirl: 0,
      pixelate: 0,
      mosaic: 0,
      brightness: 0,
      ghost: 0
    };

    this.initRuntime();
  };

  Base.prototype.fromJSON = function(data) {
    this.objName = data.objName;
    this.scripts = data.scripts;
    this.currentCostumeIndex = data.currentCostumeIndex || 0;
    this.costumes = data.costumes.map(function(d) {
      return new Costume(d);
    });
    // this.sounds = data.sounds.map(function(d) {
    //   return new Sound(d);
    // });
    this.addLists(this.lists = data.lists);
    this.addVariables(this.variables = data.variables);

    return this;
  };

  Base.prototype.addVariables = function(variables) {
    for (var i = 0; i < variables.length; i++) {
      if (variables[i].isPeristent) {
        throw new Error('Cloud variables are not supported');
      }
      this.varRefs[variables[i].name] = variables[i];
    }
  };

  Base.prototype.addLists = function(lists) {
    for (var i = 0; i < lists.length; i++) {
      if (lists[i].isPeristent) {
        throw new Error('Cloud lists are not supported');
      }
      this.listRefs[lists[i].listName] = lists[i];
      // TODO list watchers
    }
  };

  Base.prototype.showNextCostume = function() {
    this.currentCostumeIndex = (this.currentCostumeIndex + 1) % this.costumes.length;
    if (this.saying) this.updateBubble();
  };

  Base.prototype.showPreviousCostume = function() {
    var length = this.costumes.length;
    this.currentCostumeIndex = (this.currentCostumeIndex + length - 1) % length;
    if (this.saying) this.updateBubble();
  };

  Base.prototype.getCostumeName = function() {
    return this.costumes[this.currentCostumeIndex] ? this.costumes[this.currentCostumeIndex].costumeName : '';
  };

  Base.prototype.setCostume = function(costume) {
    if (typeof costume !== 'number') {
      costume = '' + costume;
      for (var i = 0; i < this.costumes.length; i++) {
        if (this.costumes[i].costumeName === costume) {
          this.currentCostumeIndex = i;
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
    i = (Math.floor(Number(costume)) - 1 || 0) % this.costumes.length;
    if (i < 0) i += this.costumes.length;
    this.currentCostumeIndex = i;
    if (this.saying) this.updateBubble();
  };

  Base.prototype.setFilter = function(name, value) {
    var min = 0;
    var max = 100;
    switch (name) {
      case 'whirl':
      case 'fisheye':
      case 'pixelate': // absolute value
      case 'mosaic': // absolute value
        min = -Infinity;
        max = Infinity;
        break;
      case 'color':
        value = value % 200;
        if (value < 0) value += 200;
        max = 200;
        break;
    }
    if (value < min) value = min;
    if (value > max) value = max;
    this.filters[name] = value;
  };

  Base.prototype.changeFilter = function(name, value) {
    this.setFilter(name, this.filters[name] + value);
  };

  Base.prototype.resetFilters = function() {
    this.filters = {
      color: 0,
      fisheye: 0,
      whirl: 0,
      pixelate: 0,
      mosaic: 0,
      brightness: 0,
      ghost: 0
    };
  };

  Base.prototype.ask = function(question) {
    var stage = this.stage;
    if (question) {
      if (this.isSprite && this.visible) {
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
  };

  var Stage = function() {
    this.stage = this;

    Stage.parent.call(this);

    this.children = [];
    this.defaultWatcherX = 10;
    this.defaultWatcherY = 10;

    this.info = {};
    this.answer = '';
    this.promptId = 0;
    this.nextPromptId = 0;
    this.tempoBPM = 60;
    this.videoAlpha = 1;
    this.zoom = 1;
    this.maxZoom = 1;
    this.baseNow = 0;
    this.baseTime = 0;
    this.timerStart = 0;
    this.cloneCount = 0;

    this.keys = {};
    this.rawMouseX = 0;
    this.rawMouseY = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mousePressed = false;

    this.penCanvas = document.createElement('canvas');
    this.penCanvas.width = 480;
    this.penCanvas.height = 360;
    this.penContext = this.penCanvas.getContext('2d');

    this.root = document.createElement('div');
    this.root.style.position = 'absolute';
    this.root.style.overflow = 'hidden';
    this.root.style.width = '480px';
    this.root.style.height = '360px';
    this.root.style.fontSize = '1px';
    this.root.style.WebkitUserSelect =
    this.root.style.MozUserSelect =
    this.root.style.MSUserSelect =
    this.root.style.WebkitUserSelect = 'none';

    this.canvas = document.createElement('canvas');
    this.root.appendChild(this.canvas);
    this.canvas.width = 480;
    this.canvas.height = 360;
    this.context = this.canvas.getContext('2d');

    this.canvas.tabIndex = 0;
    this.canvas.style.outline = 'none';
    this.canvas.style.position = 'absolute';
    this.canvas.style.background = '#fff';

    // hardware acceleration
    this.canvas.style.WebkitTransform = 'translateZ(0)';

    this.canvas.addEventListener('keydown', function(e) {
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }
      this.keys[e.keyCode] = true;
      this.trigger('whenKeyPressed', e.keyCode);
      e.stopPropagation();
      e.preventDefault();
    }.bind(this));

    this.canvas.addEventListener('keyup', function(e) {
      this.keys[e.keyCode] = false;
      e.stopPropagation();
      e.preventDefault();
    }.bind(this));

    if (hasTouchEvents) {

      document.addEventListener('touchstart', function(e) {
        this.mousePressed = true;
        for (var i = 0; i < e.changedTouches.length; i++) {
          this.updateMouse(e.changedTouches[i]);
          if (e.target === this.canvas) {
            this.clickMouse();
          }
        }
        if (e.target === this.canvas) e.preventDefault();
      }.bind(this));

      document.addEventListener('touchmove', function(e) {
        this.updateMouse(e.changedTouches[0]);
      }.bind(this));

      document.addEventListener('touchend', function(e) {
        this.releaseMouse();
      }.bind(this));

    } else {

      document.addEventListener('mousedown', function(e) {
        this.updateMouse(e);
        this.mousePressed = true;

        if (e.target === this.canvas) {
          this.clickMouse();
          e.preventDefault();
          this.canvas.focus();
        }
      }.bind(this));

      document.addEventListener('mousemove', function(e) {
        this.updateMouse(e);
      }.bind(this));

      document.addEventListener('mouseup', function(e) {
        this.updateMouse(e);
        this.releaseMouse();
      }.bind(this));
    }

    this.prompter = document.createElement('div');
    this.root.appendChild(this.prompter);
    this.prompter.style.position = 'absolute';
    this.prompter.style.left =
    this.prompter.style.right = '14em';
    this.prompter.style.bottom = '6em';
    this.prompter.style.padding = '5em 30em 5em 5em';
    this.prompter.style.border = '3em solid rgb(46, 174, 223)';
    this.prompter.style.borderRadius = '8em';
    this.prompter.style.background = '#fff';
    this.prompter.style.display = 'none';

    this.promptTitle = document.createElement('div');
    this.prompter.appendChild(this.promptTitle);
    this.promptTitle.textContent = '';
    this.promptTitle.style.cursor = 'default';
    this.promptTitle.style.font = 'bold 13em sans-serif';
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
    this.prompt.style.font = '13em sans-serif';
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
    this.promptButton.style.width = '22em';
    this.promptButton.style.height = '22em';
    this.promptButton.style.position = 'absolute';
    this.promptButton.style.right = '4em';
    this.promptButton.style.bottom = '4em';
    this.promptButton.style.background = 'url(icons.svg) -165em -37em';
    this.promptButton.style.backgroundSize = '320em 96em';

    this.prompt.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) {
        this.submitPrompt();
      }
    }.bind(this));

    this.promptButton.addEventListener(hasTouchEvents ? 'touchstart' : 'mousedown', this.submitPrompt.bind(this));

  };
  inherits(Stage, Base);

  Stage.prototype.isStage = true;

  Stage.prototype.fromJSON = function(data) {
    Stage.parent.prototype.fromJSON.call(this, data);

    data.children.forEach(function(d) {
      if (d.listName) return;
      this.children.push(new (d.cmd ? Watcher : Sprite)(this).fromJSON(d));
    }, this);

    this.children.forEach(function(child) {
      if (child.resolve) child.resolve();
    }, this);

    P.compile(this);

    return this;
  };

  Stage.prototype.focus = function() {
    if (this.promptId < this.nextPromptId) {
      this.prompt.focus();
    } else {
      this.canvas.focus();
    }
  };

  Stage.prototype.updateMouse = function(e) {
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
  };

  Stage.prototype.setZoom = function(zoom) {
    if (this.zoom === zoom) return;
    if (this.maxZoom < zoom) {
      this.maxZoom = zoom;
      var canvas = this.penCanvas;
      this.penCanvas = document.createElement('canvas');
      this.penCanvas.width = 480 * zoom;
      this.penCanvas.height = 360 * zoom;
      this.penContext = this.penCanvas.getContext('2d');
      this.penContext.drawImage(canvas, 0, 0, 480 * zoom, 360 * zoom);
      this.penContext.scale(this.maxZoom, this.maxZoom);
    }
    this.root.style.width =
    this.canvas.style.width = 480 * zoom + 'px';
    this.root.style.height =
    this.canvas.style.height = 360 * zoom + 'px';
    this.root.style.fontSize = zoom + 'px';
    this.zoom = zoom;
  };

  Stage.prototype.clickMouse = function() {
    this.mouseSprite = undefined;
    for (var i = this.children.length; i--;) {
      if (this.children[i].isSprite && this.children[i].visible && this.children[i].touching('_mouse_')) {
        if (this.children[i].isDraggable) {
          this.mouseSprite = this.children[i];
          this.children[i].mouseDown();
        } else {
          this.triggerFor(this.children[i], 'whenClicked');
        }
        return;
      }
    }
    this.triggerFor(this, 'whenClicked');
  };

  Stage.prototype.releaseMouse = function() {
    this.mousePressed = false;
    if (this.mouseSprite) {
      this.mouseSprite.mouseUp();
      this.mouseSprite = undefined;
    }
  };

  Stage.prototype.resetAllFilters = function() {
    var children = this.children;
    var i = children.length;
    while (i--) {
      children[i].resetFilters();
    }
    this.resetFilters();
  };

  Stage.prototype.removeAllClones = function() {
    var i = this.children.length;
    while (i--) {
      if (this.children[i].isClone) {
        this.children[i].remove();
        this.children.splice(i, 1);
      }
    }
    this.cloneCount = 0;
  };

  Stage.prototype.getObject = function(name) {
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].objName === name) {
        return this.children[i];
      }
    }
    if (name === '_stage_' || name === this.objName) {
      return this;
    }
  };

  Stage.prototype.getObjects = function(name) {
    var result = [];
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].objName === name) {
        result.push(this.children[i]);
      }
    }
    return result;
  };

  Stage.prototype.draw = function() {
    var context = this.context;

    this.canvas.width = 480 * this.zoom; // clear
    this.canvas.height = 360 * this.zoom;

    context.save();
    context.scale(this.zoom, this.zoom);

    this.drawOn(context);

    context.restore();

    if (this.hidePrompt) {
      this.hidePrompt = false;
      this.prompter.style.display = 'none';
      this.canvas.focus();
    }
  };

  Stage.prototype.drawOn = function(context, except) {
    var costume = this.costumes[this.currentCostumeIndex];
    context.save();
    context.scale(costume.scale, costume.scale);
    context.globalAlpha = Math.max(0, Math.min(1, 1 - this.filters.ghost / 100));
    context.drawImage(costume.image, 0, 0);
    context.restore();

    context.save();
    context.scale(1 / this.maxZoom, 1 / this.maxZoom);
    context.drawImage(this.penCanvas, 0, 0);
    context.restore();

    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].visible && this.children[i] !== except) {
        this.children[i].draw(context);
      }
    }
  };

  Stage.prototype.moveTo = function() {};

  Stage.prototype.submitPrompt = function() {
    if (this.promptId < this.nextPromptId) {
      this.answer = this.prompt.value;
      this.promptId += 1;
      if (this.promptId >= this.nextPromptId) {
        this.hidePrompt = true;
      }
    }
  };

  var KEY_CODES = {
    'space': 32,
    'left arrow': 37,
    'up arrow': 38,
    'right arrow': 39,
    'down arrow': 40
  };

  var getKeyCode = function(keyName) {
    return KEY_CODES[keyName.toLowerCase()] || keyName.toUpperCase().charCodeAt(0);
  };

  var Sprite = function(stage) {
    this.stage = stage;

    Sprite.parent.call(this);

    this.addVariables(stage.variables);
    this.addLists(stage.lists);

    this.direction = 90;
    this.indexInLibrary = -1;
    this.isDraggable = false;
    this.isDragging = false;
    this.rotationStyle = 'normal';
    this.scale = 1;
    this.scratchX = 0;
    this.scratchY = 0;
    this.spriteInfo = {};
    this.visible = true;

    this.penHue = 240;
    this.penSaturation = 100;
    this.penLightness = 50;

    this.penSize = 1;
    this.isPenDown = false;
    this.isSprite = true;
    this.bubble = null;
    this.saying = false;
    this.thinking = false;
    this.sayId = 0;
  };
  inherits(Sprite, Base);

  Sprite.prototype.fromJSON = function(data) {

    Sprite.parent.prototype.fromJSON.call(this, data);

    this.direction = data.direction;
    this.indexInLibrary = data.indexInLibrary;
    this.isDraggable = data.isDraggable;
    this.rotationStyle = data.rotationStyle;
    this.scale = data.scale;
    this.scratchX = data.scratchX;
    this.scratchY = data.scratchY;
    this.spriteInfo = data.spriteInfo;
    this.visible = data.visible;

    return this;
  };

  Sprite.prototype.clone = function() {
    var c = new Sprite(this.stage);

    c.isClone = true;
    c.costumes = this.costumes;
    c.currentCostumeIndex = this.currentCostumeIndex;
    c.objName = this.objName;
    c.sounds = this.sounds;
    c.variables = [];
    c.lists = [];

    for (var i = 0; i < this.variables.length; i++) {
      var v = this.variables[i];
      c.varRefs[v.name] = c.variables[i] = {
        name: v.name,
        value: v.value
      };
    }

    for (var i = 0; i < this.lists.length; i++) {
      var l = this.lists[i];
      c.listRefs[l.listName] = c.lists[i] = {
        contents: l.contents,
        listName: l.listName
      };
    }

    c.procedures = this.procedures;
    c.listeners = this.listeners;
    c.fns = this.fns;
    c.scripts = this.scripts;

    this.filters = {
      color: this.filters.color,
      fisheye: this.filters.fisheye,
      whirl: this.filters.whirl,
      pixelate: this.filters.pixelate,
      mosaic: this.filters.mosaic,
      brightness: this.filters.brightness,
      ghost: this.filters.ghost
    };

    c.direction = this.direction;
    c.indexInLibrary = this.indexInLibrary;
    c.isDraggable = this.isDraggable;
    c.rotationStyle = this.rotationStyle;
    c.scale = this.scale;
    c.scratchX = this.scratchX;
    c.scratchY = this.scratchY;
    c.visible = this.visible;
    c.penHue = this.penHue;
    c.penSaturation = this.penSaturation;
    c.penLightness = this.penLightness;
    c.penSize = this.penSize;
    c.isPenDown = this.isPenDown;

    c.initRuntime();

    return c;
  };

  Sprite.prototype.mouseDown = function() {
    this.dragStartX = this.scratchX;
    this.dragStartY = this.scratchY;
    this.dragOffsetX = this.scratchX - this.stage.mouseX;
    this.dragOffsetY = this.scratchY - this.stage.mouseY;
    this.isDragging = true;
  };

  Sprite.prototype.mouseUp = function() {
    if (this.isDragging && this.scratchX === this.dragStartX && this.scratchY === this.dragStartY) {
      this.stage.triggerFor(this, 'whenClicked');
    }
    this.isDragging = false;
  };

  Sprite.prototype.forward = function(steps) {
    var d = (90 - this.direction) * Math.PI / 180;
    this.moveTo(this.scratchX + steps * Math.cos(d), this.scratchY + steps * Math.sin(d));
  };

  Sprite.prototype.moveTo = function(x, y) {
    var ox = this.scratchX;
    var oy = this.scratchY;
    if (ox === x && oy === y && !this.isPenDown) return;
    this.scratchX = x;
    this.scratchY = y;
    this.keepOnStage();
    if (this.isPenDown) {
      var context = this.stage.penContext;
      if (this.penSize % 2 > .5 && this.penSize % 2 < 1.5) {
        ox -= .5;
        oy -= .5;
        x -= .5;
        y -= .5;
      }
      context.strokeStyle = 'hsl(' + this.penHue + ',' + this.penSaturation + '%,' + (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness) + '%)';
      context.lineWidth = this.penSize;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(240 + ox, 180 - oy);
      context.lineTo(240 + x, 180 - y);
      context.stroke();
    }
    if (this.saying) {
      this.updateBubble();
    }
  };

  Sprite.prototype.dotPen = function() {
    var context = this.stage.penContext;
    var x = this.scratchX;
    var y = this.scratchY;
    if (this.penSize % 2 > .5 && this.penSize % 2 < 1.5) {
      x -= .5;
      y -= .5;
    }
    context.strokeStyle = 'hsl(' + this.penHue + ',' + this.penSaturation + '%,' + (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness) + '%)';
    context.lineWidth = this.penSize;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(240 + x, 180 - y);
    context.lineTo(240.01 + x, 180 - y);
    context.stroke();
  };

  Sprite.prototype.stamp = function() {
    var context = this.stage.penContext;
    this.draw(context);
  };

  Sprite.prototype.draw = function(context) {
    var costume = this.costumes[this.currentCostumeIndex];

    if (this.isDragging) {
      this.moveTo(this.dragOffsetX + this.stage.mouseX, this.dragOffsetY + this.stage.mouseY);
    }

    if (costume) {
      context.save();

      context.translate(this.scratchX + 240, 180 - this.scratchY);
      if (this.rotationStyle === 'normal') {
        context.rotate((this.direction - 90) * Math.PI / 180);
      } else if (this.rotationStyle === 'leftRight' && this.direction < 0) {
        context.scale(-1, 1);
      }
      context.scale(this.scale, this.scale);
      context.scale(costume.scale, costume.scale);
      context.translate(-costume.rotationCenterX, -costume.rotationCenterY);

      context.globalAlpha = Math.max(0, Math.min(1, 1 - this.filters.ghost / 100));

      context.drawImage(costume.image, 0, 0);

      context.restore();
    }
  };

  Sprite.prototype.keepOnStage = function() {
    // TODO
  };

  Sprite.prototype.setDirection = function(degrees) {
    var d = degrees % 360;
    if (d > 180) d -= 360;
    if (d <= -180) d += 360;
    this.direction = d;
    if (this.saying) this.updateBubble();
  };

  var collisionCanvas = document.createElement('canvas');
  var collisionContext = collisionCanvas.getContext('2d');

  Sprite.prototype.touching = function(thing) {
    var costume = this.costumes[this.currentCostumeIndex];

    if (thing === '_mouse_') {
      var bounds = this.rotatedBounds();
      var x = this.stage.rawMouseX;
      var y = this.stage.rawMouseY;
      if (x < bounds.left || y < bounds.bottom || x > bounds.right || y > bounds.top) {
        return false;
      }
      var d = costume.context.getImageData((x - this.scratchX) * costume.bitmapResolution + costume.rotationCenterX, (this.scratchY - y) * costume.bitmapResolution + costume.rotationCenterY, 1, 1).data;
      return d[3] !== 0;
    } else if (thing === '_edge_') {
      var bounds = this.rotatedBounds();
      return bounds.left <= -240 || bounds.right >= 240 || bounds.top >= 180 || bounds.bottom <= -180;
    } else {
      if (!this.visible) return false;
      var sprites = this.stage.getObjects(thing);
      for (var i = sprites.length; i--;) {
        var sprite = sprites[i];
        if (!sprite.visible) continue;

        var sc = sprite.costumes[sprite.currentCostumeIndex];

        var mb = this.rotatedBounds();
        var ob = sprite.rotatedBounds();

        if (mb.bottom >= ob.top || ob.bottom >= mb.top || mb.left >= ob.right || ob.left >= mb.right) {
          continue;
        }

        var left = Math.max(mb.left, ob.left);
        var top = Math.min(mb.top, ob.top);
        var right = Math.min(mb.right, ob.right);
        var bottom = Math.max(mb.bottom, ob.bottom);

        collisionCanvas.width = right - left;
        collisionCanvas.height = top - bottom;

        collisionContext.save();
        collisionContext.translate(-(left + 240), -(180 - top));

        this.draw(collisionContext);
        collisionContext.globalCompositeOperation = 'source-in';
        sprite.draw(collisionContext);

        collisionContext.restore();

        var data = collisionContext.getImageData(0, 0, right - left, top - bottom).data;

        var length = (right - left) * (top - bottom) * 4;
        for (var j = 0; j < length; j += 4) {
          if (data[j + 3]) {
            return true;
          }
        }
      }
      return false;
    }
  };

  Sprite.prototype.touchingColor = function(rgb) {
    var b = this.rotatedBounds();
    collisionCanvas.width = b.right - b.left;
    collisionCanvas.height = b.top - b.bottom;

    collisionContext.save();
    collisionContext.translate(-(240 + b.left), -(180 - b.top));

    this.stage.drawOn(collisionContext, this);
    collisionContext.globalCompositeOperation = 'destination-in';
    this.draw(collisionContext);

    collisionContext.restore();

    var data = collisionContext.getImageData(0, 0, b.right - b.left, b.top - b.bottom).data;

    rgb = rgb & 0xffffff;
    var length = (b.right - b.left) * (b.top - b.bottom) * 4;
    for (var i = 0; i < length; i += 4) {
      if ((data[i] << 16 | data[i + 1] << 8 | data[i + 2]) === rgb && data[i + 3]) {
        return true;
      }
    }

    return false;
  };

  Sprite.prototype.bounceOffEdge = function() {
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
  };

  Sprite.prototype.rotatedBounds = function() {
    var costume = this.costumes[this.currentCostumeIndex];

    var mSin = Math.sin(this.direction * Math.PI / 180);
    var mCos = Math.cos(this.direction * Math.PI / 180);

    var left = -costume.rotationCenterX * costume.scale * this.scale;
    var top = costume.rotationCenterY * costume.scale * this.scale;
    var right = left + costume.image.width * costume.scale * this.scale;
    var bottom = top - costume.image.height * costume.scale * this.scale;

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
  };

  Sprite.prototype.showRotatedBounds = function() {
    var bounds = this.rotatedBounds();
    var div = document.createElement('div');
    div.style.outline = '1px solid red';
    div.style.position = 'absolute';
    div.style.left = (240 + bounds.left) + 'px';
    div.style.top = (180 - bounds.top) + 'px';
    div.style.width = (bounds.right - bounds.left) + 'px';
    div.style.height = (bounds.top - bounds.bottom) + 'px';
    this.stage.canvas.parentNode.appendChild(div);
  };

  Sprite.prototype.distanceTo = function(thing) {
    if (thing === '_mouse_') {
      var x = this.stage.mouseX;
      var y = this.stage.mouseY;
    } else {
      var sprite = this.stage.getObject(thing);
      if (!sprite) return 0;
      x = sprite.scratchX;
      y = sprite.scratchY;
    }
    return Math.sqrt((this.scratchX - x) * (this.scratchX - x) + (this.scratchY - y) * (this.scratchY - y));
  };

  Sprite.prototype.gotoObject = function(thing) {
    if (thing === '_mouse_') {
      this.moveTo(this.stage.mouseX, this.stage.mouseY);
    } else {
      var sprite = this.stage.getObject(thing);
      if (!sprite) return 0;
      this.moveTo(sprite.scratchX, sprite.scratchY);
    }
  };

  Sprite.prototype.pointTowards = function(thing) {
    if (thing === '_mouse_') {
      var x = this.stage.mouseX;
      var y = this.stage.mouseY;
    } else {
      var sprite = this.stage.getObject(thing);
      if (!sprite) return 0;
      x = sprite.scratchX;
      y = sprite.scratchY;
    }
    this.direction = Math.atan2(x - this.scratchX, y - this.scratchY) * 180 / Math.PI;
    if (this.saying) this.updateBubble();
  };

  Sprite.prototype.say = function(text, thinking) {
    text = '' + text;
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
      this.bubble.style.border = ''+(3/14)+'em solid rgb(160, 160, 160)'
      this.bubble.style.borderRadius = ''+(10/14)+'em'
      this.bubble.style.background = '#fff';
      this.bubble.style.position = 'absolute';
      this.bubble.style.font = 'bold 14em sans-serif';
      this.bubble.style.whiteSpace = 'pre-wrap';
      this.bubble.style.wordWrap = 'break-word';
      this.bubble.style.textAlign = 'center';
      this.bubble.style.cursor = 'default';
      this.bubble.appendChild(this.bubbleText = document.createTextNode(''));
      this.bubble.appendChild(this.bubblePointer = document.createElement('div'));
      this.bubblePointer.style.position = 'absolute';
      this.bubblePointer.style.height = ''+(21/14)+'em';
      this.bubblePointer.style.width = ''+(44/14)+'em';
      this.bubblePointer.style.background = 'url(icons.svg) '+(-195/14)+'em '+(-4/14)+'em';
      this.bubblePointer.style.backgroundSize = ''+(320/14)+'em '+(96/14)+'em';
      this.stage.root.appendChild(this.bubble);
    }
    this.bubblePointer.style.backgroundPositionX = ((thinking ? -259 : -195)/14)+'em';
    this.bubble.style.display = 'block';
    this.bubbleText.nodeValue = text;
    this.updateBubble();
    return ++this.sayId;
  };

  Sprite.prototype.updateBubble = function() {
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
  };

  Sprite.prototype.remove = function() {
    if (this.bubble) {
      this.stage.root.removeChild(this.bubble);
      this.bubble = null;
    }
  };

  var Costume = function(data) {
    this.baseLayerID = data.baseLayerID;
    this.baseLayerMD5 = data.baseLayerMD5;
    this.baseLayer = data.$image;
    this.bitmapResolution = data.bitmapResolution || 1;
    this.scale = 1 / this.bitmapResolution;
    this.costumeName = data.costumeName;
    this.rotationCenterX = data.rotationCenterX;
    this.rotationCenterY = data.rotationCenterY;
    this.textLayer = data.$text;

    this.image = document.createElement('canvas');
    this.context = this.image.getContext('2d');

    this.render();
    this.baseLayer.onload = function() {
      this.render();
    }.bind(this);
    if (this.textLayer) {
      this.textLayer.onload = this.baseLayer.onload;
    }
  };
  addEvents(Costume, 'load');

  Costume.prototype.render = function() {
    if (!this.baseLayer.width || this.textLayer && !this.textLayer.width) {
      return;
    }
    this.image.width = this.baseLayer.width;
    this.image.height = this.baseLayer.height;

    this.context.drawImage(this.baseLayer, 0, 0);
    if (this.textLayer) {
      this.context.drawImage(this.textLayer, 0, 0);
    }
  };

  var Watcher = function(stage) {
    this.stage = stage;

    this.cmd = 'getVar:';
    this.color = '#ee7d16';
    this.isDiscrete = true;
    this.label = 'watcher';
    this.mode = 1;
    this.param = 'var';
    this.sliderMax = 100;
    this.sliderMin = 0;
    this.target = undefined;
    this.visible = true;
    this.x = 0;
    this.y = 0;
  };

  Watcher.prototype.fromJSON = function(data) {
    this.cmd = data.cmd || 'getVar:';
    if (data.color) {
      var c = (data.color < 0 ? data.color + 0x1000000 : data.color).toString(16);
      this.color = '#000000'.slice(0, -c.length) + c;
    }
    this.isDiscrete = data.isDiscrete == null ? true : data.isDiscrete;
    this.label = data.label || '';
    this.mode = data.mode || 1;
    this.param = data.param;
    this.sliderMax = data.sliderMax == null ? 100 : data.sliderMax;
    this.sliderMin = data.sliderMin || 0;
    this.targetName = data.target;
    this.visible = data.visible == null ? true : data.visible;
    this.x = data.x || 0;
    this.y = data.y || 0;

    return this;
  };

  Watcher.prototype.resolve = function() {
    this.target = this.stage.getObject(this.targetName);
    if (this.target && this.cmd === 'getVar:') {
      var ref = this.target.varRefs[this.param];
      if (ref) {
        ref.watcher = this;
      }
    }
    if (!this.label) {
      this.label = this.getLabel();
      if (this.target.isSprite) this.label = this.target.objName + ': ' + this.label;
    }
  };

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

  Watcher.prototype.getLabel = function() {
    switch (this.cmd) {
      case 'getVar:': return this.param;
      case 'sensor:': return this.param + ' sensor value';
      case 'sensorPressed': return 'sensor ' + this.param + '?';
      case 'timeAndDate': return this.param;
      case 'senseVideoMotion': return 'video ' + this.param;
    }
    return WATCHER_LABELS[this.cmd] || '';
  };

  Watcher.prototype.draw = function(context) {
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
        var ref = this.target.varRefs[this.param];
        if (ref) {
          if (this.mode === 3 && this.stage.mousePressed) {
            var x = this.stage.mouseX + 240 - this.x - 5;
            var y = 180 - this.stage.mouseY - this.y - 20;
            if (x >= 0 && y >= 0 && x <= this.width - 5 - 5 && y <= 9) {
              ref.value = this.sliderMin + Math.max(0, Math.min(1, (x - 2.5) / (this.width - 5 - 5 - 5))) * (this.sliderMax - this.sliderMin);
              ref.value = this.isDiscrete ? Math.round(ref.value) : Math.round(ref.value * 100) / 100;
            }
          }
          value = ref.value;
        }
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
        value = Math.round((this.stage.now() - this.stage.timerStart) / 100) / 10;
        break;
      case 'volume':
        // TODO
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
    value = String(value);

    if (this.labelWidth == null) {
      context.font = 'bold 11px sans-serif';
      this.labelWidth = context.measureText(this.label).width;
    }

    context.save();
    context.translate(this.x, this.y);

    if (this.mode === 1 || this.mode === 3) {
      context.font = 'bold 11px sans-serif';

      var dw = Math.max(41, 5 + context.measureText(value).width + 5);
      var r = 5;
      var w = this.width = 5 + this.labelWidth + 5 + dw + 5;
      var h = this.mode === 1 ? 21 : 32;

      context.strokeStyle = 'rgb(148, 145, 145)';
      context.fillStyle = 'rgb(193, 196, 199)';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(r + 1, r + 1, r, Math.PI, Math.PI * 3/2, false);
      context.arc(w - r - 1, r + 1, r, Math.PI * 3/2, 0, false);
      context.arc(w - r - 1, h - r - 1, r, 0, Math.PI/2, false);
      context.arc(r + 1, h - r - 1, r, Math.PI/2, Math.PI, false);
      context.closePath();
      context.stroke();
      context.fill();

      context.fillStyle = '#000';
      context.fillText(this.label, 5, 14);

      var dh = 15;
      var dx = 5 + this.labelWidth + 5;
      var dy = 3;
      var dr = 4;

      context.save();
      context.translate(dx, dy);

      context.strokeStyle = '#fff';
      context.fillStyle = this.color;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(dr + 1, dr + 1, dr, Math.PI, Math.PI * 3/2, false);
      context.arc(dw - dr - 1, dr + 1, dr, Math.PI * 3/2, 0, false);
      context.arc(dw - dr - 1, dh - dr - 1, dr, 0, Math.PI/2, false);
      context.arc(dr + 1, dh - dr - 1, dr, Math.PI/2, Math.PI, false);
      context.closePath();
      context.stroke();
      context.fill();

      context.fillStyle = '#fff';
      context.textAlign = 'center';
      context.fillText(value, dw / 2, dh - 4);

      context.restore();

      if (this.mode === 3) {
        var sh = 5;
        var sw = w - 5 - 5;
        var sr = 1.5;
        var br = 4.5;

        context.save();
        context.translate(5, 22);

        context.strokeStyle = 'rgb(148, 145, 145)';
        context.fillStyle = 'rgb(213, 216, 219)';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(sr + 1, sr + 1, sr, Math.PI, Math.PI * 3/2, false);
        context.arc(sw - sr - 1, sr + 1, sr, Math.PI * 3/2, 0, false);
        context.arc(sw - sr - 1, sh - sr - 1, sr, 0, Math.PI/2, false);
        context.arc(sr + 1, sh - sr - 1, sr, Math.PI/2, Math.PI, false);
        context.closePath();
        context.stroke();
        context.fill();

        var x = (sw - sh) * ((Number(value) || 0) - this.sliderMin) / (this.sliderMax - this.sliderMin);
        context.strokeStyle = 'rgb(108, 105, 105)';
        context.fillStyle = 'rgb(233, 236, 239)';
        context.beginPath();
        context.arc(x + sh / 2, sh / 2, br - 1, 0, Math.PI * 2, false);
        context.stroke();
        context.fill();

        context.restore();
      }
    } else if (this.mode === 2) {
      context.font = 'bold 15px sans-serif';

      dh = 21;
      dw = Math.max(41, 5 + context.measureText(value).width + 5);
      dr = 4;

      context.strokeStyle = '#fff';
      context.fillStyle = this.color;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(dr + 1, dr + 1, dr, Math.PI, Math.PI * 3/2, false);
      context.arc(dw - dr - 1, dr + 1, dr, Math.PI * 3/2, 0, false);
      context.arc(dw - dr - 1, dh - dr - 1, dr, 0, Math.PI/2, false);
      context.arc(dr + 1, dh - dr - 1, dr, Math.PI/2, Math.PI, false);
      context.closePath();
      context.stroke();
      context.fill();

      context.fillStyle = '#fff';
      context.textAlign = 'center';
      context.fillText(value, dw / 2, dh - 5);
    }

    context.restore();
  };

  return {
    hasTouchEvents: hasTouchEvents,
    getKeyCode: getKeyCode,
    IO: IO,
    Base: Base,
    Stage: Stage,
    Sprite: Sprite,
    Watcher: Watcher
  };

}());

P.compile = (function() {
  'use strict';

  var LOG_PRIMITIVES;
  // LOG_PRIMITIVES = true;

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

  var name = 'a';
  function varn() {
    var i, s;
    s = '';
    i = name.length - 1;
    while (i >= 0 && name[i] === 'z') {
      s = 'a' + s;
      --i;
    }
    if (i === -1) {
      s = 'a' + s;
    } else {
      s = String.fromCharCode(name.charCodeAt(i) + 1) + s;
    }
    s = name.substr(0, i) + s;
    name = s;
    return '$tmp_' + s;
  }

  var compileListener = function(object, script) {
    if (!script[0] || EVENT_SELECTORS.indexOf(script[0][0]) === -1) return;

    var nextLabel = function() {
      return object.fns.length + fns.length;
    };

    var label = function() {
      var id = nextLabel();
      fns.push(source.length);
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

    var seq = function(script) {
      if (!script) return;
      for (var i = 0; i < script.length; i++) {
        compile(script[i]);
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
          .replace(/"/g, '\\"') + '"';

      } else if ((v = numval(e)) != null || (v = boolval(e)) != null) {

        return v;

      } else if (e[0] === 'costumeName') {

        return 'S.getCostumeName()';

      } else if (e[0] === 'sceneName') {

        return 'self.getCostumeName()';

      } else if (e[0] === 'getParam') { /* Data */

        return '(C && C.args[' + val(e[1]) + '] != null ? C.args[' + val(e[1]) + '] : 0)';

      } else if (e[0] === 'readVariable') {

        return 'getVar(' + val(e[1]) + ').value';

      } else if (e[0] === 'contentsOfList:') {

        return 'contentsOfList(' + val(e[1]) + ')';

      } else if (e[0] === 'getLine:ofList:') {

        return 'getLineOfList(' + val(e[2]) + ', ' + val(e[1]) + ')';

      } else if (e[0] === 'concatenate:with:') {

        return '("" + ' + val(e[1]) + ' + ' + val(e[2]) + ')';

      } else if (e[0] === 'letter:of:') {

        return '(("" + ' + val(e[2]) + ')[Math.floor(' + num(e[1]) + ') - 1] || "")';

      } else if (e[0] === 'answer') { /* Sensing */

        return 'self.answer';

      } else if (e[0] === 'getAttribute:of:') {

        return 'attribute(' + val(e[1]) + ', ' + val(e[2]) + ')';

      // } else if (e[0] === 'getUserId') {

      // } else if (e[0] === 'getUserName') {

      } else {

        warn('Undefined val: ' + e[0]);

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

      // } else if (e[0] === 'volume') { /* Sound */

      } else if (e[0] === 'tempo') {

        return 'self.tempoBPM';

      } else if (e[0] === 'lineCountOfList:') { /* Data */

        return 'lineCountOfList(' + val(e[1]) + ')';

      } else if (e[0] === '+') { /* Operators */

        return '(' + num(e[1]) + ' + ' + num(e[2]) + ')';

      } else if (e[0] === '-') {

        return '(' + num(e[1]) + ' - ' + num(e[2]) + ')';

      } else if (e[0] === '*') {

        return '(' + num(e[1]) + ' * ' + num(e[2]) + ')';

      } else if (e[0] === '/') {

        return '(' + num(e[1]) + ' / ' + num(e[2]) + ')';

      } else if (e[0] === 'randomFrom:to:') {

        return 'random(' + num(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e[0] === 'abs') {

        return 'Math.abs(' + num(e[1]) + ')';

      } else if (e[0] === 'sqrt') {

        return 'Math.sqrt(' + num(e[1]) + ')';

      } else if (e[0] === 'stringLength:') {

        return '("" + ' + val(e[1]) + ').length';

      } else if (e[0] === '%' || e[0] === '\\') {

        return 'mod(' + num(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e[0] === 'rounded') {

        return 'Math.round(' + num(e[1]) + ')';

      } else if (e[0] === 'computeFunction:of:') {

        return 'mathFunc(' + val(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e[0] === 'mouseX') { /* Sensing */

        return 'self.mouseX';

      } else if (e[0] === 'mouseY') {

        return 'self.mouseY';

      } else if (e[0] === 'timer') {

        return '((self.now() - self.timerStart) / 1000)';

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

    var boolval = function(e) {

      if (e[0] === 'list:contains:') { /* Data */

        return 'listContains(' + val(e[1]) + ', ' + val(e[2]) + ')';

      } else if (e[0] === '<') { /* Operators */

        return '(compare(' + val(e[1]) + ', ' + val(e[2]) + ') === -1)';

      } else if (e[0] === '=') {

        return '(compare(' + val(e[1]) + ', ' + val(e[2]) + ') === 0)';

      } else if (e[0] === '>') {

        return '(compare(' + val(e[1]) + ', ' + val(e[2]) + ') === 1)';

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

      // } else if (e[0] === 'color:sees:') {

      } else if (e[0] === 'keyPressed:') {

        return '!!self.keys[P.getKeyCode(' + val(e[1]) + ')]';

      // } else if (e[0] === 'isLoud') {

      // } else if (e[0] === 'sensorPressed:') {

      }
    };

    var bool = function(e) {
      if (typeof e === 'boolean') {
        return e;
      }
      if (typeof e === 'number' || typeof e === 'string') {
        return Number(e) !== 0 && e !== '' && e !== 'false' && e !== false;
      }
      var v = boolval(e);
      return v != null ? v : 'bool(' + val(e, false, true) + ')';
    };

    var num = function(e) {
      if (typeof e === 'number') {
        return e;
      }
      if (typeof e === 'boolean' || typeof e === 'string') {
        return Number(e) || 0;
      }
      var v = numval(e);
      return v != null ? v : '(Number(' + val(e, true) + ') || 0)';
    };

    var compile = function(block) {
      if (LOG_PRIMITIVES) {
        source += 'console.log(' + val(block[0]) + ');\n';
      }

      if (['forward:', 'turnRight:', 'turnLeft:', 'heading:', 'pointTowards:', 'gotoX:y:', 'gotoSpriteOrMouse:', 'changeXposBy:', 'xpos:', 'changeYposBy:', 'ypos:', 'bounceOffEdge', 'setRotationStyle', 'lookLike:', 'nextCostume', 'say:duration:elapsed:from:', 'say:', 'think:duration:elapsed:from:', 'think:', 'changeGraphicEffect:by:', 'setGraphicEffect:to:', 'filterReset', 'changeSizeBy:', 'setSizeTo:', 'comeToFront', 'goBackByLayers:', 'glideSecs:toX:y:elapsed:from:'].indexOf(block[0]) > -1) {
        source += 'if (S.visible) VISUAL = true;\n';
      } else if (['showBackground:', 'startScene', 'nextBackground', 'nextScene', 'startSceneAndWait', 'show', 'hide', 'putPenDown', 'stampCostume', 'showVariable:', 'hideVariable:', 'doAsk'].indexOf(block[0]) > -1) {
        source += 'VISUAL = true;\n';
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

        source += 'var style = ' + val(block[1]) + ';\n';
        source += 'S.rotationStyle = style === "left-right" ? "leftRight" : style === "don\'t rotate" ? "none" : "normal";';

      } else if (block[0] === 'lookLike:') { /* Looks */

        source += 'S.setCostume(' + val(block[1]) + ');\n';

      } else if (block[0] === 'nextCostume') {

        source += 'S.currentCostumeIndex = (S.currentCostumeIndex + 1) % S.costumes.length;\n';

      } else if (block[0] === 'showBackground:' ||
                 block[0] === 'startScene') {

        source += 'self.setCostume(' + val(block[1]) + ');\n';
        source += 'sceneChange();\n';

      } else if (block[0] === 'nextBackground' ||
                 block[0] === 'nextScene') {

        source += 'S.currentCostumeIndex = (S.currentCostumeIndex + 1) % S.costumes.length;\n';
        source += 'sceneChange();\n';

      } else if (block[0] === 'startSceneAndWait') {

        if (warp) {

          warn('Cannot be used at warp speed: ' + block);

        } else {

          source += 'save();\n';
          source += 'self.setCostume(' + val(block[1]) + ');\n';
          source += 'R.threads = sceneChange();\n';
          var id = label();
          source += 'if (!running(R.threads)) {\n';
          queue(id);
          source += '}\n';
          source += 'restore();\n';

        }

      } else if (block[0] === 'say:duration:elapsed:from:') {

        source += 'save();\n';
        source += 'R.id = S.say(' + val(block[1]) + ', false);\n';
        source += 'R.start = self.now();\n';
        source += 'R.duration = ' + num(block[2]) + ';\n';

        var id = label();
        source += 'if (self.now() - R.start < R.duration * 1000) {\n';
        queue(id);
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
        source += 'R.start = self.now();\n';
        source += 'R.duration = ' + num(block[2]) + ';\n';

        var id = label();
        source += 'if (self.now() - R.start < R.duration * 1000) {\n';
        queue(id);
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

        source += 'S.scale += ' + num(block[1]) + ' / 100;\n';

      } else if (block[0] === 'setSizeTo:') {

        source += 'S.scale = ' + num(block[1]) + ' / 100;\n';

      } else if (block[0] === 'show') {

        source += 'S.visible = true;\n';
        source += 'if (S.saying) S.updateBubble();\n';

      } else if (block[0] === 'hide') {

        source += 'S.visible = false;\n';
        source += 'if (S.saying) S.updateBubble();\n';

      } else if (block[0] === 'comeToFront') {

        source += 'var i = self.children.indexOf(S);\n';
        source += 'if (i > -1) self.children.splice(i, 1);\n';
        source += 'self.children.push(S);\n';

      } else if (block[0] === 'goBackByLayers:') {

        source += 'var i = self.children.indexOf(S);\n';
        source += 'if (i > -1) {\n';
        source += '  self.children.splice(i, 1);\n';
        source += '  self.children.splice(Math.max(0, i - ' + num(block[1]) + '), 0, S);\n';
        source += '}\n';

      // } else if (block[0] === 'setVideoState') {

      // } else if (block[0] === 'setVideoTransparency') {

      // } else if (block[0] === 'playSound:') { /* Sound */

      // } else if (block[0] === 'doPlaySoundAndWait') {

      // } else if (block[0] === 'stopAllSounds') {

      // } else if (block[0] === 'drum:duration:elapsed:from:') {

      // } else if (block[0] === 'playDrum') {

      // } else if (block[0] === 'rest:elapsed:from:') {

      // } else if (block[0] === 'noteOn:duration:elapsed:from:') {

      // } else if (block[0] === 'midiInstrument:') {

      // } else if (block[0] === 'instrument:') {

      // } else if (block[0] === 'changeVolumeBy:') {

      // } else if (block[0] === 'setVolumeTo:') {

      } else if (block[0] === 'changeTempoBy:') {

        source += 'self.tempoBPM += ' + num(block[1]) + ';\n';

      } else if (block[0] === 'setTempoTo:') {

        source += 'self.tempoBPM = ' + num(block[1]) + ';\n';

      } else if (block[0] === 'clearPenTrails') { /* Pen */

        source += 'self.penCanvas.width = 480 * self.maxZoom;\n';
        source += 'self.penContext.scale(self.maxZoom, self.maxZoom);\n';

      } else if (block[0] === 'putPenDown') {

        source += 'S.isPenDown = true;\n';
        source += 'S.dotPen();\n';

      } else if (block[0] === 'putPenUp') {

        source += 'S.isPenDown = false;\n';
        source += 'S.penState = null;\n';

      } else if (block[0] === 'penColor:') {

        source += 'var hsl = rgb2hsl(' + num(block[1]) + ');\n';
        source += 'S.penHue = hsl[0];\n';
        source += 'S.penSaturation = hsl[1];\n';
        source += 'S.penLightness = hsl[2];\n';

      } else if (block[0] === 'setPenHueTo:') {

        source += 'S.penHue = ' + num(block[1]) + ' * 360 / 200;\n';
        source += 'S.penSaturation = 100;\n';

      } else if (block[0] === 'changePenHueBy:') {

        source += 'S.penHue += ' + num(block[1]) + ' * 360 / 200;\n';
        source += 'S.penSaturation = 100;\n';

      } else if (block[0] === 'setPenShadeTo:') {

        source += 'S.penLightness = ' + num(block[1]) + ' % 200;\n';
        source += 'if (S.penLightness < 0) S.penLightness += 200;\n';
        source += 'S.penSaturation = 100;\n';

      } else if (block[0] === 'changePenShadeBy:') {

        source += 'S.penLightness = (S.penLightness + ' + num(block[1]) + ') % 200;\n';
        source += 'if (S.penLightness < 0) S.penLightness += 200;\n';
        source += 'S.penSaturation = 100;\n';

      } else if (block[0] === 'penSize:') {

        source += 'S.penSize = ' + num(block[1]) + ';\n';

      } else if (block[0] === 'changePenSizeBy:') {

        source += 'S.penSize += ' + num(block[1]) + ';\n';

      } else if (block[0] === 'stampCostume') {

        source += 'S.draw(self.penContext);\n';

      } else if (block[0] === 'setVar:to:') { /* Data */

        source += 'getVar(' + val(block[1]) + ').value = ' + val(block[2]) + ';\n';

      } else if (block[0] === 'changeVar:by:') {

        source += 'var v = getVar(' + val(block[1]) + '); v.value = (Number(v.value) || 0) + ' + num(block[2]) + ';\n';

      } else if (block[0] === 'append:toList:') {

        source += 'appendToList(' + val(block[2]) + ', ' + val(block[1]) + ');\n';

      } else if (block[0] === 'deleteLine:ofList:') {

        source += 'deleteLineOfList(' + val(block[2]) + ', ' + val(block[1]) + ');\n';

      } else if (block[0] === 'insert:at:ofList:') {

        source += 'insertInList(' + val(block[3]) + ', ' + val(block[2]) + ', '+ val(block[1]) + ');\n';

      } else if (block[0] === 'setLine:ofList:to:') {

        source += 'setLineOfList(' + val(block[2]) + ', ' + val(block[1]) + ', '+ val(block[3]) + ');\n';

      } else if (block[0] === 'showVariable:') {

        source += 'showVariable(' + val(block[1]) + ', true);';

      } else if (block[0] === 'hideVariable:') {

        source += 'showVariable(' + val(block[1]) + ', false);';

      // } else if (block[0] === 'showList:') {

      // } else if (block[0] === 'hideList:') {

      } else if (block[0] === 'broadcast:') { /* Control */

        source += 'broadcast(' + val(block[1]) + ');';

      } else if (block[0] === 'call') {

        source += 'call(' + val(block[1]) + ', ' + (warp ? null : nextLabel()) + ', [';
        for (var i = 2; i < block.length; i++) {
          if (i > 2) {
            source += ', ';
          }
          source += val(block[i]);
        }
        source += ']);\n';
        if (!warp) delay();

      } else if (block[0] === 'doBroadcastAndWait') {

        source += 'save();\n';
        source += 'R.threads = broadcast(' + val(block[1]) + ');\n';
        var id = label();
        source += 'if (running(R.threads)) {\n';
        queue(id);
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'doForever') {

        var id = label();
        seq(block[1]);
        queue(id);

      } else if (block[0] === 'doForeverIf') {

        if (warp) {
          warn('Cannot be used at warp speed: ' + block);
        } else {

          var id = label();

          source += 'if (' + bool(block[1]) + ') {\n';
          seq(block[2]);
          source += '}\n';

          queue(id);

        }

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

        if (warp) {

          source += 'while (R.count >= 0.5) {\n';
          source += '  R.count -= 1;\n';
          seq(block[2]);
          source += '}\n';

          source += 'restore();\n';

        } else {

          var id = label();

          source += 'if (R.count >= 0.5) {\n';
          source += '  R.count -= 1;\n';
          seq(block[2]);
          queue(id);
          source += '} else {\n';
          source += '  restore();\n';
          source += '}\n';

        }

      } else if (block[0] === 'doReturn') {

        source += 'endCall();\n';
        source += 'return;\n';

      } else if (block[0] === 'doUntil') {

        if (warp) {

          source += 'while (!' + bool(block[1]) + ') {\n';
          seq(block[2]);
          source += '}\n';

        } else {

          var id = label();
          source += 'if (!' + bool(block[1]) + ') {\n';
          seq(block[2]);
          queue(id);
          source += '}\n';

        }

      } else if (block[0] === 'doWhile') {

        if (warp) {

          source += 'while (' + bool(block[1]) + ') {\n';
          seq(block[2]);
          source += '}\n';

        } else {

          var id = label();
          source += 'if (' + bool(block[1]) + ') {\n';
          seq(block[2]);
          queue(id);
          source += '}\n';

        }

      } else if (block[0] === 'doWaitUntil') {

        if (warp) {

          warn('Cannot be used at warp speed: ' + block);

        } else {

          var id = label();
          source += 'if (!' + bool(block[1]) + ') {\n';
          queue(id);
          source += '}\n';

        }

      } else if (block[0] === 'glideSecs:toX:y:elapsed:from:') {

        if (warp) {

          warn('Cannot be used at warp speed: ' + block);

        } else {

          source += 'save();\n';
          source += 'R.start = self.now();\n';
          source += 'R.duration = ' + num(block[1]) + ';\n';
          source += 'R.baseX = S.scratchX;\n';
          source += 'R.baseY = S.scratchY;\n';
          source += 'R.deltaX = ' + num(block[2]) + ' - S.scratchX;\n';
          source += 'R.deltaY = ' + num(block[3]) + ' - S.scratchY;\n';

          var id = label();
          source += 'var f = (self.now() - R.start) / (R.duration * 1000);\n';
          source += 'if (f > 1) f = 1;\n';
          source += 'S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);\n';

          source += 'if (f < 1) {\n';
          queue(id);
          source += '}\n';
          source += 'restore();\n';

        }

      } else if (block[0] === 'stopAll') {

        source += 'self.stopAll();\n';
        source += 'return;\n';

      } else if (block[0] === 'stopScripts') {

        source += 'switch (' + val(block[1]) + ') {\n';
        source += '  case "all":\n'
        source += '    self.stopAll();\n';
        source += '    return;\n';
        source += '  case "this script":\n';
        source += '    endCall();\n';
        source += '    return;\n';
        source += '  case "other scripts in sprite":\n';
        source += '  case "other scripts in stage":\n';
        source += '    for (var i = THREAD + 1; i < self.queue.length; i++) {\n';
        source += '      if (self.queue[i] && self.queue[i].sprite === S) {\n';
        source += '        self.queue[i] = undefined;\n';
        source += '      }\n';
        source += '    }\n';
        source += '    break;\n';
        source += '}\n';

      } else if (block[0] === 'wait:elapsed:from:') {

        source += 'save();\n';
        source += 'R.start = self.now();\n';
        source += 'R.duration = ' + num(block[1]) + ';\n';
        source += 'R.first = true;\n';

        var id = label();
        source += 'if (self.now() - R.start < R.duration * 1000 || R.first) {\n';
        source += '  R.first = false;\n';
        queue(id);
        source += '}\n';

        source += 'restore();\n';

      } else if (block[0] === 'warpSpeed') {

        warp += 1;
        seq(block[1]);
        warp -= 1;

      } else if (block[0] === 'createCloneOf') {

        source += 'clone(' + val(block[1]) + ');\n'

      } else if (block[0] === 'deleteClone') {

        source += 'if (S.isClone) {\n';
        source += '  var i = self.children.indexOf(S);\n';
        source += '  if (i > -1) self.children.splice(i, 1);\n';
        source += '  S.queue = [];\n';
        source += '  TERMINATE = true;\n';
        source += '  return;\n';
        source += '}\n';

      } else if (block[0] === 'doAsk') { /* Sensing */

        source += 'R.id = self.nextPromptId++;\n';

        var id = label();
        source += 'if (self.promptId < R.id) {\n';
        queue(id);
        source += '}\n';

        source += 'S.ask(' + val(block[1]) + ');';

        var id = label();
        source += 'if (self.promptId === R.id) {\n';
        queue(id);
        source += '}\n';

      } else if (block[0] === 'timerReset') {

        source += 'self.timerStart = self.now();\n';

      } else {

        warn('Undefined command: ' + block[0]);

      }
    };

    var source = '';
    var startfn = object.fns.length;
    var fns = [0];
    var warp = 0;

    if (script[0][0] === 'procDef' && script[0][4]) {
      warp += 1;
    }

    for (var i = 1; i < script.length; i++) {
      compile(script[i]);
    }

    if (script[0][0] === 'procDef') {
      source += 'endCall();\n';
      source += 'return;\n';
    }

    var createContinuation = function(source) {
      var result = '(function() {\n';
      var brackets = 0;
      var delBrackets = 0;
      var shouldDelete = false;
      for (var i = 0; i < source.length; i++) {
        if (shouldDelete) {
          if (source[i] === '{') {
            delBrackets += 1;
          } else if (source[i] === '}') {
            delBrackets -= 1;
            if (delBrackets === 0) {
              shouldDelete = false;
            }
          }
        } else {
          if (source.substr(i, 8) === '} else {') {
            if (brackets > 0) {
              result += '} else {';
              i += 7;
            } else {
              shouldDelete = true;
              delBrackets = 0;
            }
          } else if (source[i] === '{') {
            brackets += 1;
            result += '{';
          } else if (source[i] === '}') {
            if (brackets > 0) {
              result += '}';
              brackets -= 1;
            }
          } else {
            result += source[i];
          }
        }
      }
      result += '})';
      try {
        return P.runtime.scopedEval(result);
      } catch (e) {
        debugger;
      }
    };

    for (var i = 0; i < fns.length; i++) {
      object.fns.push(createContinuation(source.slice(fns[i])));
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
      object.listeners.whenKeyPressed[P.getKeyCode(script[0][1])].push(f);
    } else if (script[0][0] === 'whenSceneStarts') {
      var key = script[0][1].toLowerCase();
      (object.listeners.whenSceneStarts[key] || (object.listeners.whenSceneStarts[key] = [])).push(f);
    } else if (script[0][0] === 'procDef') {
      object.procedures[script[0][1]] = {
        inputs: script[0][2],
        fn: f
      };
    } else {
      warn('Undefined event: ' + script[0][0]);
    }
  };

  return function(stage) {

    warnings = Object.create(null);

    compileScripts(stage);

    for (var i = 0; i < stage.children.length; i++) {
      if (!stage.children[i].cmd) {
        compileScripts(stage.children[i]);
      }
    }

    for (var key in warnings) {
      console.warn(key + (warnings[key] > 1 ? ' (repeated ' + warnings[key] + ' times)' : ''));
    }

  };

}());

P.runtime = (function() {
  'use strict';

  var self, S, R, STACK, C, CALLS, BASE, THREAD, TERMINATE, VISUAL, STOP_THREAD = {};

  var bool = function(v) {
    return Number(v) !== 0 && v !== '' && v !== 'false' && v !== false;
  };

  var DIGIT = /\d/;
  var compare = function(x, y) {
    if ((typeof x === 'number' || DIGIT.test(x)) && (typeof y === 'number' || DIGIT.test(y))) {
      var nx = Number(x);
      var ny = Number(y);
      if (nx === nx && ny === ny) {
        return nx < ny ? -1 : nx === ny ? 0 : 1;
      }
    }
    var xs = String(x).toLowerCase();
    var ys = String(y).toLowerCase();
    return xs < ys ? -1 : xs === ys ? 0 : 1;
  };

  var mod = function(x, y) {
    var r = x % y;
    if (r / y < 0) {
      r += y;
    }
    return r;
  };

  var random = function(x, y) {
    x = Number(x) || 0;
    y = Number(y) || 0;
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

  var timeAndDate = P.Watcher.prototype.timeAndDate = function(format) {
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
  };

  var getVar = function(name) {
    var v = S.varRefs[name];
    if (!v) S.variables.push(S.varRefs[name] = v = {name: name, value: 0, isPeristent: false});
    return v;
  };

  var listIndex = function(list, index, length) {
    if (index === 'random' || index === 'any') {
      return Math.floor(Math.random() * length);
    }
    if (index === 'last') {
      return length - 1;
    }
    var i = Math.floor(index) - 1;
    return i === i && i >= 0 && i < length ? i : -1;
  };

  var contentsOfList = function(name) {
    var list = S.listRefs[name];
    if (!list) return '';
    var isSingle = true;
    for (var i = 0; i < list.contents.length; i++) {
      if (list.contents[i].length !== 1) {
        isSingle = false;
        break;
      }
    }
    return list.contents.join(isSingle ? '' : ' ');
  };

  var getLineOfList = function(name, index) {
    var list = S.listRefs[name];
    if (!list) return 0;
    var i = listIndex(list, index, list.contents.length);
    return list && i > -1 ? list.contents[i] : 0;
  };

  var lineCountOfList = function(name) {
    var list = S.listRefs[name];
    return list ? list.contents.length : 0;
  };

  var listContains = function(name, value) {
    var list = S.listRefs[name];
    return list ? list.contents.indexOf(String(value)) > -1 : 0;
  };

  var appendToList = function(name, value) {
    var list = S.listRefs[name];
    if (list) {
      list.contents.push(String(value));
    }
  };

  var deleteLineOfList = function(name, index) {
    var list = S.listRefs[name];
    if (list) {
      if (index === 'all') {
        list.contents = [];
      } else {
        var i = listIndex(list, index, list.contents.length);
        if (i > -1) {
          list.contents.splice(i, 1);
        }
      }
    }
  };

  var insertInList = function(name, index, value) {
    var list = S.listRefs[name];
    if (list) {
      var i = listIndex(list, index, list.contents.length + 1);
      if (i === list.contents.length) {
        list.contents.push(String(value));
      } else if (i > -1) {
        list.contents.splice(i, 0, String(value));
      }
    }
  };

  var setLineOfList = function(name, index, value) {
    var list = S.listRefs[name];
    if (list) {
      var i = listIndex(list, index, list.contents.length);
      if (i > -1) {
        list.contents[i] = String(value);
      }
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
        return Math.exp(x * Math.LN10)
    }
    return 0;
  };

  var showVariable = function(name, visible) {
    var ref = S.varRefs[name];
    if (ref) {
      if (!ref.watcher) {
        ref.watcher = new P.Watcher(self);
        ref.watcher.x = self.defaultWatcherX;
        ref.watcher.y = self.defaultWatcherY;
        self.defaultWatcherY += 26;
        if (self.defaultWatcherY >= 450) {
          self.defaultWatcherY = 10;
          self.defaultWatcherX += 150;
        }
        ref.watcher.target = S.variables.indexOf(ref) !== -1 ? S : self;
        ref.watcher.label = (ref.watcher.target === self ? '' : ref.watcher.target.objName + ': ') + name;
        ref.watcher.param = name;
        self.children.push(ref.watcher);
      }
      ref.watcher.visible = visible;
    }
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
        case 'costume name': return o.costumes[o.currentCostumeIndex].costumeName;
        case 'size': return o.scale * 100;
        case 'volume': return 0; // TODO
      }
    } else {
      switch (attr) {
        case 'background #':
        case 'backdrop #': return o.currentCostumeIndex + 1;
        case 'backdrop name': return o.costumes[o.currentCostumeIndex].costumeName;
        case 'volume': return 0; // TODO
      }
    }
    var ref = o.varRefs[attr];
    if (ref) {
      return ref.value;
    }
    return 0;
  };

  var save = function() {
    STACK.push(R);
    R = {};
  };

  var restore = function() {
    R = STACK.pop();
  };

  var call = function(spec, id, values) {
    var procedure = S.procedures[spec];
    if (procedure) {
      var args = {};
      for (var i = values.length; i--;) {
        args[procedure.inputs[i]] = values[i];
      }
      STACK.push(R);
      CALLS.push(C);
      C = {
        fn: S.fns[id],
        args: args,
        stack: STACK = []
      };
      R = {};
      procedure.fn();
    } else {
      S.fns[id]();
    }
  };

  var endCall = function() {
    if (CALLS.length) {
      var fn = C.fn;
      C = CALLS.pop();
      STACK = C.stack;
      R = STACK.pop();
      if (fn != null) fn();
    } else {
      throw STOP_THREAD;
    }
  };

  var sceneChange = function() {
    return self.trigger('whenSceneStarts', self.costumes[self.currentCostumeIndex].costumeName);
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
    self.queue[THREAD] = {
      sprite: S,
      base: BASE,
      fn: S.fns[id],
      calls: CALLS
    };
  };

  // Internal definition
  (function() {
    'use strict';

    P.Stage.prototype.framerate = 30;

    P.Base.prototype.initRuntime = function() {
      this.queue = [];
    };

    P.Stage.prototype.startThread = function(sprite, base) {
      var thread = {
        sprite: sprite,
        base: base,
        fn: base,
        calls: [{ args:{}, stack: [{}] }]
      };
      for (var i = 0; i < this.queue.length; i++) {
        var q = this.queue[i];
        if (q && q.sprite === sprite && q.base === base) {
          this.queue[i] = thread;
          if (S === this && THREAD === i) {
            throw STOP_THREAD;
          }
          return;
        }
      }
      this.queue.push(thread);
    };

    P.Stage.prototype.triggerFor = function(sprite, event, arg) {
      var threads;
      if (event === 'whenClicked') {
        threads = sprite.listeners.whenClicked;
      } else if (event === 'whenCloned') {
        threads = sprite.listeners.whenCloned;
      } else if (event === 'whenGreenFlag') {
        threads = sprite.listeners.whenGreenFlag;
      } else if (event === 'whenIReceive') {
        threads = sprite.listeners.whenIReceive[('' + arg).toLowerCase()]
      } else if (event === 'whenKeyPressed') {
        threads = sprite.listeners.whenKeyPressed[arg];
      } else if (event === 'whenSceneStarts') {
        threads = sprite.listeners.whenSceneStarts[('' + arg).toLowerCase()];
      }
      if (threads) {
        for (var i = 0; i < threads.length; i++) {
          this.startThread(sprite, threads[i]);
        }
        return threads;
      }
      return [];
    };

    P.Stage.prototype.trigger = function(event, arg) {
      var result = [];
      for (var i = this.children.length; i--;) {
        if (this.children[i].isSprite) {
          result = result.concat(this.triggerFor(this.children[i], event, arg));
        }
      }
      return result.concat(this.triggerFor(this, event, arg));
    };

    P.Stage.prototype.triggerGreenFlag = function() {
      this.timerStart = this.now();
      this.trigger('whenGreenFlag');
    };

    P.Stage.prototype.start = function() {
      this.isRunning = true;
      if (this.interval) return;
      this.baseTime = Date.now();
      this.interval = setInterval(this.step.bind(this), 1000 / this.framerate);
    };

    P.Stage.prototype.pause = function() {
      if (this.interval) {
        this.baseNow = this.now();
        clearInterval(this.interval);
        delete this.interval;
      }
      this.isRunning = false;
    };

    P.Stage.prototype.stopAll = function() {
      this.hidePrompt = false;
      this.prompter.style.display = 'none';
      this.promptId = this.nextPromptId = 0;
      this.queue = [];
      this.resetFilters();
      for (var i = 0; i < this.children.length; i++) {
        var c = this.children[i];
        if (c.isClone) {
          c.remove();
          this.children.splice(i, 1);
          i -= 1;
        } else if (c.isSprite) {
          c.resetFilters();
          if (c.saying) c.say('');
        }
      }
    };

    P.Stage.prototype.now = function() {
      return this.baseNow + Date.now() - this.baseTime;
    };

    P.Stage.prototype.step = function() {
      try {
        self = this;
        VISUAL = false;
        var start = Date.now();
        do {
          var queue = this.queue;
          for (THREAD = 0; THREAD < queue.length; THREAD++) {
            if (queue[THREAD]) {
              S = queue[THREAD].sprite;
              var fn = queue[THREAD].fn;
              BASE = queue[THREAD].base;
              CALLS = queue[THREAD].calls;
              C = CALLS.pop();
              STACK = C.stack;
              R = STACK.pop();
              queue[THREAD] = undefined;
              try {
                fn();
              } catch (e) {
                if (e !== STOP_THREAD) throw e;
                queue[THREAD] = undefined;
                continue;
              }
              STACK.push(R);
              CALLS.push(C);
            }
          }
          for (var i = queue.length; i--;) {
            if (!queue[i]) queue.splice(i, 1);
          }
        } while ((self.isTurbo || !VISUAL) && Date.now() - start < 1000 / this.framerate);
        this.draw();
        S = null;
      } catch (e) {
        this.handleError(e);
        clearInterval(this.interval);
      }
    };

    P.Stage.prototype.handleError = function() {
      console.error(e.stack);
    };

  }());

  return {
    scopedEval: function(source) {
      return eval(source);
    }
  };

}());
