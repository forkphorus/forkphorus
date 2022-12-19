/// <reference path="phosphorus.ts" />
/// <reference path="utils.ts" />
/// <reference path="core.ts" />
/// <reference path="fonts.ts" />
/// <reference path="config.ts" />
/// <reference path="runtime.ts" />

// Scratch 3 project loader and runtime objects
namespace P.sb3 {
  // "Scratch3*" classes implement some part of the Scratch 3 runtime.
  // "SB3*" interfaces are just types for Scratch 3 projects

  /**
   * The path to fetch remote assets from.
   * Replace $md5ext with the md5sum and the format of the asset.
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
    volume: number;
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
    isDiscrete: boolean;
  }

  /**
   * Tuple of name, value
   */
  type SB3List = [string, any[]];

  /**
   * Tuple of name, value, and sometimes cloud.
   */
  type SB3Variable = [string, any, boolean?];

  // Implements a Scratch 3 Stage.
  export class Scratch3Stage extends P.core.Stage {
    public sb3data: SB3Target;
    public listIds: ObjectMap<string> = {};
    public varIds: ObjectMap<string> = {};
  }

  // Implements a Scratch 3 Sprite.
  export class Scratch3Sprite extends P.core.Sprite {
    public sb3data: SB3Target;
    public listIds: ObjectMap<string> = {};
    public varIds: ObjectMap<string> = {};

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
    private mode: string;
    public params: any;
    private libraryEntry: P.sb3.compiler.WatchedValue;
    private sliderMin: number;
    private sliderMax: number;
    private sliderStep: number;
    private sliderInput: HTMLInputElement;
    private containerEl: HTMLElement;
    private valueEl: HTMLElement;

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
      // isDiscrete doesn't always exist
      if (typeof data.isDiscrete !== 'undefined') {
        this.sliderStep = data.isDiscrete ? 1 : 0.01;
      } else {
        this.sliderStep = 1;
      }

      // Mark ourselves as invalid if the opcode is not recognized.
      if (!this.libraryEntry) {
        console.warn('unknown watcher', this.opcode, this);
        this.valid = false;
      }
    }

