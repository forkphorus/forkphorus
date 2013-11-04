var P = (function () {
  'use strict';

  var hasOwnProperty = {}.hasOwnProperty;

  var inherits = function (cla, sup) {
    cla.prototype = Object.create(sup.prototype);
    cla.parent = sup;
    cla.base = function (self, method /*, args... */) {
      return sup.prototype[method].call(self, [].slice.call(arguments, 2));
    };
  };

  var addEvents = function (cla /*, events... */) {
    [].slice.call(arguments, 1).forEach(function (event) {
      addEvent(cla, event);
    });
  };

  var addEvent = function (cla, event) {
    var capital = event[0].toUpperCase() + event.substr(1);

    cla.prototype.addEventListener = cla.prototype.addEventListener || function (event, listener) {
      var listeners = this['$' + event] = this['$' + event] || [];
      listeners.push(listener);
      return this;
    };

    cla.prototype.removeEventListener = cla.prototype.removeEventListener || function (event, listener) {
      var listeners = this['$' + event];
      if (listeners) {
        var i = listeners.indexOf(listener);
        if (i > -1) {
          listeners.splice(i, 1);
        }
      }
      return this;
    };

    cla.prototype.dispatchEvent = cla.prototype.dispatchEvent || function (event, arg) {
      var listeners = this['$' + event];
      if (listeners) {
        listeners.forEach(function (listener) {
          listener(arg);
        });
      }
      var listener = this['on' + event];
      if (listener) {
        listener(arg);
      }
      return this;
    };

    cla.prototype['on' + capital] = function (listener) {
      this.addEventListener(event, listener);
      return this;
    };

    cla.prototype['dispatch' + capital] = function (arg) {
      this.dispatchEvent(event, arg);
      return this;
    };
  };

  var Request = function () {
    this.loaded = 0;
  };
  addEvents(Request, 'load', 'progress', 'error');

  Request.prototype.progress = function (loaded, total, lengthComputable) {
    this.loaded = loaded;
    this.total = total;
    this.lengthComputable = lengthComputable;
    this.dispatchProgress({
      loaded: loaded,
      total: total,
      lengthComputable: lengthComputable
    });
  };

  Request.prototype.load = function (result) {
    this.result = result;
    this.isDone = true;
    this.dispatchLoad(result);
  };

  Request.prototype.error = function (error) {
    this.result = error;
    this.isError = true;
    this.isDone = true;
    this.dispatchError(error);
  };

  var CompositeRequest = function () {
    this.requests = [];
    this.update = this.update.bind(this);
    this.error = this.error.bind(this);
  };
  inherits(CompositeRequest, Request);

  CompositeRequest.prototype.add = function (request) {
    this.requests.push(request);
    request.addEventListener('progress', this.update);
    request.addEventListener('load', this.update);
    request.addEventListener('error', this.error);
    this.update();
  };

  CompositeRequest.prototype.update = function () {
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
    this.isDone = done === requests.length;
    if (this.isDone && !this.defer) {
      this.load(this.getResult());
    }
  };

  CompositeRequest.prototype.getResult = function () {
    throw new Error('Users must implement getResult()');
  };

  var IO = {};

  IO.BASE_URL = 'http://scratch.mit.edu/internalapi/'
  IO.PROJECT_URL = IO.BASE_URL + 'project/';
  IO.ASSET_URL = IO.BASE_URL + 'asset/';

  IO.PROXY_URL = 'proxy.php?u=';

  IO.load = function (url, callback, self) {
    var request = new Request;
    var xhr = new XMLHttpRequest;
    xhr.open('GET', IO.PROXY_URL + encodeURIComponent(url), true);
    xhr.onprogress = function (e) {
      request.progress(e.loaded, e.total, e.lengthComputable);
    };
    xhr.onload = function () {
      if (xhr.status === 200) {
        request.load(xhr.responseText);
      } else {
        request.error(new Error('HTTP ' + xhr.status + ': ' + xhr.statusText));
      }
    };
    xhr.onerror = function () {
      request.error(new Error('XHR Error'));
    };
    setTimeout(xhr.send.bind(xhr));

    if (callback) request.onLoad(callback.bind(self));
    return request;
  };

  IO.loadImage = function (url, callback, self) {
    var request = new Request;
    var image = new Image;
    image.src = url;
    image.onload = function () {
      request.load(image);
    };
    image.onerror = function () {
      request.error(new Error('Failed to load image'));
    };
    // var xhr = new XMLHttpRequest;
    // xhr.open('GET', IO.PROXY_URL + encodeURIComponent(url), true);
    // xhr.responseType = 'blob';
    // xhr.onprogress = function (e) {
    //   request.progress(e.loaded, e.total, e.lengthComputable);
    // };
    // xhr.onload = function (e) {
    //   if (xhr.status === 200) {
    //     var reader = new FileReader;
    //     reader.addEventListener('loadend', function () {
    //       var image = new Image;
    //       image.src = reader.result;
    //       image.onload = function () {
    //         request.load(image);
    //       };
    //     });
    //     reader.readAsDataURL(xhr.response);
    //   } else {
    //     request.error(new Error('HTTP ' + xhr.status + ': ' + xhr.statusText));
    //   }
    // };
    // xhr.onerror = function () {
    //   request.error(new Image('Failed to load image'));
    // };
    // xhr.send();

    if (callback) request.onLoad(callback.bind(self));
    return request;
  };

  IO.loadScratchr2Project = function (id, callback, self) {
    var request = IO.projectRequest = new CompositeRequest;

    request.defer = true;
    request.add(
      IO.load(IO.PROJECT_URL + id + '/get/')
        .addEventListener('load', function (contents) {
          try {
            var project = IO.openProject(JSON.parse(contents));
            if (callback) request.onLoad(callback.bind(self));
            if (request.isDone) {
              request.load(project);
            } else {
              request.defer = false;
              request.getResult = function () {
                return project;
              };
            }
          } catch (e) {
            request.error(e);
          }
        }));

    return request;
  };

  IO.openProject = function (data) {
    IO.projectData = data;
    return new Stage(data || {});
  };

  IO.openMap = function (data) {
    return data || {};
  };

  IO.openArray = function (data, unpack) {
    if (!data) return [];
    var result = [];
    for (var i = 0, l = data.length; i < l; ++i) {
      var item = unpack(data[i]);
      if (item) result.push(item);
    }
    return result;
  };

  IO.openObject = function (stage, data) {
    if (!data) return null;
    if (data.cmd) {
      return null; // TODO
    }
    return new Sprite(data, stage);
  };

  IO.openCostume = function (data) {
    return new Costume(data || {});
  };

  IO.openSound = function () {
    return null; // TODO
  };

  IO.openMD5 = function (md5, callback) {
    var ext = md5.split('.').pop();
    if (ext === 'png' || ext === 'svg') {
      return new ImageAsset(md5);
    }
    return null;
  };

  IO.EVENT_SELECTORS = [
    'whenClicked',
    'whenCloned',
    'whenGreenFlag',
    'whenIReceive',
    'whenKeyPressed',
    'whenSceneStarts',
    'whenSensorGreaterThan' // TODO
  ];

  IO.openScript = function (script) {
    return new Script(script[0], script[1], script[2]);
  };

  var Base = function (data) {
    this.isClone = !!data.isClone;
    this.costumes = this.isClone ? data.costumes : IO.openArray(data.costumes, IO.openCostume);
    this.currentCostumeIndex = data.currentCostumeIndex;
    this.objName = this.isClone ? '<clone>' + (++Base.id) : data.objName;
    this.sounds = this.isClone ? data.sounds : IO.openArray(data.sounds, IO.openSound);

    this.variables = {};
    this.varNames = {};
    if (this.isClone) {
      var vars = data.variables;
      for (var key in vars) if (hasOwnProperty.call(vars, key)) {
        this.variables[key] = vars[key];
        this.varNames[key] = true;
      }
    } else {
      if (data.variables) this.addVariables(data.variables);
    }

    this.lists = {};
    this.listNames = {};
    if (this.isClone) {
      var lists = data.lists;
      for (key in lists) if (hasOwnProperty.call(lists, key)) {
        this.lists[key] = new List(lists[key].contents);
        this.listNames[key] = true;
      }
    } else {
      if (data.lists) this.addLists(data.lists);
    }

    this.listeners = {};
    this.procedures = {};
    this.scripts = [];
    if (this.isStage) this.tempListeners = {};
    if (data.scripts) this.addScripts(data.scripts);

    this.filters = {
      color: 0,
      fisheye: 0,
      whirl: 0,
      pixelate: 0,
      mosaic: 0,
      brightness: 0,
      ghost: 0
    };

    this.element = document.createElement('div');
    this.element.style.position = 'absolute';

    var costume = this.costumes[this.currentCostumeIndex];
    if (costume) {
      if (costume.isLoaded) {
        this.switchCostume();
      } else {
        costume.addEventListener('load', this.switchCostume.bind(this));
      }
    }
  };
  Base.id = 1;

  Base.prototype.addScripts = function (scripts) {
    for (var i = 0, l = scripts.length; i < l; ++i) {
      var s = scripts[i] && scripts[i][2];
      if (s) {
        this.addScript(s);
        this.scripts.push(scripts[i]);
      }
    }
  };

  Base.prototype.addScript = function (script) {
    var h = script[0];
    var bh = script.slice(1);
    var listeners = this.isClone ? this.stage.tempListeners : this.stage.listeners;
    var locals = this.listeners;

    if (!bh.length) return;

    if (h[0] === 'procDef') {
      this.procedures[h[1]] = new Procedure(h, bh);
    } else if (IO.EVENT_SELECTORS.indexOf(h[0]) > -1) {
      var event = h[0];
      if (h[0] === 'whenClicked') {
        event += ':' + this.objName;
      }
      if (h[1]) {
        event += ':' + h[1].toLowerCase();
      }
      var s = new Script(this, bh);
      if (listeners[event]) {
        listeners[event].push(s);
      } else {
        listeners[event] = [s];
      }
      if (locals[event]) {
        locals[event].push(s);
      } else {
        locals[event] = [s];
      }
    }
  };

  Base.prototype.addVariables = function (variables) {
    for (var i = variables.length; i--;) {
      var v = variables[i];
      if (v.isPeristent) {
        throw new Error('Cloud variables are not supported');
      }
      this.variables[v.name] = v.value;
      this.varNames[v.name] = true;
    }
  };

  Base.prototype.addLists = function (lists) {
    for (var i = lists.length; i--;) {
      var v = lists[i];
      if (v.isPeristent) {
        throw new Error('Cloud lists are not supported');
      }
      this.lists[v.listName] = new List(v.contents);
      this.listNames[v.listName] = true;
      // TODO list watchers
    }
  };

  Base.prototype.switchCostume = function () {
    if (this.currentCostume) {
      this.element.removeChild(this.currentCostume.image);
    }
    this.currentCostume = this.costumes[this.currentCostumeIndex];
    this.element.insertBefore(this.currentCostume.image, this.element.childNodes[0]);
    this.updateFilters();
  };

  Base.prototype.setCurrentCostumeIndex = function (i) {
    this.currentCostumeIndex = i;
    this.switchCostume();
  };

  Base.prototype.showNextCostume = function () {
    this.setCurrentCostumeIndex((this.currentCostumeIndex + 1) % this.costumes.length);
  };

  Base.prototype.showPreviousCostume = function () {
    var length = this.costumes.length;
    this.setCurrentCostumeIndex((this.currentCostumeIndex + length - 1) % length);
  };

  Base.prototype.setCostume = function (costume) {
    costume = '' + costume;
    var costumes = this.costumes;
    var i = costumes.length;
    while (i--) {
      var c = costumes[i];
      if (c.costumeName === costume) {
        this.setCurrentCostumeIndex(i);
        return;
      }
    }
    i = (num(costume) - 1) % costumes.length;
    if (i < 0) i += costumes.length;
    this.setCurrentCostumeIndex(i);
  };

  Base.prototype.getVariable = function (name) {
    return zeroNull(this.variables[name]);
  };

  Base.prototype.setVariable = function (name, value) {
    this.variables[name] = value;
  };

  Base.prototype.getList = function (name) {
    return this.lists[name];
  };

  Base.prototype.setFilter = function (name, value) {
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
    this.updateFilters();
  };

  Base.prototype.resetFilters = function () {
    this.filters = {
      color: 0,
      fisheye: 0,
      whirl: 0,
      pixelate: 0,
      mosaic: 0,
      brightness: 0,
      ghost: 0
    };
    this.updateFilters();
  };

  Base.prototype.updateFilters = function () {
    if (!this.currentCostume) return;
    this.currentCostume.image.style.opacity = 1 - this.filters.ghost / 100;
    this.currentCostume.image.style.WebkitFilter =
      'brightness(' + (this.filters.brightness / 100 + 1) + ') ' +
      'hue-rotate(' + (this.filters.color * 360 / 200) + 'deg)';
  };

  var Stage = function (data) {
    this.stage = this;
    Stage.parent.call(this, data);

    this.children = IO.openArray(data.children, IO.openObject.bind(IO, this));
    this.info = IO.openMap(data.info);
    this.penLayer = new CanvasAsset(480, 360);
    this.penContext = this.penLayer.image.getContext('2d');
    this.tempoBPM = data.tempoBPM;
    this.videoAlpha = data.videoAlpha;

    this.zoom = 1;
    this.timerStart = 0;
    this.cloneCount = 0;

    this.keys = {};
    this.mouseX = 0;
    this.mouseY = 0;
    this.mousePressed = false;

    this.element.tabIndex = 0;
    this.element.style.outline = 'none';
    this.element.style.overflow = 'hidden';
    this.element.style.WebkitUserSelect =
    this.element.style.MozUserSelect =
    this.element.style.MsUserSelect =
    this.element.style.userSelect = 'none';

    this.element.style.background = '#fff';
    this.element.style.width = '480px';
    this.element.style.height = '360px';

    // hardware acceleration
    this.element.style.WebkitTransform = 'translateZ(0)';

    this.element.appendChild(this.penLayer.image);
    this.penLayer.image.style.position = 'absolute';
    this.penLayer.image.style.left = 0;
    this.penLayer.image.style.top = 0;
    this.penLayer.image.style.zIndex = -1;

    var children = this.children;
    var i = children.length;
    while (i--) {
      this.element.appendChild(children[i].element);
    }

    this.updateZ();

    this.element.addEventListener('mousedown', function (e) {
      var t = e.target;
      while (t && t !== this.element) {
        t = t.parentNode;
        if (t.className === 'watcher') return;
      }
      e.preventDefault();
      this.element.focus();
    }.bind(this));

    this.element.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }
      var keyName = getKeyName(e.keyCode);
      this.keys[keyName] = true;
      this.trigger('whenKeyPressed:' + keyName);
      e.stopPropagation();
      e.preventDefault();
    }.bind(this));

    this.element.addEventListener('keyup', function (e) {
      this.keys[getKeyName(e.keyCode)] = false;
      e.stopPropagation();
      e.preventDefault();
    }.bind(this));

    document.addEventListener('mousemove', function (e) {
      var bb = this.element.getBoundingClientRect();
      var x = (e.clientX - bb.left) / this.zoom - 240;
      var y = 180 - (e.clientY - bb.top) / this.zoom;
      if (x < -240) x = -240;
      if (x > 240) x = 240;
      if (y < -180) y = -180;
      if (y > 180) y = 180;
      this.mouseX = x;
      this.mouseY = y;
    }.bind(this));

    this.element.addEventListener('mousedown', function (e) {
      this.mousePressed = true;
    }.bind(this));

    document.addEventListener('mouseup', function (e) {
      this.mousePressed = false;
    }.bind(this));
  };
  inherits(Stage, Base);

  Stage.MAX_CLONES = 300;

  Stage.prototype.isStage = true;

  Stage.prototype.add = function (child) {
    this.children.push(child);
    this.element.appendChild(child.element);
  };

  Stage.prototype.trigger = function (event) {
    if (this.interpreter) this.interpreter.trigger(event);
  };

  Stage.prototype.switchCostume = function () {
    Stage.base(this, 'switchCostume');
    this.currentCostume.image.style.zIndex = '-2';

    this.currentCostume.image.style.WebkitTransformOrigin =
    this.currentCostume.image.style.MozTransformOrigin =
    this.currentCostume.image.style.msTransformOrigin =
    this.currentCostume.image.style.OTransformOrigin =
    this.currentCostume.image.style.transformOrigin = '0 0';

    this.currentCostume.image.style.WebkitTransform =
    this.currentCostume.image.style.MozTransform =
    this.currentCostume.image.style.msTransform =
    this.currentCostume.image.style.OTransform =
    this.currentCostume.image.style.transform =
      'scale(' + (1 / this.currentCostume.bitmapResolution) + ')';
  };

  Stage.prototype.updateZ = function () {
    var children = this.children;
    for (var i = 0, l = children.length; i < l; ++i) {
      children[i].element.style.zIndex = i;
    }
  };

  Stage.prototype.resetAllFilters = function () {
    var children = this.children;
    var i = children.length;
    while (i--) {
      children[i].resetFilters();
    }
    this.resetFilters();
  };

  Stage.prototype.removeAllClones = function () {
    var children = this.children;
    var i = children.length;
    while (i--) {
      if (children[i].isClone) {
        this.element.removeChild(children[i].element);
        children.splice(i, 1);
      }
    }
    this.tempListeners = {};
    this.cloneCount = 0;
  };

  Stage.prototype.getObject = function (name) {
    var children = this.children;
    var i = children.length;
    while (i--) {
      if (children[i].objName === name) {
        return children[i];
      }
    }
  };

  Stage.prototype.moveBy =
  Stage.prototype.moveTo =
  Stage.prototype.setVisible = function () {};

  var KEY_NAMES = {
    32: 'space',
    37: 'left arrow',
    38: 'up arrow',
    39: 'right arrow',
    40: 'down arrow'
  };

  var getKeyName = function (keyCode) {
    return KEY_NAMES[keyCode] || String.fromCharCode(keyCode);
  };

  var Sprite = function (data, stage) {
    this.stage = stage;
    Sprite.parent.call(this, data);

    this.direction = data.direction;
    this.indexInLibrary = data.indexInLibrary;
    this.isDraggable = data.isDraggable;
    this.rotationStyle = data.rotationStyle;
    this.scale = data.scale;
    this.scratchX = data.scratchX;
    this.scratchY = data.scratchY;
    this.spriteInfo = data.spriteInfo;
    this.visible = data.visible;

    this.penColor = this.isClone ? data.penColor : 0x0000ff;
    this.penSize = this.isClone ? data.penSize : 1;
    this.isPenDown = this.isClone ? data.isPenDown : false;

    this.element.addEventListener('click', function (e) {
      this.stage.trigger('whenClicked:' + this.objName);
    }.bind(this));

    this.updateVisible();
  };
  inherits(Sprite, Base);

  Sprite.prototype.copy = function () {
    var sprite = new Sprite({
      isClone: true,
      costumes: this.costumes.map(function (costume) {
        return costume.copy();
      }),
      sounds: this.sounds.map(function (sound) {
        return sound.copy();
      }),
      currentCostumeIndex: this.currentCostumeIndex,
      objName: this.objName,
      variables: this.variables,
      lists: this.lists,
      filters: {
        color: this.filters.color,
        fisheye: this.filters.fisheye,
        whirl: this.filters.whirl,
        pixelate: this.filters.pixelate,
        mosaic: this.filters.mosaic,
        brightness: this.filters.brightness,
        ghost: this.filters.ghost
      },
      scripts: this.scripts,

      direction: this.direction,
      isDraggable: this.isDraggable,
      rotationStyle: this.rotationStyle,
      scale: this.scale,
      scratchX: this.scratchX,
      scratchY: this.scratchY,
      spriteInfo: this.spriteInfo,
      visible: this.visible,

      penColor: this.penColor,
      penSize: this.penSize,
      isPenDown: this.isPenDown
    }, this.stage);
    sprite.procedures = this.procedures;
    return sprite;
  };

  Sprite.prototype.getVariable = function (name) {
    if (this.varNames[name]) {
      return zeroNull(this.variables[name]);
    }
    return this.stage.getVariable(name);
  };

  Sprite.prototype.setVariable = function (name, value) {
    if (this.varNames[name]) {
      this.variables[name] = value;
    } else {
      this.stage.setVariable(name, value);
    }
  };

  Sprite.prototype.getList = function (name) {
    if (this.listNames[name]) {
      return this.lists[name];
    }
    return this.stage.getList(name);
  };

  Sprite.prototype.switchCostume = function () {
    Sprite.base(this, 'switchCostume');
    this.updateTransform();
  };

  Sprite.prototype.setVisible = function (visible) {
    this.visible = visible;
    this.updateVisible();
  };

  Sprite.prototype.updateVisible = function () {
    this.element.style.display = this.visible ? 'block' : 'none';
    if (this.visible && this.currentCostume) {
      this.updateTransform();
    }
  };

  Sprite.prototype.updateTransform = function () {
    if (!this.visible) return;

    var x = 240 + (this.scratchX - this.currentCostume.rotationCenterX);
    var y = 180 - (this.scratchY + this.currentCostume.rotationCenterY);
    this.element.style.WebkitTransform =
    this.element.style.MozTransform =
    this.element.style.msTransform =
    this.element.style.OTransform =
    this.element.style.transform =
      'translate(' + x + 'px, ' + y + 'px) ' +
      'rotate(' + (this.direction - 90) + 'deg)' +
      'scale(' + (this.scale / this.currentCostume.bitmapResolution) + ')';

    this.element.style.WebkitTransformOrigin =
    this.element.style.MozTransformOrigin =
    this.element.style.msTransformOrigin =
    this.element.style.OTransformOrigin =
    this.element.style.transformOrigin =
      this.currentCostume.rotationCenterX + 'px ' +
      this.currentCostume.rotationCenterY + 'px';

    // this.element.style.display = 'none';
    // this.element.offsetHeight;
    // this.element.style.display = 'block';
  };

  Sprite.prototype.moveBy = function (x, y) {
    this.moveTo(this.scratchX + x, this.scratchY + y);
  };

  Sprite.prototype.moveTo = function (x, y) {
    var ox = this.scratchX;
    var oy = this.scratchY;
    this.scratchX = x;
    this.scratchY = y;
    this.keepOnStage();
    if (this.isPenDown) this.stroke(ox, oy, x, y);
    this.updateTransform();
  };

  Sprite.prototype.stroke = function (ox, oy, x, y) {
    var hex = this.penColor.toString(16);
    while (hex.length < 6) hex = '0' + hex;
    var context = this.stage.penContext;
    context.strokeStyle = '#' + hex;
    context.lineCap = 'round';
    context.lineWidth = this.penSize;
    context.beginPath();
    if (Math.abs(this.penSize % 2 - 1) < .0001) {
      ox -= .5;
      oy -= .5;
      x -= .5;
      y -= .5;
    }
    context.moveTo(240 + ox, 180 - oy);
    context.lineTo(240 + x, 180 - y);
    context.stroke();
  };

  Sprite.prototype.stamp = function () {
    var context = this.stage.penContext;
    context.save();
    context.translate(-this.currentCostume.rotationCenterX, -this.currentCostume.rotationCenterY);
    var scale = this.scale / this.currentCostume.bitmapResolution;
    context.scale(scale, scale);
    context.rotate((this.direction - 90) * Math.PI / 180);
    context.translate(this.currentCostume.rotationCenterX / scale, this.currentCostume.rotationCenterY / scale);
    context.translate((this.scratchX + 240) / scale, (180 - this.scratchY) / scale);
    context.globalAlpha = 1 - this.filters.ghost / 100;
    context.drawImage(this.currentCostume.baseLayer.image, 0, 0);
    context.restore();
  };

  Sprite.prototype.keepOnStage = function () {
    // TODO
  };

  Sprite.prototype.setDirection = function (degrees) {
    var d = degrees % 360;
    if (d > 180) d -= 360;
    if (d <= -180) d += 360;
    this.direction = d;
    this.updateTransform();
  };

  Sprite.prototype.setScale = function (scale) {
    this.scale = scale;
    this.updateTransform();
  };

  var Costume = function (data, baseLayer) {
    this.baseLayerID = data.baseLayerID;
    this.baseLayerMD5 = data.baseLayerMD5;
    this.baseLayer = baseLayer ? baseLayer.copy() : IO.openMD5(data.baseLayerMD5);
    this.bitmapResolution = data.bitmapResolution || 1;
    this.costumeName = data.costumeName;
    this.rotationCenterX = data.rotationCenterX;
    this.rotationCenterY = data.rotationCenterY;

    this.image = document.createElement('div');
    this.isLoaded = this.baseLayer.isLoaded;
    if (this.isLoaded) {
      this.createImage();
    } else {
      this.baseLayer.addEventListener('load', function () {
        this.createImage();
        this.dispatchEvent('load', this);
      }.bind(this));
    }
  };
  addEvents(Costume, 'load');

  Costume.prototype.copy = function () {
    return new Costume({
      baseLayerID: this.baseLayerID,
      baseLayerMD5: this.baseLayerMD5,
      bitmapResolution: this.bitmapResolution,
      costumeName: this.costumeName,
      rotationCenterX: this.rotationCenterX,
      rotationCenterY: this.rotationCenterY
    }, this.baseLayer);
  };

  Costume.prototype.createImage = function () {
    this.image.appendChild(this.baseLayer.image);

    this.image.width = this.baseLayer.image.width;
    this.image.height = this.baseLayer.image.height;
    this.image.style.width = this.image.width + 'px';
    this.image.style.height = this.image.height + 'px';

    this.image.style.position = 'absolute';
    this.image.style.left = 0;
    this.image.style.top = 0;
  };

  var ImageAsset = function (md5, image) {
    this.md5 = md5;
    this.isLoaded = !!image;
    if (image) {
      this.image = new Image;
      this.image.src = image.src;
    } else {
      IO.projectRequest.add(
        IO.loadImage(IO.ASSET_URL + md5 + '/get/', function (result) {
          this.isLoaded = true;
          this.image = result;
          this.dispatchEvent('load', this);
        }, this));
    }
  };
  addEvents(ImageAsset, 'load');

  ImageAsset.prototype.copy = function () {
    return new ImageAsset(this.md5, this.image);
  };

  var CanvasAsset = function (width, height) {
    this.isLoaded = true;
    this.image = document.createElement('canvas');
    this.image.width = width;
    this.image.height = height;
  };

  var Script = function (target, expression) {
    this.target = target;
    this.expression = expression;
  };

  var Procedure = function (data, expression) {
    this.spec = data[1];
    this.inputs = data[2];
    this.defaults = data[3];
    this.isAtomic = data[4];
    this.expression = expression;
  };

  var List = function (contents) {
    this.contents = contents;
  };

  List.prototype.index = function (index, max) {
    if (max == null) max = this.contents.length;
    if (index === 'random' || index === 'any') {
      return Math.floor(Math.random() * max);
    }
    if (index === 'last') {
      return this.contents.length - 1;
    }
    if (+index !== +index) {
      return -1;
    }
    index = Math.floor(index) - 1;
    return index < 0 || index >= this.contents.length ? - 1 : index;
  };

  List.prototype.isAllChars = function () {
    var contents = this.contents;
    var i = contents.length;
    while (i--) {
      if (('' + contents[i]).length !== 1) {
        return false;
      }
    }
    return true;
  };

  List.prototype.toString = function () {
    var s = '';
    this.contents.join(this.isAllChars() ? '' : ' ');
  };

  List.prototype.add = function (value) {
    this.contents.push(value);
  };

  List.prototype.delete = function (index) {
    if (index === 'all') {
      this.contents = [];
    } else {
      var i = this.index(index);
      if (i !== -1) {
        this.contents.splice(i, 1);
      }
    }
  };

  List.prototype.insert = function (index, value) {
    if (index === 'last') {
      this.add(value);
    } else {
      var i = this.index(index, this.contents.length + 1);
      if (i !== -1) {
        this.contents.splice(i, 0, value);
      }
    }
  };

  List.prototype.put = function (index, value) {
    var i = this.index(index);
    if (i !== -1) {
      this.contents[i] = value;
    }
  };

  List.prototype.get = function (index) {
    return zeroNull(this.contents[this.index(index)]);
  };

  List.prototype.length = function () {
    return this.contents.length;
  };

  List.prototype.contains = function (value) {
    var contents = this.contents;
    var i = contents.length;
    while (i--) {
      if (compare(contents[i], value) === 0) {
        return true;
      }
    }
    return false;
  };

  var Interpreter = function (stage) {
    this.threads = [];
    this.stage = stage;
    this.framerate = 1000 / 30;
    this.isTurbo = false;
    this.now = 0;
    this.lastTime = Date.now();

    this.step = this.step.bind(this);

    stage.interpreter = this;
  };

  Interpreter.prototype.startThread = function (script, event) {
    this.stopThread(script);
    this.threads.push(new Thread(this, script, event));
    this.lazilyStart();
  };

  Interpreter.prototype.stopThread = function (script) {
    var expression = script.expression;
    var threads = this.threads;
    var i = threads.length;
    while (i--) {
      if (threads[i].top === expression) {
        threads.splice(i, 1);
      }
    }
  };

  Interpreter.prototype.stopThreadsFor = function (target, exceptCurrent) {
    var threads = this.threads;
    var i = threads.length;
    while (i--) {
      var t = threads[i];
      if (t.target === target && (!exceptCurrent || t !== this.currentThread)) {
        t.shouldStop = true;
      }
    }
  };

  Interpreter.prototype.trigger = function (event) {
    var listeners = this.stage.listeners[event];
    var tl = this.stage.tempListeners[event];
    if (!listeners && !tl) return;
    if (listeners) {
      for (var i = 0, l = listeners.length; i < l; ++i) {
        this.startThread(listeners[i], event);
      }
    }
    if (tl) {
      for (var i = 0, l = tl.length; i < l; ++i) {
        this.startThread(tl[i], event);
      }
    }
  };
  Interpreter.prototype.triggerFor = function (target, event) {
    var listeners = target.listeners[event];
    if (!listeners) return;
    for (var i = 0, l = listeners.length; i < l; ++i) {
      this.startThread(listeners[i], event);
    }
  };

  Interpreter.prototype.triggerGreenFlag = function () {
    this.stop();
    this.trigger('whenGreenFlag');
  };

  Interpreter.prototype.hasTrigger = function (event) {
    var threads = this.threads;
    var i = threads.length;
    while (i--) {
      if (threads[i].event === event) {
        return true;
      }
    }
    return false;
  };

  Interpreter.prototype.start = function () {
    this.isRunning = true;
    if (this.interval) return;
    this.lastTime = Date.now();
    this.interval = setInterval(this.step, this.framerate);
  };

  Interpreter.prototype.lazilyStart = function () {
    if (this.isRunning && !this.interval) {
      this.now += Date.now() - this.paused;
      this.start();
    }
  };

  Interpreter.prototype.pause = function () {
    if (this.interval) {
      clearInterval(this.interval);
      delete this.interval;
    }
    this.isRunning = false;
  };

  Interpreter.prototype.stop = function () {
    this.threads = [];
    this.lazilyPause();
    this.stage.resetAllFilters();
    this.stage.removeAllClones();
  };

  Interpreter.prototype.lazilyPause = function () {
    if (this.interval) {
      clearInterval(this.interval);
      delete this.interval;
      this.paused = Date.now();
    }
  };

  Interpreter.prototype.step = function () {
    this.now += Date.now() - this.lastTime;
    this.lastTime = Date.now();
    var time = Date.now();
    var threads = this.threads;
    do {
      for (var i = 0, l = threads.length; i < l; ++i) {
        this.currentThread = threads[i];
        this.currentThread.step();
      }
      i = threads.length;
      while (i--) {
        if (threads[i].isDone) {
          threads.splice(i, 1);
        }
      }
      if (!threads.length) {
        this.lazilyPause();
        return;
      }
    } while (this.isTurbo && Date.now() - time < this.framerate - 3);
  };

  var Thread = function (interpreter, script, event) {
    this.interpreter = interpreter;
    this.target = script.target;
    this.top = script.expression;
    this.stack = [new StackFrame(script.expression)];
    this.callStack = [];
    this.isDone = false;
    this.shouldStop = false;
    this.shouldYield = false;
    this.event = event;
  };

  Thread.prototype.step = function () {
    this.shouldYield = false;
    this.warp = 0;
    while (!this.shouldStop && (!this.shouldYield || this.warp)) {
      if (!this.stack.length) {
        this.isDone = true;
        break;
      }
      this.frame = this.stack[this.stack.length - 1];
      try {
        this.eval(this.frame.expression);
      } catch (e) {
        console.error(e);
        this.shouldStop = true;
      }
    }
    if (this.shouldStop) {
      this.isDone = true;
    }
  };

  Thread.prototype.push = function (expression) {
    this.stack.push(new StackFrame(expression));
  };

  Thread.prototype.pushInternal = function (selector) {
    this.stack.push(new StackFrame([selector]));
  };

  Thread.prototype.pushYield = function () {
    this.pushInternal('yield_');
  };

  Thread.prototype.pop = function () {
    this.stack.pop();
  };

  Thread.prototype.eval = function (expression) {
    if (typeof expression === 'number' || typeof expression === 'string') {
      return expression;
    }
    if (!expression) {
      return this.pop();
    }
    if (expression.slice) {
      if (typeof expression[0] === 'string') {
        return this.evalBlock(expression);
      }
      return this.evalSequence(expression);
    }
  };

  Thread.prototype.arg = function (expression) {
    return typeof expression === 'object' ?
      this.callBlock(expression) :
      expression;
  };

  Thread.prototype.evalSequence = function (expression) {
    if (this.frame.tmp == null) {
      this.frame.tmp = 0;
    }
    if (this.frame.tmp >= expression.length) {
      this.pop();
      return;
    }
    this.push(expression[this.frame.tmp]);
    this.frame.tmp += 1;
  };

  Thread.prototype.evalBlock = function (expression) {
    var selector = expression[0];
    if (hasOwnProperty.call(this.specialForms, selector)) {
      return this.specialForms[selector].call(this, expression);
    }
    this.pop();
    return this.callBlock(expression);
  };

  Thread.prototype.callBlock = function (expression) {
    var selector = expression[0];
    var args = [];
    for (var i = 1, l = expression.length; i < l; ++i) {
      args.push(this.arg(expression[i]));
    }
    if (hasOwnProperty.call(this.primitives, selector)) {
      return this.primitives[selector].apply(this.target, args);
    } else {
      if (!Thread.warnings[selector]) {
        console.warn('Unimplemented:', selector);
        Thread.warnings[selector] = true;
      }
    }
  };

  var bool = function (x) {
    x = x + '';
    return x !== 'false' && x !== '0' && x !== '';
  };

  var num = function (x) {
    return +x || 0;
  };

  var color = function (x) {
    return Math.floor(num(x)) & 0xffffff;
  };

  var zeroNull = function (x) {
    return x == null ? '0' : '' + x;
  };

  var compare = function (x, y) {
    if (+x === +x && +y === +y) {
      return +x < +y ? -1 : +x === +y ? 0 : 1;
    }
    return '' + x < '' + y ? -1 : '' + x === '' + y ? 0 : 1;
  };

  Thread.warnings = {};

  var specialForms = Thread.prototype.specialForms = {};
  specialForms['broadcast:'] = function (e) {
    this.interpreter.trigger('whenIReceive:' + ('' + this.arg(e[1])).toLowerCase());
    this.pop();
  };
  specialForms['call'] = function (e) {
    var procedure = this.target.procedures[e[1]];
    this.pop();
    if (!procedure) return;

    var args = {};
    for (var i = 2, l = e.length; i < l; ++i) {
      args[procedure.inputs[i - 2]] = this.arg(e[i]);
    }

    this.callStack.push({
      procedure: procedure,
      arguments: args
    });

    if (procedure.isAtomic) {
      this.warp += 1;
    }

    this.pushInternal('endCall_');
    this.push(procedure.expression);
  };
  specialForms['doBroadcastAndWait'] = function (e) {
    if (this.frame.tmp == null) {
      this.frame.tmp = 'whenIReceive:' + ('' + this.arg(e[1])).toLowerCase();
      this.interpreter.trigger(this.frame.tmp);
    }
    if (!this.interpreter.hasTrigger(this.frame.tmp)) {
      this.pop();
    }
    this.shouldYield = true;
  };
  specialForms['doForever'] = function (e) {
    this.pushYield();
    this.push(e[1]);
  };
  specialForms['doForeverIf'] = function () {
    if (bool(this.arg(e[1]))) {
      this.pushYield();
      this.push(e[2]);
    } else {
      this.shouldYield = true;
    }
  };
  // doForLoop
  specialForms['doIf'] = function (e) {
    this.pop();
    if (bool(this.arg(e[1]))) {
      this.push(e[2]);
    }
  };
  specialForms['doIfElse'] = function (e) {
    this.pop();
    if (bool(this.arg(e[1]))) {
      this.push(e[2]);
    } else {
      this.push(e[3]);
    }
  };
  specialForms['doRepeat'] = function (e) {
    if (this.frame.tmp == null) {
      // Scratch 1.4 uses ceil; Scratch 2.0 uses round
      this.frame.tmp = Math.ceil(num(this.arg(e[1])));
    }
    if (this.frame.tmp > 0) {
      this.frame.tmp -= 1;
      this.pushYield();
      this.push(e[2]);
    } else {
      this.pop();
    }
  };
  specialForms['doReturn'] = function (e) {
    while (true) {
      if (!this.stack.length) return;
      var e = this.stack[this.stack.length - 1].expression;
      if (e[0] === 'endCall_') {
        this.pop();
        return;
      }
      this.pop();
    }
  };
  specialForms['doUntil'] = function (e) {
    if (bool(this.arg(e[1]))) {
      this.pop();
    } else {
      this.pushYield();
      this.push(e[2]);
    }
  };
  specialForms['doWhile'] = function (e) {
    if (!bool(this.arg(e[1]))) {
      this.pop();
    } else {
      this.pushYield();
      this.push(e[2]);
    }
  };
  specialForms['doWaitUntil'] = function (e) {
    if (bool(this.arg(e[1]))) {
      this.pop();
    } else {
      this.shouldYield = true;
    }
  };
  specialForms['glideSecs:toX:y:elapsed:from:'] = function (e) {
    if (this.frame.tmp == null) {
      this.frame.tmp = num(this.arg(e[1])) * 1000;
      this.frame.ox = this.target.scratchX;
      this.frame.oy = this.target.scratchY;
      this.frame.x = num(this.arg(e[2])) - this.frame.ox;
      this.frame.y = num(this.arg(e[3])) - this.frame.oy;
      this.frame.start = this.interpreter.now;
    }
    var delta = this.interpreter.now - this.frame.start;
    var f = delta / this.frame.tmp;
    if (delta > this.frame.tmp) {
      this.pop();
      f = 1;
    }
    this.target.moveTo(this.frame.ox + this.frame.x * f, this.frame.oy + this.frame.y * f);
    this.shouldYield = true;
  };
  specialForms['startSceneAndWait'] = function (e) {
    if (this.frame.tmp == null) {
      this.primitives.showBackground.call(this, this.arg(e[1]));
      this.frame.tmp = 'whenSceneStarts:' + this.target.stage.currentCostume.costumeName.toLowerCase();
    }
    if (!this.hasTrigger(this.frame.tmp)) {
      this.pop();
    }
    this.shouldYield = true;
  };
  specialForms['stopAll'] = function () {
    this.pop();
    this.interpreter.stop();
    this.shouldStop = true;
  };
  specialForms['stopScripts'] = function (e) {
    switch (this.arg(e[1])) {
      case 'all':
        this.specialForms.stopAll.call(this);
        return;
      case 'this script':
        this.specialForms.doReturn.call(this);
        return;
      case 'other scripts in sprite':
      case 'other scripts in stage':
        this.interpreter.stopThreadsFor(this.target, true);
        this.pop();
        return;
    }
    console.warn('Unrecognized stopScripts argument', e);
  };
  specialForms['wait:elapsed:from:'] = function (e) {
    if (this.frame.tmp == null) {
      this.frame.tmp = num(this.arg(e[1])) * 1000;
      this.frame.start = this.interpreter.now;
    }
    if (this.interpreter.now - this.frame.start > this.frame.tmp) {
      this.pop();
    }
    this.shouldYield = true;
  };
  specialForms['warpSpeed'] = function (e) {
    this.warp += 1;
    this.pop();
    this.pushInternal('endWarpSpeed_');
    this.push(e[1]);
  };

  // Internal
  specialForms['yield_'] = function () {
    this.pop();
    this.shouldYield = true;
  };
  specialForms['endCall_'] = function () {
    var call = this.callStack.pop();
    this.pop();
    if (call.procedure.isAtomic) {
      this.warp -= 1;
    }
  };
  specialForms['endWarpSpeed_'] = function () {
    this.pop();
    this.warp -= 1;
  };

  var primitives = Thread.prototype.primitives = {};

  // Motion
  primitives['forward:'] = function (steps) {
    var t = Math.PI / 2 - this.direction * Math.PI / 180;
    var r = num(steps);
    this.moveBy(r * Math.cos(t), r * Math.sin(t));
  };
  primitives['turnRight:'] = function (degrees) {
    this.setDirection(this.direction + num(degrees));
  };
  primitives['turnLeft:'] = function (degrees) {
    this.setDirection(this.direction - num(degrees));
  };
  primitives['heading:'] = function (degrees) {
    this.setDirection(num(degrees));
  };
  // primitives['pointTowards:'] = function () {};
  primitives['gotoX:y:'] = function (x, y) {
    this.moveTo(num(x), num(y));
  };
  // primitives['gotoSpriteOrMouse:'] = function () {};
  primitives['changeXposBy:'] = function (x) {
    this.moveBy(num(x), 0);
  };
  primitives['xpos:'] = function (x) {
    this.moveTo(num(x), this.scratchY);
  };
  primitives['changeYposBy:'] = function (y) {
    this.moveBy(0, num(y));
  };
  primitives['ypos:'] = function (y) {
    this.moveTo(this.scratchX, num(y));
  };
  // primitives['bounceOffEdge'] = function () {};
  primitives['xpos'] = function () {
    return this.scratchX;
  };
  primitives['ypos'] = function () {
    return this.scratchY;
  };
  primitives['heading'] = function () {
    return this.direction;
  };

  // Looks
  primitives['lookLike:'] = function (costume) {
    this.setCostume(costume);
  };
  primitives['nextCostume'] = function () {
    this.showNextCostume();
  };
  primitives['costumeIndex'] = function () {
    return this.currentCostumeIndex + 1;
  };
  primitives['costumeName'] = function () {
    return this.currentCostume.costumeName;
  };
  primitives['showBackground:'] = function (costume) {
    if (costume === 'next backdrop') {
      this.stage.showNextCostume();
    } else if (costume === 'previous backdrop') {
      this.stage.showPreviousCostume();
    } else {
      this.stage.setCostume(costume);
    }
    this.stage.interpreter.trigger('whenSceneStarts:' + this.stage.currentCostume.costumeName.toLowerCase());
  };
  primitives['nextBackground'] = function () {
    this.stage.showNextCostume();
  };
  primitives['backgroundIndex'] = function () {
    return this.stage.currentCostumeIndex + 1;
  };
  primitives['sceneName'] = function () {
    return this.stage.currentCostume.costumeName;
  };
  primitives['nextScene'] = primitives['nextBackground'];
  primitives['startScene'] = primitives['showBackground:'];
  // startSceneAndWait (special form)
  // primitives['say:duration:elapsed:from:'] = function () {};
  // primitives['say:'] = function () {};
  // primitives['think:duration:elapsed:from:'] = function () {};
  // primitives['think:'] = function () {};
  primitives['changeGraphicEffect:by:'] = function (name, value) {
    this.setFilter(name, this.filters[name] + num(value));
  };
  primitives['setGraphicEffect:to:'] = function (name, value) {
    this.setFilter(name, num(value));
  };
  primitives['filterReset'] = function () {
    this.resetFilters();
  };
  primitives['changeSizeBy:'] = function (scale) {
    this.setScale(this.scale + num(scale) / 100);
  };
  primitives['setSizeTo:'] = function (scale) {
    this.setScale(num(scale) / 100);
  };
  // primitives['scale'] = function () {};
  primitives['show'] = function () {
    this.setVisible(true);
  };
  primitives['hide'] = function () {
    this.setVisible(false);
  };
  primitives['comeToFront'] = function () {
    var children = this.stage.children;
    var i = children.indexOf(this);
    if (i > -1) {
      children.splice(i, 1);
    }
    children.push(this);
    this.stage.updateZ();
  };
  primitives['goBackByLayers:'] = function (layers) {
    var children = this.stage.children;
    var i = children.indexOf(this);
    if (i > -1) {
      children.splice(i, 1);
    }
    i -= Math.round(num(layers));
    if (i < 0) i = 0;
    children.splice(i, 0, this);
  };
  // primitives['setVideoState'] = function () {};
  // primitives['setVideoTransparency'] = function () {};
  // primitives['setRotationStyle'] = function () {};

  // Sound
  // primitives['playSound:'] = function () {};
  // primitives['doPlaySoundAndWait'] = function () {};
  // primitives['stopAllSounds'] = function () {};
  // primitives['drum:duration:elapsed:from:'] = function () {};
  // primitives['playDrum'] = function () {};
  // primitives['rest:elapsed:from:'] = function () {};
  // primitives['noteOn:duration:elapsed:from:'] = function () {};
  // primitives['midiInstrument:'] = function () {};
  // primitives['instrument:'] = function () {};
  // primitives['changeVolumeBy:'] = function () {};
  // primitives['setVolumeTo:'] = function () {};
  // primitives['volume'] = function () {};
  // primitives['changeTempoBy:'] = function () {};
  // primitives['setTempoTo:'] = function () {};
  // primitives['tempo'] = function () {};

  // Pen
  primitives['clearPenTrails'] = function () {
    var canvas = this.stage.penLayer.image;
    canvas.width = canvas.width;
  };
  primitives['putPenDown'] = function () {
    this.isPenDown = true;
    this.stroke(this.scratchX, this.scratchY, this.scratchX, this.scratchY);
  };
  primitives['putPenUp'] = function () {
    this.isPenDown = false;
  };
  primitives['penColor:'] = function (x) {
    this.penColor = color(x);
  };
  // primitives['setPenHueTo:'] = function () {};
  // primitives['changePenHueBy:'] = function () {};
  // primitives['setPenShadeTo:'] = function () {};
  // primitives['changePenShadeBy:'] = function () {};
  primitives['penSize:'] = function (x) {
    this.penSize = num(x);
  };
  primitives['changePenSizeBy:'] = function (x) {
    this.penSize += num(x);
  };
  primitives['stampCostume'] = function () {
    this.stamp();
  };

  // Data
  primitives['getParam'] = function (name) {
    var thread = this.stage.interpreter.currentThread;
    var callStack = thread.callStack;
    return callStack ? zeroNull(callStack[callStack.length - 1].arguments[name]) : 0;
  };
  primitives['readVariable'] = function (name) {
    return this.getVariable(name);
  };
  primitives['setVar:to:'] = function (name, value) {
    this.setVariable(name, value);
  };
  primitives['changeVar:by:'] = function (name, value) {
    this.setVariable(name, num(this.getVariable(name)) + num(value));
  };
  primitives["contentsOfList:"] = function () {
    var list = this.getList(name);
    return list ? list + '' : '';
  };
  primitives["append:toList:"] = function (value, name) {
    var list = this.getList(name);
    if (list) list.add(value);
  };
  primitives["deleteLine:ofList:"] = function (i, name) {
    var list = this.getList(name);
    if (list) list.delete(i);
  };
  primitives["insert:at:ofList:"] = function (value, i, name) {
    var list = this.getList(name);
    if (list) list.insert(i, value);
  };
  primitives["setLine:ofList:to:"] = function (i, name, value) {
    var list = this.getList(name);
    if (list) list.put(i, value);
  };
  primitives["getLine:ofList:"] = function (i, name) {
    var list = this.getList(name);
    return list ? list.get(i) : 0;
  };
  primitives["lineCountOfList:"] = function (name) {
    var list = this.getList(name);
    return list ? list.length() : 0;
  };
  primitives["list:contains:"] = function (name, value) {
    var list = this.getList(name);
    return list ? list.contains(value) : false;
  };
  // primitives['showVariable:'] = function () {};
  // primitives['hideVariable:'] = function () {};
  // primitives['showList:'] = function () {};
  // primitives['hideList:'] = function () {};

  // Events
  // broadcast: (special form)
  // doBroadcastAndWait (special form)

  // Control
  primitives['createCloneOf'] = function (name) {
    var parent = name === '_myself_' ? this : this.stage.getObject(name);
    if (!parent || stage.cloneCount >= Stage.MAX_CLONES) return;
    var sprite = parent.copy();
    this.stage.add(sprite);
    ++stage.cloneCount;
    this.stage.interpreter.triggerFor(sprite, 'whenCloned');
  };
  primitives['deleteClone'] = function () {};

  // Sensing
  // primitives['touching:'] = function () {};
  // primitives['touchingColor:'] = function () {};
  // primitives['color:sees:'] = function () {};
  // primitives['doAsk'] = function () {};
  // primitives['answer'] = function () {};
  primitives['mousePressed'] = function () {
    return this.stage.mousePressed;
  };
  primitives['mouseX'] = function () {
    return this.stage.mouseX;
  };
  primitives['mouseY'] = function () {
    return this.stage.mouseY;
  };
  primitives['timer'] = function () {
    return (this.stage.interpreter.now - this.stage.timerStart) / 1000;
  };
  primitives['timerReset'] = function () {
    this.stage.timerStart = this.stage.interpreter.now;
  };
  primitives['keyPressed:'] = function (key) {
    return !!this.stage.keys[key];
  };
  // primitives['distanceTo:'] = function () {};
  // primitives['getAttribute:of:'] = function () {};
  // primitives['getUserId'] = function () {};
  // primitives['getUserName'] = function () {};
  // primitives['soundLevel'] = function () {};
  // primitives['isLoud'] = function () {};
  // primitives['timestamp'] = function () {};
  primitives['timeAndDate'] = function (format) {
    var d = new Date;
    switch (format) {
      case 'year':
        return d.getFullYear()
      case 'month':
        return d.getMonth() + 1;
      case 'date':
        return d.getDate();
      case 'day of week':
        return d.getDay() + 1;
      case 'hour':
        return d.getHours();
      case 'minute':
        return d.getMinutes();
      case 'second':
        return d.getSeconds();
    }
    console.warn('Unrecognized date format', format);
  };
  // primitives['sensor:'] = function () {};
  // primitives['sensorPressed:'] = function () {};

  // Operators
  primitives['+'] = function (x, y) {
    return num(x) + num(y);
  };
  primitives['-'] = function (x, y) {
    return num(x) - num(y);
  };
  primitives['*'] = function (x, y) {
    return num(x) * num(y);
  };
  primitives['/'] = function (x, y) {
    return num(x) / num(y);
  };
  primitives['randomFrom:to:'] = function (a, b) {
    var min = num(a);
    var max = num(b);
    if (min > max) {
      min = num(b);
      max = num(a);
    }
    if (min % 1 === 0 && max % 1 === 0) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
    return Math.random() * (max - min) + min;
  };
  primitives['<'] = function (x, y) {
    return compare(x, y) === -1;
  };
  primitives['='] = function (x, y) {
    return compare(x, y) === 0;
  };
  primitives['>'] = function (x, y) {
    return compare(x, y) === 1;
  };
  primitives['&'] = function (x, y) {
    return bool(x) && bool(y);
  };
  primitives['|'] = function (x, y) {
    return bool(x) && bool(y);
  };
  primitives['not'] = function (x) {
    return !bool(x);
  };
  primitives['abs'] = function (x) {
    return Math.abs(num(x));
  };
  primitives['sqrt'] = function (x) {
    return Math.sqrt(num(x));
  };
  primitives['concatenate:with:'] = function (x, y) {
    return '' + x + y;
  };
  primitives['letter:of:'] = function (letter, s) {
    return ('' + s)[letter];
  };
  primitives['stringLength:'] = function (s) {
    return ('' + s).length;
  };
  primitives['%'] = function (x, y) {
    var n = x % y;
    if (n / y < 0) {
      n += y;
    }
    return n;
  };
  primitives['\\'] = primitives['%'];
  primitives['rounded'] = function (x) {
    return Math.round(num(x));
  };
  primitives['computeFunction:of:'] = function (f, x) {
    x = num(x);
    switch (f) {
      case 'abs':
      case 'floor':
      case 'sqrt':
        return Math[f](x);
      case 'ceiling':
        return Math.ceil(x);
      case 'cos':
        x = 90 - x;
      case 'sin':
        // 0 <= x <= 45 for degrees->radians to work well
        var neg = false;
        x = x % 360;
        if (x < 0) x += 360;
        if (x > 180) {
          neg = !neg;
          x -= 180;
        }
        if (x > 90) {
          x = 180 - x;
        }
        var z = x > 45 ?
          Math.cos((90 - x) * Math.PI / 180) :
          Math.sin(x * Math.PI / 180);
        return neg ? -z : z;
      case 'tan':
        x = x % 180;
        if (x < 0) x += 180;
        return x > 90 ?
          -Math.tan((90 - x) * Math.PI / 180) :
          Math.tan(x * Math.PI / 180);
      case 'asin':
      case 'acos':
      case 'atan':
        return Math[f](x) * 180 / Math.PI;
      case 'ln':
        return Math.log(x);
      case 'log':
        return Math.log(x) / Math.LN10;
      case 'e ^':
        return Math.exp(x);
      case '10 ^':
        return Math.exp(x * Math.LN10)
    }
  };

  var StackFrame = function (expression) {
    this.expression = expression;
    this.tmp = null;
  };

  return {
    IO: IO,
    Interpreter: Interpreter,
    Thread: Thread
  };

}());
