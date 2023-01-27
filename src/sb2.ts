/// <reference path="phosphorus.ts" />
/// <reference path="utils.ts" />
/// <reference path="core.ts" />
/// <reference path="fonts.ts" />
/// <reference path="config.ts" />

namespace P.sb2 {
  const ASSET_URL = 'https://cdn.assets.scratch.mit.edu/internalapi/asset/';

  export class Scratch2VariableWatcher extends P.core.Watcher {
    private cmd: string;
    private type: string;
    private color: string;
    public isDiscrete: boolean;
    private label: string;
    private mode: number;
    public param: string;
    public sliderMax: number;
    public sliderMin: number;

    private el: HTMLElement;
    private labelEl: HTMLElement;
    private readout: HTMLElement;
    public slider: HTMLElement;
    public button: HTMLElement;
    private buttonWrap: HTMLElement;

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

      this.isDiscrete = data.isDiscrete == null ? true : data.isDiscrete;
      this.label = data.label || '';
      this.mode = data.mode || 1;
      this.param = data.param;
      this.sliderMax = data.sliderMax == null ? 100 : data.sliderMax;
      this.sliderMin = data.sliderMin || 0;
      this.targetName = data.target;
      this.visible = data.visible == null ? false : data.visible;
      this.x = data.x || 0;
      this.y = data.y || 0;
    }

    init() {
      super.init();
      if (this.target && this.cmd === 'getVar:') {
        this.target.watchers[this.param] = this;
      }
      if (!this.label) {
        this.label = this.getLabel();
        if (this.target.isSprite) this.label = this.target.name + ': ' + this.label;
      }
      this.layout();
    }