    update() {
      if (this.visible) {
        const value = this.getValue();
        // Value is only updated when the value has changed to reduce useless paints/reflows in some browsers.
        if (this.valueEl.textContent !== value) {
          this.valueEl.textContent = value;
        }
        if (this.sliderInput) {
          this.sliderInput.value = value;
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
        this.update();
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
      // fix https://github.com/forkphorus/forkphorus/issues/195
      container.onmousedown = (e) => e.stopPropagation();
      container.ontouchstart = (e) => e.stopPropagation();

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
          input.step = '' + this.sliderStep;
          input.value = this.getValue();
          input.addEventListener('input', this.sliderChanged.bind(this));
          this.sliderInput = input;

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

  export class ListWatcherRow {
    public element: HTMLElement;
    private indexEl: HTMLElement;
    private valueEl: HTMLElement;
    private value: any = '';
    private index: any = -1;
    private y: any = 0;
    private visible: boolean = true;

    constructor() {
      this.element = document.createElement('div');
      this.indexEl = document.createElement('div');
      this.valueEl = document.createElement('div');
      this.element.className = 's3-list-row';
      this.indexEl.className = 's3-list-index';
      this.valueEl.className = 's3-list-value';
      this.element.appendChild(this.indexEl);
      this.element.appendChild(this.valueEl);
    }

    /**
     * Set the value of this row.
     */
    setValue(value: any) {
      if (value !== this.value) {
        this.value = value;
        this.valueEl.textContent = value;
      }
    }

    /**
     * Set the index of this row.
     * @param index The *JavaScript* index of the row.
     */
    setIndex(index: number) {
      if (index !== this.index) {
        this.index = index;
        this.indexEl.textContent = (index + 1).toString();
      }
    }

    /**
     * Set the Y coordinate of this row.
     */
    setY(y: number) {
      if (y !== this.y) {
        this.y = y;
        this.element.style.transform = 'translateY(' + y + 'px)';
      }
    }

    /**
     * Set the visibility of this row.
     */
    setVisible(visible: boolean) {
      if (this.visible !== visible) {
        this.visible = visible;
        this.element.style.display = visible ? '' : 'none';
      }
    }
  }

  const enum ScrollDirection {
    Up, Down,
  }
  export class Scratch3ListWatcher extends P.core.Watcher {
    private params: any;
    private id: string;
    private width: number;
    private height: number;
    private list: Scratch3List;
    private containerEl: HTMLElement;
    private topLabelEl: HTMLElement;
    private bottomLabelEl: HTMLElement;
    private middleContainerEl: HTMLElement;
    private endpointEl: HTMLElement;
    private contentEl: HTMLElement;
    private rows: ListWatcherRow[] = [];
    private firstUpdateComplete: boolean = false;
    private _rowHeight: number = -1;
    private scrollTop: number = 0;
    private lastZoomLevel: number = 1;
    private scrollAhead: number = 8;
    private scrollBack: number = 3;
    private scrollDirection: ScrollDirection = ScrollDirection.Down;
    private _contentHeight: number = -1;

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

    shouldUpdate() {
      if (!this.visible) return false;
      if (this.lastZoomLevel !== this.stage.zoom) return true;
      if (!this.firstUpdateComplete) return true;
      return this.list.modified;
    }

    update() {
      if (!this.shouldUpdate()) {
        return;
      }

      if (this.lastZoomLevel !== this.stage.zoom) {
        this.contentEl.scrollTop *= this.stage.zoom / this.lastZoomLevel;
      }
      this.list.modified = false;
      this.lastZoomLevel = this.stage.zoom;
      this.firstUpdateComplete = true;

      this.updateList();

      const bottomLabelText = this.getBottomLabel();
      if (this.bottomLabelEl.textContent !== bottomLabelText) {
        this.bottomLabelEl.textContent = this.getBottomLabel();
      }
    }

    updateList() {
      // Temporary hack to fix setZoom() calling updateList() on invisible lists, causing _rowHeight to be invalid.
      if (!this.visible && this._rowHeight === -1) {
        return;
      }

      const height = this.list.length * this.getRowHeight() * this.stage.zoom;
      this.endpointEl.style.transform = 'translateY(' + height + 'px)';

      const topVisible = this.scrollTop;
      const bottomVisible = topVisible + this.getContentHeight();

      let startingIndex = Math.floor(topVisible / this.getRowHeight());
      let endingIndex = Math.ceil(bottomVisible / this.getRowHeight());

      if (this.scrollDirection === ScrollDirection.Down) {
        startingIndex -= this.scrollBack;
        endingIndex += this.scrollAhead;
      } else {
        startingIndex -= this.scrollAhead;
        endingIndex += this.scrollBack;
      }

      if (startingIndex < 0) startingIndex = 0;
      if (endingIndex > this.list.length - 1) endingIndex = this.list.length - 1;

      // Sanity checks:
      // Cap ourselves at 50 rows on screen.
      if (endingIndex - startingIndex > 50) {
        endingIndex = startingIndex + 50;
      }

      const visibleRows = endingIndex - startingIndex;
      while (this.rows.length <= visibleRows) {
        this.addRow();
      }
      for (var listIndex = startingIndex, rowIndex = 0; listIndex <= endingIndex; listIndex++, rowIndex++) {
        let row = this.rows[rowIndex];
        row.setIndex(listIndex);
        row.setValue(this.list[listIndex]);
        row.setY(listIndex * this._rowHeight * this.stage.zoom);
        row.setVisible(true);
      }
      while (rowIndex < this.rows.length) {
        this.rows[rowIndex].setVisible(false);
        rowIndex++;
      }
    }

    init() {
      super.init();
      const target = this.target as Target;
      const listId = this.id;
      const listName = target.listIds[listId];
      if (!(listName in this.target.lists)) {
        // Create the list if it doesn't exist.
        // It might be better to mark ourselves as invalid instead, but this works just fine.
        this.target.lists[listName] = createList();
      }
      this.list = this.target.lists[listName] as Scratch3List;
      this.target.listWatchers[listName] = this;
      if (this.visible) {
        this.updateLayout();
      }
    }

    getTopLabel(): string {
      if (this.target.isStage) {
        return this.params.LIST;
      }
      return this.target.name + ': ' + this.params.LIST;
    }
    getBottomLabel(): string {
      return 'length ' + this.list.length;
    }

    getContentHeight(): number {
      if (this._contentHeight === -1) {
        this._contentHeight = this.contentEl.offsetHeight;
      }
      return this._contentHeight;
    }

    getRowHeight(): number {
      if (this._rowHeight === -1) {
        // Space between each row, in pixels.
        const PADDING = 2;
        if (this.rows.length === 0) {
          this.addRow();
        }
        const height = this.rows[0].element.offsetHeight / this.stage.zoom;
        if (height === 0) {
          // happens sometimes when list is updated but not actually visible, make sure not to cache the result in this case
          return 0;
        }
        this._rowHeight = height + PADDING;
      }
      return this._rowHeight;
    }

    addRow(): ListWatcherRow {
      const row = new ListWatcherRow();
      this.rows.push(row);
      this.contentEl.appendChild(row.element);
      return row;
    }

    updateLayout() {
      if (!this.containerEl) {
        if (!this.visible) {
          // if the element doesn't exist, we have no reason to create it
          return;
        }
        this.createLayout();
      }
      this.containerEl.style.display = this.visible ? '' : 'none';
    }

    setVisible(visible: boolean) {
      super.setVisible(visible);
      this.updateLayout();
    }

    createLayout() {
      this.containerEl = document.createElement('div');
      this.topLabelEl = document.createElement('div');
      this.bottomLabelEl = document.createElement('div');
      this.middleContainerEl = document.createElement('div');
      this.contentEl = document.createElement('div');

      this.containerEl.style.top = (this.y / 10) + 'em';
      this.containerEl.style.left = (this.x / 10) + 'em';
      this.containerEl.style.height = (this.height / 10) + 'em';
      this.containerEl.style.width = (this.width / 10) + 'em';
      this.containerEl.classList.add('s3-list-container');

      // fix https://github.com/forkphorus/forkphorus/issues/195
      this.containerEl.onmousedown = (e) => e.stopPropagation();
      this.containerEl.ontouchstart = (e) => e.stopPropagation();

      this.topLabelEl.textContent = this.getTopLabel();
      this.topLabelEl.classList.add('s3-list-top-label');

      this.bottomLabelEl.textContent = this.getBottomLabel();
      this.bottomLabelEl.classList.add('s3-list-bottom-label');

      this.middleContainerEl.classList.add('s3-list-content');

      this.contentEl.classList.add('s3-list-rows');
      this.contentEl.addEventListener('scroll', (e) => {
        const scrollTop = this.contentEl.scrollTop / this.stage.zoom;
        const scrollChange = this.scrollTop - scrollTop;
        if (scrollChange < 0) {
          this.scrollDirection = ScrollDirection.Down;
        } else if (scrollChange > 0) {
          this.scrollDirection = ScrollDirection.Up;
        }
        this.scrollTop = scrollTop;
        this.updateList();
      });

      this.endpointEl = document.createElement('div');
      this.endpointEl.className = 's3-list-endpoint';
      this.contentEl.appendChild(this.endpointEl);

      this.middleContainerEl.appendChild(this.contentEl);
      this.containerEl.appendChild(this.topLabelEl);
      this.containerEl.appendChild(this.middleContainerEl);
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

  export interface Scratch3List extends Array<any> {
    modified: boolean;
  }

  export function createList(): Scratch3List {
    const list = [] as any as Scratch3List;
    list.modified = false;
    list.toString = function() {
      var i = this.length;
      while (i--) {
        if (('' + this[i]).length !== 1) {
          return this.join(' ');
        }
      }
      return this.join('');
    };
    return list;
  }

  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

  /**
   * Convert an SVG with an improper or missing namespace to a proper namespaced SVG
   * @param svg An SVG with an improper or missing namespace
   */
  function fixSVGNamespace(svg: SVGSVGElement): SVGSVGElement {
    // To fix the namespace, we create a new SVG and copy its content.
    // Create the SVG in a new document to avoid XSS
    const newDocument = document.implementation.createHTMLDocument();
    const newSVG = newDocument.createElementNS(SVG_NAMESPACE, 'svg');
    for (const attribute of svg.attributes) {
      newSVG.setAttribute(attribute.name, attribute.value);
    }
    newSVG.innerHTML = svg.innerHTML;
    return newSVG;
  }

  /**
   * Patches and modifies an SVG element to make it function properly in the forkphorus environment.
   */
  function patchSVG(svg: SVGSVGElement, costumeOptions: P.core.CostumeOptions): SVGSVGElement {
    // Fix missing namespace
    const invalidNamespace = svg.namespaceURI !== SVG_NAMESPACE;
    if (invalidNamespace) {
      svg = fixSVGNamespace(svg);

      // fix some edge case SVGs
      // this could apply to any SVG with or without a namespace, but right now we only do this on projects that are missing a namespace
      // (they tend to be more likely to be invalid)
      // https://github.com/forkphorus/forkphorus/issues/210
      // https://forkphorus.github.io/#374570920
      if (svg.firstElementChild && svg.firstElementChild.tagName !== 'g') {
        // create a new <g> (group) and transform
        // translate the SVG to fix the center
        const width = svg.width.baseVal;
        const height = svg.height.baseVal;
        if (width.unitType !== width.SVG_LENGTHTYPE_PERCENTAGE && height.unitType !== width.SVG_LENGTHTYPE_PERCENTAGE) {
          const group = document.createElementNS(SVG_NAMESPACE, 'g');
          const transform = svg.createSVGTransform();
          for (const el of svg.children) {
            group.appendChild(el);
          }
          transform.setTranslate(-width.value / 2, height.value / 2);
          group.transform.baseVal.appendItem(transform);
          costumeOptions.rotationCenterX -= width.value / 2;
          costumeOptions.rotationCenterY += height.value / 2;
          svg.appendChild(group);
        }
      }
    }

    // Special treatment for the viewBox attribute
    if (svg.hasAttribute('viewBox')) {
      const viewBox = svg.getAttribute('viewBox')!.split(/ |,/).map((i) => +i);
      if (viewBox.every((i) => !isNaN(i)) && viewBox.length === 4) {
        const [ x, y, w, h ] = viewBox;
        // Fix width/height to include the viewBox min x/y
        const width = Math.max(1, w + x);
        const height = Math.max(1, h + y);
        svg.setAttribute('width', width.toString());
        svg.setAttribute('height', height.toString());
      } else {
        console.warn('weird viewBox', svg.getAttribute('viewBox'));
      }
      svg.removeAttribute('viewBox');
    }

    // Search for used fonts
    const textElements = svg.querySelectorAll('text');
    const usedFonts: string[] = [];
    const addFont = (font: string) => {
      if (usedFonts.indexOf(font) === -1) {
        usedFonts.push(font);
      }
    };
    for (var i = 0; i < textElements.length; i++) {
      const el = textElements[i];
      let fonts = (el.getAttribute('font-family') || '')
        .split(',')
        .map((i) => i.trim());
      let found = false;
      for (const family of fonts) {
        if (P.fonts.scratch3[family]) {
          found = true;
          addFont(family);
          break;
        } else if (family === 'sans-serif') {
          found = true;
          // We let the system handle their respective 'sans-serif' fonts
          // This is different from Scratch's 'Sans Serif' font.
          // https://scratch.mit.edu/projects/319138929/
          break;
        }
      }
      if (!found) {
        console.warn('unknown fonts', fonts);
        const font = 'Sans Serif';
        addFont(font);
        el.setAttribute('font-family', font);
      }
    }
    P.fonts.addFontRules(svg, usedFonts);

    // Disable image interpolation
    let style = document.createElement("style");
    let css = "image { image-rendering: pixelated; }";
    style.appendChild(document.createTextNode(css));
    svg.appendChild(style);

    return svg;
  }

  // Implements base SB3 loading logic.
  // Needs to be extended to add file loading methods.
  // Implementations are expected to set `this.projectData` to something before calling super.load()
  export abstract class BaseSB3Loader extends P.io.Loader<P.core.Stage> {
    protected projectData: SB3Project;
    private needsMusic: boolean = false;

    protected abstract getAsText(path: string): Promise<string>;
    protected abstract getAsArrayBuffer(path: string): Promise<ArrayBuffer>;
    protected abstract getAsImage(path: string, format: string): Promise<HTMLImageElement>;

    getSVG(path: string, costumeOptions: P.core.CostumeOptions): Promise<HTMLImageElement> {
      return this.getAsText(path)
        .then((source) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(source, 'image/svg+xml');
          const svg = patchSVG(doc.documentElement as any, costumeOptions);

          return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = (e) => {
              resolve(image);
            };
            image.onerror = (e) => {
              reject(new Error('Failed to load SVG: ' + path));
            };
            image.src = 'data:image/svg+xml,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
          });
        });
    }

    getBitmapImage(path: string, format: string): Promise<HTMLImageElement> {
      return this.getAsImage(path, format);
    }

    loadCostume(data: SB3Costume, index: number): Promise<P.core.Costume> {
      const path = data.assetId + '.' + data.dataFormat;
      const costumeOptions = {
        name: data.name,
        bitmapResolution: data.bitmapResolution || 1,
        rotationCenterX: data.rotationCenterX,
        rotationCenterY: data.rotationCenterY,
      };
      if (data.dataFormat === 'svg') {
        return this.getSVG(path, costumeOptions)
          .then((svg) => new P.core.VectorCostume(svg, costumeOptions));
      } else {
        return this.getBitmapImage(path, data.dataFormat)
          .then((image) => new P.core.BitmapCostume(image, costumeOptions));
      }
    }

    getAudioBuffer(path: string) {
      return this.getAsArrayBuffer(path)
        .then((buffer) => P.audio.decodeAudio(buffer))
        .catch((err) => {
          throw new Error(`Could not load audio: ${path} (${err})`);
        });
    }

    loadSound(data: SB3Sound): Promise<P.core.Sound | null> {
      return new Promise((resolve, reject) => {
        this.getAudioBuffer(data.md5ext)
          .then((buffer) => {
            resolve(new P.core.Sound({
              name: data.name,
              buffer,
            }))
          })
          .catch((err) => {
            console.warn('Could not load sound: ' + err);
            resolve(null);
          });
      });
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
        if (variable.length > 2) {
          const cloud = variable[2];
          if (cloud) {
            if (data.isStage) {
              (target as Scratch3Stage).cloudVariables.push(name);
            } else {
              console.warn('Cloud variable found on a non-stage object. Skipping.');
            }
          }
        }
        target.vars[name] = value;
        target.varIds[id] = name;
      }

      for (const id of Object.keys(data.lists)) {
        const list = data.lists[id];
        const name = list[0];
        const content = list[1];
        // There are some cases where projects has multiple lists of the same name, different ID
        // To avoid issues caused by that, we will give the first definition precedence over later definitions.
        if (target.lists[name]) {
          continue;
        }
        const scratchList = createList();
        for (var i = 0; i < content.length; i++) {
          scratchList[i] = content[i];
        }
        target.lists[name] = scratchList;
        target.listIds[id] = name;
      }

      target.name = data.name;
      target.currentCostumeIndex = data.currentCostume;
      if ('volume' in data) {
        target.volume = data.volume / 100;
      }
      target.sb3data = data;

      if (target.isStage) {

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
      const soundsPromise = Promise.all<P.core.Sound | null>(data.sounds.map((c) => this.loadSound(c)));

      return Promise.all([costumesPromise, soundsPromise])
        .then((result) => {
          const costumes = result[0];
          const sounds = result[1];

          target.costumes = costumes;
          sounds.forEach((sound) => sound && target.addSound(sound));

          return target;
        });
    }

    loadRequiredAssets() {
      return Promise.all([
        this.loadFonts(),
      ]);
    }

    loadSoundbank() {
      return P.audio.loadSoundbankSB2(this);
    }

    loadFonts() {
      const promises: Promise<unknown>[] = [];
      for (const family in P.fonts.scratch3) {
        const promise = P.utils.settled(P.fonts.loadLocalFont(family, P.fonts.scratch3[family]));
        promises.push(promise);
        this.addTask(new P.io.PromiseTask(promise));
      }
      return Promise.all(promises);
    }

    compileTargets(targets: Target[], stage: P.core.Stage): void {
      if (P.config.debug) {
        console.time('Scratch 3 compile');
      }
      for (const target of targets) {
        const compiler = new P.sb3.compiler.Compiler(target);
        compiler.compile();
        if (compiler.needsMusic) {
          this.needsMusic = true;
        }
      }
      if (P.config.debug) {
        console.timeEnd('Scratch 3 compile');
      }
    }

    async load() {
      if (!this.projectData) {
        throw new Error('Project data is missing or invalid');
      }
      if (!Array.isArray(this.projectData.targets)) {
        throw new Error('Invalid project data: missing targets');
      }

      await this.loadRequiredAssets();

      this.resetTasks();
      const targets = await Promise.all(this.projectData.targets
        .sort((a, b) => a.layerOrder - b.layerOrder)
        .map((data) => this.loadTarget(data))
      );

      if (this.aborted) {
        throw new Error('Loading aborting.');
      }

      const stage = targets.filter((i) => i.isStage)[0] as Scratch3Stage;
      if (!stage) {
        throw new Error('Project does not have a Stage');
      }
      const sprites = targets.filter((i) => i.isSprite) as Scratch3Sprite[];
      sprites.forEach((sprite) => sprite.stage = stage);
      stage.children = sprites;

      if (this.projectData.monitors) {
        stage.allWatchers = this.projectData.monitors
          .map((data) => this.loadWatcher(data, stage))
          .filter((i) => i && i.valid);
        stage.allWatchers.forEach((watcher) => watcher.init());
      }

      this.compileTargets(targets, stage);

      if (this.needsMusic) {
        await this.loadSoundbank();
      }

      // projectData is now unused and can be removed. This reduces memory usage
      this.projectData = null as any;

      return stage;
    }
  }

  // Loads a .sb3 file
  export class SB3FileLoader extends BaseSB3Loader {
    private buffer: ArrayBuffer;
    private zip: JSZip;

    constructor(buffer: ArrayBuffer) {
      super();
      this.buffer = buffer;
    }

    getAsText(path: string) {
      const task = this.addTask(new P.io.Manual());
      const file = this.zip.file(path);
      if (!file) {
        throw new Error('cannot find file as text: ' + path);
      }
      return file.async('text')
        .then((response) => {
          task.markComplete();
          return response;
        });
    }

    getAsArrayBuffer(path: string) {
      const task = this.addTask(new P.io.Manual());
      const file = this.zip.file(path);
      if (!file) {
        throw new Error('cannot find file as arraybuffer: ' + path);
      }
      return file.async('arraybuffer')
        .then((response) => {
          task.markComplete();
          return response;
        });
    }

    getAsBase64(path: string) {
      const task = this.addTask(new P.io.Manual());
      const file = this.zip.file(path);
      if (!file) {
        throw new Error('cannot find file as base64: ' + path);
      }
      return file.async('base64')
        .then((response) => {
          task.markComplete();
          return response;
        });
    }

    getAsImage(path: string, format: string) {
      const task = this.addTask(new P.io.Manual());
      return this.getAsBase64(path)
        .then((imageData) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
              task.markComplete();
              resolve(image);
            };
            image.onerror = (error) => {
              reject(new Error('Failed to load image: ' + path + '.' + format));
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
      return this.addTask(new P.io.Request(ASSETS_API.replace('$md5ext', path))).load('text');
    }

    getAsArrayBuffer(path: string) {
      return this.addTask(new P.io.Request(ASSETS_API.replace('$md5ext', path))).load('arraybuffer');
    }

    getAsImage(path: string) {
      return this.addTask(new P.io.Img(ASSETS_API.replace('$md5ext', path))).load();
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
}

/**
 * The Scratch 3 compiler.
 */
namespace P.sb3.compiler {
  import Fn = P.runtime.Fn;

  /**
   * Asserts at compile-time that a value is of the type `never`
   */
  function assertNever(i: never): never {
    throw new Error('Compile-time assertNever failed.');
  }

  // IDs of native types
  // https://github.com/LLK/scratch-vm/blob/36fe6378db930deb835e7cd342a39c23bb54dd72/src/serialization/sb3.js#L60-L79
  const enum NativeTypes {
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

  export const enum InputFlags {
    NaN = 1,
  }

  /**
   * JS code with an associated type.
   * Returns the source when stringified, making the raw type safe to use in concatenation.
   */
  export class CompiledInput {
    /**
     * Whether this input could potentially be a number-like object at runtime.
     * A value may be a potential number if:
     *  - it is a number
     *  - it is a boolean
     *  - it is a string that represents a number or a boolean
     */
    public potentialNumber: boolean = true;
    private flags: number = 0;

    constructor(public source: string, public type: InputType) {

    }

    enableFlag(flag: number): void {
      this.flags |= flag;
    }

    hasFlag(flag: number): boolean {
      return (this.flags & flag) !== 0;
    }

    toString(): string {
      return this.source;
    }
  }

  // Shorter CompiledInput aliases
  const stringInput = (v: string) => new CompiledInput(v, 'string');
  const numberInput = (v: string) => new CompiledInput(v, 'number');
  const booleanInput = (v: string) => new CompiledInput(v, 'boolean');
  const anyInput = (v: string) => new CompiledInput(v, 'any');

  /**
   * A compiler for a statement.
   * A statement is something like "move ( ) steps"
   * @param util Use the methods of the utility class to write the body.
   */
  export type StatementCompiler = (util: StatementUtil) => void

  /**
   * A compiler for an input.
   * An input is something like the "10" in "move (10) steps"
   */
  export type InputCompiler = (util: InputUtil) => CompiledInput;

  /**
   * A compiler for a hat block.
   */
  export interface HatCompiler {
    /**
     * The handler that is responsible for installing the compiled functions
     */
    handle(util: HatUtil): void;
    /**
     * Optionally make changes to the script's source before it is compiled away into functions.
     */
    postcompile?(compiler: Compiler, source: string, hat: SB3Block): string;
    /**
     * Optionally handle what happens before compilation begins.
     * The result of this will be added to the script's source before the script begins.
     */
    precompile?(compiler: Compiler, hat: SB3Block): string;
  };

  export type InputType = 'string' | 'boolean' | 'number' | 'any' | 'list' | 'color';

  /**
   * General block generation utilities.
   */
  export class BlockUtil {
    constructor(public compiler: Compiler, public block: SB3Block) {

    }

    get target() {
      return this.compiler.target;
    }

    get stage() {
      return this.compiler.target.stage;
    }

    /**
     * Compile an input, and give it a type.
     */
    getInput(name: string, type: InputType): CompiledInput {
      return this.compiler.compileInput(this.block, name, type);
    }

    /**
     * Compile a field. Results are unescaped strings and unsafe to include in a script.
     */
    getField(name: string): string {
      return this.compiler.getField(this.block, name);
    }

    /**
     * Get and sanitize a field.
     */
    fieldInput(name: string): CompiledInput {
      return this.sanitizedInput(this.getField(name));
    }

    /**
     * Sanitize an unescaped string into an input.
     */
    sanitizedInput(string: string): CompiledInput {
      return this.compiler.sanitizedInput(string);
    }

    /**
     * Sanitize an unescaped string for inclusion in a script.
     */
    sanitizedString(string: string): string {
      return this.compiler.sanitizedString(string);
    }

    /**
     * Gets a field's reference to a variable.
     */
    getVariableReference(field: string): string {
      return this.compiler.getVariableReference(this.compiler.getVariableField(this.block, field));
    }

    /**
     * Gets a field's reference to a list.
     */
    getListReference(field: string) {
      return this.compiler.getListReference(this.compiler.getVariableField(this.block, field));
    }

    /**
     * Gets the scope of a field's reference to a variable.
     */
    getVariableScope(field: string): string {
      return this.compiler.findVariable(this.compiler.getVariableField(this.block, field)).scope;
    }

    /**
     * Determine whether a variable is a cloud variable.
     */
    isCloudVariable(field: string): boolean {
      return this.target.stage.cloudVariables.indexOf(this.getField(field)) > -1;
    }

    /**
     * Gets the scope of a field's reference to a list.
     */
    getListScope(field: string): string {
      return this.compiler.findList(this.compiler.getVariableField(this.block, field)).scope;
    }

    /**
     * Forcibly converts JS to another type.
     */
    asType(input: string, type: InputType): string {
      return this.compiler.asType(input, type)
    }

    /**
     * Evaluate a compiled input.
     * May throw if there is an error evaluating the input.
     * As the input is always evaluated once, changes will not be reflected.
     * The input will have access to runtime objects and data, including the target sprite and runtime methods.
     * @param input The input to evaluate.
     */
    evaluateInputOnce(input: CompiledInput): any {
      const fn = P.runtime.scopedEval(`(function() { return ${input}; })`);
      return this.target.stage.runtime.evaluateExpression(this.target, fn);
    }
  }

  /**
   * General statement generation utilities.
   */
  export class StatementUtil extends BlockUtil {
    public content: string = '';
    public substacksQueue: boolean = false;

    /**
     * Compile a substack.
     */
    getSubstack(name: string): string {
      const labelsBefore = this.compiler.labelCount;
      const substack = this.compiler.compileSubstackInput(this.block, name);
      if (this.compiler.labelCount !== labelsBefore) {
        this.substacksQueue = true;
      }
      return substack;
    }

    /**
     * Gets the next label ID ready for use. The ID is unique and will cannot be reused.
     */
    claimNextLabel(): number {
      return this.compiler.labelCount++;
    }

    /**
     * Create a new label at this location. A label ID will be created if none is supplied.
     */
    addLabel(label?: number): number {
      if (!label) {
        label = this.claimNextLabel();
      }
      // We'll use special syntax to denote this spot as a label.
      // It'll be cleaned up later in compilation.
      // Interestingly, this is actually valid JavaScript, so cleanup isn't strictly necessary.
      this.write(`{{${label}}}`);
      return label;
    }

    /**
     * Writes the queue() method to call a label.
     */
    queue(label: number): void {
      this.writeLn(`queue(${label}); return;`);
    }

    /**
     * Writes the forceQueue() method to call a label.
     */
    forceQueue(label: number): void {
      this.writeLn(`forceQueue(${label}); return;`);
    }

    /**
     * Writes an appropriate VISUAL check
     */
    visual(variant: 'drawing' | 'visible' | 'always'): void {
      switch (variant) {
        case 'drawing': this.writeLn('if (S.visible || S.isPenDown) VISUAL = true;'); break;
        case 'visible': this.writeLn('if (S.visible) VISUAL = true;'); break;
        case 'always': this.writeLn('VISUAL = true;'); break;
        default: assertNever(variant);
      }
    }

    /**
     * Update the speech bubble, if any.
     */
    updateBubble() {
      this.writeLn('if (S.saying) S.updateBubble()');
    }

    /**
     * Write JS to pause script execution until a Promise is settled (regardless of resolve/reject)
     */
    waitUntilSettles(source: string): void {
      this.writeLn('save();');
      this.writeLn('R.resume = false;');
      this.writeLn('var localR = R;');
      this.writeLn(`${source}`);
      this.writeLn('  .then(function() { localR.resume = true; })');
      this.writeLn('  .catch(function() { localR.resume = true; });');
      const label = this.addLabel();
      this.writeLn('if (!R.resume) {');
      this.forceQueue(label);
      this.writeLn('}');
      this.writeLn('restore();');
    }

    /**
     * Write JS to pause script execution for one tick.
     */
    waitOneTick() {
      this.writeLn('save();');
      this.writeLn('R.start = runtime.currentMSecs;');
      const label = this.addLabel();
      this.writeLn('if (runtime.currentMSecs === R.start) {');
      this.forceQueue(label);
      this.writeLn('}');
      this.writeLn('restore();');
    }

    /**
     * Append to the content
     */
    write(content: string): void {
      this.content += content;
    }

    /**
     * Append to the content, followed by a newline.
     */
    writeLn(content: string): void {
      this.content += content + '\n';
    }
  }

  /**
   * General input generation utilities.
   */
  export class InputUtil extends BlockUtil {
    numberInput(v: string) { return numberInput(v); }
    stringInput(v: string) { return stringInput(v); }
    booleanInput(v: string) { return booleanInput(v); }
    anyInput(v: string) { return anyInput(v); }
  }

  /**
   * General hat handling utilities.
   */
  export class HatUtil extends BlockUtil {
    constructor(compiler: Compiler, block: SB3Block, public startingFunction: Fn) {
      super(compiler, block);
    }
  }

  /**
   * A value that can be watched by a variable watcher.
   */
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

  interface CompilerState {
    isWarp: boolean;
    isProcedure: boolean;
    argumentNames: string[];
  }

  // Block definitions
  export const statementLibrary: ObjectMap<StatementCompiler> = Object.create(null);
  export const inputLibrary: ObjectMap<InputCompiler> = Object.create(null);
  export const hatLibrary: ObjectMap<HatCompiler> = Object.create(null);
  export const watcherLibrary: ObjectMap<WatchedValue> = Object.create(null);

  const safeNumberToString = (n: number): string => {
    // -0 toString() returns "0"
    if (Object.is(n, -0)) {
      return '-0';
    }
    return n.toString();
  };

  /**
   * The new compiler for Scratch 3 projects.
   */
  export class Compiler {
    /**
     * The Stage or Sprite to compile.
     */
    public target: Target;
    /**
     * The raw .sb3 data for this target.
     */
    public data: SB3Target;
    /**
     * The blocks of this target.
     */
    public blocks: ObjectMap<SB3Block>;
    /**
     * Total number of labels created by this compiler.
     */
    public labelCount: number = 0;
    /**
     * Compilation state metadata.
     */
    public state: CompilerState;
    /**
     * Whether the compiled scripts depend on music assets to exist.
     */
    public needsMusic: boolean = false;
    /**
     * Set of the names of all costumes and sounds in the sprite.
     */
    public costumeAndSoundNames: Set<string> = new Set();

    constructor(target: Target) {
      this.target = target;
      this.data = target.sb3data;
      this.blocks = this.data.blocks;
      for (const costume of target.costumes) {
        this.costumeAndSoundNames.add(costume.name);
      }
      for (const sound of target.sounds) {
        this.costumeAndSoundNames.add(sound.name);
      }
    }

    /**
     * Gets the IDs of all hat blocks.
     */
    getHatBlocks(): string[] {
      return Object.keys(this.blocks)
        .filter((i) => this.blocks[i].topLevel);
    }

    /**
     * Get the compiler for a statement
     */
    getStatementCompiler(opcode: string): StatementCompiler | null {
      if (statementLibrary[opcode]) {
        return statementLibrary[opcode];
      }
      return null;
    }

    /**
     * Get the compiler for an input
     */
    getInputCompiler(opcode: string): InputCompiler | null {
      if (inputLibrary[opcode]) {
        return inputLibrary[opcode];
      }
      return null;
    }

    /**
     * Get the compiler for a hat
     */
    getHatCompiler(opcode: string): HatCompiler | null {
      if (hatLibrary[opcode]) {
        return hatLibrary[opcode];
      }
      return null;
    }

    /**
     * Gets the default value to use for a missing input.
     */
    getInputFallback(type: InputType): string {
      switch (type) {
        case 'number': return '0';
        case 'boolean': return 'false';
        case 'string': return '""';
        case 'any': return '""';
        case 'list': return '""';
        case 'color': return '0';
      }
      assertNever(type);
    }

    /**
     * Applies type coercions to JS to forcibly change it's type.
     */
    asType(input: string, type: InputType): string {
      switch (type) {
        case 'string': return '("" + ' + input + ')';
        case 'number': return '(+' + input + ' || 0)';
        case 'boolean': return 'bool(' + input + ')';
        case 'any': return input;
        case 'list': throw new Error("Converting to 'list' type is not something you're supposed to do");
        case 'color': return 'parseColor(' + input + ')';
      }
      assertNever(type);
    }

    /**
     * Converts a compiled input to another type, if necessary
     */
    convertInputType(input: CompiledInput, type: InputType): CompiledInput {
      // If the types are already identical, no changes are necessary
      if (input.type === type) {
        // if the input could be NaN, number conversion is always required (NaN will be converted to 0)
        if (type === 'number' && input.hasFlag(InputFlags.NaN)) {
          return new CompiledInput('(' + input.source + ' || 0)', type);
        }
        return input;
      }
      // The 'any' type is a little bit special.
      // When the input is of type 'list', we change the desired type to string to fix list stringification.
      // In all other cases no action is necessary.
      if (type === 'any') {
        if (input.type === 'list') {
          type = 'string';
        } else {
          return input;
        }
      }
      return new CompiledInput(this.asType(input.source, type), type);
    }

    /**
     * Sanitize a string into a CompiledInput
     */
    sanitizedInput(string: string): CompiledInput {
      return stringInput(this.sanitizedString(string));
    }

    /**
     * Sanitize a string for use in the runtime.
     */
    sanitizedString(string: string): string {
      string = string
        .replace(/\\/g, '\\\\')
        .replace(/'/g, '\\\'')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\{/g, '\\x7b')
        .replace(/\}/g, '\\x7d');
      return `"${string}"`;
    }

    /**
     * Creates a sanitized block comment with the given contents.
     */
    sanitizedComment(content: string): string {
      // just disallow the content from ending the comment, and everything should be fine.
      content = content
        .replace(/\*\//g, '');
      return `/* ${content} */`;
    }

    /**
     * Find the scope and name of a variable from its ID.
     * The variable may be created if it does not exist.
     */
    findVariable({id, name}: {id: string, name: string}): { scope: string; name: string; } {
      const stage = this.target.stage as Target;
      if (stage.varIds.hasOwnProperty(id)) {
        return { scope: 'self', name: stage.varIds[id] };
      } else if (stage.vars.hasOwnProperty(name)) {
        return { scope: 'self', name: name };
      } else if (this.target.varIds.hasOwnProperty(id)) {
        return { scope: 'S', name: this.target.varIds[id] };
      } else if (this.target.vars.hasOwnProperty(name)) {
        return { scope: 'S', name: name };
      } else {
        // Create missing variables in the sprite.
        // We use the variable ID as the name, and store this in varIds for future lookups.
        this.target.vars[id] = 0;
        this.target.varIds[id] = id;
        return { scope: 'S', name: id };
      }
    }

    /**
     * Find the scope and name of a list from its ID.
     * The list may be created if it does not exist.
     */
    findList({id, name}: {id: string, name: string}): { scope: string; name: string; } {
      const stage = this.target.stage as Target;
      if (stage.listIds.hasOwnProperty(id)) {
        return { scope: 'self', name: stage.listIds[id] };
      } else if (stage.lists.hasOwnProperty(name)) {
        return { scope: 'self', name: name };
      } else if (this.target.listIds.hasOwnProperty(id)) {
        return { scope: 'S', name: this.target.listIds[id] };
      } else if (this.target.lists.hasOwnProperty(name)) {
        return { scope: 'S', name: name };
      } else {
        // Create missing lists in the sprite.
        // We use the list ID as the name, and store this in listIds for future lookups.
        this.target.lists[id] = createList();
        this.target.listIds[id] = id;
        return { scope: 'S', name: id };
      }
    }

    /**
     * Gets the runtime reference to a variable.
     */
    getVariableReference({id, name}: {id: string, name: string}): string {
      const varInfo = this.findVariable({id: id, name: name});
      return `${varInfo.scope}.vars[${this.sanitizedString(varInfo.name)}]`;
    }

    /**
     * Gets the runtime reference to a list.
     */
    getListReference({id, name}: {id: string, name: string}): string {
      const listInfo = this.findList({id: id, name: name});
      return `${listInfo.scope}.lists[${this.sanitizedString(listInfo.name)}]`;
    }

    /**
     * Determine if a string literal could potentially become a number at runtime.
     * May return false positives.
     * @see CompiledInput
     */
    isStringLiteralPotentialNumber(text: string) {
      return /\d|true|false|Infinity/.test(text);
    }

    /**
     * Determine whether text is the name of a costume or a sound.
     */
    isNameOfCostumeOrSound(text: string): boolean {
      return this.costumeAndSoundNames.has(text);
    }

    /**
     * Compile a native or primitive value.
     */
    compileNativeInput(native: any[], desiredType: InputType): CompiledInput {
      const type = native[0];
      switch (type) {
        // These are all just types of numbers.
        case NativeTypes.MATH_NUM:
        case NativeTypes.POSITIVE_NUM:
        case NativeTypes.WHOLE_NUM:
        case NativeTypes.INTEGER_NUM:
        case NativeTypes.ANGLE_NUM: {
          // [type, value]
          const number = +native[1];
          if (isNaN(number) || desiredType === 'string') {
            return this.sanitizedInput('' + native[1]);
          }
          return numberInput(safeNumberToString(number));
        }

        case NativeTypes.TEXT: {
          // [type, value]
          const value = native[1];
          // Do not attempt any conversions if:
          //  - desired type is string
          //  - value does not appear to be number-like
          //  - this is the name of a costume or sound (https://github.com/forkphorus/forkphorus/issues/264)
          if (desiredType !== 'string' && /\d|Infinity/.test(value) && !this.isNameOfCostumeOrSound(value)) {
            const number = +value;
            // If the stringification of the number is not the same as the original value, do not convert.
            // This fixes issues where the stringification is used instead of the number itself.
            // For example the number "0123" will end up "123" so reading the first letter of "0123" would return 1 instead of 0
            if (number.toString() === value) {
              if (!isNaN(number)) {
                return numberInput(number.toString());
              }
            }
          }
          const input = this.sanitizedInput(native[1] + '');
          input.potentialNumber = this.isStringLiteralPotentialNumber(native[1]);
          return input;
        }

        case NativeTypes.VAR:
          // [type, name, id]
          return anyInput(this.getVariableReference({id: native[2], name: native[1]}));

        case NativeTypes.LIST:
          // [type, name, id]
          return new CompiledInput(this.getListReference({id: native[2], name: native[1]}), 'list');

        case NativeTypes.BROADCAST:
          // [type, name, id]
          return this.sanitizedInput(native[1]);

        case NativeTypes.COLOR_PICKER: {
          // [type, color]
          // Color is a value like "#abcdef"
          const color = native[1];
          const rgb = P.utils.parseColor(color);
          return new CompiledInput('' + rgb, 'color');
        }

        default:
          this.warn('unknown native', type, native);
          return stringInput('""');
      }
    }

    /**
     * Compile an input of a block, and do any necessary type coercions.
     */
    compileInput(parentBlock: SB3Block, inputName: string, type: InputType): CompiledInput {
      // Handling when the block does not contain an input entry.
      if (!parentBlock.inputs || !parentBlock.inputs[inputName]) {
        // This could be a sign of another issue, so log a warning.
        this.warn('missing input', inputName);
        return new CompiledInput(this.getInputFallback(type), type);
      }

      const input = parentBlock.inputs[inputName];

      if (Array.isArray(input[1])) {
        const native = input[1];
        return this.convertInputType(this.compileNativeInput(native, type), type);
      }

      const inputBlockId = input[1];

      // Handling null inputs where the input exists but is just empty.
      // This is normal and happens very often.
      if (!inputBlockId) {
        return new CompiledInput(this.getInputFallback(type), type);
      }

      const inputBlock = this.blocks[inputBlockId];
      if (!inputBlock) {
        return new CompiledInput(this.getInputFallback(type), type);
      }

      const opcode = inputBlock.opcode;
      const compiler = this.getInputCompiler(opcode);

      // If we don't recognize this block, that's a problem.
      if (!compiler) {
        this.warn('unknown input', opcode, inputBlock);
        return new CompiledInput(this.getInputFallback(type), type);
      }

      const util = new InputUtil(this, inputBlock);
      let result = compiler(util);

      if (P.config.debug) {
        result.source = this.sanitizedComment(inputBlock.opcode) + result.source;
      }

      return this.convertInputType(result, type);
    }

    /**
     * Get a field of a block.
     */
    getField(block: SB3Block, fieldName: string): string {
      const value = block.fields[fieldName];
      if (!value) {
        // This could be a sign of another issue, so log a warning.
        this.warn('missing field', fieldName);
        return '';
      }
      return '' + value[0];
    }

    /**
     * Get the value of a variable field of a block.
     * @returns The variable ID
     */
    getVariableField(block: SB3Block, fieldName: string): {id: string; name: string} {
      const value = block.fields[fieldName];
      if (!value) {
        // This could be a sign of another issue, so log a warning.
        this.warn('missing variable field', fieldName);
        return {id: '', name: ''};
      }
      return {id: '' + value[1], name: '' + value[0]};
    }

    /**
     * Compile a script within a script.
     */
    compileSubstackInput(block: SB3Block, substackName: string): string {
      // empty substacks are normal
      if (!block.inputs[substackName]) {
        return '';
      }

      const substack = block.inputs[substackName];
      const type = substack[0];
      const id = substack[1];

      if (id === null) {
        return '';
      }

      return this.compileStack(id);
    }

    /**
     * Creates a fresh CompilerState
     */
    getNewState(): CompilerState {
      return {
        isWarp: false,
        isProcedure: false,
        argumentNames: []
      };
    }

    /**
     * Compile an entire script from a starting block.
     */
    compileStack(startingBlock: string): string {
      let script = '';
      let block = this.blocks[startingBlock];

      while (true) {
        var opcode = block.opcode;
        const compiler = this.getStatementCompiler(opcode);

        if (P.config.debug) {
          script += this.sanitizedComment(block.opcode);
        }

        if (compiler) {
          const util = new StatementUtil(this, block);
          compiler(util);
          script += util.content;
        } else {
          script += '/* unknown statement */';
          this.warn('unknown statement', opcode, block);
        }

        if (!block.next) {
          break;
        }
        block = this.blocks[block.next];
      }

      return script;
    }

    /**
     * Compile a hat block and its children.
     * The hat handler will be used, and the scripts will be installed.
     */
    compileHat(hat: SB3Block): void {
      const hatCompiler = this.getHatCompiler(hat.opcode);
      if (!hatCompiler) {
        // If a hat block is otherwise recognized as an input or statement, don't warn.
        // Most projects have at least one of these "dangling" blocks.
        if (!this.getInputCompiler(hat.opcode) && !this.getStatementCompiler(hat.opcode)) {
          this.warn('unknown hat block', hat.opcode, hat);
        }
        return;
      }

      this.labelCount = this.target.fns.length;

      const startingBlock = hat.next;
      // Empty hats will be ignored
      if (!startingBlock) {
        return;
      }

      this.state = this.getNewState();

      // There is always a label placed at the beginning of the script.
      // If you're clever, you may be able to remove this at some point.
      let script = `{{${this.labelCount++}}}`;

      if (hatCompiler.precompile) {
        script += hatCompiler.precompile(this, hat);
      }

      script += this.compileStack(startingBlock);

      // If a block wants to do some changes to the script after script generation but before compilation, let it.
      if (hatCompiler.postcompile) {
        script = hatCompiler.postcompile(this, script, hat);
      }

      // Parse the script to search for labels, and remove the label metadata.
      const parseResult = this.parseScript(script);
      const parsedScript = parseResult.script;

      const startFn = this.target.fns.length;
      for (let label of Object.keys(parseResult.labels)) {
        this.target.fns[label] = P.runtime.createContinuation(parsedScript.slice(parseResult.labels[label]));
      }

      const startingFunction = this.target.fns[startFn];
      const util = new HatUtil(this, hat, startingFunction);
      hatCompiler.handle(util);

      if (P.config.debug) {
        this.log(`[${this.target.name}] compiled sb3 script "${hat.opcode}"`, script, this.target);
      }
    }

    /**
     * Parse a generated script for label locations, and remove redundant data.
     */
    parseScript(script: string): { labels: ObjectMap<number>, script: string; } {
      const labels = {};
      let index = 0;
      let accumulator = 0;

      while (true) {
        const labelStart = script.indexOf('{{', index);
        if (labelStart === -1) {
          break;
        }
        const labelEnd = script.indexOf('}}', index);
        const id = script.substring(labelStart + 2, labelEnd);
        const length = labelEnd + 2 - labelStart;
        accumulator += length;

        labels[id] = labelEnd + 2 - accumulator;

        index = labelEnd + 2;
      }

      // We don't **actually* have to remove the {{0}} labels (its technically valid JS),
      // but it's probably a good idea.
      const fixedScript = script.replace(/{{\d+}}/g, '');

      return {
        labels,
        script: fixedScript,
      };
    }

    /**
     * Log a warning
     */
    warn(...args: any[]) {
      args.unshift(`[sb3 compiler ${this.target.name}]`);
      console.warn.apply(console, args);
    }

    /**
     * Log info
     */
    log(...args: any[]) {
      args.unshift(`[sb3 compiler ${this.target.name}]`);
      console.log.apply(console, args);
    }

    /**
     * Compiles the scripts of the target with the current data.
     */
    compile(): void {
      const hats = this.getHatBlocks();

      for (const hatId of hats) {
        const hat = this.blocks[hatId];
        this.compileHat(hat);
      }

      // Remove data that is now unused
      this.target.sb3data = null as any;
    }
  }
}

/**
 * Scratch 3 blocks.
 */
(function() {
  const statementLibrary = P.sb3.compiler.statementLibrary;
  const inputLibrary = P.sb3.compiler.inputLibrary;
  const hatLibrary = P.sb3.compiler.hatLibrary;
  const watcherLibrary = P.sb3.compiler.watcherLibrary;

  /* Statements */
  statementLibrary['control_all_at_once'] = function(util) {
    // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_control.js#L194-L199
    const SUBSTACK = util.getSubstack('SUBSTACK');
    util.write(SUBSTACK);
  };
  statementLibrary['control_clear_counter'] = function(util) {
    util.writeLn('self.counter = 0;');
  };
  statementLibrary['control_create_clone_of'] = function(util) {
    const CLONE_OPTION = util.getInput('CLONE_OPTION', 'any');
    util.writeLn(`clone(${CLONE_OPTION});`);
  };
  statementLibrary['control_delete_this_clone'] = function(util) {
    util.writeLn('if (S.isClone) {');
    util.visual('visible');
    util.writeLn('  S.remove();');
    util.writeLn('  var i = self.children.indexOf(S);');
    util.writeLn('  if (i !== -1) self.children.splice(i, 1);');
    util.writeLn('  for (var i = 0; i < runtime.queue.length; i++) {');
    util.writeLn('    if (runtime.queue[i] && runtime.queue[i].sprite === S) {');
    util.writeLn('      runtime.queue[i] = undefined;');
    util.writeLn('    }');
    util.writeLn('  }');
    util.writeLn('  return;');
    util.writeLn('}');
  };
  statementLibrary['control_for_each'] = function(util) {
    const VARIABLE = util.getVariableReference('VARIABLE');
    const SUBSTACK = util.getSubstack('SUBSTACK');
    const VALUE = util.getInput('VALUE', 'number');
    util.writeLn('save();');
    util.writeLn(`R.times = ${VALUE};`);
    util.writeLn('R.current = 0;');
    const label = util.addLabel();
    util.writeLn(`if (R.current < R.times) {`);
    util.writeLn(`  ${VARIABLE} = ++R.current;`);
    util.write(SUBSTACK);
    util.queue(label);
    util.writeLn('} else {');
    util.writeLn('  restore();');
    util.writeLn('}');
  };
  statementLibrary['control_forever'] = function(util) {
    const SUBSTACK = util.getSubstack('SUBSTACK');
    if (util.compiler.state.isWarp && !util.substacksQueue) {
      util.writeLn('while (true) {');
      util.write(SUBSTACK);
      util.writeLn('}');
    } else {
      const label = util.addLabel();
      util.write(SUBSTACK);
      util.queue(label);
    }
  };
  statementLibrary['control_if'] = function(util) {
    const CONDITION = util.getInput('CONDITION', 'boolean');
    const SUBSTACK = util.getSubstack('SUBSTACK');
    util.writeLn(`if (${CONDITION}) {`);
    util.write(SUBSTACK);
    util.writeLn('}');
  };
  statementLibrary['control_if_else'] = function(util) {
    const CONDITION = util.getInput('CONDITION', 'boolean');
    const SUBSTACK = util.getSubstack('SUBSTACK');
    const SUBSTACK2 = util.getSubstack('SUBSTACK2');
    util.writeLn(`if (${CONDITION}) {`);
    util.write(SUBSTACK);
    util.writeLn('} else {');
    util.write(SUBSTACK2);
    util.writeLn('}');
  };
  statementLibrary['control_incr_counter'] = function(util) {
    util.writeLn('self.counter++;');
  };
  statementLibrary['control_repeat'] = function(util) {
    const TIMES = util.getInput('TIMES', 'any');
    const SUBSTACK = util.getSubstack('SUBSTACK');
    if (util.compiler.state.isWarp && !util.substacksQueue) {
      util.writeLn('save();');
      util.writeLn(`R.count = ${TIMES};`);
      util.writeLn('while (R.count >= 0.5) {');
      util.writeLn('  R.count -= 1;');
      util.write(SUBSTACK);
      util.writeLn('}');
      util.writeLn('restore();');
    } else {
      util.writeLn('save();');
      util.writeLn(`R.count = ${TIMES};`);
      const label = util.addLabel();
      util.writeLn('if (R.count >= 0.5) {');
      util.writeLn('  R.count -= 1;');
      util.write(SUBSTACK);
      util.queue(label);
      util.writeLn('} else {');
      util.writeLn('  restore();');
      util.writeLn('}');
    }
  };
  statementLibrary['control_repeat_until'] = function(util) {
    const CONDITION = util.getInput('CONDITION', 'boolean');
    const SUBSTACK = util.getSubstack('SUBSTACK');
    if (util.compiler.state.isWarp && !util.substacksQueue) {
      util.writeLn(`while (!${CONDITION}) {`);
      util.write(SUBSTACK);
      util.writeLn('}');
    } else {
      const label = util.addLabel();
      util.writeLn(`if (!${CONDITION}) {`);
      util.write(SUBSTACK);
      util.queue(label);
      util.writeLn('}');
    }
  };
  statementLibrary['control_stop'] = function(util) {
    const STOP_OPTION = util.getField('STOP_OPTION');
    switch (STOP_OPTION) {
      case 'all':
        util.writeLn('runtime.stopAll(); return;');
        break;
      case 'this script':
        util.writeLn('endCall(); return;');
        break;
      case 'other scripts in sprite':
      case 'other scripts in stage':
        util.writeLn('S.stopSoundsExcept(BASE);');
        util.writeLn('for (var i = 0; i < runtime.queue.length; i++) {');
        util.writeLn('  if (i !== THREAD && runtime.queue[i] && runtime.queue[i].sprite === S) {');
        util.writeLn('    runtime.queue[i].stopped = true;');
        util.writeLn('    runtime.queue[i].fn = undefined;');
        util.writeLn('  }');
        util.writeLn('}');
        break;
    }
  };
  statementLibrary['control_wait'] = function(util) {
    const DURATION = util.getInput('DURATION', 'any');
    util.visual('always');
    util.writeLn('save();');
    util.writeLn('R.start = runtime.currentMSecs;');
    util.writeLn(`R.duration = ${DURATION};`);
    util.writeLn(`var first = !WARP;`);
    const label = util.addLabel();
    util.writeLn('if (runtime.currentMSecs - R.start < R.duration * 1000 || first) {');
    util.writeLn('  var first;');
    util.forceQueue(label);
    util.writeLn('}');
    util.writeLn('restore();');
  };
  statementLibrary['control_wait_until'] = function(util) {
    const CONDITION = util.getInput('CONDITION', 'boolean');
    const label = util.addLabel();
    util.writeLn(`if (!${CONDITION}) {`);
    util.forceQueue(label);
    util.writeLn('}');
  };
  statementLibrary['control_while'] = function(util) {
    const CONDITION = util.getInput('CONDITION', 'boolean');
    const SUBSTACK = util.getSubstack('SUBSTACK');
    if (util.compiler.state.isWarp && !util.substacksQueue) {
      util.writeLn(`while (${CONDITION}) {`);
      util.write(SUBSTACK);
      util.writeLn('}');
    } else {
      const label = util.addLabel();
      util.writeLn(`if (${CONDITION}) {`);
      util.write(SUBSTACK);
      util.queue(label);
      util.writeLn('}');
    }
  };
  statementLibrary['data_addtolist'] = function(util) {
    const LIST = util.getListReference('LIST');
    const ITEM = util.getInput('ITEM', 'any');
    util.writeLn(`watchedAppendToList(${LIST}, ${ITEM});`);
  };
  statementLibrary['data_changevariableby'] = function(util) {
    const VARIABLE = util.getVariableReference('VARIABLE');
    const VALUE = util.getInput('VALUE', 'number');
    util.writeLn(`${VARIABLE} = (${util.asType(VARIABLE, 'number')} + ${VALUE});`);
    if (util.isCloudVariable('VARIABLE')) {
      util.writeLn(`cloudVariableChanged(${util.sanitizedString(util.getField('VARIABLE'))})`);
    }
  };
  statementLibrary['data_deletealloflist'] = function(util) {
    const LIST = util.getListReference('LIST');
    util.writeLn(`watchedDeleteAllOfList(${LIST});`);
  };
  statementLibrary['data_deleteoflist'] = function(util) {
    const LIST = util.getListReference('LIST');
    const INDEX = util.getInput('INDEX', 'any');
    util.writeLn(`watchedDeleteLineOfList(${LIST}, ${INDEX});`);
  };
  statementLibrary['data_hidelist'] = function(util) {
    const LIST = util.sanitizedString(util.getField('LIST'));
    const scope = util.getListScope('LIST');
    util.writeLn(`${scope}.showList(${LIST}, false);`);
  };
  statementLibrary['data_hidevariable'] = function(util) {
    const VARIABLE = util.sanitizedString(util.getField('VARIABLE'));
    const scope = util.getVariableScope('VARIABLE');
    util.writeLn(`${scope}.showVariable(${VARIABLE}, false);`);
  };
  statementLibrary['data_insertatlist'] = function(util) {
    const LIST = util.getListReference('LIST');
    const INDEX = util.getInput('INDEX', 'any');
    const ITEM = util.getInput('ITEM', 'any');
    util.writeLn(`watchedInsertInList(${LIST}, ${INDEX}, ${ITEM});`);
  };
  statementLibrary['data_replaceitemoflist'] = function(util) {
    const LIST = util.getListReference('LIST');
    const ITEM = util.getInput('ITEM', 'any');
    const INDEX = util.getInput('INDEX', 'any');
    util.writeLn(`watchedSetLineOfList(${LIST}, ${INDEX}, ${ITEM});`);
  };
  statementLibrary['data_setvariableto'] = function(util) {
    const VARIABLE = util.getVariableReference('VARIABLE');
    const VALUE = util.getInput('VALUE', 'any');
    util.writeLn(`${VARIABLE} = ${VALUE};`);
    if (util.isCloudVariable('VARIABLE')) {
      util.writeLn(`cloudVariableChanged(${util.sanitizedString(util.getField('VARIABLE'))})`);
    }
  };
  statementLibrary['data_showlist'] = function(util) {
    const LIST = util.sanitizedString(util.getField('LIST'));
    const scope = util.getListScope('LIST');
    util.writeLn(`${scope}.showList(${LIST}, true);`);
  };
  statementLibrary['data_showvariable'] = function(util) {
    const VARIABLE = util.sanitizedString(util.getField('VARIABLE'));
    const scope = util.getVariableScope('VARIABLE');
    util.writeLn(`${scope}.showVariable(${VARIABLE}, true);`);
  };
  statementLibrary['event_broadcast'] = function(util) {
    const BROADCAST_INPUT = util.getInput('BROADCAST_INPUT', 'any');
    util.writeLn(`var threads = broadcast(${BROADCAST_INPUT});`);
    util.writeLn(`if (threads.indexOf(BASE) !== -1) {STOPPED = true;}`);
  };
  statementLibrary['event_broadcastandwait'] = function(util) {
    const BROADCAST_INPUT = util.getInput('BROADCAST_INPUT', 'any');
    util.writeLn('save();');
    util.writeLn(`R.threads = broadcast(${BROADCAST_INPUT});`);
    util.writeLn('if (R.threads.indexOf(BASE) !== -1) {return;}');
    const label = util.addLabel();
    util.writeLn('if (running(R.threads)) {');
    util.forceQueue(label);
    util.writeLn('}');
    util.writeLn('restore();');
  };
  statementLibrary['looks_changeeffectby'] = function(util) {
    const EFFECT = util.sanitizedString(util.getField('EFFECT')).toLowerCase();
    const CHANGE = util.getInput('CHANGE', 'number');
    util.writeLn(`S.changeFilter(${EFFECT}, ${CHANGE});`);
    util.visual('visible');
  };
  statementLibrary['looks_changesizeby'] = function(util) {
    const CHANGE = util.getInput('CHANGE', 'any');
    util.writeLn(`var f = S.scale + ${CHANGE} / 100;`);
    util.writeLn('S.scale = f < 0 ? 0 : f;');
    util.visual('visible');
  };
  statementLibrary['looks_cleargraphiceffects'] = function(util) {
    util.writeLn('S.resetFilters();');
    util.visual('visible');
  };
  statementLibrary['looks_goforwardbackwardlayers'] = function(util) {
    const FORWARD_BACKWARD = util.getField('FORWARD_BACKWARD');
    const NUM = util.getInput('NUM', 'number');
    util.writeLn('var i = self.children.indexOf(S);');
    util.writeLn('if (i !== -1) {');
    util.writeLn('  self.children.splice(i, 1);');
    if (FORWARD_BACKWARD === 'forward') {
      util.writeLn(`  self.children.splice(Math.max(0, Math.min(self.children.length, i + ${NUM})), 0, S);`);
    } else {
      util.writeLn(`  self.children.splice(Math.max(0, Math.min(self.children.length, i - ${NUM})), 0, S);`);
    }
    util.writeLn('}');
  };
  statementLibrary['looks_gotofrontback'] = function(util) {
    const FRONT_BACK = util.getField('FRONT_BACK');
    util.writeLn('var i = self.children.indexOf(S);');
    util.writeLn('if (i !== -1) self.children.splice(i, 1);');
    if (FRONT_BACK === 'front') {
      util.writeLn('self.children.push(S);');
    } else {
      util.writeLn('self.children.unshift(S);');
    }
  };
  statementLibrary['looks_hide'] = function(util) {
    util.writeLn('S.visible = false;');
    util.updateBubble();
  };
  statementLibrary['looks_nextbackdrop'] = function(util) {
    util.writeLn('self.showNextCostume();');
    util.visual('always');
    util.writeLn('var threads = sceneChange();');
    util.writeLn('if (threads.indexOf(BASE) !== -1) {return;}');
  };
  statementLibrary['looks_nextcostume'] = function(util) {
    util.writeLn('S.showNextCostume();');
    util.visual('visible');
  };
  statementLibrary['looks_say'] = function(util) {
    const MESSAGE = util.getInput('MESSAGE', 'any');
    util.writeLn(`S.say(${MESSAGE}, false);`);
    util.visual('visible');
  };
  statementLibrary['looks_sayforsecs'] = function(util) {
    const MESSAGE = util.getInput('MESSAGE', 'any');
    const SECS = util.getInput('SECS', 'number');
    util.writeLn('save();');
    util.writeLn(`R.id = S.say(${MESSAGE}, false);`);
    util.visual('visible');
    util.writeLn('R.start = runtime.now();');
    util.writeLn(`R.duration = ${SECS};`);
    util.writeLn(`var first = true;`);
    const label = util.addLabel();
    util.writeLn('if (runtime.now() - R.start < R.duration * 1000 || first) {');
    util.writeLn('  var first;');
    util.forceQueue(label);
    util.writeLn('}');
    util.writeLn('if (S.sayId === R.id) {');
    util.writeLn('  S.say("");');
    util.writeLn('}');
    util.writeLn('restore();');
  };
  statementLibrary['looks_seteffectto'] = function(util) {
    const EFFECT = util.sanitizedString(util.getField('EFFECT')).toLowerCase();
    const VALUE = util.getInput('VALUE', 'number');
    util.writeLn(`S.setFilter(${EFFECT}, ${VALUE});`);
    util.visual('visible');
  };
  statementLibrary['looks_setsizeto'] = function(util) {
    const SIZE = util.getInput('SIZE', 'number');
    util.writeLn(`S.scale = Math.max(0, ${SIZE} / 100);`)
    util.visual('visible');
  };
  statementLibrary['looks_show'] = function(util) {
    util.writeLn('S.visible = true;');
    util.visual('always');
    util.updateBubble();
  };
  statementLibrary['looks_switchbackdropto'] = function(util) {
    // BACKDROP cannot be casted: setCostume behavior depends on type
    const BACKDROP = util.getInput('BACKDROP', 'any');
    util.writeLn(`self.setCostume(${BACKDROP});`);
    util.visual('always');
    util.writeLn('var threads = sceneChange();');
    util.writeLn('if (threads.indexOf(BASE) !== -1) {return;}');
  };
  statementLibrary['looks_switchbackdroptoandwait'] = function(util) {
    const BACKDROP = util.getInput('BACKDROP', 'any');
    util.writeLn(`self.setCostume(${BACKDROP});`);
    util.visual('always');
    util.writeLn('save();');
    util.writeLn('R.threads = sceneChange();');
    util.writeLn('if (R.threads.indexOf(BASE) !== -1) {return;}');
    const label = util.addLabel();
    util.writeLn('if (running(R.threads)) {');
    util.forceQueue(label);
    util.writeLn('}');
    util.writeLn('restore();');
  };
  statementLibrary['looks_switchcostumeto'] = function(util) {
    // COSTUME cannot be casted: setCostume behavior depends on type
    const COSTUME = util.getInput('COSTUME', 'any');
    util.writeLn(`S.setCostume(${COSTUME});`);
    util.visual('visible');
  };
  statementLibrary['looks_think'] = function(util) {
    const MESSAGE = util.getInput('MESSAGE', 'any');
    util.writeLn(`S.say(${MESSAGE}, true);`);
    util.visual('visible');
  };
  statementLibrary['looks_thinkforsecs'] = function(util) {
    const MESSAGE = util.getInput('MESSAGE', 'any');
    const SECS = util.getInput('SECS', 'number');
    util.writeLn('save();');
    util.writeLn(`R.id = S.say(${MESSAGE}, true);`);
    util.visual('visible');
    util.writeLn('R.start = runtime.now();');
    util.writeLn(`R.duration = ${SECS};`);
    util.writeLn(`var first = true;`);
    const label = util.addLabel();
    util.writeLn('if (runtime.now() - R.start < R.duration * 1000 || first) {');
    util.writeLn('  var first;');
    util.forceQueue(label);
    util.writeLn('}');
    util.writeLn('if (S.sayId === R.id) {');
    util.writeLn('  S.say("");');
    util.writeLn('}');
    util.writeLn('restore();');
  };
  statementLibrary['motion_changexby'] = function(util) {
    const DX = util.getInput('DX', 'number');
    util.writeLn(`S.moveTo(S.scratchX + ${DX}, S.scratchY);`);
    util.visual('drawing');
  };
  statementLibrary['motion_changeyby'] = function(util) {
    const DY = util.getInput('DY', 'number');
    util.writeLn(`S.moveTo(S.scratchX, S.scratchY + ${DY});`);
    util.visual('drawing');
  };
  statementLibrary['motion_glidesecstoxy'] = function(util) {
    const SECS = util.getInput('SECS', 'any');
    const X = util.getInput('X', 'any');
    const Y = util.getInput('Y', 'any');
    util.visual('drawing');
    util.writeLn('save();');
    util.writeLn('R.start = runtime.now();');
    util.writeLn(`R.duration = ${SECS};`);
    util.writeLn('R.baseX = S.scratchX;');
    util.writeLn('R.baseY = S.scratchY;');
    util.writeLn(`R.deltaX = ${X} - S.scratchX;`);
    util.writeLn(`R.deltaY = ${Y} - S.scratchY;`);
    const label = util.addLabel();
    util.writeLn('var f = (runtime.now() - R.start) / (R.duration * 1000);');
    util.writeLn('if (f > 1 || isNaN(f)) f = 1;');
    util.writeLn('S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);');
    util.visual('drawing');
    util.writeLn('if (f < 1) {');
    util.forceQueue(label);
    util.writeLn('}');
    util.writeLn('restore();');
  };
  statementLibrary['motion_glideto'] = function(util) {
    const SECS = util.getInput('SECS', 'any');
    const TO = util.getInput('TO', 'any');
    util.visual('drawing');
    util.writeLn('save();');
    util.writeLn('R.start = runtime.now();');
    util.writeLn(`R.duration = ${SECS};`);
    util.writeLn('R.baseX = S.scratchX;');
    util.writeLn('R.baseY = S.scratchY;');
    util.writeLn(`var to = self.getPosition(${TO});`);
    util.writeLn('if (to) {');
    util.writeLn('  R.deltaX = to.x - S.scratchX;');
    util.writeLn('  R.deltaY = to.y - S.scratchY;');
    const label = util.addLabel();
    util.writeLn('  var f = (runtime.now() - R.start) / (R.duration * 1000);');
    util.writeLn('  if (f > 1 || isNaN(f)) f = 1;');
    util.writeLn('  S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);');
    util.visual('drawing');
    util.writeLn('  if (f < 1) {');
    util.forceQueue(label);
    util.writeLn('  }');
    util.writeLn('  restore();');
    util.writeLn('}');
  };
  statementLibrary['motion_goto'] = function(util) {
    const TO = util.getInput('TO', 'any');
    util.writeLn(`S.gotoObject(${TO});`);
    util.visual('drawing');
  };
  statementLibrary['motion_gotoxy'] = function(util) {
    const X = util.getInput('X', 'number');
    const Y = util.getInput('Y', 'number');
    util.writeLn(`S.moveTo(${X}, ${Y});`);
    util.visual('drawing');
  };
  statementLibrary['motion_ifonedgebounce'] = function(util) {
    // TODO: set visual if bounced
    util.writeLn('S.bounceOffEdge();');
  };
  statementLibrary['motion_movesteps'] = function(util) {
    const STEPS = util.getInput('STEPS', 'number');
    util.writeLn(`S.forward(${STEPS});`);
    util.visual('drawing');
  };
  statementLibrary['motion_pointindirection'] = function(util) {
    const DIRECTION = util.getInput('DIRECTION', 'number');
    util.visual('visible');
    util.writeLn(`S.setDirection(${DIRECTION});`);
  };
  statementLibrary['motion_pointtowards'] = function(util) {
    const TOWARDS = util.getInput('TOWARDS', 'any');
    util.writeLn(`S.pointTowards(${TOWARDS});`);
    util.visual('visible');
  };
  statementLibrary['motion_setrotationstyle'] = function(util) {
    const STYLE = P.utils.parseRotationStyle(util.getField('STYLE'));
    util.writeLn(`S.rotationStyle = ${STYLE};`);
    util.visual('visible');
  };
  statementLibrary['motion_setx'] = function(util) {
    const X = util.getInput('X', 'number');
    util.writeLn(`S.moveTo(${X}, S.scratchY);`);
    util.visual('drawing');
  };
  statementLibrary['motion_sety'] = function(util) {
    const Y = util.getInput('Y', 'number');
    util.writeLn(`S.moveTo(S.scratchX, ${Y});`);
    util.visual('drawing');
  };
  statementLibrary['motion_turnleft'] = function(util) {
    const DEGREES = util.getInput('DEGREES', 'number');
    util.writeLn(`S.setDirection(S.direction - ${DEGREES});`);
    util.visual('visible');
  };
  statementLibrary['motion_turnright'] = function(util) {
    const DEGREES = util.getInput('DEGREES', 'number');
    util.writeLn(`S.setDirection(S.direction + ${DEGREES});`);
    util.visual('visible');
  };
  statementLibrary['music_changeTempo'] = function(util) {
    const TEMPO = util.getInput('TEMPO', 'number');
    util.writeLn(`self.tempoBPM += ${TEMPO};`)
  };
  statementLibrary['music_playDrumForBeats'] = function(util) {
    const BEATS = util.getInput('BEATS', 'number');
    const DRUM = util.getInput('DRUM', 'number');

    util.compiler.needsMusic = true;

    util.writeLn('save();');
    util.writeLn('R.start = runtime.now();');
    util.writeLn(`R.duration = ${BEATS} * 60 / self.tempoBPM;`);
    util.writeLn(`var first = !WARP;`);

    if (P.audio.context) {
      util.writeLn(`R.sound = playSpan(DRUMS[Math.round(${DRUM}) - 1] || DRUMS[2], 60, 10);`);
    } else {
      util.writeLn('R.sound = { stopped: false };');
    }

    const id = util.addLabel();
    util.writeLn('S.activeSounds.add(R.sound);')
    util.writeLn('if ((runtime.now() - R.start < R.duration * 1000 || first) && !R.sound.stopped) {');
    util.writeLn('  var first;');
    util.forceQueue(id);
    util.writeLn('}');
    util.writeLn('S.activeSounds.delete(R.sound);');
    util.writeLn('restore();');
  };
  statementLibrary['music_playNoteForBeats'] = function(util) {
    const BEATS = util.getInput('BEATS', 'number');
    const NOTE = util.getInput('NOTE', 'number');

    util.compiler.needsMusic = true;

    util.writeLn('save();');
    util.writeLn('R.start = runtime.now();');
    util.writeLn(`R.duration = ${BEATS} * 60 / self.tempoBPM;`);

    if (P.audio.context) {
      util.writeLn(`R.sound = playNote(${NOTE}, R.duration);`);
    } else {
      util.writeLn('R.sound = { stopped: false };');
    }

    const id = util.addLabel();
    util.writeLn('S.activeSounds.add(R.sound);')
    util.writeLn('if ((runtime.now() - R.start < R.duration * 1000) && !R.sound.stopped) {');
    util.forceQueue(id);
    util.writeLn('}');
    util.writeLn('S.activeSounds.delete(R.sound);');
    util.writeLn('restore();');
  };
  statementLibrary['music_restForBeats'] = function(util) {
    const BEATS = util.getInput('BEATS', 'number');
    util.writeLn('save();');
    util.writeLn('R.start = runtime.now();');
    util.writeLn(`R.duration = ${BEATS} * 60 / self.tempoBPM;`);
    util.writeLn(`var first = !WARP;`);
    const id = util.addLabel();
    util.writeLn('if (runtime.now() - R.start < R.duration * 1000 || first) {');
    util.writeLn('  var first;');
    util.forceQueue(id);
    util.writeLn('}');
    util.writeLn('restore();');
  };
  statementLibrary['music_setTempo'] = function(util) {
    const TEMPO = util.getInput('TEMPO', 'number');
    util.writeLn(`self.tempoBPM = ${TEMPO};`)
  };
  statementLibrary['music_setInstrument'] = function(util) {
    const INSTRUMENT = util.getInput('INSTRUMENT', 'number');
    util.writeLn(`S.instrument = Math.max(0, Math.min(INSTRUMENTS.length - 1, ${INSTRUMENT} - 1)) | 0;`);
  };
  statementLibrary['pen_changePenColorParamBy'] = function(util) {
    const COLOR_PARAM = util.getInput('COLOR_PARAM', 'string');
    const VALUE = util.getInput('VALUE', 'number');
    util.writeLn(`S.penColor.changeParam(${COLOR_PARAM}, ${VALUE});`);
  };
  statementLibrary['pen_changePenHueBy'] = function(util) {
    // This is an old pen hue block, which functions differently from the new one.
    const HUE = util.getInput('HUE', 'number');
    util.writeLn('S.penColor.toHSLA();');
    util.writeLn(`S.penColor.x += ${HUE} * 360 / 200;`);
    util.writeLn('S.penColor.y = 100;');
  };
  statementLibrary['pen_changePenShadeBy'] = function(util) {
    const SHADE = util.getInput('SHADE', 'number');
    util.writeLn('S.penColor.toHSLA();');
    util.writeLn(`S.penColor.z = (S.penColor.z + ${SHADE}) % 200;`);
    util.writeLn('if (S.penColor.z < 0) S.penColor.z += 200;');
    util.writeLn('S.penColor.y = 100;');
  };
  statementLibrary['pen_changePenSizeBy'] = function(util) {
    const SIZE = util.getInput('SIZE', 'number');
    util.writeLn(`S.penSize = Math.max(1, S.penSize + ${SIZE});`);
  };
  statementLibrary['pen_clear'] = function(util) {
    util.writeLn('self.clearPen();');
    util.visual('always');
  };
  statementLibrary['pen_penDown'] = function(util) {
    util.writeLn('S.isPenDown = true;');
    util.writeLn('S.dotPen();');
    util.visual('always');
  };
  statementLibrary['pen_penUp'] = function(util) {
    util.writeLn('S.isPenDown = false;');
  };
  statementLibrary['pen_setPenColorParamTo'] = function(util) {
    const COLOR_PARAM = util.getInput('COLOR_PARAM', 'string');
    const VALUE = util.getInput('VALUE', 'number');
    util.writeLn(`S.penColor.setParam(${COLOR_PARAM}, ${VALUE});`);
  };
  statementLibrary['pen_setPenColorToColor'] = function(util) {
    const COLOR = util.getInput('COLOR', 'color');
    util.writeLn(`S.penColor.setShiftedRGBA(${COLOR});`);
  };
  statementLibrary['pen_setPenHueToNumber'] = function(util) {
    // This is an old pen hue block, which functions differently from the new one.
    const HUE = util.getInput('HUE', 'number');
    util.writeLn('S.penColor.toHSLA();');
    util.writeLn(`S.penColor.x = ${HUE} * 360 / 200;`);
    util.writeLn('S.penColor.y = 100;');
    util.writeLn('S.penColor.a = 1;');
  };
  statementLibrary['pen_setPenShadeToNumber'] = function(util) {
    const SHADE = util.getInput('SHADE', 'number');
    util.writeLn('S.penColor.toHSLA();');
    util.writeLn(`S.penColor.z = ${SHADE} % 200;`);
    util.writeLn('if (S.penColor.z < 0) S.penColor.z += 200;');
    util.writeLn('S.penColor.y = 100;');
  };
  statementLibrary['pen_setPenSizeTo'] = function(util) {
    const SIZE = util.getInput('SIZE', 'number');
    // clamping per https://github.com/LLK/scratch-vm/blob/015a095dfd30b229511f174cea96dbdb612af8eb/src/extensions/scratch3_pen/index.js#L101
    util.writeLn(`S.penSize = Math.max(1, Math.min(${SIZE}, 1200));`);
  };
  statementLibrary['pen_stamp'] = function(util) {
    util.writeLn('S.stamp();');
    util.visual('always');
  };
  statementLibrary['procedures_call'] = function(util) {
    const mutation = util.block.mutation;
    const name = mutation.proccode;

    if (P.config.debug) {
      if (name === 'forkphorus:debugger;') {
        util.writeLn('/* forkphorus */ debugger;');
        return;
      } else if (name === 'forkphorus:throw;') {
        util.writeLn('/* forkphorus */ throw new Error("Debug intended crash");');
        return;
      }
    }

    const label = util.claimNextLabel();
    util.write(`call(S.procedures[${util.sanitizedString(name)}], ${label}, [`);

    // The mutation has a stringified JSON list of input IDs... it's weird.
    const inputNames = JSON.parse(mutation.argumentids);
    for (const inputName of inputNames) {
      util.write(`${util.getInput(inputName, 'any')}, `);
    }

    util.writeLn(']); return;');
    util.addLabel(label);
  };
  statementLibrary['sound_changeeffectby'] = function(util) {
    const EFFECT = util.sanitizedString(util.getField('EFFECT'));
    const VALUE = util.getInput('VALUE', 'number');
    util.writeLn(`S.changeSoundFilter(${EFFECT}, ${VALUE});`);
    util.writeLn('if (updateSoundEffectsOnAllSounds) updateSoundEffectsOnAllSounds();');
    util.waitOneTick();
  };
  statementLibrary['sound_changevolumeby'] = function(util) {
    const VOLUME = util.getInput('VOLUME', 'number');
    util.writeLn(`S.volume = Math.max(0, Math.min(1, S.volume + ${VOLUME} / 100));`);
    util.writeLn('if (S.node) S.node.gain.value = S.volume;');
    util.waitOneTick();
  };
  statementLibrary['sound_cleareffects'] = function(util) {
    util.writeLn('S.resetSoundFilters();');
  };
  statementLibrary['sound_play'] = function(util) {
    const SOUND_MENU = util.getInput('SOUND_MENU', 'any');
    if (P.audio.context) {
      util.writeLn(`var sound = S.getSound(${SOUND_MENU});`);
      util.writeLn('if (sound) startSound(sound);');
    }
  };
  statementLibrary['sound_playuntildone'] = function(util) {
    const SOUND_MENU = util.getInput('SOUND_MENU', 'any');
    if (P.audio.context) {
      util.writeLn(`var sound = S.getSound(${SOUND_MENU});`);
      util.writeLn('if (sound) {');
      util.writeLn('  save();');
      util.writeLn('  R.sound = playSound(sound);');
      util.writeLn('  S.activeSounds.add(R.sound);')
      const label = util.addLabel();
      util.writeLn('  if (!R.sound.node.ended && !R.sound.stopped) {');
      util.forceQueue(label);
      util.writeLn('  }');
      util.writeLn('  S.activeSounds.delete(R.sound);');
      util.writeLn('  restore();');
      util.writeLn('}');
    }
  };
  statementLibrary['sound_seteffectto'] = function(util) {
    const EFFECT = util.sanitizedString(util.getField('EFFECT'));
    const VALUE = util.getInput('VALUE', 'number');
    util.writeLn(`S.setSoundFilter(${EFFECT}, ${VALUE});`);
    util.writeLn('if (updateSoundEffectsOnAllSounds) updateSoundEffectsOnAllSounds();');
    util.writeLn('if (!self.removeLimits) {');
    util.waitOneTick();
    util.writeLn('}');
  };
  statementLibrary['sound_setvolumeto'] = function(util) {
    const VOLUME = util.getInput('VOLUME', 'number');
    util.writeLn(`S.volume = Math.max(0, Math.min(1, ${VOLUME} / 100));`);
    util.writeLn('if (S.node) S.node.gain.value = S.volume;');
    util.writeLn('if (!self.removeLimits) {');
    util.waitOneTick();
    util.writeLn('}');
  };
  statementLibrary['sound_stopallsounds'] = function(util) {
    if (P.audio.context) {
      util.writeLn('self.stopAllSounds();');
    }
  };
  statementLibrary['sensing_askandwait'] = function(util) {
    const QUESTION = util.getInput('QUESTION', 'string');

    util.writeLn('R.id = self.nextPromptId++;');
    const label1 = util.addLabel();
    util.writeLn('if (self.promptId < R.id) {');
    util.forceQueue(label1);
    util.writeLn('}');

    util.writeLn(`S.ask(${QUESTION});`);
    const label2 = util.addLabel();
    util.writeLn('if (self.promptId === R.id) {')
    util.forceQueue(label2);
    util.writeLn('}');
    util.writeLn('S.say("");');

    util.visual('always');
  };
  statementLibrary['sensing_resettimer'] = function(util) {
    util.writeLn('runtime.resetTimer();');
  };
  statementLibrary['sensing_setdragmode'] = function(util) {
    const DRAG_MODE = util.getField('DRAG_MODE');
    if (DRAG_MODE === 'draggable') {
      util.writeLn('S.isDraggable = true;');
    } else {
      util.writeLn('S.isDraggable = false;');
    }
  };
  statementLibrary['text2speech_setVoice'] = function(util) {
    const VOICE = util.getInput('VOICE', 'string');
    util.stage.initTextToSpeech();
    util.writeLn(`self.tts.setVoice(${VOICE});`);
  };
  statementLibrary['text2speech_setLanguage'] = function(util) {
    const LANGUAGE = util.getInput('LANGUAGE', 'string');
    util.stage.initTextToSpeech();
    util.writeLn(`self.tts.setLanguage(${LANGUAGE});`);
  };
  statementLibrary['text2speech_speakAndWait'] = function(util) {
    const WORDS = util.getInput('WORDS', 'string');
    util.stage.initTextToSpeech();
    util.waitUntilSettles(`self.tts.speak(${WORDS})`);
  };
  statementLibrary['videoSensing_videoToggle'] = function(util) {
    const VIDEO_STATE = util.getInput('VIDEO_STATE', 'string');
    util.writeLn(`switch (${VIDEO_STATE}) {`);
    util.writeLn('  case "off": self.showVideo(false); break;');
    util.writeLn('  case "on": self.showVideo(true); break;');
    util.writeLn('}');
  };

  // Legacy no-ops
  // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_motion.js#L19
  // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_looks.js#L248
  const noopStatement = (util: P.sb3.compiler.StatementUtil) => util.writeLn('/* noop */');
  statementLibrary['motion_align_scene'] = noopStatement;
  statementLibrary['motion_scroll_right'] = noopStatement;
  statementLibrary['motion_scroll_up'] = noopStatement;
  statementLibrary['looks_changestretchby'] = noopStatement;
  statementLibrary['looks_hideallsprites'] = noopStatement;
  statementLibrary['looks_setstretchto'] = noopStatement;

  /* Inputs */
  inputLibrary['argument_reporter_boolean'] = function(util) {
    const VALUE = util.getField('VALUE');
    if (!util.compiler.state.isProcedure || util.compiler.state.argumentNames.indexOf(VALUE) === -1) {
      const lowerCaseName = VALUE.toLowerCase();
      if (lowerCaseName === 'is compiled?' || lowerCaseName === 'is forkphorus?') {
        return util.booleanInput('true');
      }
      // Missing boolean reporters are 0, not false.
      return util.numberInput('0');
    }
    return util.booleanInput(util.asType(`C.args[${util.sanitizedString(VALUE)}]`, 'boolean'));
  };
  inputLibrary['argument_reporter_string_number'] = function(util) {
    const VALUE = util.getField('VALUE');
    if (!util.compiler.state.isProcedure || util.compiler.state.argumentNames.indexOf(VALUE) === -1) {
      return util.numberInput('0');
    }
    return util.anyInput(`C.args[${util.sanitizedString(VALUE)}]`);
  };
  inputLibrary['control_create_clone_of_menu'] = function(util) {
    return util.fieldInput('CLONE_OPTION');
  };
  inputLibrary['control_get_counter'] = function(util) {
    return util.numberInput('self.counter');
  };
  inputLibrary['data_itemoflist'] = function(util) {
    const LIST = util.getListReference('LIST');
    const INDEX = util.getInput('INDEX', 'any');
    return util.anyInput(`getLineOfList(${LIST}, ${INDEX})`);
  };
  inputLibrary['data_itemnumoflist'] = function(util) {
    const LIST = util.getListReference('LIST');
    const ITEM = util.getInput('ITEM', 'any');
    return util.numberInput(`listIndexOf(${LIST}, ${ITEM})`);
  };
  inputLibrary['data_lengthoflist'] = function(util) {
    const LIST = util.getListReference('LIST');
    return util.numberInput(`${LIST}.length`);
  };
  inputLibrary['data_listcontainsitem'] = function(util) {
    const LIST = util.getListReference('LIST');
    const ITEM = util.getInput('ITEM', 'any');
    return util.booleanInput(`listContains(${LIST}, ${ITEM})`);
  };
  inputLibrary['looks_backdropnumbername'] = function(util) {
    const NUMBER_NAME = util.getField('NUMBER_NAME');
    if (NUMBER_NAME === 'number') {
      return util.numberInput('(self.currentCostumeIndex + 1)');
    } else {
      return util.stringInput('self.costumes[self.currentCostumeIndex].name');
    }
  };
  inputLibrary['looks_backdrops'] = function(util) {
    return util.fieldInput('BACKDROP');
  };
  inputLibrary['looks_costume'] = function(util) {
    return util.fieldInput('COSTUME');
  };
  inputLibrary['looks_costumenumbername'] = function(util) {
    const NUMBER_NAME = util.getField('NUMBER_NAME');
    if (NUMBER_NAME === 'number') {
      return util.numberInput('(S.currentCostumeIndex + 1)');
    } else {
      return util.stringInput('S.costumes[S.currentCostumeIndex].name');
    }
  };
  inputLibrary['looks_size'] = function(util) {
    return util.numberInput('Math.round(S.scale * 100)');
  };
  inputLibrary['makeymakey_menu_KEY'] = function(util) {
    return util.fieldInput('KEY');
  };
  inputLibrary['makeymakey_menu_SEQUENCE'] = function(util) {
    return util.fieldInput('SEQUENCE');
  };
  inputLibrary['matrix'] = function(util) {
    return util.fieldInput('MATRIX');
  };
  inputLibrary['motion_direction'] = function(util) {
    return util.numberInput('S.direction');
  };
  inputLibrary['motion_glideto_menu'] = function(util) {
    return util.fieldInput('TO');
  };
  inputLibrary['motion_goto_menu'] = function(util) {
    return util.fieldInput('TO');
  };
  inputLibrary['motion_pointtowards_menu'] = function(util) {
    return util.fieldInput('TOWARDS');
  };
  inputLibrary['motion_xposition'] = function(util) {
    return util.numberInput('S.scratchX');
  };
  inputLibrary['motion_yposition'] = function(util) {
    return util.numberInput('S.scratchY');
  };
  inputLibrary['music_getTempo'] = function(util) {
    return util.numberInput('self.tempoBPM');
  };
  inputLibrary['music_menu_DRUM'] = function(util) {
    return util.fieldInput('DRUM');
  };
  inputLibrary['music_menu_INSTRUMENT'] = function(util) {
    return util.fieldInput('INSTRUMENT');
  };
  inputLibrary['note'] = function(util) {
    return util.fieldInput('NOTE');
  };
  inputLibrary['operator_add'] = function(util) {
    const NUM1 = util.getInput('NUM1', 'number');
    const NUM2 = util.getInput('NUM2', 'number');
    const input = util.numberInput(`(${NUM1} + ${NUM2})`);
    input.enableFlag(P.sb3.compiler.InputFlags.NaN); // Infinity + (-Infitity)
    return input;
  };
  inputLibrary['operator_and'] = function(util) {
    const OPERAND1 = util.getInput('OPERAND1', 'any');
    const OPERAND2 = util.getInput('OPERAND2', 'any');
    return util.booleanInput(`(${OPERAND1} && ${OPERAND2})`);
  };
  inputLibrary['operator_contains'] = function(util) {
    const STRING1 = util.getInput('STRING1', 'string');
    const STRING2 = util.getInput('STRING2', 'string');
    return util.booleanInput(`stringContains(${STRING1}, ${STRING2})`);
  };
  inputLibrary['operator_divide'] = function(util) {
    const NUM1 = util.getInput('NUM1', 'number');
    const NUM2 = util.getInput('NUM2', 'number');
    const input = util.numberInput(`(${NUM1} / ${NUM2})`);
    input.enableFlag(P.sb3.compiler.InputFlags.NaN); // 0 / 0
    return input;
  };
  inputLibrary['operator_equals'] = function(util) {
    const OPERAND1 = util.getInput('OPERAND1', 'any');
    const OPERAND2 = util.getInput('OPERAND2', 'any');
    // If we know at compile-time that either input cannot be a number, we will use the faster strEqual.
    if (!OPERAND1.potentialNumber || !OPERAND2.potentialNumber) {
      return util.booleanInput(`strEqual(${OPERAND1}, ${OPERAND2})`);
    }
    if (P.config.experimentalOptimizations) {
      // If we know at compile-time that an input is a number, we will use the faster numEqual method.
      // The first argument to numEqual must be a number, the other will be converted if necessary.
      if (OPERAND1.type === 'number') {
        return util.booleanInput(`numEqualExperimental(${OPERAND1}, ${OPERAND2})`);
      }
      if (OPERAND2.type === 'number') {
        return util.booleanInput(`numEqualExperimental(${OPERAND2}, ${OPERAND1})`);
      }
    }
    return util.booleanInput(`equal(${OPERAND1}, ${OPERAND2})`);
  };
  inputLibrary['operator_gt'] = function(util) {
    const OPERAND1 = util.getInput('OPERAND1', 'any');
    const OPERAND2 = util.getInput('OPERAND2', 'any');
    if (P.config.experimentalOptimizations) {
      if (OPERAND1.type === 'number') {
        return util.booleanInput(`numGreaterExperimental(${OPERAND1}, ${OPERAND2})`);
      }
    }
    return util.booleanInput(`(compare(${OPERAND1}, ${OPERAND2}) === 1)`);
  };
  inputLibrary['operator_join'] = function(util) {
    const STRING1 = util.getInput('STRING1', 'string');
    const STRING2 = util.getInput('STRING2', 'string');
    return util.stringInput(`(${STRING1} + ${STRING2})`)
  };
  inputLibrary['operator_length'] = function(util) {
    const STRING = util.getInput('STRING', 'string');
    // TODO: parenthesis important?
    return util.numberInput(`(${STRING}).length`);
  };
  inputLibrary['operator_letter_of'] = function(util) {
    const STRING = util.getInput('STRING', 'string');
    const LETTER = util.getInput('LETTER', 'number');
    return util.stringInput(`((${STRING})[(${LETTER} | 0) - 1] || "")`);
  };
  inputLibrary['operator_lt'] = function(util) {
    const OPERAND1 = util.getInput('OPERAND1', 'any');
    const OPERAND2 = util.getInput('OPERAND2', 'any');
    if (P.config.experimentalOptimizations) {
      if (OPERAND1.type === 'number') {
        return util.booleanInput(`numLessExperimental(${OPERAND1}, ${OPERAND2})`);
      }
    }
    return util.booleanInput(`(compare(${OPERAND1}, ${OPERAND2}) === -1)`);
  };
  inputLibrary['operator_mathop'] = function(util) {
    const OPERATOR = util.getField('OPERATOR');
    const NUM = util.getInput('NUM', 'number');

    switch (OPERATOR) {
      case 'abs':
        return util.numberInput(`Math.abs(${NUM})`);
      case 'floor':
        return util.numberInput(`Math.floor(${NUM})`);
      case 'sqrt': {
        const input = util.numberInput(`Math.sqrt(${NUM})`);
        input.enableFlag(P.sb3.compiler.InputFlags.NaN);
        return input;
      }
      case 'ceiling':
        return util.numberInput(`Math.ceil(${NUM})`);
      case 'cos':
        return util.numberInput(`(Math.round(Math.cos(${NUM} * Math.PI / 180) * 1e10) / 1e10)`);
      case 'sin':
        return util.numberInput(`(Math.round(Math.sin(${NUM} * Math.PI / 180) * 1e10) / 1e10)`);
      case 'tan':
        return util.numberInput(`tan3(${NUM})`);
      case 'asin':
        return util.numberInput(`(Math.asin(${NUM}) * 180 / Math.PI)`);
      case 'acos':
        return util.numberInput(`(Math.acos(${NUM}) * 180 / Math.PI)`);
      case 'atan':
        return util.numberInput(`(Math.atan(${NUM}) * 180 / Math.PI)`);
      case 'ln':
        return util.numberInput(`Math.log(${NUM})`);
      case 'log':
        return util.numberInput(`(Math.log(${NUM}) / Math.LN10)`);
      case 'e ^':
        return util.numberInput(`Math.exp(${NUM})`);
      case '10 ^':
        return util.numberInput(`Math.pow(10, ${NUM})`);
      default:
        return util.numberInput('0');
    }
  };
  inputLibrary['operator_mod'] = function(util) {
    const NUM1 = util.getInput('NUM1', 'number');
    const NUM2 = util.getInput('NUM2', 'number');
    return util.numberInput(`mod(${NUM1}, ${NUM2})`);
  };
  inputLibrary['operator_multiply'] = function(util) {
    const NUM1 = util.getInput('NUM1', 'number');
    const NUM2 = util.getInput('NUM2', 'number');
    const input = util.numberInput(`(${NUM1} * ${NUM2})`);
    input.enableFlag(P.sb3.compiler.InputFlags.NaN); // Infinity * 0
    return input;
  };
  inputLibrary['operator_not'] = function(util) {
    const OPERAND = util.getInput('OPERAND', 'any');
    return util.booleanInput(`!${OPERAND}`);
  };
  inputLibrary['operator_or'] = function(util) {
    const OPERAND1 = util.getInput('OPERAND1', 'any');
    const OPERAND2 = util.getInput('OPERAND2', 'any');
    return util.booleanInput(`(${OPERAND1} || ${OPERAND2})`);
  };
  inputLibrary['operator_random'] = function(util) {
    const FROM = util.getInput('FROM', 'string');
    const TO = util.getInput('TO', 'string');
    return util.numberInput(`random3(${FROM}, ${TO})`);
  };
  inputLibrary['operator_round'] = function(util) {
    const NUM = util.getInput('NUM', 'number');
    return util.numberInput(`Math.round(${NUM})`);
  };
  inputLibrary['operator_subtract'] = function(util) {
    const NUM1 = util.getInput('NUM1', 'number');
    const NUM2 = util.getInput('NUM2', 'number');
    const input = util.numberInput(`(${NUM1} - ${NUM2})`);
    input.enableFlag(P.sb3.compiler.InputFlags.NaN); // Infinity - Infinity
    return input;
  };
  inputLibrary['pen_menu_colorParam'] = function(util) {
    return util.fieldInput('colorParam');
  };
  inputLibrary['sensing_answer'] = function(util) {
    return util.stringInput('self.answer');
  };
  inputLibrary['sensing_coloristouchingcolor'] = function(util) {
    const COLOR = util.getInput('COLOR', 'color');
    const COLOR2 = util.getInput('COLOR2', 'color');
    return util.booleanInput(`S.colorTouchingColor(${COLOR}, ${COLOR2})`);
  };
  inputLibrary['sensing_current'] = function(util) {
    const CURRENTMENU = util.getField('CURRENTMENU').toLowerCase();
    switch (CURRENTMENU) {
      case 'year': return util.numberInput('new Date().getFullYear()');
      case 'month': return util.numberInput('(new Date().getMonth() + 1)');
      case 'date': return util.numberInput('new Date().getDate()');
      case 'dayofweek': return util.numberInput('(new Date().getDay() + 1)');
      case 'hour': return util.numberInput('new Date().getHours()');
      case 'minute': return util.numberInput('new Date().getMinutes()');
      case 'second': return util.numberInput('new Date().getSeconds()');
    }
    return util.numberInput('0');
  };
  inputLibrary['sensing_dayssince2000'] = function(util) {
    return util.numberInput('((Date.now() - epoch) / 86400000)');
  };
  inputLibrary['sensing_distanceto'] = function(util) {
    const DISTANCETOMENU = util.getInput('DISTANCETOMENU', 'any');
    return util.numberInput(`S.distanceTo(${DISTANCETOMENU})`);
  };
  inputLibrary['sensing_distancetomenu'] = function(util) {
    return util.fieldInput('DISTANCETOMENU');
  };
  inputLibrary['sensing_keyoptions'] = function(util) {
    return util.fieldInput('KEY_OPTION');
  };
  inputLibrary['sensing_keypressed'] = function(util) {
    const KEY_OPTION = util.getInput('KEY_OPTION', 'string');
    // in scratch 3, the input can be dynamic so the getKeyCode call cannot be easily removed
    // we also have to use getKeyCode3 because of some changes made in Scratch 3
    return util.booleanInput(`!!self.keys[getKeyCode3(${KEY_OPTION})]`);
  };
  inputLibrary['sensing_loud'] = function(util) {
    util.stage.initMicrophone();
    return util.booleanInput('(self.microphone.getLoudness() > 10)');
  };
  inputLibrary['sensing_loudness'] = function(util) {
    util.stage.initMicrophone();
    return util.numberInput('self.microphone.getLoudness()');
  };
  inputLibrary['sensing_mousedown'] = function(util) {
    return util.booleanInput('self.mousePressed');
  };
  inputLibrary['sensing_mousex'] = function(util) {
    return util.numberInput('self.mouseX');
  };
  inputLibrary['sensing_mousey'] = function(util) {
    return util.numberInput('self.mouseY');
  };
  inputLibrary['sensing_of'] = function(util) {
    const PROPERTY = util.sanitizedString(util.getField('PROPERTY'));
    const OBJECT = util.getInput('OBJECT', 'string');
    return util.anyInput(`attribute(${PROPERTY}, ${OBJECT})`);
  };
  inputLibrary['sensing_of_object_menu'] = function(util) {
    return util.fieldInput('OBJECT');
  };
  inputLibrary['sensing_timer'] = function(util) {
    return util.numberInput('((runtime.now() - runtime.timerStart) / 1000)');
  };
  inputLibrary['sensing_touchingcolor'] = function(util) {
    const COLOR = util.getInput('COLOR', 'color');
    return util.booleanInput(`S.touchingColor(${COLOR})`);
  };
  inputLibrary['sensing_touchingobject'] = function(util) {
    const TOUCHINGOBJECTMENU = util.getInput('TOUCHINGOBJECTMENU', 'string');
    return util.booleanInput(`S.touching(${TOUCHINGOBJECTMENU})`);
  };
  inputLibrary['sensing_touchingobjectmenu'] = function(util) {
    return util.fieldInput('TOUCHINGOBJECTMENU');
  };
  inputLibrary['sound_sounds_menu'] = function(util) {
    return util.fieldInput('SOUND_MENU');
  };
  inputLibrary['sensing_username'] = function(util) {
    return util.stringInput('self.username');
  };
  inputLibrary['sound_volume'] = function(util) {
    return util.numberInput('(S.volume * 100)');
  };
  inputLibrary['text2speech_menu_voices'] = function(util) {
    return util.fieldInput('voices');
  };
  inputLibrary['text2speech_menu_languages'] = function(util) {
    return util.fieldInput('languages');
  };
  inputLibrary['translate_menu_languages'] = function(util) {
    return util.fieldInput('languages');
  };
  inputLibrary['translate_getTranslate'] = function(util) {
    const WORDS = util.getInput('WORDS', 'string');
    const LANGUAGE = util.getInput('LANGUAGE', 'string');
    // The translation extension is stubbed in forkphorus to only return the supplied input.
    // Using Scratch' translation API is very questionable, and most projects don't use the API anyways.
    return WORDS;
  };
  inputLibrary['translate_getViewerLanguage'] = function(util) {
    // TODO: return option or user's actual language?
    return util.sanitizedInput('English');
  };
  inputLibrary['videoSensing_menu_VIDEO_STATE'] = function(util) {
    return util.fieldInput('VIDEO_STATE');
  };

  // Legacy no-ops
  // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_sensing.js#L74
  // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_motion.js#L42-L43
  const noopInput = (util: P.sb3.compiler.InputUtil) => util.anyInput('undefined');
  inputLibrary['motion_yscroll'] = noopInput;
  inputLibrary['motion_xscroll'] = noopInput;
  inputLibrary['sensing_userid'] = noopInput;

  /* Hats */
  hatLibrary['control_start_as_clone'] = {
    handle(util) {
      util.target.listeners.whenCloned.push(util.startingFunction);
    },
  };
  hatLibrary['event_whenbackdropswitchesto'] = {
    handle(util) {
      const BACKDROP = util.getField('BACKDROP').toLowerCase();
      if (!util.target.listeners.whenSceneStarts[BACKDROP]) {
        util.target.listeners.whenSceneStarts[BACKDROP] = [];
      }
      util.target.listeners.whenSceneStarts[BACKDROP].push(util.startingFunction);
    },
  };
  hatLibrary['event_whenbroadcastreceived'] = {
    handle(util) {
      const BROADCAST_OPTION = util.getField('BROADCAST_OPTION').toLowerCase();
      if (!util.target.listeners.whenIReceive[BROADCAST_OPTION]) {
        util.target.listeners.whenIReceive[BROADCAST_OPTION] = [];
      }
      util.target.listeners.whenIReceive[BROADCAST_OPTION].push(util.startingFunction);
    },
  };
  hatLibrary['event_whenflagclicked'] = {
    handle(util) {
      util.target.listeners.whenGreenFlag.push(util.startingFunction);
    },
  };
  hatLibrary['event_whengreaterthan'] = {
    precompile(compiler, hat) {
      const WHENGREATERTHANMENU = compiler.getField(hat, 'WHENGREATERTHANMENU');
      const VALUE = compiler.compileInput(hat, 'VALUE', 'number');

      let executeWhen = 'false';
      let stallUntil = 'false';
      switch (WHENGREATERTHANMENU.toLowerCase()) {
        case 'timer':
          executeWhen = `runtime.whenTimerMSecs / 1000 > ${VALUE}`;
          stallUntil = `runtime.whenTimerMSecs / 1000 <= ${VALUE}`;
          break;
        case 'loudness':
          compiler.target.stage.initMicrophone();
          executeWhen = `self.microphone.getLoudness() > ${VALUE}`;
          stallUntil = `self.microphone.getLoudness() <= ${VALUE}`;
          break;
        default:
          console.warn('unknown WHENGREATERTHANMENU', WHENGREATERTHANMENU);
      }

      let source = '';
      source += 'if (!R.init) { R.init = true; R.stalled = false; }\n';
      source += `if (R.stalled && (${stallUntil})) { R.stalled = false; }\n`;
      source += `else if (!R.stalled && (${executeWhen})) { R.stalled = true;\n`;
      // if/else will be finished in postcompile
      return source;
    },
    postcompile(compiler, source, hat) {
      // finish the if/else started in precompile
      source += '}\n';
      source += `forceQueue(${compiler.target.fns.length});`;
      return source;
    },
    handle(util) {
      util.target.listeners.edgeActivated.push(util.startingFunction);
    },
  };
  hatLibrary['event_whenkeypressed'] = {
    handle(util) {
      const KEY_OPTION = util.getField('KEY_OPTION');
      const key = P.runtime.getKeyCode(KEY_OPTION);
      util.target.addWhenKeyPressedHandler(key, util.startingFunction);
    },
  };
  hatLibrary['event_whenstageclicked'] = {
    handle(util) {
      util.target.listeners.whenClicked.push(util.startingFunction);
    },
  };
  hatLibrary['event_whenthisspriteclicked'] = {
    handle(util) {
      util.target.listeners.whenClicked.push(util.startingFunction);
    },
  };
  function makeymakeyParseKey(key: string): string {
    key = key.toLowerCase();
    if (key === 'up' || key === 'down' || key === 'left' || key === 'right') {
      return P.runtime.getKeyCode(key + ' arrow');
    }
    return P.runtime.getKeyCode(key);
  }
  hatLibrary['makeymakey_whenMakeyKeyPressed'] = {
    handle(util) {
      const KEY = util.getInput('KEY', 'string');
      try {
        const keyValue = '' + util.evaluateInputOnce(KEY);
        if (typeof keyValue !== 'string') throw new Error('cannot accept type: ' + typeof keyValue);
        var keyCode = makeymakeyParseKey(keyValue);
      } catch (e) {
        util.compiler.warn('makeymakey key generation error', e);
        return;
      }
      const key = P.runtime.getKeyCode(keyCode);
      util.target.addWhenKeyPressedHandler(key, util.startingFunction);
    },
  };
  hatLibrary['procedures_definition'] = {
    handle(util) {
      // TODO: HatUtil helpers for this

      const customBlockId = util.block.inputs.custom_block[1];
      const mutation = util.compiler.blocks[customBlockId].mutation;

      const proccode = mutation.proccode;

      if (!util.target.procedures[proccode]) {
        // Warp is either a boolean or a string representation of that boolean for some reason.
        const warp = typeof mutation.warp === 'string' ? mutation.warp === 'true' : mutation.warp;
        // It's a stringified JSON array.
        const argumentNames = JSON.parse(mutation.argumentnames);

        const procedure = new P.sb3.Scratch3Procedure(util.startingFunction, warp, argumentNames);
        util.target.procedures[proccode] = procedure;
      }
    },
    postcompile(compiler, source, hat) {
      return source + 'endCall(); return;\n';
    },
    precompile(compiler, hat) {
      // see `handle()` above for what these do
      const customBlockId = hat.inputs.custom_block[1];
      const mutation = compiler.blocks[customBlockId].mutation;
      const warp = typeof mutation.warp === 'string' ? mutation.warp === 'true' : mutation.warp;
      const argumentNames = JSON.parse(mutation.argumentnames);

      compiler.state.isProcedure = true;
      compiler.state.argumentNames = argumentNames;
      if (warp) {
        compiler.state.isWarp = true;
      }

      return '';
    },
  };

  /* Watchers */
  watcherLibrary['data_variable'] = {
    init(watcher) {
      const name = watcher.params.VARIABLE;
      watcher.target.watchers[name] = watcher;
    },
    set(watcher, value) {
      const name = watcher.params.VARIABLE;
      watcher.target.vars[name] = value;
    },
    evaluate(watcher) {
      const name = watcher.params.VARIABLE;
      return watcher.target.vars[name];
    },
    getLabel(watcher) {
      return watcher.params.VARIABLE;
    },
  };
  watcherLibrary['looks_backdropnumbername'] = {
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
  };
  watcherLibrary['looks_costumenumbername'] = {
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
  };
  watcherLibrary['looks_size'] = {
    evaluate(watcher) { return P.core.isSprite(watcher.target) ? watcher.target.scale * 100 : 100; },
    getLabel() { return 'size'; },
  };
  watcherLibrary['motion_direction'] = {
    evaluate(watcher) { return P.core.isSprite(watcher.target) ? watcher.target.direction : 0; },
    getLabel() { return 'direction'; },
  };
  watcherLibrary['motion_xposition'] = {
    evaluate(watcher) { return watcher.target.scratchX; },
    getLabel() { return 'x position'; },
  };
  watcherLibrary['motion_yposition'] = {
    evaluate(watcher) { return watcher.target.scratchY; },
    getLabel() { return 'y position'; },
  };
  watcherLibrary['music_getTempo'] = {
    evaluate(watcher) { return watcher.stage.tempoBPM; },
    getLabel() { return 'Music: tempo'; },
  };
  watcherLibrary['sensing_answer'] = {
    evaluate(watcher) { return watcher.stage.answer; },
    getLabel() { return 'answer'; },
  };
  watcherLibrary['sensing_current'] = {
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
  };
  watcherLibrary['sensing_loudness'] = {
    init(watcher) {
      watcher.stage.initMicrophone();
    },
    evaluate(watcher) {
      if (watcher.stage.microphone) {
        return watcher.stage.microphone.getLoudness();
      } else {
        return -1;
      }
    },
    getLabel() { return 'loudness'; },
  };
  watcherLibrary['sensing_timer'] = {
    evaluate(watcher) {
      return (watcher.stage.runtime.now() - watcher.stage.runtime.timerStart) / 1000;
    },
    getLabel() { return 'timer'; },
  };
  watcherLibrary['sensing_username'] = {
    evaluate(watcher) { return watcher.stage.username; },
    getLabel() { return 'username'; },
  };
  watcherLibrary['sound_volume'] = {
    evaluate(watcher) { return watcher.target.volume * 100; },
    getLabel() { return 'volume'; },
  };
}());
