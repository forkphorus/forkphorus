/// <reference path="phosphorus.ts" />
/// <reference path="utils.ts" />
/// <reference path="core.ts" />
/// <reference path="fonts.ts" />
/// <reference path="config.ts" />

// Scratch 3 project loader and runtime objects
namespace P.sb3 {
  // "Scratch3*" classes implement some part of the Scratch 3 runtime.
  // "SB3*" interfaces are just types for Scratch 3 projects

  /**
   * The path to fetch remote assets from.
   * Replace $md5ext with the md5sum and the format of the asset. (just use md5ext)
   */
  export const ASSETS_API = 'https://assets.scratch.mit.edu/internalapi/asset/$md5ext/get/';

  interface SB3Project {
    targets: SB3Target[];
    monitors: SB3Watcher[];
    meta: any;
  }

  export interface SB3Target {
    name: string;
    isStage: boolean;
    sounds: SB3Sound[];
    costumes: SB3Costume[];
    draggable: boolean;
    size: number;
    direction: number;
    visible: boolean;
    x: number;
    y: number;
    currentCostume: number;
    rotationStyle: string;
    layerOrder: number;
    lists: ObjectMap<SB3List>;
    variables: ObjectMap<SB3Variable>;
    blocks: ObjectMap<SB3Block>;
    broadcasts: ObjectMap<string>;
  }

  interface SB3Costume {
    /**
     * The ID of the asset. Should be its md5sum.
     * Example: "b61b1077b0ea1931abee9dbbfa7903ff"
     */
    assetId: string;
    name: string;
    /**
     * "Real pixels per image pixel"
     */
    bitmapResolution: number;
    /**
     * The ID of the asset with its extension.
     * Example: "b61b1077b0ea1931abee9dbbfa7903ff.png"
     */
    md5ext: string;
    /**
     * The format of the image.
     * Usually "png" or "svg"
     */
    dataFormat: string;
    rotationCenterX: number;
    rotationCenterY: number;
  }

  interface SB3Sound {
    assetId: string,
    name: string;
    dataFormat: string;
    format: string;
    rate: number;
    sampleCount: number;
    md5ext: string;
  }

  export interface SB3Block {
    opcode: string;
    topLevel: boolean;
    inputs: ObjectMap<any>;
    fields: ObjectMap<any>;
    mutation: any;
    parent: string | null;
    next: string | null;
  }

  interface SB3Watcher {
    spriteName: string | null;
    visible: boolean;
    id: string;
    opcode: string;
    mode: string;
    params: any;
    x: number;
    y: number;
    sliderMin?: number;
    sliderMax?: number;
    width?: number;
    height?: number;
  }

  /**
   * Tuple of name and initial value
   */
  type SB3List = [string, any[]];

  /**
   * Tuple of name and initial value
   */
  type SB3Variable = [string, any];

  // Implements a Scratch 3 Stage.
  // Adds Scratch 3 specific things such as broadcastReferences
  export class Scratch3Stage extends P.core.Stage {
    private broadcastReferences: ObjectMap<string> = {};
    public variableNames: ObjectMap<string> = {};
    public sb3data: SB3Target;

    addBroadcast(name: string, id: string) {
      this.broadcastReferences[name] = id;
    }

    lookupBroadcast(name: string) {
      // Use the mapped ID or fall back to the name.
      // Usually the name is the unique ID, but occasionally it is not.
      return this.broadcastReferences[name] || name;
    }

    lookupVariable(name: string) {
      return this.vars[this.variableNames[name]];
    }

    createVariableWatcher(target: P.core.Base, variableName: string) {
      // TODO: implement
      return null;
    }
  }

  // Implements a Scratch 3 Sprite.
  export class Scratch3Sprite extends P.core.Sprite {
    public sb3data: any;
    public variableNames: ObjectMap<string> = {};

    lookupVariable(name: string) {
      return this.vars[this.variableNames[name]];
    }

    _clone() {
      return new Scratch3Sprite(this.stage);
    }
  }

  export type Target = Scratch3Stage | Scratch3Sprite;

  // Implements a Scratch 3 VariableWatcher.
  // Adds Scratch 3-like styling
  export class Scratch3VariableWatcher extends P.core.Watcher {
    public id: string;
    public opcode: string;
    public mode: string;
    public params: any;
    public libraryEntry: P.sb3.compiler.WatchedValue;
    public sliderMin: number;
    public sliderMax: number;

    public containerEl: HTMLElement;
    public valueEl: HTMLElement;

    constructor(stage: Scratch3Stage, data: SB3Watcher) {
      super(stage, data.spriteName || '');

      // Unique ID
      this.id = data.id;
      // Operation code, similar to other parts of Scratch 3
      this.opcode = data.opcode;
      this.mode = data.mode;
      // Watcher options, varies by opcode.
      this.params = data.params;
      // This opcode's watcherLibrary entry.
      this.libraryEntry = P.sb3.compiler.watcherLibrary[this.opcode];

      this.x = data.x;
      this.y = data.y;
      this.visible = typeof data.visible === 'boolean' ? data.visible : true;

      this.sliderMin = data.sliderMin || 0;
      this.sliderMax = data.sliderMax || 0;

      // Mark ourselves as invalid if the opcode is not recognized.
      if (!this.libraryEntry) {
        console.warn('unknown watcher', this.opcode, this);
        this.valid = false;
      }
    }

    update() {
      if (this.visible) {
        // Value is only updated when the value has changed to reduce useless paints in some browsers.
        const value = this.getValue();
        if (this.valueEl.textContent !== value) {
          this.valueEl.textContent = this.getValue();
        }
      }
    }

    init() {
      super.init();

      // call init() if it exists
      if (this.libraryEntry.init) {
        this.libraryEntry.init(this);
      }

      this.updateLayout();
    }

    setVisible(visible: boolean) {
      super.setVisible(visible);
      this.updateLayout();
    }

    // Gets the label of the watcher.
    // Will include the sprite's name if any.
    // Example results are 'Sprite1: my variable' and 'timer'
    getLabel() {
      const label = this.libraryEntry.getLabel(this);
      if (!this.target.isStage) {
        return this.targetName + ': ' + label;
      }
      return label;
    }

    // Gets the value of the watcher as a string.
    getValue() {
      const value = this.libraryEntry.evaluate(this);
      // Round off numbers to the 6th decimal
      if (typeof value === 'number') {
        return '' + (Math.round(value * 1e6) / 1e6);
      }
      return '' + value;
    }

    // Attempts to set the value of the watcher.
    // Will silently fail if this watcher cannot be set.
    setValue(value: number) {
      // Not all opcodes have a set()
      if (this.libraryEntry.set) {
        this.libraryEntry.set(this, value);
      }
    }

    // Updates or creates the layout of the watcher.
    updateLayout() {
      // If the HTML element has already been created, them simply update the CSS display property.
      if (this.containerEl) {
        this.containerEl.style.display = this.visible ? 'flex' : 'none';
        return;
      }

      if (!this.visible) {
        return;
      }

      const container = document.createElement('div');
      container.classList.add('s3-watcher-container');
      container.dataset.opcode = this.opcode;
      container.style.top = (this.y / 10) + 'em';
      container.style.left = (this.x / 10) + 'em';

      const value = document.createElement('div');
      value.classList.add('s3-watcher-value');
      value.textContent = this.getValue();

      this.containerEl = container;
      this.valueEl = value;
      this.stage.ui.appendChild(container);

      const mode = this.mode;

      if (mode === 'large') {
        container.classList.add('s3-watcher-large');
        container.appendChild(value);
      } else {
        // mode is probably 'normal' or 'slider'
        // if it's not, then 'normal' would be a good fallback anyways.

        const row = document.createElement('div');
        row.classList.add('s3-watcher-row');
        row.classList.add('s3-watcher-row-normal');

        const label = document.createElement('div');
        label.classList.add('s3-watcher-label');
        label.textContent = this.getLabel();

        row.appendChild(label);
        row.appendChild(value);

        container.classList.add('s3-watcher-container-normal');
        container.appendChild(row);

        // 'slider' is a slight variation of 'normal', just with an extra slider row.
        if (mode === 'slider') {
          const slider = document.createElement('div');
          slider.classList.add('s3-watcher-row-slider');

          const input = document.createElement('input');
          input.type = 'range';
          input.min = '' + this.sliderMin;
          input.max = '' + this.sliderMax;
          input.value = this.getValue();
          input.addEventListener('input', this.sliderChanged.bind(this));

          slider.appendChild(input);
          container.appendChild(slider);
        }
      }
    }

