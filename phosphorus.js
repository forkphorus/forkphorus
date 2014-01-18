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
    this.isDone = true;
    this.update = this.update.bind(this);
    this.error = this.error.bind(this);
  };
  inherits(CompositeRequest, Request);

  CompositeRequest.prototype.add = function (request) {
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
    this.doneCount = done;
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

  IO.init = function (request) {
    IO.projectRequest = request;
    IO.zip = null;
    IO.costumes = null;
    IO.images = null;
  };

  IO.load = function (url, callback, self) {
    var request = new Request;
    var xhr = new XMLHttpRequest;
    xhr.open('GET', IO.PROXY_URL + encodeURIComponent(url + '?' + Math.random().toString().slice(2)), true);
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
    var request = new CompositeRequest;
    IO.init(request);

    request.defer = true;
    request.add(
      IO.load(IO.PROJECT_URL + id + '/get/')
        .addEventListener('load', function (contents) {
          try {
            var json = JSON.parse(contents);
            IO.loadProject(json);
            if (callback) request.onLoad(callback.bind(self));
            if (request.isDone) {
              request.load(new Stage().fromJSON(json));
            } else {
              request.defer = false;
              request.getResult = function () {
                return new Stage().fromJSON(json);
              };
            }
          } catch (e) {
            request.error(e);
          }
        }));

    return request;
  };

  IO.loadJSONProject = function (json, callback, self) {
    var request = new CompositeRequest;
    IO.init(request);

    try {
      IO.loadProject(json);
      if (callback) request.onLoad(callback.bind(self));
      if (request.isDone) {
        request.load(new Stage().fromJSON(json));
      } else {
        request.defer = false;
        request.getResult = function () {
          return new Stage().fromJSON(json);
        };
      }
    } catch (e) {
      request.error(e);
    }

    return request;
  };

  IO.loadSB2Project = function (ab, callback, self) {
    var request = new CompositeRequest;
    IO.init(request);

    try {
      IO.zip = new JSZip(ab);
      var json = JSON.parse(IO.zip.file('project.json').asText());

      IO.images = 1; // ignore pen trails
      IO.sounds = 0;

      IO.loadProject(json);
      if (callback) request.onLoad(callback.bind(self));
      if (request.isDone) {
        request.load(new Stage().fromJSON(json));
      } else {
        request.defer = false;
        request.getResult = function () {
          return new Stage().fromJSON(json);
        };
      }
    } catch (e) {
      request.error(e);
    }

    return request;
  };

  IO.loadSB2File = function (f, callback, self) {
    var cr = new CompositeRequest;
    cr.defer = true;
    var request = new Request;
    cr.add(request);
    var reader = new FileReader;
    reader.onloadend = function () {
      cr.defer = true;
      cr.add(IO.loadSB2Project(reader.result, function (result) {
        cr.defer = false;
        cr.getResult = function () {
          return result;
        };
        cr.update();
      }));
      request.load();
    };
    reader.onprogress = function (e) {
      request.progress(e.loaded, e.total, e.lengthComputable);
    };
    reader.readAsArrayBuffer(f);
    if (callback) cr.onLoad(callback.bind(self));
    return cr;
  };

  IO.loadProject = function (data) {
    IO.loadBase(data);
    IO.loadArray(data.children, IO.loadObject);
  };

  IO.loadBase = function (data) {
    data.scripts = data.scripts || [];
    data.costumes = IO.loadArray(data.costumes, IO.loadCostume);
    data.sounds = IO.loadArray(data.sounds, IO.loadSound);
    data.variables = data.variables || [];
    data.lists = data.lists || [];
  };

  IO.loadArray = function (data, process) {
    if (!data) return [];
    for (var i = 0; i < data.length; i++) {
      process(data[i]);
    }
    return data;
  };

  IO.loadObject = function (data) {
    if (!data.cmd && !data.listName) {
      IO.loadBase(data);
    }
  };

  IO.loadCostume = function (data) {
    IO.loadMD5(data.baseLayerMD5, function (asset) {
      data.$image = asset;
    });
  };

  IO.loadSound = function () {
    // TODO
  };

  IO.loadMD5 = function (md5, callback, zip, index) {
    var ext = md5.split('.').pop();
    if (ext === 'png') {
      if (IO.zip) {
        var image = IO.images;
        IO.images += 1;

        var request = new Request;
        setTimeout(function () {
          var f = IO.zip.file(image + '.png');

          var reader = new FileReader;
          reader.onloadend = function () {
            console.log(reader.result);
            var image = new Image;
            image.onload = function () {
              if (callback) callback();
              request.load();
            };
            image.src = reader.result;
          };
          reader.readAsDataURL(f);
          IO.projectRequest.add(request);
        });
      } else {
        IO.projectRequest.add(
          IO.loadImage(IO.PROXY_URL + encodeURIComponent(IO.ASSET_URL + md5 + '/get/'), function (result) {
            callback(result);
          }));
      }
    } else if (ext === 'svg') {
      var cb = function (source) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var image = new Image;
        callback(image);
        canvg(canvas, source, {
          ignoreMouse: true,
          ignoreAnimation: true,
          ignoreClear: true,
          renderCallback: function () {
            image.src = canvas.toDataURL();
          }
        })
      };
      if (IO.zip) {
        var image = IO.images;
        IO.images += 1;

        var request = new Request;
        setTimeout(function () {
          cb(IO.zip.file(image + '.svg').asText());
          request.load();
        });
        IO.projectRequest.add(request);
      } else {
        IO.projectRequest.add(IO.load(IO.ASSET_URL + md5 + '/get/', cb));
      }
    }
  };

  var Base = function () {
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

  Base.prototype.fromJSON = function (data) {
    this.objName = data.objName;
    this.scripts = data.scripts;
    this.costumes = data.costumes.map(function (d) {
      return new Costume(d);
    });
    // this.sounds = data.sounds.map(function (d) {
    //   return new Sound(d);
    // });
    this.addLists(this.lists = data.lists);
    this.addVariables(this.variables = data.variables);

    return this;
  };

  Base.prototype.addVariables = function (variables) {
    for (var i = 0; i < variables.length; i++) {
      if (variables[i].isPeristent) {
        throw new Error('Cloud variables are not supported');
      }
      this.varRefs[variables[i].name] = variables[i];
    }
  };

  Base.prototype.addLists = function (lists) {
    for (var i = 0; i < lists.length; i++) {
      if (lists[i].isPeristent) {
        throw new Error('Cloud lists are not supported');
      }
      this.listRefs[lists[i].listName] = lists[i];
      // TODO list watchers
    }
  };

  Base.prototype.showNextCostume = function () {
    this.currentCostumeIndex = (this.currentCostumeIndex + 1) % this.costumes.length;
  };

  Base.prototype.showPreviousCostume = function () {
    var length = this.costumes.length;
    this.currentCostumeIndex = (this.currentCostumeIndex + length - 1) % length;
  };

  Base.prototype.getCostumeName = function () {
    return this.costumes[this.currentCostumeIndex] ? this.costumes[this.currentCostumeIndex].objName : "";
  };

  Base.prototype.setCostume = function (costume) {
    costume = '' + costume;
    var costumes = this.costumes;
    var i = costumes.length;
    while (i--) {
      var c = costumes[i];
      if (c.costumeName === costume) {
        this.currentCostumeIndex = i;
        return;
      }
    }
    i = ((+costume || 0) - 1) % costumes.length;
    if (i < 0) i += costumes.length;
    this.currentCostumeIndex = i;
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
  };

  var Stage = function () {
    this.stage = this;

    Stage.parent.call(this);

    this.children = [];

    this.info = {};
    this.tempoBPM = 60;
    this.videoAlpha = 1;
    this.zoom = 1;
    this.timerStart = 0;
    this.cloneCount = 0;

    this.penCanvas = document.createElement('canvas');
    this.penCanvas.width = 480;
    this.penCanvas.height = 360;
    this.penContext = this.penCanvas.getContext('2d');

    this.keys = {};
    this.mouseX = 0;
    this.mouseY = 0;
    this.mousePressed = false;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 480;
    this.canvas.height = 360;
    this.context = this.canvas.getContext('2d');

    this.canvas.tabIndex = 0;
    this.canvas.style.outline = 'none';
    this.canvas.style.position = 'absolute';
    this.canvas.style.background = '#fff';

    // hardware acceleration
    this.canvas.style.WebkitTransform = 'translateZ(0)';

    this.canvas.addEventListener('mousedown', function (e) {
      this.updateMouse(e);

      for (var i = this.children.length; i--;) {
        if (this.children[i].visible && this.children[i].touching('_mouse_')) {
          this.triggerFor(this.children[i], 'whenClicked');
          break;
        }
      }

      e.preventDefault();
      this.canvas.focus();
    }.bind(this));

    this.canvas.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }
      this.keys[e.keyCode] = true;
      this.trigger('whenKeyPressed', e.keyCode);
      e.stopPropagation();
      e.preventDefault();
    }.bind(this));

    this.canvas.addEventListener('keyup', function (e) {
      this.keys[e.keyCode] = false;
      e.stopPropagation();
      e.preventDefault();
    }.bind(this));

    document.addEventListener('mousemove', function (e) {
      this.updateMouse(e);
    }.bind(this));

    this.canvas.addEventListener('mousedown', function (e) {
      this.mousePressed = true;
    }.bind(this));

    document.addEventListener('mouseup', function (e) {
      this.mousePressed = false;
    }.bind(this));

  };
  inherits(Stage, Base);

  Stage.prototype.isStage = true;

  Stage.prototype.fromJSON = function (data) {
    Stage.parent.prototype.fromJSON.call(this, data);

    data.children.forEach(function (d) {
      if (d.cmd || d.listName) {
        return;
      }
      this.children.push(new Sprite(this).fromJSON(d));
    }, this);

    P.compile(this);

    return this;
  };

  Stage.prototype.updateMouse = function (e) {
    var bb = this.canvas.getBoundingClientRect();
    var x = (e.clientX - bb.left) / this.zoom - 240;
    var y = 180 - (e.clientY - bb.top) / this.zoom;
    if (x < -240) x = -240;
    if (x > 240) x = 240;
    if (y < -180) y = -180;
    if (y > 180) y = 180;
    this.mouseX = x;
    this.mouseY = y;
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
    var i = this.children.length;
    while (i--) {
      if (this.children[i].isClone) {
        this.children.splice(i, 1);
      }
    }
    this.cloneCount = 0;
  };

  Stage.prototype.getObject = function (name) {
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].objName === name) {
        return this.children[i];
      }
    }
  };

  Stage.prototype.draw = function () {
    var context = this.context;

    this.canvas.width = 480; // clear

    context.save();

    context.drawImage(this.costumes[this.currentCostumeIndex].image, 0, 0);
    context.drawImage(this.penCanvas, 0, 0);

    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].visible) {
        this.children[i].draw(context);
      }
    }

    context.restore();
  };

  Stage.prototype.moveTo = function () {};

  var KEY_CODES = {
    'space': 32,
    'left arrow': 37,
    'up arrow': 38,
    'right arrow': 39,
    'down arrow': 40
  };

  var getKeyCode = function (keyName) {
    return KEY_CODES[keyName] || keyName.charCodeAt(0);
  };

  var Sprite = function (stage) {
    this.stage = stage;

    Sprite.parent.call(this);

    this.addVariables(stage.variables);
    this.addLists(stage.lists);

    this.direction = 90;
    this.indexInLibrary = -1;
    this.isDraggable = false;
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
  };
  inherits(Sprite, Base);

  Sprite.prototype.fromJSON = function (data) {

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

  Sprite.prototype.clone = function () {
    var c = new Sprite(this.stage);

    c.isClone = true;
    c.costumes = this.costumes;
    c.currentCostumeIndex = this.currentCostumeIndex;
    c.objName = this.objName;
    c.sounds = this.sounds;
    c.varRefs = this.varRefs;
    c.variables = this.variables;
    c.listRefs = this.listRefs;
    c.lists = this.lists;

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

  Sprite.prototype.forward = function (steps) {
    var d = (90 - this.direction) * Math.PI / 180;
    this.moveTo(this.scratchX + steps * Math.cos(d), this.scratchY + steps * Math.sin(d));
  }

  Sprite.prototype.moveTo = function (x, y) {
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
      context.strokeStyle = 'hsl(' + this.penHue + ',' + this.penSaturation + '%,' + this.penLightness + '%)';
      context.lineWidth = this.penSize;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(240 + ox, 180 - oy);
      context.lineTo(240 + x, 180 - y);
      context.stroke();
    }
  };

  Sprite.prototype.dotPen = function () {
    var context = this.stage.penContext;
    var x = this.scratchX;
    var y = this.scratchY;
    if (this.penSize % 2 > .5 && this.penSize % 2 < 1.5) {
      x -= .5;
      y -= .5;
    }
    context.strokeStyle = 'hsl(' + this.penHue + ',' + this.penSaturation + '%,' + this.penLightness + '%)';
    context.lineWidth = this.penSize;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(240 + x, 180 - y);
    context.lineTo(240.01 + x, 180 - y);
    context.stroke();
  };

  Sprite.prototype.stamp = function () {
    var context = this.stage.penContext;
    this.draw(context);
  };

  Sprite.prototype.draw = function (context) {
    var costume = this.costumes[this.currentCostumeIndex];

    context.save();

    context.translate(this.scratchX + 240, 180 - this.scratchY);
    context.rotate((this.direction - 90) * Math.PI / 180);
    context.scale(this.scale, this.scale);
    context.translate(-costume.rotationCenterX, -costume.rotationCenterY);

    context.globalAlpha = Math.max(0, Math.min(1, 1 - this.filters.ghost / 100));

    context.drawImage(costume.image, 0, 0);

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
  };

  Sprite.prototype.touching = function (thing) {
    if (thing === '_mouse_') {
      var costume = this.costumes[this.currentCostumeIndex];
      var d = costume.context.getImageData(this.stage.mouseX - this.scratchX + costume.rotationCenterX, (this.scratchY - this.stage.mouseY + costume.rotationCenterY), 1, 1).data;
      return d[3] !== 0;
    } else {
      throw new Error('Unimplemented');
    }
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

  var Costume = function (data) {
    this.baseLayerID = data.baseLayerID;
    this.baseLayerMD5 = data.baseLayerMD5;
    this.baseLayer = data.$image;
    this.bitmapResolution = data.bitmapResolution || 1;
    this.costumeName = data.costumeName;
    this.rotationCenterX = data.rotationCenterX;
    this.rotationCenterY = data.rotationCenterY;

    this.image = document.createElement('canvas');

    if (this.baseLayer.width) {
      this.render();
    } else {
      this.baseLayer.onload = function () {
        this.render();
      }.bind(this);
    }
  };
  addEvents(Costume, 'load');

  Costume.prototype.render = function () {
    var scale = 1 / this.bitmapResolution;
    this.rotationCenterX *= scale;
    this.rotationCenterY *= scale;

    this.image.width = this.baseLayer.width * scale;
    this.image.height = this.baseLayer.height * scale;

    this.context = this.image.getContext('2d');
    this.context.save();
    this.context.scale(scale, scale);
    this.context.drawImage(this.baseLayer, 0, 0);
  };

  return {
    getKeyCode: getKeyCode,
    IO: IO,
    Base: Base,
    Stage: Stage,
    Sprite: Sprite
  };

}());