    getLabel(): string {
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

    setVisible(visible: boolean) {
      super.setVisible(visible);
      this.layout();
    }

    update() {
      var value: string | number = 0;
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
          value = (this.target as P.core.Sprite).direction;
          break;
        case 'scale':
          if (this.target.isSprite) {
            value = (this.target as P.core.Sprite).scale * 100;
          }
          break;
        case 'sceneName':
          value = this.stage.getCostumeName();
          break;
        case 'senseVideoMotion':
          // TODO
          break;
        case 'soundLevel':
          if (this.stage.microphone) {
            value = this.stage.microphone.getLoudness();
          } else {
            value = -1;
          }
          break;
        case 'tempo':
          value = this.stage.tempoBPM;
          break;
        case 'timeAndDate':
          value = this.timeAndDate(this.param);
          break;
        case 'timer':
          value = Math.round((this.stage.runtime.now() - this.stage.runtime.timerStart) / 100) / 10;
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

    timeAndDate(format: any): number {
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
      this.el.dataset.watcher = '' + this.stage.allWatchers.indexOf(this);
      this.el.style.whiteSpace = 'pre';
      this.el.style.position = 'absolute';
      this.el.style.left = this.el.style.top = '0';
      this.el.style.transform = 'translate('+(this.x|0)/10+'em,'+(this.y|0)/10+'em)';
      this.el.style.cursor = 'default';

      if (this.mode === 2) {
        this.el.appendChild(this.readout = document.createElement('div'));
        this.readout.style.minWidth = (38/15)+'em';
        this.readout.style.font = 'bold 1.5em/'+(19/15)+' sans-serif';
        this.readout.style.height = (19/15)+'em';
        this.readout.style.borderRadius = (4/15)+'em';
        this.readout.style.margin = (3/15)+'em 0 0 0';
        this.readout.style.padding = '0 '+(3/10)+'em';
      } else {
        this.el.appendChild(this.labelEl = document.createElement('div'));
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
        this.slider.style.pointerEvents = 'auto';
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

  export class Scratch2Stage extends P.core.Stage {
    // Used to tell the compiler what scripts this sprite uses.
    // TODO: should the compiler delete after use?
    public scripts: any;

    private dragging: any = {};
    private defaultWatcherX = 10;
    private defaultWatcherY = 10;

    createVariableWatcher(target: P.core.Base, variableName: string) {
      const x = this.defaultWatcherX;
      const y = this.defaultWatcherY;

      this.defaultWatcherY += 26;
      if (this.defaultWatcherY >= 450) {
        this.defaultWatcherY = 10;
        this.defaultWatcherX += 150;
      }

      return new P.sb2.Scratch2VariableWatcher(this, target.name, {
        cmd: 'getVar:',
        param: variableName,
        x,
        y,
      });
    }

    say(text: string, thinking?: boolean) {
      // Stage cannot say things in Scratch 2.
      return ++this.sayId;
    }

    updateBubble() {
      // Stage cannot say things in Scratch 2.
    }

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

    ontouch(event: TouchEvent, touch: Touch) {
      const target = event.target as HTMLElement;
      if (target.dataset.button != null || target.dataset.slider != null) {
        this.watcherStart(touch.identifier, touch, event);
      }
    }
    onmousedown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.dataset.button != null || target.dataset.slider != null) {
        this.watcherStart('mouse', e, e);
      }
    }
    onmousemove(e: MouseEvent) {
      this.watcherMove('mouse', e, e);
    }
    onmouseup(e: MouseEvent) {
      this.watcherEnd('mouse', e, e);
    }
  }

  export class Scratch2Sprite extends P.core.Sprite {
    public scripts: any;

    _clone() {
      return new Scratch2Sprite(this.stage);
    }
  }

  type SB2Base = any;
  type SB2Project = any;
  type SB2Costume = any;
  type SB2Sound = any;

  export abstract class BaseSB2Loader extends P.io.Loader<P.core.Stage> {
    protected projectData: SB2Project;

    loadImage(url: string): Promise<HTMLImageElement> {
      return this.addTask(new P.io.Img(url)).load();
    }

    loadFonts(): Promise<void> {
      return Promise.all([
        this.addTask(new P.io.PromiseTask((P.utils.settled(P.fonts.loadWebFont('Donegal One'))))),
        this.addTask(new P.io.PromiseTask((P.utils.settled(P.fonts.loadWebFont('Gloria Hallelujah'))))),
        this.addTask(new P.io.PromiseTask((P.utils.settled(P.fonts.loadWebFont('Mystery Quest'))))),
        this.addTask(new P.io.PromiseTask((P.utils.settled(P.fonts.loadWebFont('Permanent Marker'))))),
      ]).then(() => undefined);
    }

    loadBase(data: any, isStage: boolean) {
      var costumes;
      var sounds;

      return Promise.all([
        this.loadArray(data.costumes, this.loadCostume.bind(this)).then((c) => costumes = c),
        this.loadArray(data.sounds, this.loadSound.bind(this)).then((s) => sounds = s),
      ]).then(() => {
        // Dirty hack to construct a target with a null stage
        const object = new (isStage ? Scratch2Stage : Scratch2Sprite)(null!);

        if (data.variables) {
          for (const variable of data.variables) {
            if (variable.isPersistent) {
              if (object.isStage) {
                (object as Scratch2Stage).cloudVariables.push(variable.name);
              } else {
                console.warn('Cloud variable found on a non-stage object. Skipping.');
              }
            }
            object.vars[variable.name] = variable.value;
          }
        }

        if (data.lists) {
          for (const list of data.lists) {
            if (list.isPersistent) {
              console.warn('Cloud lists are not supported');
            }
            object.lists[list.listName] = list.contents;
          }
        }

        object.name = data.objName;
        object.costumes = costumes;
        object.currentCostumeIndex = Math.floor(data.currentCostumeIndex);
        sounds.forEach((sound) => sound && object.addSound(sound));

        if (isStage) {

        } else {
          const sprite = object as Scratch2Sprite;
          sprite.scratchX = data.scratchX;
          sprite.scratchY = data.scratchY;
          sprite.direction = data.direction;
          sprite.isDraggable = data.isDraggable;
          sprite.rotationStyle = P.utils.parseRotationStyle(data.rotationStyle);
          sprite.scale = data.scale;
          sprite.visible = data.visible;
        }

        // Store the scripts on the Sprite so the compiler can access them
        object.scripts = data.scripts || [];

        return object;
      });
    }

    loadArray(data: any[], process: any) {
      return Promise.all((data || []).map((i, ind) => process(i, ind)));
    }

    loadObject(data: SB2Base) {
      if (data.cmd) {
        return this.loadVariableWatcher(data);
      } else if (data.listName) {
        // TODO: list watcher
      } else {
        return this.loadBase(data, false);
      }
    }

    loadVariableWatcher(data: SB2Base) {
      const targetName = data.target;
      const watcher = new Scratch2VariableWatcher(null, targetName, data);
      return watcher;
    }

    loadCostume(data: SB2Costume) {
      const promises = [
        this.loadMD5(data.baseLayerMD5, data.baseLayerID)
          .then((asset) => data.$image = asset)
      ];
      if (data.textLayerMD5) {
        promises.push(this.loadMD5(data.textLayerMD5, data.textLayerID)
          .then((asset) => data.$text = asset));
      }
      return Promise.all(promises)
        .then((layers: any[]) => {
          var image;
          if (layers.length > 1) {
            image = document.createElement('canvas');
            const ctx = image.getContext('2d');
            if (!ctx) {
              throw new Error('Cannot get 2d rendering context loading costume ' + data.costumeName);
            }
            image.width = Math.max(layers[0].width, 1);
            image.height = Math.max(layers[0].height, 1);
            for (const layer of layers) {
              ctx.drawImage(layer, 0, 0);
            }
          } else {
            image = layers[0];
          }

          return new P.core.BitmapCostume(image, {
            name: data.costumeName,
            bitmapResolution: data.bitmapResolution,
            rotationCenterX: data.rotationCenterX,
            rotationCenterY: data.rotationCenterY,
          });
        });
    }

    loadSound(data: SB2Sound): Promise<P.core.Sound | null> {
      return new Promise((resolve, reject) => {
        this.loadMD5(data.md5, data.soundID, true)
          .then((buffer) => {
            resolve(new P.core.Sound({
              name: data.soundName,
              buffer,
            }));
          })
          .catch((err) => {
            resolve(null);
            console.warn('Could not load sound: ' + err);
          });
      });
    }

    loadSVG(source: string): Promise<HTMLCanvasElement | HTMLImageElement> {
      const parser = new DOMParser();
      var doc = parser.parseFromString(source, 'image/svg+xml');
      var svg = doc.documentElement as any;
      if (!svg.style) {
        doc = parser.parseFromString('<body>' + source, 'text/html');
        svg = doc.querySelector('svg');
      }
      DOMPurify.sanitize(svg, {
        IN_PLACE: true,
        USE_PROFILES: { svg: true }
      });
      svg.style.visibility = 'hidden';
      svg.style.position = 'absolute';
      svg.style.left = '-10000px';
      svg.style.top = '-10000px';
      document.body.appendChild(svg);
      const viewBox = svg.viewBox.baseVal;
      if (viewBox && (viewBox.x || viewBox.y)) {
        svg.width.baseVal.value = viewBox.width - viewBox.x;
        svg.height.baseVal.value = viewBox.height - viewBox.y;
        viewBox.x = 0;
        viewBox.y = 0;
        viewBox.width = 0;
        viewBox.height = 0;
      }
      patchSVG(svg, svg);
      document.body.removeChild(svg);
      svg.style.visibility = svg.style.position = svg.style.left = svg.style.top = '';

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('unable to get rendering context for drawing svg');
      }
      return canvg.Canvg.from(ctx, new XMLSerializer().serializeToString(svg), {
        ignoreMouse: true,
        ignoreAnimation: true,
        ignoreClear: true,
      })
        .then((v) => {
          return v.render();
        }).then(() => {
          return canvas;
        });
    }

    abstract loadMD5(hash: string, id: string, isAudio?: true): Promise<AudioBuffer>;
    abstract loadMD5(hash: string, id: string, isAudio?: false): Promise<HTMLImageElement | HTMLCanvasElement | null>;
    abstract loadMD5(hash: string, id: string, isAudio?: boolean): Promise<HTMLImageElement | HTMLCanvasElement | AudioBuffer | null>;

    load() {
      var children: any[];
      var stage: P.core.Stage;

      return this.loadFonts()
        .then(() => Promise.all<any>([
          P.audio.loadSoundbankSB2(this),
          this.loadArray(this.projectData.children, this.loadObject.bind(this)).then((c) => children = c),
          this.loadBase(this.projectData, true).then((s) => stage = s as P.core.Stage),
        ]))
        .then(() => {
          if (this.aborted) {
            throw new Error('Loading aborting.');
          }

          children = children.filter((i) => i);
          children.forEach((c) => c.stage = stage);
          const sprites: Scratch2Sprite[] = children.filter((i) => i instanceof Scratch2Sprite);
          const watchers: Scratch2VariableWatcher[] = children.filter((i) => i instanceof Scratch2VariableWatcher);

          stage.children = sprites;
          stage.allWatchers = watchers;
          stage.allWatchers.forEach((w) => w.init());

          P.sb2.compiler.compile(stage);
          return stage;
        });
    }
  }

  export class SB2FileLoader extends BaseSB2Loader {
    private buffer: ArrayBuffer;
    private zip: JSZip;

    constructor(buffer: ArrayBuffer) {
      super();
      this.buffer = buffer;
    }

    loadMD5(hash: string, id: string, isAudio?: true): Promise<AudioBuffer>;
    loadMD5(hash: string, id: string, isAudio?: false): Promise<HTMLImageElement | HTMLCanvasElement | null>;
    loadMD5(hash: string, id: string, isAudio: boolean = false): Promise<HTMLImageElement | HTMLCanvasElement | AudioBuffer | null> {
      const f = isAudio ? (this.zip.file(id + '.wav') || this.zip.file(id + '.mp3')) : this.zip.file(id + '.gif') || (this.zip.file(id + '.png') || this.zip.file(id + '.jpg') || this.zip.file(id + '.svg'));
      if (!f) {
        throw new Error('cannot find md5: ' + hash + ' (isAudio=' + isAudio + ')');
      }
      hash = f.name;

      if (isAudio) {
        return f.async('arraybuffer')
          .then((buffer) => P.audio.decodeAudio(buffer));
      }

      const ext = hash.split('.').pop();
      if (ext === 'svg') {
        return f.async('text')
          .then((text) => this.loadSVG(text));
      } else {
        return new Promise((resolve, reject) => {
          var image = new Image();
          image.onload = function() {
            resolve(image);
          };
          image.onerror = function() {
            reject(new Error('Failed to load image: ' + hash + '/' + id));
          };
          f.async('binarystring')
            .then((data: string) => {
              image.src = 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' + btoa(data);
            });
        });
      }
    }

    load() {
      return JSZip.loadAsync(this.buffer)
        .then((data) => {
          this.zip = data;
          const project = this.zip.file('project.json');
          if (!project) {
            throw new Error('project.json is missing');
          }
          return project.async('text');
        })
        .then((project) => {
          this.projectData = P.json.parse(project);
        })
        .then(() => super.load());
    }
  }

  export class Scratch2Loader extends BaseSB2Loader {
    private projectId: number | null;

    constructor(idOrData: number | SB2Project) {
      super();
      if (typeof idOrData === 'object') {
        this.projectData = idOrData;
        this.projectId = null;
      } else {
        this.projectId = idOrData;
      }
    }

    loadMD5(hash: string, id: string, isAudio?: true): Promise<AudioBuffer>;
    loadMD5(hash: string, id: string, isAudio?: false): Promise<HTMLImageElement | HTMLCanvasElement | null>;
    loadMD5(hash: string, id: string, isAudio: boolean = false): Promise<HTMLImageElement | HTMLCanvasElement | AudioBuffer | null> {
      const ext = hash.split('.').pop();

      if (ext === 'svg') {
        return this.addTask(new P.io.Request(ASSET_URL + hash + '/get/')).load('text')
          .then((text) => this.loadSVG(text));
      } else if (ext === 'wav') {
        return this.addTask(new P.io.Request(ASSET_URL + hash + '/get/')).load('arraybuffer')
          .then((buffer) => P.audio.decodeAudio(buffer));
      } else {
        return this.loadImage(ASSET_URL + hash + '/get/');
      }
    }

    load() {
      if (this.projectId) {
        return this.addTask(new P.io.Request(P.config.PROJECT_API.replace('$id', '' + this.projectId))).load('json')
          .then((data) => {
            this.projectData = data;
            return super.load();
          });
      } else {
        return super.load();
      }
    }
  }

  function patchSVG(svg, element) {
    const FONTS: ObjectMap<string> = {
      '': 'Helvetica',
      Donegal: 'Donegal One',
      Gloria: 'Gloria Hallelujah',
      Marker: 'Permanent Marker',
      Mystery: 'Mystery Quest'
    };

    const LINE_HEIGHTS: ObjectMap<number> = {
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
      var transform = element.transform.baseVal.consolidate();
      if (transform) {
        var x = 4 - .6 * transform.matrix.a;
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
            tspan.setAttribute('x', '' + x);
            tspan.setAttribute('y', '' + (y + size * i * lineHeight));
            element.appendChild(tspan);
          }
        }
      }
    } else if ((element.hasAttribute('x') || element.hasAttribute('y')) && element.hasAttribute('transform')) {
      element.setAttribute('x', 0);
      element.setAttribute('y', 0);
    }
    [].forEach.call(element.childNodes, patchSVG.bind(null, svg));
  }
}