    // Handles slider input events.
    sliderChanged(e: Event) {
      const value = +(e.target as HTMLInputElement).value;
      this.setValue(value);
    }
  }

  interface ListRow {
    row: HTMLElement;
    index: HTMLElement;
    value: HTMLElement;
  }

  export class Scratch3ListWatcher extends P.core.Watcher {
    private id: string;
    private params: any;
    private width: number;
    private height: number;
    private list: Scratch3List;
    private domRows: ListRow[] = [];
    private containerEl: HTMLElement;
    private topLabelEl: HTMLElement;
    private bottomLabelEl: HTMLElement;
    private contentEl: HTMLElement;

    constructor(stage: Scratch3Stage, data: SB3Watcher) {
      super(stage, data.spriteName || '');

      this.id = data.id;
      this.params = data.params;
      this.x = data.x;
      this.y = data.y;
      this.visible = typeof data.visible === 'boolean' ? data.visible : true;
      this.width = data.width || 100;
      this.height = data.height || 200;
    }

    update() {
      // We're not visible, so no changes would be seen. We'd only be wasting CPU cycles.
      // If the list was modified, we'll find out after we become visible.
      if (!this.visible) {
        return;
      }

      // Silently rest if the list has not been modified to improve performance for static lists.
      if (!this.list.modified) {
        return;
      }
      this.list.modified = false;
      this.updateContents();
    }

    updateContents() {
      const length = this.list.length;

      if (this.domRows.length < length) {
        while (this.domRows.length < length) {
          const row = this.createRow();
          this.domRows.push(row);
          this.contentEl.appendChild(row.row);
        }
      } else if (this.domRows.length > length) {
        while (this.domRows.length > length) {
          this.domRows.pop();
          this.contentEl.removeChild(this.contentEl.lastChild!);
        }
      }

      for (var i = 0; i < length; i++) {
        const { row, index, value } = this.domRows[i];
        const rowText = '' + this.list[i];
        if (rowText !== value.textContent) {
          value.textContent = rowText;
        }
      }

      const bottomLabelText = this.getBottomLabel();
      if (this.bottomLabelEl.textContent !== bottomLabelText) {
        this.bottomLabelEl.textContent = this.getBottomLabel();
      }
    }

    init() {
      super.init();
      if (!(this.id in this.target.lists)) {
        // Create the list if it doesn't exist.
        // It might be better to mark ourselves as invalid instead, but this works just fine.
        this.target.lists[this.id] = new Scratch3List();
      }
      this.list = this.target.lists[this.id] as Scratch3List;
      this.target.watchers[this.id] = this;
      this.updateLayout();
      this.updateContents();
    }

    getTopLabel() {
      return this.params.LIST;
    }
    getBottomLabel() {
      return 'length ' + this.list.length;
    }

    updateLayout() {
      if (!this.containerEl) {
        this.createLayout();
      }
      this.containerEl.style.display = this.visible ? '' : 'none';
    }

    setVisible(visible: boolean) {
      super.setVisible(visible);
      this.updateLayout();
    }

    createRow(): ListRow {
      const row = document.createElement('div');
      const index = document.createElement('div');
      const value = document.createElement('div');
      row.classList.add('s3-list-row');
      index.classList.add('s3-list-index');
      value.classList.add('s3-list-value');
      index.textContent = (this.domRows.length + 1).toString();
      row.appendChild(index);
      row.appendChild(value);
      return { row, index, value };
    }

    createLayout() {
      this.containerEl = document.createElement('div');
      this.topLabelEl = document.createElement('div');
      this.bottomLabelEl = document.createElement('div');
      this.contentEl = document.createElement('div');

      this.containerEl.style.top = (this.y / 10) + 'em';
      this.containerEl.style.left = (this.x / 10) + 'em';
      this.containerEl.style.height = (this.height / 10) + 'em';
      this.containerEl.style.width = (this.width / 10) + 'em';
      this.containerEl.classList.add('s3-list-container');

      this.topLabelEl.textContent = this.getTopLabel();
      this.topLabelEl.classList.add('s3-list-top-label');

      this.bottomLabelEl.textContent = this.getBottomLabel();
      this.bottomLabelEl.classList.add('s3-list-bottom-label');

      this.contentEl.classList.add('s3-list-content');

      this.containerEl.appendChild(this.topLabelEl);
      this.containerEl.appendChild(this.contentEl);
      this.containerEl.appendChild(this.bottomLabelEl);
      this.stage.ui.appendChild(this.containerEl);
    }
  }

  // Implements a Scratch 3 procedure.
  // Scratch 3 uses names as references for arguments (Scratch 2 uses indexes I believe)
  export class Scratch3Procedure extends P.core.Procedure {
    call(inputs: any[]) {
      const args = {};
      for (var i = 0; i < this.inputs.length; i++) {
        args[this.inputs[i]] = inputs[i];
      }
      return args;
    }
  }

  // An Array usable by the Scratch 3 compiler.
  // Implements Scratch list blocks and their behavior.
  export class Scratch3List extends Array {
    public modified: boolean = false;

    // Modified toString() that functions like Scratch.
    toString() {
      var i = this.length;
      while (i--) {
        if (('' + this[i]).length !== 1) {
          return this.join(' ');
        }
      }
      return this.join('');
    }

    /**
     * Determines the "real" 0-indexed index of a 1-indexed Scratch index.
     * @param index A scratch 1-indexed index, or 'random', 'any', 'last'
     * @returns The 0-indexed index, or -1
     */
    scratchIndex(index: number | string): number {
      if (index === 'random' || index === 'any') {
        return Math.floor(Math.random() * this.length);
      }
      if (index === 'last') {
        return this.length - 1;
      }
      if (index < 1 || index > this.length) {
        return -1;
      }
      return +index - 1;
    }

    // Deletes a line from the list.
    // index is a scratch index.
    deleteLine(index: number | 'all') {
      if (index === 'all') {
        this.modified = true;
        this.length = 0;
        return;
      }

      index = this.scratchIndex(index);
      if (index === this.length - 1) {
        this.modified = true;
        this.pop();
      } else if (index !== -1) {
        this.modified = true;
        this.splice(index, 1);
      }
    }

    // Adds an item to the list.
    push(...items: any[]) {
      this.modified = true;
      return super.push(...items);
    }

    // Inserts an item at a spot in the list.
    // Index is a Scratch index.
    insert(index: number, value: any) {
      index = this.scratchIndex(index);
      if (index === this.length) {
        this.modified = true;
        this.push(value);
      } else if (index !== -1) {
        this.modified = true;
        this.splice(index, 0, value);
      }
    }

    // Sets the index of something in the list.
    set(index: number, value: any) {
      index = this.scratchIndex(index);
      if (index !== -1) {
        this.modified = true;
        this[index] = value;
      }
    }
  }

  // Modifies a Scratch 3 SVG to work properly in our environment.
  function patchSVG(svg: SVGElement) {
    // Adjust Scratch's font names to match what we name them.
    const FONTS: ObjectMap<string> = {
      'Marker': 'Knewave',
      'Handwriting': 'Handlee',
      'Curly': 'Griffy',
      'Serif': 'serif',
      'Sans Serif': 'sans-serif',
      // 'Serif': 'Source Serif Pro',
      // 'Sans Serif': 'Noto Sans',
    };

    const textElements = svg.querySelectorAll('text');
    for (const el of textElements) {
      const font = el.getAttribute('font-family') || '';
      if (FONTS[font]) {
        el.setAttribute('font-family', FONTS[font]);
      }
    }
  }

  // Implements base SB3 loading logic.
  // Needs to be extended to add file loading methods.
  // Implementations are expected to set `this.projectData` to something before calling super.load()
  export abstract class BaseSB3Loader {
    protected projectData: SB3Project;

    protected abstract getAsText(path: string): Promise<string>;
    protected abstract getAsArrayBuffer(path: string): Promise<ArrayBuffer>;
    protected abstract getAsImage(path: string, format: string): Promise<HTMLImageElement>;