P.compile = (function () {
  'use strict';

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

  var compileScripts = function (object) {
    for (var i = 0; i < object.scripts.length; i++) {
      compileListener(object, object.scripts[i][2]);
    }

    console.log(object.fns);
  };

  var warnings;
  var warn = function (message) {
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

  var compileListener = function (object, script, isAtomic) {
    if (!script[0] || EVENT_SELECTORS.indexOf(script[0][0]) === -1) return;

    var nextLabel = function () {
      return object.fns.length + fns.length;
    };

    var label = function () {
      var id = nextLabel();
      fns.push(source.length);
      return id;
    };

    var delay = function () {
      source += 'return;\n';
      label();
    };

    var queue = function (id) {
      source += 'queue(' + id + ');\n';
      source += 'return;\n';
    };

    var seq = function (script) {
      if (!script) return;
      for (var i = 0; i < script.length; i++) {
        compile(script[i]);
      }
    };

    var val = function (e) {
      if (typeof e === 'number') {

        return '' + e;

      } else if (typeof e === 'string') {

        return '"' + e
          .replace(/\\/g, '\\\\')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/"/g, '\\"') + '"';

      } else if (e[0] === 'xpos') { /* Motion */

        return 'S.scratchX';

      } else if (e[0] === 'ypos') {

        return 'S.scratchY';

      } else if (e[0] === 'heading') {

        return 'S.direction';

      } else if (e[0] === 'costumeIndex') { /* Looks */

        return 'S.currentCostumeIndex';

      } else if (e[0] === 'costumeName') {

        return 'S.getCostumeName()';

      } else if (e[0] === 'backgroundIndex') {

        return 'self.currentCostumeIndex';

      } else if (e[0] === 'sceneName') {

        return 'self.getCostumeName()';

      } else if (e[0] === 'scale') {

        return 'S.scale';

      // } else if (e[0] === 'volume') { /* Sound */

      // } else if (e[0] === 'tempo') {

      } else if (e[0] === 'getParam') { /* Data */

        return '(C && C.args[' + val(e[1]) + '] != null ? C.args[' + val(e[1]) + '] : 0)';

      } else if (e[0] === 'readVariable') {

        return 'S.varRefs[' + val(e[1]) + '].value';

      } else if (e[0] === 'contentsOfList:') {

        return 'contentsOfList(' + val(e[1]) + ')';

      } else if (e[0] === 'getLine:ofList:') {

        return 'getLineOfList(' + val(e[2]) + ', ' + val(e[1]) + ')';

      } else if (e[0] === 'lineCountOfList:') {

        return 'lineCountOfList(' + val(e[1]) + ')';

      } else if (e[0] === 'list:contains:') {

        return 'listContains(' + val(e[1]) + ', ' + val(e[2]) + ')';

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

      } else if (e[0] === '<') {

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

      } else if (e[0] === 'abs') {

        return 'Math.abs(' + num(e[1]) + ')';

      } else if (e[0] === 'sqrt') {

        return 'Math.sqrt(' + num(e[1]) + ')';

      } else if (e[0] === 'concatenate:with:') {

        return '("" + ' + val(e[1]) + ' + ' + val(e[2]) + ')';

      } else if (e[0] === 'letter:of:') {

        return '(("" + ' + val(e[2]) + ')[Math.floor(' + num(e[1]) + ')] || "")';

      } else if (e[0] === 'stringLength:') {

        return '("" + ' + val(e[1]) + ').length';

      } else if (e[0] === '%' || e[0] === '\\') {

        return 'mod(' + num(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e[0] === 'rounded') {

        return 'Math.round(' + num(e[1]) + ')';

      } else if (e[0] === 'computeFunction:of:') {

        return 'mathFunc(' + val(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e[0] === 'mousePressed') {

        return 'self.mousePressed';

      } else if (e[0] === 'mouseX') {

        return 'self.mouseX';

      } else if (e[0] === 'mouseY') {

        return 'self.mouseY';

      // } else if (e[0] === 'touching:') { /* Sensing */

      // } else if (e[0] === 'touchingColor:') {

      // } else if (e[0] === 'color:sees:') {

      // } else if (e[0] === 'answer') {

      } else if (e[0] === 'timer') {

        return '(Date.now() - self.timerStart) / 1000';

      } else if (e[0] === 'keyPressed:') {

        return 'self.keys[P.getKeyCode(' + val(e[1]) + ')]';

      } else if (e[0] === 'distanceTo:') {

        return 'S.distanceTo(' + val(e[1]) + ')';

      // } else if (e[0] === 'getAttribute:of:') {

      // } else if (e[0] === 'getUserId') {

      // } else if (e[0] === 'getUserName') {

      // } else if (e[0] === 'soundLevel') {

      // } else if (e[0] === 'isLoud') {

      // } else if (e[0] === 'timestamp') {

      // } else if (e[0] === 'timeAndDate') {

      // } else if (e[0] === 'sensor:') {

      // } else if (e[0] === 'sensorPressed:') {

      } else {

        warn('Undefined val: ' + e[0]);

      }
    };

    var bool = function (e) {
      return 'bool(' + val(e) + ')';
    };

    var num = function (e) {
      if (typeof e === 'number') {
        return e;
      }
      if (typeof e === 'boolean' || typeof e === 'string') {
        return Number(e) || 0;
      }
      return '(Number(' + val(e) + ') || 0)';
    };

    var compile = function (block) {
      if (block[0] === 'forward:') { /* Motion */

        source += 'S.forward(' + num(block[1]) + ');\n';

      } else if (block[0] === 'turnRight:') {

        source += 'S.setDirection(S.direction + ' + num(block[1]) + ');\n';

      } else if (block[0] === 'turnLeft:') {

        source += 'S.setDirection(S.direction - ' + num(block[1]) + ');\n';

      } else if (block[0] === 'heading:') {

        source += 'S.setDirection(' + num(block[1]) + ');\n';

      // } else if (block[0] === 'pointTowards:') {

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

      // } else if (block[0] === 'bounceOffEdge') {

      } else if (block[0] === 'setRotationStyle') {

        source += 'S.rotationStyle = ' + val(block[1]) + ';\n';

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

          source += 'self.setCostume(' + val(block[1]) + ');\n';
          source += 'sceneChange();\n';
          source += 'waitForSceneChange(S, ' + val(block[1]) + ', ' + nextLabel() + ');\n';
          delay();

        }

      // } else if (block[0] === 'say:duration:elapsed:from:') {

      // } else if (block[0] === 'say:') {

      // } else if (block[0] === 'think:duration:elapsed:from:') {

      // } else if (block[0] === 'think:') {

      } else if (block[0] === 'changeGraphicEffect:by:') {

        source += 'S.filters[' + val(block[1]) + '] += ' + num(block[2]) + ';\n';

      } else if (block[0] === 'setGraphicEffect:to:') {

        source += 'S.filters[' + val(block[1]) + '] = ' + num(block[2]) + ';\n';

      } else if (block[0] === 'filterReset') {

        source += 'S.resetFilters();\n';

      } else if (block[0] === 'changeSizeBy:') {

        source += 'S.scale += ' + num(block[1]) + ' / 100;\n';

      } else if (block[0] === 'setSizeTo:') {

        source += 'S.scale = ' + num(block[1]) + ' / 100;\n';

      } else if (block[0] === 'show') {

        source += 'S.visible = true;\n';

      } else if (block[0] === 'hide') {

        source += 'S.visible = false;\n';

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

      // } else if (block[0] === 'changeTempoBy:') {

      // } else if (block[0] === 'setTempoTo:') {

      } else if (block[0] === 'clearPenTrails') { /* Pen */

        source += 'self.penCanvas.width = 480;\n';

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

      } else if (block[0] === 'changePenHueBy:') {

        source += 'S.penHue += ' + num(block[1]) + ' * 360 / 200;\n';

      } else if (block[0] === 'setPenShadeTo:') {

        source += 'S.penLightness = ' + num(block[1]) + ' % 200;\n';
        source += 'if (S.penLightness < 0) S.penLightness += 200;\n';
        source += 'if (S.penLightness > 100) S.penLightness = 100 - S.penLightness;\n';

      } else if (block[0] === 'changePenShadeBy:') {

        source += 'S.penLightness += ' + num(block[1]) + ' % 200;\n';
        source += 'if (S.penLightness < 0) S.penLightness += 200;\n';
        source += 'if (S.penLightness > 100) S.penLightness = 100 - S.penLightness;\n';

      } else if (block[0] === 'penSize:') {

        source += 'S.penSize = ' + num(block[1]) + ';\n';

      } else if (block[0] === 'changePenSizeBy:') {

        source += 'S.penSize += ' + num(block[1]) + ';\n';

      } else if (block[0] === 'stampCostume') {

        source += 'S.draw(self.penContext);\n';

      } else if (block[0] === 'setVar:to:') { /* Data */

        source += 'if (S.varRefs[' + val(block[1]) + ']) S.varRefs[' + val(block[1]) + '].value = ' + val(block[2]) + ';\n';

      } else if (block[0] === 'changeVar:by:') {

        source += 'if (S.varRefs[' + val(block[1]) + ']) S.varRefs[' + val(block[1]) + '].value = (+S.varRefs[' + val(block[1]) + '].value || 0) + ' + num(block[2]) + ';\n';

      } else if (block[0] === 'append:toList:') {

        source += 'appendToList(' + val(block[2]) + ', ' + val(block[1]) + ');\n';

      } else if (block[0] === 'deleteLine:ofList:') {

        source += 'deleteLineOfList(' + val(block[2]) + ', ' + val(block[1]) + ');\n';

      } else if (block[0] === 'insert:at:ofList:') {

        source += 'insertInList(' + val(block[3]) + ', ' + val(block[2]) + ', '+ val(block[1]) + ');\n';

      } else if (block[0] === 'setLine:ofList:to:') {

        source += 'setLineOfList(' + val(block[2]) + ', ' + val(block[1]) + ', '+ val(block[3]) + ');\n';

      // } else if (block[0] === 'showVariable:') {

      // } else if (block[0] === 'hideVariable:') {

      // } else if (block[0] === 'showList:') {

      // } else if (block[0] === 'hideList:') {

      } else if (block[0] === 'broadcast:') { /* Control */

        source += 'broadcast(' + val(block[1]) + ');';

      } else if (block[0] === 'call') {

        source += 'call(' + val(block[1]) + ', ' + nextLabel() + ', [';
        for (var i = 2; i < block.length; i++) {
          if (i > 2) {
            source += ', ';
          }
          source += val(block[i]);
        }
        source += ']);\n';
        delay();

      } else if (block[0] === 'doBroadcastAndWait') {

        source += 'broadcast(' + val(block[1]) + ');\n';
        source += 'waitForBroadcast(S, ' + val(block[1]) + ', ' + nextLabel() + ');\n';
        delay();

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

        source += 'if (' + bool(block[1]) + ') {';
        seq(block[2]);
        source += '} else {';
        seq(block[3]);
        source += '}';

      } else if (block[0] === 'doRepeat') {

        source += 'save();\n';
        source += 'R.count = ' + num(block[1]) + ';\n';

        if (warp) {

          source += 'while (R.count > 0) {\n';
          source += '  R.count -= 1;\n';
          seq(block[2]);
          source += '}\n';

          source += 'restore();\n';

        } else {

          var id = label();

          source += 'if (R.count > 0) {\n';
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

          source += 'if (!' + bool(block[1]) + ') {\n';
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
          source += 'R.start = Date.now();\n';
          source += 'R.duration = ' + num(block[1]) + ';\n';
          source += 'R.baseX = S.scratchX;\n';
          source += 'R.baseY = S.scratchY;\n';
          source += 'R.deltaX = ' + num(block[2]) + ' - S.scratchX;\n';
          source += 'R.deltaY = ' + num(block[3]) + ' - S.scratchY;\n';

          var id = label();
          source += 'var f = (Date.now() - R.start) / (R.duration * 1000);\n';
          source += 'if (f > 1) f = 1;\n';
          source += 'S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);\n';

          source += 'if (f < 1) {\n';
          queue(id);
          source += '}\n';
          source += 'restore();\n';

        }

      } else if (block[0] === 'stopAll') {

        source += 'terminate();\n';
        source += 'return;\n';

      } else if (block[0] === 'stopScripts') {

        source += 'switch (' + val(block[1]) + ') {\n';
        source += '  case "all":\n'
        source += '    terminate();\n';
        source += '    return;\n';
        source += '  case "this script":\n';
        source += '    endCall();\n';
        source += '    return;\n';
        source += '  case "other scripts in sprite":\n';
        source += '  case "other scripts in stage":\n';
        source += '    terminateOthers(S);\n';
        source += '    break;\n';
        source += '}\n';

      } else if (block[0] === 'wait:elapsed:from:') {

        source += 'save();\n';
        source += 'R.start = Date.now();\n';
        source += 'R.duration = ' + num(block[1]) + ';\n';

        var id = label();
        source += 'if (Date.now() - R.start < R.duration * 1000) {\n';
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

        source += 'var i = self.children.indexOf(S);\n';
        source += 'if (i > -1) self.children.splice(i, 1);\n';
        source += 'terminateS();\n';
        source += 'return;\n';

      // } else if (block[0] === 'doAsk') { /* Sensing */

      } else if (block[0] === 'timerReset') {

        source += 'self.timerStart = Date.now();\n';

      } else {

        warn('Undefined command: ' + block[0]);

      }
    };

    var source = '';
    var startfn = object.fns.length;
    var fns = [0];
    var warp = +!!isAtomic;

    for (var i = 1; i < script.length; i++) {
      compile(script[i]);
    }

    if (script[0][0] === 'procDef') {
      source += 'endCall();\n';
      source += 'return;\n';
    }

    var createContinuation = function (source) {
      var result = '(function () {\n';
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
      object.listeners.whenKeyPressed[P.getKeyCode(script[0][0])].push(f);
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

  return function (stage) {

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

P.runtime = (function () {
  'use strict';

  var self, S, R, STACK, C, CALLS;

  var bool = function (v) {
    return +v !== 0 && v !== '' && v !== 'false';
  };

  var compare = function (x, y) {
    if (+x === +x && +y === +y) {
      return +x < +y ? -1 : +x === +y ? 0 : 1;
    }
    var xs = '' + x;
    var ys = '' + y;
    return xs < ys ? -1 : xs === ys ? 0 : 1;
  };

  var random = function (x, y) {
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

  var rgb2hsl = function (rgb) {
    var r = (rgb >> 16 & 0xff) / 0xff;
    var g = (rgb >> 8 & 0xff) / 0xff;
    var b = (rgb & 0xff) / 0xff;

    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);

    if (min === max) {
      return [0, 0, r];
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

  var clone = function (name) {
    var c = (name === '_myself_' ? S : self.getObject(name)).clone();
    self.children.push(c);
    self.triggerFor(c, "whenCloned");
  };

  var listIndex = function (list, index, length) {
    if (index === 'random' || index === 'any') {
      return Math.floor(Math.random() * length);
    }
    if (index === 'last') {
      return length - 1;
    }
    var i = Math.floor(index) - 1;
    return i === i && i >= 0 && i < length ? i : -1;
  };

  var contentsOfList = function (name) {
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

  var getLineOfList = function (name, index) {
    var list = S.listRefs[name];
    if (!list) return 0;
    var i = listIndex(list, index, list.contents.length);
    return list && i > -1 ? list.contents[i] : 0;
  };

  var lineCountOfList = function (name) {
    var list = S.listRefs[name];
    return list ? list.contents.length : 0;
  };

  var listContains = function (name, value) {
    var list = S.listRefs[name];
    return list ? list.contents.indexOf(value) > -1 : 0;
  };

  var appendToList = function (name, value) {
    var list = S.listRefs[name];
    if (list) {
      list.contents.push(value);
    }
  };

  var deleteLineOfList = function (name, index) {
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

  var insertInList = function (name, index, value) {
    var list = S.listRefs[name];
    if (list) {
      var i = listIndex(list, index, list.contents.length + 1);
      if (i === list.contents.length) {
        list.contents.push(value);
      } else if (i > -1) {
        list.contents.splice(i, 0, value);
      }
    }
  };

  var setLineOfList = function (name, index, value) {
    var list = S.listRefs[name];
    if (list) {
      var i = listIndex(list, index, list.contents.length);
      if (i > -1) {
        list.contents[i] = value;
      }
    }
  };

  var mathFunc = function (f, x) {
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
    return 0;
  };

  var save = function () {
    STACK.push(R);
    R = {};
  };

  var restore = function () {
    R = STACK.pop();
  };

  var call = function (spec, id, values) {
    var procedure = S.procedures[spec];
    if (procedure) {
      var args = {};
      for (var i = 0; i < values.length; i++) {
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
    }
  };

  var endCall = function () {
    if (CALLS.length) {
      var fn = C.fn;
      C = CALLS.pop();
      STACK = C.stack;
      R = STACK.pop();
      fn();
    }
  };

  var sceneChange = function () {
    self.trigger('whenSceneStarts', self.costumes[self.currentCostumeIndex].costumeName);
  };

  var broadcast = function (name) {
    self.trigger('whenIReceive', name);
  };

  var queue = function (id) {
    CALLS.push(C);
    STACK.push(R);
    S.queue.push({
      fn: S.fns[id],
      calls: CALLS
    });
  };

  var waitForBroadcast = function (sprite, message, id) {
    sprite.wait.push({
      fn: sprite.fns[id],
      'for': 'broadcast',
      'message': message
    });
  };

  // Internal definition
  (function () {
    'use strict';

    P.Stage.prototype.framerate = 30;

    P.Base.prototype.initRuntime = function () {
      this.queue = [];
      this.wait = [];
    };

    P.Stage.prototype.triggerFor = function (sprite, event, arg) {
      var threads;
      if (event === 'whenClicked') {
        threads = sprite.listeners.whenClicked;
      } else if (event === 'whenCloned') {
        threads = sprite.listeners.whenCloned;
      } else if (event === 'whenGreenFlag') {
        threads = sprite.listeners.whenGreenFlag;
      } else if (event === 'whenIReceive') {
        threads = sprite.listeners.whenIReceive[arg.toLowerCase()]
      } else if (event === 'whenKeyPressed') {
        threads = sprite.listeners.whenKeyPressed[arg];
      } else if (event === 'whenSceneStarts') {
        threads = sprite.listeners.whenSceneStarts[arg.toLowerCase()];
      }
      if (threads) {
        for (var i = 0; i < threads.length; i++) {
          sprite.queue.push({
            fn: threads[i],
            calls: [{ args:{}, stack: [{}] }]
          });
        }
      }
    };

    P.Stage.prototype.trigger = function (event, arg) {
      this.triggerFor(this, event, arg);
      for (var i = 0; i < this.children.length; i++) {
        this.triggerFor(this.children[i], event, arg);
      }
    };

    P.Stage.prototype.triggerGreenFlag = function () {
      this.trigger('whenGreenFlag');
    };

    P.Stage.prototype.start = function () {
      this.timerStart = Date.now();
      this.interval = setInterval(this.step.bind(this), 1000 / this.framerate);
    };

    P.Stage.prototype.stopAll = function () {
      this.queue = [];
      this.wait = [];
      this.resetFilters();
      for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].isClone) {
          this.children.splice(i, 1);
          i -= 1;
        } else {
          this.children[i].queue = [];
          this.children[i].wait = [];
          this.children[i].resetFilters();
        }
      }
    };

    P.Stage.prototype.runFor = function (sprite) {
      S = sprite;
      var queue = sprite.queue;
      sprite.queue = [];
      for (var i = 0; i < queue.length; i++) {
        CALLS = queue[i].calls;
        C = CALLS.pop();
        STACK = C.stack;
        R = STACK.pop();
        queue[i].fn();
        STACK.push(R);
        CALLS.push(C);
      }
    };

    P.Stage.prototype.step = function () {
      try {
        self = this;
        var start = Date.now();
        do {
          this.runFor(this);
          for (var i = 0; i < this.children.length; i++) {
            this.runFor(this.children[i]);
          }
        } while (self.isTurbo && Date.now() - start < 1000 / this.framerate);
        this.draw();
      } catch (e) {
        console.error(e.stack);
        clearInterval(this.interval);
      }
    };

  }());

  return {
    scopedEval: function (source) {
      return eval(source);
    }
  };

}());