// Compiler for .sb2 projects
namespace P.sb2.compiler {
  const CLOUD = '☁ ';

  var LOG_PRIMITIVES;

  // Implements a Scratch 2 procedure.
  // Scratch 2 argument references just go by index, so its very simple.
  export class Scratch2Procedure extends P.core.Procedure {
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

  export var compileListener = function(object: P.core.Base, script) {
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

    var isCloudVar = function(name) {
      if (typeof name !== 'string') {
        // a dynamic variable could be a cloud variable, but we will ignore this.
        return false;
      }
      return name.startsWith(CLOUD) && object.stage.vars[name] !== undefined && object.stage.cloudVariables.indexOf(name) > -1;
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

        return 'self.username';

      } else {

        warn('Undefined val: ' + e[0]);

      }
    };

    var val = function(e, usenum?, usebool?) {
      var v;

      if (typeof e === 'number' || typeof e === 'boolean' || e === null) {

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

        return 'Math.round(S.scale * 100)';

      } else if (e[0] === 'volume') { /* Sound */

        return '(S.volume * 100)';

      } else if (e[0] === 'tempo') {

        return 'self.tempoBPM';

      } else if (e[0] === 'lineCountOfList:') { /* Data */

        return listRef(e[1]) + '.length';

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
              return '(Math.asin(' + num(e[2]) + ') * 180 / Math.PI)';
            case 'acos':
              return '(Math.acos(' + num(e[2]) + ') * 180 / Math.PI)';
            case 'atan':
              return '(Math.atan(' + num(e[2]) + ') * 180 / Math.PI)';
            case 'ln':
              return 'Math.log(' + num(e[2]) + ')';
            case 'log':
              return '(Math.log(' + num(e[2]) + ') / Math.LN10)';
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

        return '((runtime.now() - runtime.timerStart) / 1000)';

      } else if (e[0] === 'distanceTo:') {

        return 'S.distanceTo(' + val(e[1]) + ')';

      } else if (e[0] === 'soundLevel') {

        object.stage.initMicrophone();
        return 'self.microphone.getLoudness()';

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

        var less: boolean;
        let x;
        let y;

        if (typeof e[1] === 'string' && DIGIT.test(e[1]) || typeof e[1] === 'number') {
          less = e[0] === '<';
          x = e[1];
          y = e[2];
        } else if (typeof e[2] === 'string' && DIGIT.test(e[2]) || typeof e[2] === 'number') {
          less = e[0] === '>';
          x = e[2];
          y = e[1];
        }
        var nx = +x;
        if (x == null || nx !== nx) {
          return '(compare(' + val(e[1]) + ', ' + val(e[2]) + ') === ' + (e[0] === '<' ? -1 : 1) + ')';
        }
        return (less! ? 'numLess' : 'numGreater') + '(' + nx + ', ' + val(y) + ')';

      } else if (e[0] === '=') {

        let x;
        let y;
        if (typeof e[1] === 'string' && DIGIT.test(e[1]) || typeof e[1] === 'number') {
          x = e[1];
          y = e[2];
        } else if (typeof e[2] === 'string' && DIGIT.test(e[2]) || typeof e[2] === 'number') {
          x = e[2];
          y = e[1];
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
          'getKeyCode(' + val(e[1]) + ')' : val(P.runtime.getKeyCode(e[1]));
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
        return +e !== 0 && e !== '' && e !== 'false';
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
      source += 'R.start = runtime.now();\n';
      source += 'R.duration = ' + num(dur) + ' * 60 / self.tempoBPM;\n';
      source += 'var first = !WARP;\n';
    };

    var beatTail = function() {
      var id = label();
      source += 'if (!R.sound) R.sound = { stopped: false };';
      source += 'S.activeSounds.add(R.sound);\n'
      source += 'if ((runtime.now() - R.start < R.duration * 1000 || first) && !R.sound.stopped) {\n';
      source += '  var first;\n';
      forceQueue(id);
      source += '}\n';
      source += 'S.activeSounds.delete(R.sound);';
      source += 'restore();\n';
    };

    var wait = function(dur) {
      source += 'save();\n';
      source += 'R.start = runtime.now();\n';
      source += 'R.duration = ' + dur + ';\n';
      source += 'var first = !WARP;\n';

      var id = label();
      source += 'if (runtime.now() - R.start < R.duration * 1000 || first) {\n';
      source += '  var first;\n';
      forceQueue(id);
      source += '}\n';

      source += 'restore();\n';
    };

    var toHSLA = 'S.penColor.toHSLA();\n';
    toHSLA += 'S.penColor.a = 1;\n';

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

        source += 'S.rotationStyle = P.utils.parseRotationStyle(' + val(block[1]) + ');\n';

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
        source += 'R.start = runtime.now();\n';
        source += 'R.duration = ' + num(block[2]) + ';\n';
        source += 'var first = !WARP;\n';

        var id = label();
        source += 'if (runtime.now() - R.start < R.duration * 1000 || first) {\n';
        source += '  var first;\n';
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
        source += 'R.start = runtime.now();\n';
        source += 'R.duration = ' + num(block[2]) + ';\n';
        source += 'var first = !WARP;\n';

        var id = label();
        source += 'if (runtime.now() - R.start < R.duration * 1000 || first) {\n';
        source += '  var first;\n';
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

      } else if (block[0] === 'setVideoState') {

        source += 'switch (' + val(block[1]) + ') {';
        source += '  case "off": self.showVideo(false); break;';
        source += '  case "on": self.showVideo(true); break;';
        source += '}';

      // } else if (block[0] === 'setVideoTransparency') {

      } else if (block[0] === 'playSound:') { /* Sound */

        if (P.audio.context) {
          source += 'var sound = S.getSound(' + val(block[1]) + ');\n';
          source += 'if (sound) startSound(sound);\n';
        }

      } else if (block[0] === 'doPlaySoundAndWait') {

        if (P.audio.context) {
          source += 'var sound = S.getSound(' + val(block[1]) + ');\n';
          source += 'if (sound) {\n';
          source += '  save();\n';
          source += '  R.sound = playSound(sound);\n';
          source += '  S.activeSounds.add(R.sound);\n';
          source += '  R.start = runtime.now();\n';
          source += '  R.duration = sound.duration;\n';
          source += '  var first = true;\n';
          var id = label();
          source += '  if ((runtime.now() - R.start < R.duration * 1000 || first) && !R.sound.stopped) {\n';
          source += '    var first;\n';
          forceQueue(id);
          source += '  }\n';
          source += '  S.activeSounds.delete(R.sound);\n';
          source += '  restore();\n';
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
          source += 'R.sound = playSpan(DRUMS[Math.round(' + num(block[1]) + ') - 1] || DRUMS[2], 60, 10);\n';
        }
        beatTail();

      } else if (block[0] === 'rest:elapsed:from:') {

        beatHead(block[1]);
        beatTail();

      } else if (block[0] === 'noteOn:duration:elapsed:from:') {

        beatHead(block[2]);
        if (P.audio.context) {
          source += 'R.sound = playNote(' + num(block[1]) + ', R.duration);\n';
        }
        beatTail();

      // } else if (block[0] === 'midiInstrument:') {

      } else if (block[0] === 'instrument:') {

        source += 'S.instrument = Math.max(0, Math.min(INSTRUMENTS.length - 1, ' + num(block[1]) + ' - 1)) | 0;';

      } else if (block[0] === 'changeVolumeBy:' || block[0] === 'setVolumeTo:') {

        source += 'S.volume = Math.min(1, Math.max(0, ' + (block[0] === 'changeVolumeBy:' ? 'S.volume + ' : '') + num(block[1]) + ' / 100));\n';
        source += 'if (S.node) S.node.gain.value = S.volume;\n';

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

        source += 'S.penColor.setRGBA(' + num(block[1]) + ');\n';

      } else if (block[0] === 'setPenHueTo:') {

        source += toHSLA;
        source += 'S.penColor.x = ' + num(block[1]) + ' * 360 / 200;\n';
        source += 'S.penColor.y = 100;\n';

      } else if (block[0] === 'changePenHueBy:') {

        source += toHSLA;
        source += 'S.penColor.x += ' + num(block[1]) + ' * 360 / 200;\n';
        source += 'S.penColor.y = 100;\n';

      } else if (block[0] === 'setPenShadeTo:') {

        source += toHSLA;
        source += 'S.penColor.z = ' + num(block[1]) + ' % 200;\n';
        source += 'if (S.penColor.z < 0) S.penColor.z += 200;\n';
        source += 'S.penColor.y = 100;\n';

      } else if (block[0] === 'changePenShadeBy:') {

        source += toHSLA;
        source += 'S.penColor.z = (S.penColor.z + ' + num(block[1]) + ') % 200;\n';
        source += 'if (S.penColor.z < 0) S.penColor.z += 200;\n';
        source += 'S.penColor.y = 100;\n';

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
        if (isCloudVar(block[1])) {
          source += 'cloudVariableChanged(' + val(block[1]) + ');\n';
        }

      } else if (block[0] === 'changeVar:by:') {

        var ref = varRef(block[1]);
        source += ref + ' = (+' + ref + ' || 0) + ' + num(block[2]) + ';\n';
        if (isCloudVar(block[1])) {
          source += 'cloudVariableChanged(' + val(block[1]) + ');\n';
        }

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
        if (typeof block[1] === 'string') {
          var o = object.vars[block[1]] !== undefined ? 'S' : 'self';
          source += o + '.showVariable(' + val(block[1]) + ', ' + isShow + ');\n';
        } else {
          warn('ignoring dynamic variable');
        }

      // } else if (block[0] === 'showList:') {

      // } else if (block[0] === 'hideList:') {

      } else if (block[0] === 'broadcast:') { /* Control */

        source += 'var threads = broadcast(' + val(block[1]) + ');\n';
        source += 'if (threads.indexOf(BASE) !== -1) {STOPPED = true;}\n';

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
        forceQueue(id);
        source += '}\n';

      } else if (block[0] === 'glideSecs:toX:y:elapsed:from:') {

        source += 'save();\n';
        source += 'R.start = runtime.now();\n';
        source += 'R.duration = ' + num(block[1]) + ';\n';
        source += 'R.baseX = S.scratchX;\n';
        source += 'R.baseY = S.scratchY;\n';
        source += 'R.deltaX = ' + num(block[2]) + ' - S.scratchX;\n';
        source += 'R.deltaY = ' + num(block[3]) + ' - S.scratchY;\n';

        var id = label();
        source += 'var f = (runtime.now() - R.start) / (R.duration * 1000);\n';
        source += 'if (f > 1 || isNaN(f)) f = 1;\n';
        source += 'S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);\n';

        source += 'if (f < 1) {\n';
        forceQueue(id);
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'stopAll') {

        source += 'runtime.stopAll();\n';
        source += 'return;\n';

      } else if (block[0] === 'stopScripts') {

        source += 'switch (' + val(block[1]) + ') {\n';
        source += '  case "all":\n';
        source += '    runtime.stopAll();\n';
        source += '    return;\n';
        source += '  case "this script":\n';
        source += '    endCall();\n';
        source += '    return;\n';
        source += '  case "other scripts in sprite":\n';
        source += '  case "other scripts in stage":\n';
        source += '    S.stopSoundsExcept(BASE);\n';
        source += '    for (var i = 0; i < runtime.queue.length; i++) {\n';
        source += '      if (i !== THREAD && runtime.queue[i] && runtime.queue[i].sprite === S) {\n';
        source += '        runtime.queue[i].stopped = true;\n';
        source += '        runtime.queue[i].fn = undefined;\n';
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
        source += '  for (var i = 0; i < runtime.queue.length; i++) {\n';
        source += '    if (runtime.queue[i] && runtime.queue[i].sprite === S) {\n';
        source += '      runtime.queue[i] = undefined;\n';
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

        source += 'runtime.timerStart = runtime.now();\n';

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
      var used: boolean[] = [];
    }

    for (let i = 1; i < script.length; i++) {
      compile(script[i]);
    }

    if (script[0][0] === 'procDef') {
      let pre = '';
      for (let i = types.length; i--;) {
        // We know `used` is defined at this point, but typescript doesn't.
        if (used![i]) {
          const t = types[i];
          if (t === '%d' || t === '%n' || t === '%c') {
            pre += 'C.numargs[' + i + '] = +C.args[' + i + '] || 0;\n';
          } else if (t === '%b') {
            pre += 'C.boolargs[' + i + '] = bool(C.args[' + i + ']);\n';
          }
        }
      }
      source = pre + source;
      for (let i = 1, l = fns.length; i < l; ++i) {
        fns[i] += pre.length;
      }
      source += 'endCall();\n';
      source += 'return;\n';
    }

    for (let i = 0; i < fns.length; i++) {
      object.fns.push(P.runtime.createContinuation(source.slice(fns[i])));
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
      const key = P.runtime.getKeyCode(script[0][1]);
      object.addWhenKeyPressedHandler(key, f);
    } else if (script[0][0] === 'whenSceneStarts') {
      var key = script[0][1].toLowerCase();
      (object.listeners.whenSceneStarts[key] || (object.listeners.whenSceneStarts[key] = [])).push(f);
    } else if (script[0][0] === 'procDef') {
      const warp = script[0][4];
      const name = script[0][1];
      // don't define procedure if it already exists
      // https://github.com/forkphorus/forkphorus/issues/186
      if (!object.procedures[name]) {
        object.procedures[name] = new Scratch2Procedure(f, warp, inputs);
      } else {
        warn('procedure already exists: ' + name);
      }
    } else {
      warn('Undefined event: ' + script[0][0]);
    }

    if (P.config.debug) {
      var variant = script[0][0];
      if (variant === 'procDef') {
        variant += ':' + script[0][1];
      }
      console.log('compiled sb2 script', variant, source);
    }
  };

  export function compile(stage) {
    warnings = Object.create(null);

    compileScripts(stage);
    for (var i = 0; i < stage.children.length; i++) {
      compileScripts(stage.children[i]);
    }

    for (var key in warnings) {
      console.warn(key + (warnings[key] > 1 ? ' (repeated ' + warnings[key] + ' times)' : ''));
    }
  }
}