    // Loads and returns a costume from its sb3 JSON data
    getImage(path: string, format: string): Promise<HTMLImageElement | HTMLCanvasElement> {
      if (format === 'svg') {
        return this.getAsText(path)
          .then((source) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(source, 'image/svg+xml');
            const svg = doc.documentElement as any;
            patchSVG(svg);

            const canvas = document.createElement('canvas');

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
                  resolve(canvas);
                }
              });
            });
          });
      } else {
        return this.getAsImage(path, format);
      }
    }

    loadCostume(data: SB3Costume, index: number): Promise<P.core.Costume> {
      const path = data.assetId + '.' + data.dataFormat;
      return this.getImage(path, data.dataFormat)
        .then((image) => new P.core.Costume({
          index: index,
          bitmapResolution: data.bitmapResolution,
          name: data.name,
          rotationCenterX: data.rotationCenterX,
          rotationCenterY: data.rotationCenterY,
          layers: [image],
        }));
    }

    getAudioBuffer(path: string) {
      return this.getAsArrayBuffer(path)
        .then((buffer) => P.audio.decodeAudio(buffer))
        .catch((err) => {
          throw new Error(`Could not load audio: ${path} (${err})`);
        });
    }

    loadSound(data: SB3Sound): Promise<P.core.Sound> {
      return this.getAudioBuffer(data.md5ext)
        .then((buffer) => new P.core.Sound({
          name: data.name,
          buffer: buffer,
        }));
    }

    loadWatcher(data: SB3Watcher, stage: Scratch3Stage): P.core.Watcher {
      if (data.mode === 'list') {
        return new Scratch3ListWatcher(stage, data);
      }

      return new Scratch3VariableWatcher(stage, data);
    }

    loadTarget(data: SB3Target): Promise<Target> {
      // dirty hack for null stage
      const target = new (data.isStage ? Scratch3Stage : Scratch3Sprite)(null as any);

      for (const id of Object.keys(data.variables)) {
        const variable = data.variables[id];
        const name = variable[0];
        const value = variable[1];
        target.vars[id] = value;
        target.variableNames[name] = id;
      }

      for (const id of Object.keys(data.lists)) {
        const list = data.lists[id];
        target.lists[id] = new Scratch3List().concat(list[1]);
      }

      target.name = data.name;
      target.currentCostumeIndex = data.currentCostume;
      target.sb3data = data;

      if (target.isStage) {
        const stage = target as Scratch3Stage;
        for (const id of Object.keys(data.broadcasts)) {
          const name = data.broadcasts[id];
          stage.addBroadcast(name, id);
        }
      } else {
        const sprite = target as Scratch3Sprite;
        sprite.scratchX = data.x;
        sprite.scratchY = data.y;
        sprite.visible = data.visible;
        sprite.direction = data.direction;
        sprite.scale = data.size / 100;
        sprite.isDraggable = data.draggable;
        sprite.rotationStyle = P.utils.parseRotationStyle(data.rotationStyle);
      }

      const costumesPromise = Promise.all<P.core.Costume>(data.costumes.map((c: any, i: any) => this.loadCostume(c, i)));
      const soundsPromise = Promise.all<P.core.Sound>(data.sounds.map((c) => this.loadSound(c)));

      return Promise.all<P.core.Costume[], P.core.Sound[]>([costumesPromise, soundsPromise])
        .then((result) => {
          const costumes = result[0];
          const sounds = result[1];

          target.costumes = costumes;
          sounds.forEach((sound: P.core.Sound) => target.addSound(sound));

          return target;
        });
    }

    loadFonts(): Promise<void> {
      return P.fonts.loadScratch3();
    }

    load() {
      if (!this.projectData) {
        throw new Error('invalid project data');
      }
      if (!Array.isArray(this.projectData.targets)) {
        throw new Error('no targets');
      }

      const targets = this.projectData.targets;
      // sort targets by their layerOrder to match how they will display
      targets.sort((a, b) => a.layerOrder - b.layerOrder);

      return this.loadFonts()
        .then(() => Promise.all(targets.map((data) => this.loadTarget(data))))
        .then((targets: any) => {
          const stage = targets.filter((i) => i.isStage)[0] as Scratch3Stage;
          if (!stage) {
            throw new Error('no stage object');
          }
          const sprites = targets.filter((i) => i.isSprite) as Scratch3Sprite[];
          const watchers = this.projectData.monitors
            .map((data) => this.loadWatcher(data, stage))
            .filter((i) => i && i.valid);

          sprites.forEach((sprite) => sprite.stage = stage);
          targets.forEach((base) => P.sb3.compiler.compileTarget(base, base.sb3data));
          stage.children = sprites;
          stage.allWatchers = watchers;
          watchers.forEach((watcher) => watcher.init());
          stage.updateBackdrop();

          return stage;
        });
    }
  }

  // Loads a .sb3 file
  export class SB3FileLoader extends BaseSB3Loader {
    private buffer: ArrayBuffer;
    private zip: JSZip.Zip;

    constructor(buffer: ArrayBuffer) {
      super();
      this.buffer = buffer;
    }

    getAsText(path: string) {
      P.IO.progressHooks.new();
      return this.zip.file(path).async('text')
        .then((response) => {
          P.IO.progressHooks.end();
          return response;
        });
    }

    getAsArrayBuffer(path: string) {
      P.IO.progressHooks.new();
      return this.zip.file(path).async('arrayBuffer')
        .then((response) => {
          P.IO.progressHooks.end();
          return response;
        });
    }

    getAsBase64(path: string) {
      P.IO.progressHooks.new();
      return this.zip.file(path).async('base64')
        .then((response) => {
          P.IO.progressHooks.end();
          return response;
        });
    }

    getAsImage(path: string, format: string) {
      P.IO.progressHooks.new();
      return this.getAsBase64(path)
        .then((imageData) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
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
  export class Scratch3Loader extends BaseSB3Loader {
    private projectId: number | null;

    constructor(idOrData: number | SB3Project) {
      super();
      if (typeof idOrData === 'object') {
        this.projectData = idOrData;
        this.projectId = null;
      } else {
        this.projectId = idOrData;
      }
    }

    getAsText(path: string) {
      return P.IO.fetch(ASSETS_API.replace('$md5ext', path))
        .then((request) => request.text());
    }

    getAsArrayBuffer(path: string) {
      return P.IO.fetch(ASSETS_API.replace('$md5ext', path))
        .then((request) => request.arrayBuffer());
    }

    getAsImage(path: string) {
      P.IO.progressHooks.new();
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = function() {
          P.IO.progressHooks.end();
          resolve(image);
        };
        image.onerror = function(err) {
          P.IO.progressHooks.error(err);
          reject('Failed to load image: ' + image.src);
        };
        image.crossOrigin = 'anonymous';
        image.src = ASSETS_API.replace('$md5ext', path);
      });
    }

    load() {
      if (this.projectId) {
        return P.IO.fetch(P.config.PROJECT_API.replace('$id', '' + this.projectId))
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
}

// Compiler for .sb3 projects
namespace P.sb3.compiler {
  // Source of the current script being compiled.
  let source: string;
  // The target being compiled.
  let currentTarget: P.sb3.Target;
  // The blocks of the target.
  let blocks: ObjectMap<Block>;
  // Points to the position of functions (by string index) within the compiled source.
  let fns: number[];

  // Alias Block so you don't have you type as much
  import Block = P.sb3.SB3Block;

  /*
  In Scratch 3 all blocks have a unique identifier.
  In the project.json, blocks do not contain other blocks in the way a .sb2 file does, but rather they point to the IDs of other blocks.

  This compiler differentiates between "statements", "expressions", "top levels", and "natives".
  Statements are things like `move [ ] steps`. They do something. Cannot be placed in other blocks.
  Expressions are things like `size`, `addition`, `and` etc. They return something. Cannot do anything on their own.
  Natives are things that are core parts of the runtime. This is stuff like strings, numbers, variable references, list references, colors.
  Top levels are top level blocks like `when green flag pressed`, they react to events.
  Each of these are separated and compiled differently and in different spots.
  */

  // A CompiledExpression is a type of expression made by an expression compiler with extra
  // data such as types for sake of optimization.
  class CompiledExpression {
    /**
     * The source code of this expression.
     */
    public source: string;

    /**
     * The type of this expression. Guarantees that, when evaluated, this expression will **always**
     * return a value of a certain type to avoid type coercion overhead.
     */
    public type: ExpressionType;

    constructor(src: string, type: ExpressionType) {
      this.source = src;
      this.type = type;
    }
  }

  // Easier aliases for CompiledExpression
  const numberExpr = (src: string) => new CompiledExpression(src, 'number');
  const stringExpr = (src: string) => new CompiledExpression(src, 'string');
  const booleanExpr = (src: string) => new CompiledExpression(src, 'boolean');

  // All possible types you can compile an expression into.
  type ExpressionType = 'string' | 'boolean' | 'number';

  // Compiler for a top level block
  export type TopLevelCompiler = (block: Block, f: P.runtime.Fn) => void;
  // Compiler for an expression
  export type ExpressionCompiler = (block: Block) => string | CompiledExpression;
  // Compiler for a statement
  export type StatementCompiler = (block: Block) => void;
  // Compiler/handler for a watcher
  export interface WatchedValue {
    /**
     * Initializes the watcher.
     */
    init?(watcher: P.sb3.Scratch3VariableWatcher): void;
    /**
     * Sets the value of the watcher to a new number.
     */
    set?(watcher: P.sb3.Scratch3VariableWatcher, value: number): void;
    /**
     * Evaluates the current value of the watcher. Called every visible frame.
     */
    evaluate(watcher: P.sb3.Scratch3VariableWatcher): any;
    /**
     * Determines the label to display in the watcher. Called once during initialization (after init)
     */
    getLabel(watcher: P.sb3.Scratch3VariableWatcher): string;
  }

  // IDs of primitive types
  // https://github.com/LLK/scratch-vm/blob/36fe6378db930deb835e7cd342a39c23bb54dd72/src/serialization/sb3.js#L60-L79
  const enum PrimitiveTypes {
    MATH_NUM = 4,
    POSITIVE_NUM = 5,
    WHOLE_NUM = 6,
    INTEGER_NUM = 7,
    ANGLE_NUM = 8,
    COLOR_PICKER = 9,
    TEXT = 10,
    BROADCAST = 11,
    VAR = 12,
    LIST = 13,
  }

  /**
   * Maps opcodes of top level blocks to their handler
   */
  export const topLevelLibrary: ObjectMap<TopLevelCompiler> = {
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
      currentTarget.listeners.whenClicked.push(f);
    },
    event_whenbackdropswitchesto(block, f) {
      const backdrop = block.fields.BACKDROP[0];
      if (!currentTarget.listeners.whenBackdropChanges[backdrop]) {
        currentTarget.listeners.whenBackdropChanges[backdrop] = [];
      }
      currentTarget.listeners.whenBackdropChanges[backdrop].push(f);
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
      // Warp is either a boolean or a string representation of that boolean for some reason.
      const warp = typeof mutation.warp === 'string' ? mutation.warp === 'true' : mutation.warp;
      // It's a stringified JSON array.
      const argumentNames = JSON.parse(mutation.argumentnames);

      const procedure = new P.sb3.Scratch3Procedure(f, warp, argumentNames);
      currentTarget.procedures[name] = procedure;
    },
  };

  // An untyped undefined works as it does in Scratch 3.
  // Becomes "undefined" when used as a string, becomes 0 when used as number, false when used as boolean.
  const noopExpression = () => 'undefined';

  /**
   * Maps expression opcodes to their handler
   */
  export const expressionLibrary: ObjectMap<ExpressionCompiler> = {
    // Motion
    motion_goto_menu(block) {
      const to = block.fields.TO[0];
      return sanitizedExpression(to);
    },
    motion_glideto_menu(block) {
      const to = block.fields.TO[0];
      return sanitizedExpression(to);
    },
    motion_pointtowards_menu(block) {
      const towards = block.fields.TOWARDS[0];
      return sanitizedExpression(towards);
    },
    motion_xposition(block) {
      return numberExpr('S.scratchX');
    },
    motion_yposition(block) {
      return numberExpr('S.scratchY');
    },
    motion_direction() {
      return numberExpr('S.direction');
    },

    // Looks
    looks_costume(block) {
      const costume = block.fields.COSTUME;
      return sanitizedExpression(costume[0]);
    },
    looks_backdrops(block) {
      const backdrop = block.fields.BACKDROP[0];
      return sanitizedExpression(backdrop);
    },
    looks_costumenumbername(block) {
      const name = block.fields.NUMBER_NAME[0];
      if (name === 'number') {
        return numberExpr('(S.currentCostumeIndex + 1)');
      } else {
        // `name` is probably 'name', but it doesn't matter
        return stringExpr('S.costumes[S.currentCostumeIndex].name');
      }
    },
    looks_backdropnumbername(block) {
      const name = block.fields.NUMBER_NAME[0];
      if (name === 'number') {
        return numberExpr('(self.currentCostumeIndex + 1)');
      } else {
        // `name` is probably 'name', but it doesn't matter
        return stringExpr('self.costumes[self.currentCostumeIndex].name');
      }
    },
    looks_size() {
      return numberExpr('(S.scale * 100)');
    },

    // Sounds
    sound_sounds_menu(block) {
      const sound = block.fields.SOUND_MENU[0];
      return sanitizedExpression(sound);
    },
    sound_volume() {
      return numberExpr('(S.volume * 100)');
    },

    // Control
    control_create_clone_of_menu(block) {
      const option = block.fields.CLONE_OPTION;
      return sanitizedExpression(option[0]);
    },
    control_get_counter(block) {
      return numberExpr('self.counter');
    },

    // Sensing
    sensing_touchingobject(block) {
      const object = block.inputs.TOUCHINGOBJECTMENU;
      return booleanExpr('S.touching(' + compileExpression(object) + ')');
    },
    sensing_touchingobjectmenu(block) {
      const object = block.fields.TOUCHINGOBJECTMENU;
      return sanitizedExpression(object[0]);
    },
    sensing_touchingcolor(block) {
      const color = block.inputs.COLOR;
      return booleanExpr('S.touchingColor(' + compileExpression(color) + ')');
    },
    sensing_coloristouchingcolor(block) {
      const color = block.inputs.COLOR;
      const color2 = block.inputs.COLOR2;
      return booleanExpr('S.colorTouchingColor(' + compileExpression(color) + ', ' + compileExpression(color2) + ')');
    },
    sensing_distanceto(block) {
      const menu = block.inputs.DISTANCETOMENU;
      return numberExpr('S.distanceTo(' + compileExpression(menu) + ')');
    },
    sensing_distancetomenu(block) {
      return sanitizedExpression(block.fields.DISTANCETOMENU[0]);
    },
    sensing_answer(block) {
      return stringExpr('self.answer');
    },
    sensing_keypressed(block) {
      const key = block.inputs.KEY_OPTION;
      return booleanExpr('!!self.keys[P.utils.getKeyCode(' + compileExpression(key) + ')]');
    },
    sensing_keyoptions(block) {
      const key = block.fields.KEY_OPTION[0];
      return sanitizedExpression(key);
    },
    sensing_mousedown(block) {
      return booleanExpr('self.mousePressed');
    },
    sensing_mousex(block) {
      return numberExpr('self.mouseX');
    },
    sensing_mousey(block) {
      return numberExpr('self.mouseY');
    },
    sensing_loudness(block) {
      // We don't implement loudness, we always return -1 which indicates that there is no microphone available.
      return numberExpr('-1');
    },
    sensing_loud(block) {
      // see sensing_loudness above
      return booleanExpr('false');
    },
    sensing_timer(block) {
      return numberExpr('((runtime.now - runtime.timerStart) / 1000)');
    },
    sensing_of(block) {
      const property = block.fields.PROPERTY[0];
      const object = block.inputs.OBJECT;
      return 'attribute(' + sanitizedString(property) + ', ' + compileExpression(object, 'string') + ')';
    },
    sensing_of_object_menu(block) {
      const object = block.fields.OBJECT[0];
      return sanitizedExpression(object);
    },
    sensing_current(block) {
      const current = block.fields.CURRENTMENU[0].toLowerCase();

      switch (current) {
        case 'year': return numberExpr('new Date().getFullYear()');
        case 'month': return numberExpr('(new Date().getMonth() + 1)');
        case 'date': return numberExpr('new Date().getDate()');
        case 'dayofweek': return numberExpr('(new Date().getDay() + 1)');
        case 'hour': return numberExpr('new Date().getHours()');
        case 'minute': return numberExpr('new Date().getMinutes()');
        case 'second': return numberExpr('new Date().getSeconds()');
      }

      return numberExpr('0');
    },
    sensing_dayssince2000(block) {
      return numberExpr('((Date.now() - epoch) / 86400000)');
    },
    sensing_username(block) {
      return stringExpr('self.username');
    },

    // Operators
    operator_add(block) {
      const num1 = block.inputs.NUM1;
      const num2 = block.inputs.NUM2;
      return numberExpr('(' + compileExpression(num1, 'number') + ' + ' + compileExpression(num2, 'number') + ' || 0)');
    },
    operator_subtract(block) {
      const num1 = block.inputs.NUM1;
      const num2 = block.inputs.NUM2;
      return numberExpr('(' + compileExpression(num1, 'number') + ' - ' + compileExpression(num2, 'number') + ' || 0)');
    },
    operator_multiply(block) {
      const num1 = block.inputs.NUM1;
      const num2 = block.inputs.NUM2;
      return numberExpr('(' + compileExpression(num1, 'number') + ' * ' + compileExpression(num2, 'number') + ' || 0)');
    },
    operator_divide(block) {
      const num1 = block.inputs.NUM1;
      const num2 = block.inputs.NUM2;
      return numberExpr('(' + compileExpression(num1, 'number') + ' / ' + compileExpression(num2, 'number') + ' || 0)');
    },
    operator_random(block) {
      const from = block.inputs.FROM;
      const to = block.inputs.TO;
      return numberExpr('random(' + compileExpression(from, 'number') + ', ' + compileExpression(to, 'number') + ')');
    },
    operator_gt(block) {
      const operand1 = block.inputs.OPERAND1;
      const operand2 = block.inputs.OPERAND2;
      // TODO: use numGreater?
      return booleanExpr('(compare(' + compileExpression(operand1) + ', ' + compileExpression(operand2) + ') === 1)');
    },
    operator_lt(block) {
      const operand1 = block.inputs.OPERAND1;
      const operand2 = block.inputs.OPERAND2;
      // TODO: use numLess?
      return booleanExpr('(compare(' + compileExpression(operand1) + ', ' + compileExpression(operand2) + ') === -1)');
    },
    operator_equals(block) {
      const operand1 = block.inputs.OPERAND1;
      const operand2 = block.inputs.OPERAND2;
      return booleanExpr('equal(' + compileExpression(operand1) + ', ' + compileExpression(operand2) + ')');
    },
    operator_and(block) {
      const operand1 = block.inputs.OPERAND1;
      const operand2 = block.inputs.OPERAND2;
      return booleanExpr('(' + compileExpression(operand1) + ' && ' + compileExpression(operand2) + ')');
    },
    operator_or(block) {
      const operand1 = block.inputs.OPERAND1;
      const operand2 = block.inputs.OPERAND2;
      return booleanExpr('(' + compileExpression(operand1) + ' || ' + compileExpression(operand2) + ')');
    },
    operator_not(block) {
      const operand = block.inputs.OPERAND;
      return booleanExpr('!' + compileExpression(operand));
    },
    operator_join(block) {
      const string1 = block.inputs.STRING1;
      const string2 = block.inputs.STRING2;
      return stringExpr('(' + compileExpression(string1, 'string') + ' + ' + compileExpression(string2, 'string') + ')');
    },
    operator_letter_of(block) {
      const string = block.inputs.STRING;
      const letter = block.inputs.LETTER;
      return stringExpr('((' + compileExpression(string, 'string') + ')[(' + compileExpression(letter, 'number') + ' | 0) - 1] || "")');
    },
    operator_length(block) {
      const string = block.inputs.STRING;
      // TODO: parenthesis important?
      return numberExpr('(' + compileExpression(string, 'string') + ').length');
    },
    operator_contains(block) {
      const string1 = block.inputs.STRING1;
      const string2 = block.inputs.STRING2;
      return booleanExpr(compileExpression(string1, 'string') + '.includes(' + compileExpression(string2, 'string') + ')');
    },
    operator_mod(block) {
      const num1 = block.inputs.NUM1;
      const num2 = block.inputs.NUM2;
      return numberExpr('mod(' + compileExpression(num1) + ', ' + compileExpression(num2) + ')');
    },
    operator_round(block) {
      const num = block.inputs.NUM;
      return numberExpr('Math.round(' + compileExpression(num, 'number') + ')');
    },
    operator_mathop(block) {
      const operator = block.fields.OPERATOR[0];
      const num = block.inputs.NUM;
      const compiledNum = compileExpression(num, 'number');

      switch (operator) {
        case 'abs':
          return numberExpr(`Math.abs(${compiledNum})`);
        case 'floor':
          return numberExpr(`Math.floor(${compiledNum})`);
        case 'sqrt':
          return numberExpr(`Math.sqrt(${compiledNum})`);
        case 'ceiling':
          return numberExpr(`Math.ceil(${compiledNum})`);
        case 'cos':
          return numberExpr(`Math.cos(${compiledNum} * Math.PI / 180)`);
        case 'sin':
          return numberExpr(`Math.sin(${compiledNum} * Math.PI / 180)`);
        case 'tan':
          return numberExpr(`Math.tan(${compiledNum} * Math.PI / 180)`);
        case 'asin':
          return numberExpr(`(Math.asin(${compiledNum}) * 180 / Math.PI)`)
        case 'acos':
          return numberExpr(`(Math.acos(${compiledNum}) * 180 / Math.PI)`)
        case 'atan':
          return numberExpr(`(Math.atan(${compiledNum}) * 180 / Math.PI)`)
        case 'ln':
          return numberExpr(`Math.log(${compiledNum})`);
        case 'log':
          return numberExpr(`(Math.log(${compiledNum}) / Math.LN10)`);
        case 'e ^':
          return numberExpr(`Math.exp(${compiledNum})`);
        case '10 ^':
          return numberExpr(`Math.exp(${compiledNum} * Math.LN10)`);
        default:
          return numberExpr('0');
      }
    },

    // Data
    data_itemoflist(block) {
      const list = block.fields.LIST[1];
      const index = block.inputs.INDEX;
      return 'getLineOfList(' + listReference(list) + ', ' + compileExpression(index) + ')';
    },
    data_itemnumoflist(block) {
      const list = block.fields.LIST[1];
      const item = block.inputs.ITEM;
      return numberExpr('listIndexOf(' + listReference(list) + ', ' + compileExpression(item) + ')');
    },
    data_lengthoflist(block) {
      const list = block.fields.LIST[1];
      return numberExpr(listReference(list) + '.length');
    },
    data_listcontainsitem(block) {
      const list = block.fields.LIST[1];
      const item = block.inputs.ITEM;
      return booleanExpr('listContains(' + listReference(list) + ', ' + compileExpression(item) + ')');
    },

    // Procedures/arguments
    argument_reporter_string_number(block) {
      const name = block.fields.VALUE[0];
      return 'C.args[' + sanitizedString(name) + ']';
    },
    argument_reporter_boolean(block) {
      const name = block.fields.VALUE[0];
      // Forcibly convert to boolean
      return booleanExpr(asType('C.args[' + sanitizedString(name) + ']', 'boolean'));
    },

    // The matrix, a little known expression. Only used in some of the robot extensions.
    matrix(block) {
      const matrix = block.fields.MATRIX[0];
      // This is a string, not a number. It's not to be treated as binary digits to convert to base 10.
      return sanitizedExpression(matrix);
    },

    // Pen (extension)
    pen_menu_colorParam(block) {
      const colorParam = block.fields.colorParam[0];
      return sanitizedExpression(colorParam);
    },

    // Music (extension)
    music_getTempo(block) {
      return numberExpr('self.tempoBPM');
    },

    // Legacy no-ops
    // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_sensing.js#L74
    sensing_userid: noopExpression,
    // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_motion.js#L42-L43
    motion_xscroll: noopExpression,
    motion_yscroll: noopExpression,
  };

  const noopStatement = () => { source += '/* noop */\n'};

  /**
   * Maps statement opcodes to their handler
   */
  export const statementLibrary: ObjectMap<StatementCompiler> = {
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
    motion_glideto(block) {
      const secs = block.inputs.SECS;
      const to = block.inputs.TO;

      visualCheck('drawing');
      source += 'save();\n';
      source += 'R.start = runtime.now;\n';
      source += 'R.duration = ' + compileExpression(secs) + ';\n';
      source += 'R.baseX = S.scratchX;\n';
      source += 'R.baseY = S.scratchY;\n';
      source += 'var to = self.getPosition(' + compileExpression(to) + ');\n';
      source += 'if (to) {';
      source += 'R.deltaX = to.x - S.scratchX;\n';
      source += 'R.deltaY = to.y - S.scratchY;\n';
      const id = label();
      source += 'var f = (runtime.now - R.start) / (R.duration * 1000);\n';
      source += 'if (f > 1) f = 1;\n';
      source += 'S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);\n';
      source += 'if (f < 1) {\n';
      forceQueue(id);
      source += '}\n';
      source += 'restore();\n';
      source += '}\n';
    },
    motion_glidesecstoxy(block) {
      const secs = block.inputs.SECS;
      const x = block.inputs.X;
      const y = block.inputs.Y;

      visualCheck('drawing');
      source += 'save();\n';
      source += 'R.start = runtime.now;\n';
      source += 'R.duration = ' + compileExpression(secs) + ';\n';
      source += 'R.baseX = S.scratchX;\n';
      source += 'R.baseY = S.scratchY;\n';
      source += 'R.deltaX = ' + compileExpression(x) + ' - S.scratchX;\n';
      source += 'R.deltaY = ' + compileExpression(y) + ' - S.scratchY;\n';
      const id = label();
      source += 'var f = (runtime.now - R.start) / (R.duration * 1000);\n';
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
      // TODO: set visual if bounced
      source += 'S.bounceOffEdge();\n';
    },
    motion_setrotationstyle(block) {
      const style = block.fields.STYLE[0];
      source += 'S.rotationStyle = ' + P.utils.parseRotationStyle(style) + ';\n';
      visualCheck('visible');
    },

    // Looks
    looks_sayforsecs(block) {
      const message = block.inputs.MESSAGE;
      const secs = block.inputs.SECS;
      source += 'save();\n';
      source += 'R.id = S.say(' + compileExpression(message) + ', false);\n';
      source += 'R.start = runtime.now;\n';
      source += 'R.duration = ' + compileExpression(secs, 'number') + ';\n';
      const id = label();
      source += 'if (runtime.now - R.start < R.duration * 1000) {\n';
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
      source += 'R.start = runtime.now;\n';
      source += 'R.duration = ' + compileExpression(secs, 'number') + ';\n';
      const id = label();
      source += 'if (runtime.now - R.start < R.duration * 1000) {\n';
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
      source += 'var threads = backdropChange();\n';
      source += 'if (threads.indexOf(BASE) !== -1) {return;}\n';
    },
    looks_nextbackdrop(block) {
      source += 'self.showNextCostume();\n';
      visualCheck('always');
      source += 'var threads = backdropChange();\n';
      source += 'if (threads.indexOf(BASE) !== -1) {return;}\n';
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
      source += 'S.changeFilter(' + sanitizedString(effect).toLowerCase() + ', ' + compileExpression(change, 'number') + ');\n';
      visualCheck('visible');
    },
    looks_seteffectto(block) {
      const effect = block.fields.EFFECT[0];
      const value = block.inputs.VALUE;
      // Lowercase conversion is necessary to remove capitals, which we do not want.
      source += 'S.setFilter(' + sanitizedString(effect).toLowerCase() + ', ' + compileExpression(value, 'number') + ');\n';
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
      visualCheck('visible');
      source += 'S.visible = false;\n';
      updateBubble();
    },
    looks_gotofrontback(block) {
      const frontBack = block.fields.FRONT_BACK[0];
      source += 'var i = self.children.indexOf(S);\n';
      source += 'if (i !== -1) self.children.splice(i, 1);\n';
      if (frontBack === 'front') {
        source += 'self.children.push(S);\n';
      } else {
        // `frontBack` is probably 'back', but it doesn't matter
        source += 'self.children.unshift(S);\n';
      }
    },
    looks_goforwardbackwardlayers(block) {
      const direction = block.fields.FORWARD_BACKWARD[0];
      const number = block.inputs.NUM;
      source += 'var i = self.children.indexOf(S);\n';
      source += 'if (i !== -1) {\n';
      source += '  self.children.splice(i, 1);\n';
      if (direction === 'forward') {
        source += '  self.children.splice(Math.min(self.children.length - 1, i + ' + compileExpression(number) + '), 0, S);\n';
      } else {
        // `direction` is probably 'backward', but it doesn't matter
        source += '  self.children.splice(Math.max(0, i - ' + compileExpression(number) + '), 0, S);\n';
      }
      source += '}\n';
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
      source += 'R.start = runtime.now;\n';
      source += 'R.duration = ' + compileExpression(duration) + ';\n';
      source += 'var first = true;\n';
      const id = label();
      source += 'if (runtime.now - R.start < R.duration * 1000 || first) {\n';
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
      source += 'if (!' + compileExpression(condition) + ') {\n';
      compileSubstack(substack);
      queue(id);
      source += '}\n';
    },
    control_while(block) {
      // Hacked block
      const condition = block.inputs.CONDITION;
      const substack = block.inputs.SUBSTACK;
      const id = label();
      source += 'if (' + compileExpression(condition, 'boolean') + ') {\n';
      compileSubstack(substack);
      queue(id);
      source += '}\n';
    },
    control_all_at_once(block) {
      // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_control.js#L194-L199
      const substack = block.inputs.SUBSTACK;
      compileSubstack(substack);
    },
    control_stop(block) {
      const option = block.fields.STOP_OPTION[0];

      switch (option) {
        case 'all':
          source += 'runtime.stopAll();\n';
          source += 'return;\n';
          break;
        case 'this script':
          source += 'endCall();\n';
          source += 'return;\n';
          break;
        case 'other scripts in sprite':
        case 'other scripts in stage':
          source += 'for (var i = 0; i < runtime.queue.length; i++) {\n';
          source += '  if (i !== THREAD && runtime.queue[i] && runtime.queue[i].sprite === S) {\n';
          source += '    runtime.queue[i] = undefined;\n';
          source += '  }\n';
          source += '}\n';
          break;
        default:
          // If the field is not recognized or not a compile-time constant, then fallback to a large switch statement.
          source += 'switch (' + sanitizedString(option) + ') {\n';
          source += '  case "all":\n';
          source += '    runtime.stopAll();\n';
          source += '    return;\n';
          source += '  case "this script":\n';
          source += '    endCall();\n';
          source += '    return;\n';
          source += '  case "other scripts in sprite":\n';
          source += '  case "other scripts in stage":\n';
          source += '    for (var i = 0; i < runtime.queue.length; i++) {\n';
          source += '      if (i !== THREAD && runtime.queue[i] && runtime.queue[i].sprite === S) {\n';
          source += '        runtime.queue[i] = undefined;\n';
          source += '      }\n';
          source += '    }\n';
          source += '    break;\n';
          source += '}\n';
      }
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
      source += '  for (var i = 0; i < runtime.queue.length; i++) {\n';
      source += '    if (runtime.queue[i] && runtime.queue[i].sprite === S) {\n';
      source += '      runtime.queue[i] = undefined;\n';
      source += '    }\n';
      source += '  }\n';
      source += '  return;\n';
      source += '}\n';
    },
    control_incr_counter(block) {
      source += 'self.counter++;\n';
    },
    control_clear_counter(block) {
      source += 'self.counter = 0;\n';
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

      source += 'S.ask(' + compileExpression(question, 'string') + ');\n';
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
        // it doesn't matter what `dragMode` is at this point
        source += 'S.isDraggable = false;\n';
      }
    },
    sensing_resettimer(blocK) {
      source += 'runtime.timerStart = runtime.now;\n';
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
      source += ref + ' = (' + asType(ref, 'number') + ' + ' + compileExpression(value, 'number') + ');\n';
    },
    data_showvariable(block) {
      const variable = block.fields.VARIABLE[1];
      const scope = variableScope(variable);
      source += scope + '.showVariable(' + sanitizedString(variable) + ', true);\n';
    },
    data_hidevariable(block) {
      const variable = block.fields.VARIABLE[1];
      const scope = variableScope(variable);
      source += scope + '.showVariable(' + sanitizedString(variable) + ', false);\n';
    },
    data_showlist(block) {
      const list = block.fields.LIST[1];
      const scope = listScope(list);
      source += scope + '.showVariable(' + sanitizedString(list) + ', true);\n';
    },
    data_hidelist(block) {
      const list = block.fields.LIST[1];
      const scope = listScope(list);
      source += scope + '.showVariable(' + sanitizedString(list) + ', false);\n';
    },
    data_addtolist(block) {
      const list = block.fields.LIST[1];
      const item = block.inputs.ITEM;
      source += listReference(list) + '.push(' + compileExpression(item)  + ');\n';
    },
    data_deleteoflist(block) {
      const list = block.fields.LIST[1];
      const index = block.inputs.INDEX;
      source += listReference(list) + '.deleteLine(' + compileExpression(index) + ');\n';
    },
    data_deletealloflist(block) {
      const list = block.fields.LIST[1];
      source += listReference(list) + '.deleteLine("all");\n';
    },
    data_insertatlist(block) {
      const list = block.fields.LIST[1];
      const item = block.inputs.ITEM;
      const index = block.inputs.INDEX;
      source += listReference(list) + '.insert(' + compileExpression(index) + ', ' + compileExpression(item) + ');\n';
    },
    data_replaceitemoflist(block) {
      const list = block.fields.LIST[1];
      const item = block.inputs.ITEM;
      const index = block.inputs.INDEX;
      source += listReference(list) + '.set(' + compileExpression(index) + ', ' + compileExpression(item) + ');\n';
    },

    // Procedures
    procedures_call(block) {
      const mutation = block.mutation;
      const name = mutation.proccode;

      if (P.config.debug && name === 'forkphorus:debugger;') {
        source += '/* forkphorus debugger */debugger;\n';
        return;
      }

      const id = nextLabel();
      source += 'call(S.procedures[' + sanitizedString(name) + '], ' + id + ', [\n';

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
      // TODO: determine visualCheck variant
      // definitely not 'always' or 'visible', might be a 'if (S.isPenDown)'
      source += 'S.isPenDown = false;\n';
    },
    pen_setPenColorToColor(block) {
      const color = block.inputs.COLOR;
      source += 'S.setPenColor(' + compileExpression(color, 'number') + ');\n';
    },
    pen_setPenHueToNumber(block) {
      const hue = block.inputs.HUE;
      source += 'S.setPenColorParam("color", ' + compileExpression(hue, 'number') + ');\n';
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

    // Music (extension)
    music_setTempo(block) {
      const tempo = block.inputs.TEMPO;
      source += 'self.tempoBPM = ' + compileExpression(tempo, 'number') + ';\n';
    },
    music_changeTempo(block) {
      const tempo = block.inputs.TEMPO;
      source += 'self.tempoBPM += ' + compileExpression(tempo, 'number') + ';\n';
    },

    // Legacy no-ops.
    // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_motion.js#L19
    motion_scroll_right: noopStatement,
    motion_scroll_up: noopStatement,
    motion_align_scene: noopStatement,
    // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_looks.js#L248
    looks_changestretchby: noopStatement,
    looks_setstretchto: noopStatement,
    looks_hideallsprites: noopStatement,
  };

  // Contains data used for variable watchers.
  export const watcherLibrary: ObjectMap<WatchedValue> = {
    // Maps watcher opcode to the methods that define its behavior.

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
      evaluate(watcher) { return P.core.isSprite(watcher.target) ? watcher.target.direction : 0; },
      getLabel() { return 'direction'; },
    },

    // Looks
    looks_costumenumbername: {
      evaluate(watcher) {
        const target = watcher.target;
        const param = watcher.params.NUMBER_NAME;
        if (param === 'number') {
          return target.currentCostumeIndex + 1;
        } else {
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
        } else {
          return target.costumes[target.currentCostumeIndex].name;
        }
      },
      getLabel(watcher) {
        return 'backdrop ' + watcher.params.NUMBER_NAME;
      },
    },
    looks_size: {
      evaluate(watcher) { return P.core.isSprite(watcher.target) ? watcher.target.scale * 100 : 100; },
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
      // We don't implement loudness.
      evaluate() { return -1; },
      getLabel() { return 'loudness'; },
    },
    sensing_timer: {
      evaluate(watcher) {
        return (watcher.stage.runtime.now - watcher.stage.runtime.timerStart) / 1000;
      },
      getLabel() { return 'timer'; },
    },
    sensing_current: {
      evaluate(watcher) {
        const param = watcher.params.CURRENTMENU.toLowerCase();
        switch (param) {
          case 'year': return new Date().getFullYear();
          case 'month': return new Date().getMonth() + 1;
          case 'date': return new Date().getDate();
          case 'dayofweek': return new Date().getDay() + 1;
          case 'hour': return new Date().getHours();
          case 'minute': return new Date().getMinutes();
          case 'second': return new Date().getSeconds();
        }
        return 0;
      },
      getLabel(watcher) {
        const param = watcher.params.CURRENTMENU.toLowerCase();
        // all expected params except DAYOFWEEK can just be lowercased and used directly
        if (param === 'dayofweek') {
          return 'day of week';
        }
        return param;
      }
    },
    sensing_username: {
      evaluate(watcher) { return watcher.stage.username; },
      getLabel() { return 'username'; },
    },

    // Data
    data_variable: {
      init(watcher) {
        watcher.target.watchers[watcher.id] = watcher;
      },
      set(watcher, value) {
        watcher.target.vars[watcher.id] = value;
      },
      evaluate(watcher) {
        return watcher.target.vars[watcher.id];
      },
      getLabel(watcher) {
        return watcher.params.VARIABLE;
      },
    },

    // Music (extension)
    music_getTempo: {
      evaluate(watcher) { return watcher.stage.tempoBPM; },
      getLabel() { return 'Music: tempo'; },
    },
  };

  ///
  /// Helpers
  ///

  /**
   * Adds JS to update the speech bubble if necessary
   */
  function updateBubble() {
    source += 'if (S.saying) S.updateBubble();\n';
  }

  /**
   * Adds JS to enable the VISUAL runtime flag when necessary
   * @param variant 'drawing', 'visible', or 'always'
   */
  function visualCheck(variant: 'drawing' | 'visible' | 'always') {
    if (P.config.debug) {
      source += '/*visual:' + variant + '*/';
    }
    switch (variant) {
      case 'drawing': source += 'if (S.visible || S.isPenDown) VISUAL = true;\n'; break;
      case 'visible': source += 'if (S.visible) VISUAL = true;\n'; break;
      case 'always':  source += 'VISUAL = true;\n'; break;
    }
  }

  // Queues something to run with the forceQueue runtime method
  function forceQueue(id: number) {
    source += 'forceQueue(' + id + '); return;\n';
  }

  // Queues something to run with the queue runtime method
  function queue(id: number) {
    source += 'queue(' + id + '); return;\n';
  }

  // Adds a delay
  function delay() {
    source += 'return;\n';
    label();
  }

  // Gets the next label
  function nextLabel(): number {
    return fns.length + currentTarget.fns.length;
  }

  // Creates and returns a new label for the script's current state
  function label(): number {
    const id = nextLabel();
    fns.push(source.length);
    if (P.config.debug) {
      source += '/*label:' + id + '*/';
    }
    return id;
  }

  // Sanitizes a string to be used in a javascript string enclosed in double quotes.
  function sanitizedString(thing: string): string {
    if (typeof thing !== 'string') {
      thing = '' + thing;
    }
    return '"' + thing
      .replace(/\\/g, '\\\\')
      .replace(/'/g, '\\\'')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\{/g, '\\x7b')
      .replace(/\}/g, '\\x7d') + '"';
  }

  // Sanitizes a string using sanitizedString() as a compiled string expression.
  function sanitizedExpression(thing: string): CompiledExpression {
    return stringExpr(sanitizedString(thing));
  }

  // Adds JS to wait for a duration.
  // `duration` is a valid compiled JS expression.
  function wait(duration: string) {
    source += 'save();\n';
    source += 'R.start = runtime.now;\n';
    source += 'R.duration = ' + duration + ';\n';
    source += 'var first = true;\n';
    const id = label();
    source += 'if (runtime.now - R.start < R.duration * 1000 || first) {\n';
    source += '  var first;\n';
    forceQueue(id);
    source += '}\n';
    source += 'restore();\n';
  }

  /**
   * Determines the runtime object that owns a variable.
   * If the variable does not exist, it will be created.
   * @param id The Scratch 3 variable ID
   */
  function variableScope(id: string) {
    if (id in currentTarget.stage.vars) {
      return 'self';
    } else if (id in currentTarget.vars) {
      return 'S';
    } else {
      // We make sure all variables exist at compile time.
      // We'll use 0 as a default value because I **think** this is what Scratch 3 does.
      currentTarget.vars[id] = 0;
      return 'S';
    }
  }

  /**
   * Determines the runtime object that owns a list.
   * If the list does not exist, it will be created.
   * @param id The Scratch 3 list ID
   */
  function listScope(id: string) {
    if (id in currentTarget.stage.lists) {
      return 'self';
    } else if (id in currentTarget.lists) {
      return 'S';
    } else {
      // We make sure all lists exist at compile time.
      // Unknown lists become empty lists. This is probably what Scratch 3 does.
      currentTarget.lists[id] = new Scratch3List();
      return 'S';
    }
  }

  // Returns a reference to a variable with an ID
  function variableReference(id: string) {
    const scope = variableScope(id);
    return scope + '.vars[' + compileExpression(id) + ']';
  }

  // Returns a reference to a list with a ID
  function listReference(id: string) {
    const scope = listScope(id);
    return scope + '.lists[' + compileExpression(id) + ']';
  }

  ///
  /// Compilers
  ///

  // Compiles a '#ABCDEF' color
  function compileColor(hexCode: string): CompiledExpression {
    // Remove the leading # and use it to create a hexadecimal number
    const hex = hexCode.substr(1);
    // Ensure that it is actually a hex number.
    if (/^[0-9a-f]{6}$/.test(hex)) {
      return numberExpr('0x' + hex);
    } else {
      console.warn('expected hex color code but got', hex);
      return numberExpr('0x0');
    }
  }

  // Compiles a native expression (number, string, data) to a JavaScript string
  function compileNative(constant): CompiledExpression | string {
    // Natives are arrays, where the first value is the type ID. (see PrimitiveTypes)
    const type = constant[0];

    switch (type) {
      // These all function as numbers. I believe they are only differentiated so the editor can be more helpful.
      case PrimitiveTypes.MATH_NUM:
      case PrimitiveTypes.POSITIVE_NUM:
      case PrimitiveTypes.WHOLE_NUM:
      case PrimitiveTypes.INTEGER_NUM:
      case PrimitiveTypes.ANGLE_NUM:
        // The value might not actually be a number.
        if (!isNaN(parseFloat(constant[1]))) {
          return numberExpr(constant[1]);
        } else {
          // Non-numbers will be sanitized
          return sanitizedExpression(constant[1]);
        }

      case PrimitiveTypes.TEXT:
        return sanitizedExpression(constant[1]);

      case PrimitiveTypes.VAR:
        // For variable natives the second item is the name of the variable
        // and the third is the ID of the variable. We only care about the ID.
        return variableReference(constant[2]);

      case PrimitiveTypes.LIST:
        // Similar to variable references
        return listReference(constant[2]);

      case PrimitiveTypes.BROADCAST:
        // Similar to variable references.
        return compileExpression(constant[2]);

      case PrimitiveTypes.COLOR_PICKER:
        // Colors are stored as strings like "#123ABC", so we must do some conversions to use them as numbers.
        return compileColor(constant[1]);

      default:
        console.warn('unknown constant', type, constant);
        return stringExpr('""');
    }
  }

  /**
   * Compiles a block
   * The source code is in the source variable (does not return)
   */
  function compile(block: Block | string) {
    if (typeof block === 'string') {
      block = blocks[block];
    }
    if (!block) {
      return;
    }

    while (true) {
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

      if (!block.next) {
        break;
      }
      block = blocks[block.next];
    }
  }

  // Compiles a substack (script inside of another block)
  function compileSubstack(substack) {
    // Substacks are statements inside of statements.
    // Substacks are a type of input. The first item is type ID, the second is the ID of the child.

    // Substacks are not guaranteed to exist, so silently fail.
    if (!substack) {
      return;
    }

    // TODO: check type?
    // const type = substack[0];

    const id: string = substack[1];
    compile(id);
  }

  function asType(script: string | CompiledExpression, type?: ExpressionType): string {
    if (script instanceof CompiledExpression) {
      // If a compiled expression is already of the desired type, then simply return it.
      if (script.type === type) {
        return script.source;
      }
      script = script.source;
    }
    switch (type) {
      case 'string': return '("" + ' + script + ')';
      case 'number': return '+' + script;
      case 'boolean': return 'bool(' + script + ')';
    }
    return script;
  }

  function fallbackValue(type?: ExpressionType): string {
    switch (type) {
      case 'string': return '""';
      case 'number': return '0';
      case 'boolean': return 'false';
    }
    return '""';
  }

  /**
   * Compiles a Scratch 3 expression or input.
   *
   * @param The expression to compile
   * @param The requested type of the expression
   * @return The source of the compiled expression with any required type conversions
   */
  function compileExpression(expression, type?: ExpressionType): string {
    if (!expression) {
      return fallbackValue(type);
    }

    // TODO: use asType?
    if (typeof expression === 'string') {
      return sanitizedString(expression);
    }
    if (typeof expression === 'number') {
      // I have a slight feeling this block never runs.
      // TODO: remove?
      return '' + expression;
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

    if (result instanceof CompiledExpression) {
      if (P.config.debug) {
        result.source = '/*' + opcode + '*/' + result.source;
      }
      return asType(result, type);
    }

    if (P.config.debug) {
      result = '/*' + opcode + '*/' + result;
    }

    return asType(result, type);
  }

  /**
   * Compiles a top block listener from the top down.
   * The resulting source code is in the `source` variable of P.sb3.compiler
   * @returns {boolean} Successful compiling
   */
  function compileListener(topBlock: Block): boolean {
    // Ignore blocks where we don't recognize the opcode
    const topLevelOpCode = topBlock.opcode;
    if (!(topLevelOpCode in topLevelLibrary)) {
      // Only log warnings if we wouldn't otherwise recognize the block.
      // Some dangling non-top-level blocks is very common.
      if (!(topLevelOpCode in expressionLibrary) && !(topLevelOpCode in statementLibrary)) {
        console.warn('unknown top level block', topLevelOpCode, topBlock);
      }
      return false;
    }

    // We can completely ignore empty listeners (those without any children)
    if (!topBlock.next) {
      return false;
    }

    source = '';
    const block = blocks[topBlock.next];

    compile(block);

    // Procedure definitions need special care to properly end calls.
    // In the future this should be refactored so that things like this are part of the top level library
    if (topLevelOpCode === 'procedures_definition') {
      source += 'endCall(); return\n';
    }

    return true;
  }

  /**
   * Compiles a Scratch 3 Target (Sprite/Stage)
   *
   * @param target The constructed instance of P.sb3.Target
   * @param data The raw sb3 data of the target
   */
  export function compileTarget(target: P.sb3.Target, data: P.sb3.SB3Target) {
    currentTarget = target;
    blocks = data.blocks;

    // We compile blocks from the top level down to their children, so extract top level blocks
    const topLevelBlocks = Object.keys(data.blocks)
      .map((id) => data.blocks[id])
      .filter((block) => block.topLevel);

    for (const block of topLevelBlocks) {
      // The first function points to the very start at index 0
      fns = [0];

      const compilingSuccess = compileListener(block);
      if (!compilingSuccess) {
        continue;
      }

      const startFn = target.fns.length;
      for (var i = 0; i < fns.length; i++) {
        target.fns.push(P.utils.createContinuation(source.slice(fns[i])));
      }

      const topLevelHandler = topLevelLibrary[block.opcode];
      topLevelHandler(block, target.fns[startFn]);

      if (P.config.debug) {
        console.log('compiled sb3 script', block.opcode, source, target);
      }
    }
  }
}
