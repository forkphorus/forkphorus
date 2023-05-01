/// <reference path="../phosphorus.ts" />
/// <reference path="renderer.ts" />

namespace P.renderer.canvas2d {
  import RotationStyle = P.core.RotationStyle;

  function getCSSFilter(filters: P.core.Filters) {
    let filter = '';
    if (filters.brightness) {
      filter += 'brightness(' + (100 + filters.brightness) + '%) ';
    }
    if (filters.color) {
      if (filters.color === Infinity) {
        filter += 'grayscale(100%) ';
      } else {
        filter += 'hue-rotate(' + (filters.color / 200 * 360) + 'deg) ';
      }
    }
    // ghost could be supported through opacity(), however that effect is applied with the opacity property because more browsers support it
    return filter;
  }

  function create2dCanvas(): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2d rendering context in create2dCanvas');
    }
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  // These are the only bits we care about when comparing colors, everything else is ignored.
  // Note that the inconsistent pattern is intentional.
  // Based on: https://github.com/LLK/scratch-render/blob/d73aeb1ac13d8b263abdfb189a6d2ee305688fa2/src/RenderWebGL.js#L61-L75
  const COLOR_MASK = 0b111110001111100011110000;
  //                   RRRRRRRRGGGGGGGGBBBBBBBB

  export class SpriteRenderer2D {
    public ctx: CanvasRenderingContext2D;
    public canvas: HTMLCanvasElement;

    public noEffects: boolean = false
    public imageSmoothingEnabled: boolean = false;

    constructor() {
      const { canvas, ctx } = create2dCanvas();
      this.canvas = canvas;
      this.ctx = ctx;
    }

    reset(scale: number) {
      this._reset(this.ctx, scale);
    }

    drawChild(c: P.core.Base) {
      this._drawChild(c, this.ctx);
    }

    drawObjects(children: P.core.Base[]) {
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (!child.visible) {
          continue;
        }
        this.drawChild(child);
      }
    }

    protected _reset(ctx: CanvasRenderingContext2D, scale: number) {
      const effectiveScale = scale * P.config.scale;
      const width = Math.max(1, 480 * effectiveScale);
      const height = Math.max(1, 360 * effectiveScale);
      // This is not optimal, but necessary to avoid issues caused by some browsers resetting canvas data
      // and transforms without informing us.
      ctx.canvas.width = width;
      ctx.canvas.height = height;
      ctx.scale(effectiveScale, effectiveScale);
    }

    protected _drawChild(c: P.core.Base, ctx: CanvasRenderingContext2D) {
      const costume = c.costumes[c.currentCostumeIndex];
      if (!costume) {
        return;
      }

      ctx.save();

      const globalScale = c.stage.zoom * P.config.scale;
      ctx.translate(((c.scratchX + 240) * globalScale | 0) / globalScale, ((180 - c.scratchY) * globalScale | 0) / globalScale);

      let objectScale = costume.scale;
      if (P.core.isSprite(c)) {
        if (c.rotationStyle === RotationStyle.Normal) {
          ctx.rotate((c.direction - 90) * Math.PI / 180);
        } else if (c.rotationStyle === RotationStyle.LeftRight && c.direction < 0) {
          ctx.scale(-1, 1);
        }
        objectScale *= c.scale;
      }

      if (costume.isScalable) {
        costume.requestSize(objectScale * globalScale);
      }
      ctx.imageSmoothingEnabled = costume.isScalable || this.imageSmoothingEnabled;

      const image = costume.getImage();
      const x = -costume.rotationCenterX * objectScale | 0;
      const y = -costume.rotationCenterY * objectScale | 0;
      const w = costume.width * objectScale | 0;
      const h = costume.height * objectScale | 0;
      if (w < 1 || h < 1) {
        ctx.restore();
        return;
      }

      if (!this.noEffects) {
        ctx.globalAlpha = Math.max(0, Math.min(1, 1 - c.filters.ghost / 100));

        if (c.filters.brightness !== 0 && c.filters.color === 0) {
          const ws = w * globalScale;
          const hs = h * globalScale;

          workingRenderer.canvas.width = ws;
          workingRenderer.canvas.height = hs;
          workingRenderer.ctx.save();
          workingRenderer.ctx.imageSmoothingEnabled = false;

          workingRenderer.ctx.translate(0, 0);
          workingRenderer.ctx.drawImage(image, 0, 0, ws, hs);
          workingRenderer.ctx.globalCompositeOperation = 'source-atop';
          workingRenderer.ctx.globalAlpha = Math.abs(c.filters.brightness / 100);
          if (c.filters.brightness > 0) {
            workingRenderer.ctx.fillStyle = 'white';
          } else {
            workingRenderer.ctx.fillStyle = 'black';
          }
          workingRenderer.ctx.fillRect(0, 0, ws, hs);
          ctx.drawImage(workingRenderer.canvas, x, y, w, h);

          workingRenderer.ctx.restore();
        } else {
          const filter = getCSSFilter(c.filters);
          if (filter !== '') {
            ctx.filter = filter;
          }
          ctx.drawImage(image, x, y, w, h);
        }
      } else {
        ctx.drawImage(image, x, y, w, h);
      }

      ctx.restore();
    }
  }

  // Renderers used for some features such as collision detection
  const workingRenderer = new SpriteRenderer2D();
  const workingRenderer2 = new SpriteRenderer2D();

  export class ProjectRenderer2D extends SpriteRenderer2D implements ProjectRenderer {
    public stageLayer: HTMLCanvasElement;
    public stageContext: CanvasRenderingContext2D;
    public penLayer: HTMLCanvasElement;
    public penContext: CanvasRenderingContext2D;
    public zoom: number = 1;

    public penScalingEnabled: boolean = true;

    private penModified: boolean = false;
    private penTargetZoom: number = -1;
    private penZoom: number = 1;

    private stageCostumeIndex: number = -1;

    constructor(public stage: P.core.Stage) {
      super();
      const { ctx: stageContext, canvas: stageLayer } = create2dCanvas();
      this.stageContext = stageContext;
      this.stageLayer = stageLayer;

      const { ctx: penContext, canvas: penLayer } = create2dCanvas();
      this.penContext = penContext;
      this.penLayer = penLayer;
    }

    onStageFiltersChanged() {
      this.renderStageCostume(this.zoom);
    }

    renderStageCostume(scale: number) {
      this._reset(this.stageContext, scale);
      this._drawChild(this.stage, this.stageContext);
    }

    init(root: HTMLCanvasElement) {
      root.appendChild(this.stageLayer);
      root.appendChild(this.penLayer);
      root.appendChild(this.canvas);
    }

    destroy() {
      // Do nothing
    }

    drawFrame() {
      this.reset(this.zoom);
      this.drawObjects(this.stage.children);
      if (this.stage.currentCostumeIndex !== this.stageCostumeIndex) {
        this.stageCostumeIndex = this.stage.currentCostumeIndex;
        this.renderStageCostume(this.zoom);
      }
    }

    /**
     * Draw everything from this renderer onto another 2d renderer, skipping a single item.
     * "Everything" includes stage, pen, and all visible children.
     */
    drawAllExcept(renderer: SpriteRenderer2D, skip: P.core.Base) {
      renderer.drawChild(this.stage);
      renderer.ctx.drawImage(this.penLayer, 0, 0, 480, 360);
      for (var i = 0; i < this.stage.children.length; i++) {
        var child = this.stage.children[i];
        if (!child.visible || child === skip) {
          continue;
        }
        renderer.drawChild(child);
      }
    }

    resize(zoom: number) {
      this.zoom = zoom;
      this.resizePen(zoom);
      this.renderStageCostume(this.zoom);
    }

    resizePen(zoom: number) {
      if (!this.penScalingEnabled) {
        return;
      }
      if (zoom > this.penZoom) {
        this.penZoom = zoom;
        workingRenderer.canvas.width = this.penLayer.width;
        workingRenderer.canvas.height = this.penLayer.height;
        workingRenderer.ctx.drawImage(this.penLayer, 0, 0);
        this._reset(this.penContext, zoom);
        this.penContext.drawImage(workingRenderer.canvas, 0, 0, 480, 360);
      } else if (!this.penModified) {
        // Immediately scale down if no changes have been made
        this.penZoom = zoom;
        this._reset(this.penContext, zoom);
      } else {
        // We'll resize on the next clear, as resizing now would result in a loss of detail.
        this.penTargetZoom = zoom;
      }
    }

    penClear() {
      this.penModified = false;
      if (this.penTargetZoom !== -1) {
        this._reset(this.penContext, this.penTargetZoom);
        this.penZoom = this.penTargetZoom;
        this.penTargetZoom = -1;
      }
      this.penContext.clearRect(0, 0, 480, 360);
    }

    penDot(color: P.core.PenColor, size: number, x: number, y: number) {
      this.penModified = true;
      this.penContext.fillStyle = color.toCSS();
      this.penContext.beginPath();
      this.penContext.arc(240 + x, 180 - y, size / 2, 0, 2 * Math.PI, false);
      this.penContext.fill();
    }

    penLine(color: P.core.PenColor, size: number, x1: number, y1: number, x2: number, y2: number) {
      if (x1 === x2 && y1 === y2) {
        // Fixes 0-length lines in GNOME Web
        this.penDot(color, size, x1, y1);
        return;
      }

      this.penModified = true;
      this.penContext.lineCap = 'round';
      if (this.penZoom === 1) {
        if (size % 2 > .5 && size % 2 < 1.5) {
          x1 -= .5;
          y1 -= .5;
          x2 -= .5;
          y2 -= .5;
        }
      }
      this.penContext.strokeStyle = color.toCSS();
      this.penContext.lineWidth = size;
      this.penContext.beginPath();
      this.penContext.moveTo(240 + x1, 180 - y1);
      this.penContext.lineTo(240 + x2, 180 - y2);
      this.penContext.stroke();
    }

    penStamp(sprite: P.core.Sprite) {
      this.penModified = true;
      this._drawChild(sprite, this.penContext);
    }

    spriteTouchesPoint(sprite: P.core.Sprite, x: number, y: number) {
      const bounds = sprite.rotatedBounds();
      if (x < bounds.left || y < bounds.bottom || x > bounds.right || y > bounds.top || sprite.scale === 0) {
        return false;
      }

      const costume = sprite.costumes[sprite.currentCostumeIndex];
      var cx = (x - sprite.scratchX) / sprite.scale;
      var cy = (sprite.scratchY - y) / sprite.scale;
      if (sprite.rotationStyle === RotationStyle.Normal && sprite.direction !== 90) {
        const d = (90 - sprite.direction) * Math.PI / 180;
        const ox = cx;
        const s = Math.sin(d), c = Math.cos(d);
        cx = c * ox - s * cy;
        cy = s * ox + c * cy;
      } else if (sprite.rotationStyle === RotationStyle.LeftRight && sprite.direction < 0) {
        cx = -cx;
      }

      let positionX = Math.round(cx / costume.scale + costume.rotationCenterX);
      let positionY = Math.round(cy / costume.scale + costume.rotationCenterY);
      // Temporary hack: https://github.com/forkphorus/forkphorus/issues/187
      if (costume instanceof P.core.VectorCostume) {
        positionX *= costume.currentScale;
        positionY *= costume.currentScale;
      }
      if (!Number.isFinite(positionX) || !Number.isFinite(positionY)) {
        return false;
      }
      const data = costume.getContext().getImageData(positionX, positionY, 1, 1).data;
      return data[3] !== 0;
    }

    spritesIntersect(spriteA: core.Base, otherSprites: core.Base[]) {
      const mb = spriteA.rotatedBounds();

      for (var i = 0; i < otherSprites.length; i++) {
        const spriteB = otherSprites[i];
        // Invisible sprites are ignored.
        // Sprites cannot intersect with themselves.
        if (!spriteB.visible || spriteA === spriteB) {
          continue;
        }

        const ob = spriteB.rotatedBounds();

        if (mb.bottom >= ob.top || ob.bottom >= mb.top || mb.left >= ob.right || ob.left >= mb.right) {
          continue;
        }

        const left = Math.max(mb.left, ob.left);
        const top = Math.min(mb.top, ob.top);
        const right = Math.min(mb.right, ob.right);
        const bottom = Math.max(mb.bottom, ob.bottom);

        const width = right - left;
        const height = top - bottom;

        // dimensions that are less than 1 or are NaN will throw when we try to get image data
        if (width < 1 || height < 1 || width !== width || height !== height) {
          continue;
        }

        workingRenderer.canvas.width = width;
        workingRenderer.canvas.height = height;

        workingRenderer.ctx.save();
        workingRenderer.noEffects = true;

        workingRenderer.ctx.translate(-(left + 240), -(180 - top));
        workingRenderer.drawChild(spriteA);
        workingRenderer.ctx.globalCompositeOperation = 'source-in';
        workingRenderer.drawChild(spriteB);

        workingRenderer.noEffects = false;
        workingRenderer.ctx.restore();

        const data = workingRenderer.ctx.getImageData(0, 0, width, height).data;
        const length = data.length;

        for (var j = 0; j < length; j += 4) {
          // check for the opacity byte being a non-zero number
          if (data[j + 3]) {
            return true;
          }
        }
      }
      return false;
    }

    spriteTouchesColor(sprite: P.core.Base, color: number) {
      const b = sprite.rotatedBounds();

      const width = b.right - b.left;
      const height = b.top - b.bottom;
      if (width < 1 || height < 1 || width !== width || height !== height) {
        return false;
      }

      workingRenderer.canvas.width = width;
      workingRenderer.canvas.height = height;

      workingRenderer.ctx.fillStyle = 'white';
      workingRenderer.ctx.fillRect(0, 0, width, height);

      workingRenderer.ctx.save();
      workingRenderer.ctx.translate(-(240 + b.left), -(180 - b.top));

      this.drawAllExcept(workingRenderer, sprite);
      workingRenderer.ctx.globalCompositeOperation = 'destination-in';
      workingRenderer.noEffects = true;
      workingRenderer.drawChild(sprite);
      workingRenderer.noEffects = false;
      workingRenderer.ctx.restore();

      const data = workingRenderer.ctx.getImageData(0, 0, width, height).data;
      color = color & COLOR_MASK;
      const length = data.length;
      for (var i = 0; i < length; i += 4) {
        if (((data[i] << 16 | data[i + 1] << 8 | data[i + 2]) & COLOR_MASK) === color && data[i + 3]) {
          return true;
        }
      }

      return false;
    }

    spriteColorTouchesColor(sprite: P.core.Base, spriteColor: number, otherColor: number) {
      var rb = sprite.rotatedBounds();

      const width = rb.right - rb.left;
      const height = rb.top - rb.bottom;
      if (width < 1 || height < 1 || width !== width || height !== height) {
        return false;
      }

      workingRenderer.canvas.width = workingRenderer2.canvas.width = width;
      workingRenderer.canvas.height = workingRenderer2.canvas.height = height;

      workingRenderer.ctx.save();
      workingRenderer2.ctx.save();
      workingRenderer.ctx.translate(-(240 + rb.left), -(180 - rb.top));
      workingRenderer2.ctx.translate(-(240 + rb.left), -(180 - rb.top));

      this.drawAllExcept(workingRenderer, sprite);
      workingRenderer2.noEffects = true;
      workingRenderer2.drawChild(sprite);
      workingRenderer2.noEffects = false;

      workingRenderer.ctx.restore();
      workingRenderer2.ctx.restore();

      var dataA = workingRenderer.ctx.getImageData(0, 0, width, height).data;
      var dataB = workingRenderer2.ctx.getImageData(0, 0, width, height).data;

      spriteColor = spriteColor & COLOR_MASK;
      otherColor = otherColor & COLOR_MASK;

      var length = dataA.length;
      for (var i = 0; i < length; i += 4) {
        var touchesSource = ((dataB[i] << 16 | dataB[i + 1] << 8 | dataB[i + 2]) & COLOR_MASK) === spriteColor && dataB[i + 3];
        var touchesOther = ((dataA[i] << 16 | dataA[i + 1] << 8 | dataA[i + 2]) & COLOR_MASK) === otherColor && dataA[i + 3];
        if (touchesSource && touchesOther) {
          return true;
        }
      }

      return false;
    }
  }
}