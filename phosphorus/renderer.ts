/// <reference path="phosphorus.ts" />

namespace P.renderer {
  // Import aliases
  import RotationStyle = P.core.RotationStyle;

  /**
   * Creates the CSS filter for a Filter object.
   * The filter is generally an estimation of the actual effect.
   * Includes brightness and color. (does not include ghost)
   */
  function cssFilter(filters: P.core.Filters) {
    let filter = '';
    if (filters.brightness) {
      filter += 'brightness(' + (100 + filters.brightness) + '%) ';
    }
    if (filters.color) {
      filter += 'hue-rotate(' + (filters.color / 200 * 360) + 'deg) ';
    }
    return filter;
  }

  export interface Renderer {
    reset(scale: number): void;
    drawChild(child: P.core.Base): void;
    drawImage(image: HTMLImageElement | HTMLCanvasElement, x: number, y: number): void;
  }

  export abstract class Base2DRenderer implements Renderer {
    public ctx: CanvasRenderingContext2D;
    public canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
      const ctx = canvas.getContext('2d')!;
      this.ctx = ctx;
      this.canvas = canvas;
    }

    /**
     * Resizes and clears the renderer
     */
    reset(scale: number) {
      const effectiveScale = scale * P.config.scale;
      this.canvas.width = 480 * effectiveScale;
      this.canvas.height = 360 * effectiveScale;
      this.ctx.scale(effectiveScale, effectiveScale);
    }

    drawImage(image: CanvasImageSource, x: number, y: number) {
      this.ctx.drawImage(image, x, y);
    }

    abstract drawChild(child: P.core.Base): void;
  }

  /**
   * A renderer for drawing sprites (or stages)
   */
  export class SpriteRenderer2D extends Base2DRenderer {
    public noEffects: boolean = false;

    drawChild(c: P.core.Base) {
      const costume = c.costumes[c.currentCostumeIndex];
      if (!costume) {
        return;
      }

      this.ctx.save();

      const scale = c.stage.zoom * P.config.scale;
      this.ctx.translate(((c.scratchX + 240) * scale | 0) / scale, ((180 - c.scratchY) * scale | 0) / scale);

      // Direction transforms are only applied to Sprites because Stages cannot be rotated.
      if (P.core.isSprite(c)) {
        if (c.rotationStyle === RotationStyle.Normal) {
          this.ctx.rotate((c.direction - 90) * Math.PI / 180);
        } else if (c.rotationStyle === RotationStyle.LeftRight && c.direction < 0) {
          this.ctx.scale(-1, 1);
        }
        this.ctx.scale(c.scale, c.scale);
      }

      this.ctx.scale(costume.scale, costume.scale);
      this.ctx.translate(-costume.rotationCenterX, -costume.rotationCenterY);

      if (!this.noEffects) {
        this.ctx.globalAlpha = Math.max(0, Math.min(1, 1 - c.filters.ghost / 100));

        const filter = cssFilter(c.filters);
        // Only apply a filter if necessary, otherwise Firefox performance nosedives.
        if (filter !== '') {
          this.ctx.filter = filter;
        }
      }

      this.ctx.drawImage(costume.image, 0, 0);
      this.ctx.restore();
    }
  }

  /**
   * A renderer specifically for the backdrop of a Stage.
   */
  export class StageRenderer extends SpriteRenderer2D {
    constructor(canvas: HTMLCanvasElement, private stage: P.core.Stage) {
      super(canvas);
      // We handle effects in other ways, so forcibly disable SpriteRenderer's filters
      this.noEffects = true;
    }

    drawStage() {
      this.drawChild(this.stage);
      this.updateFilters();
    }

    updateFilters() {
      const filter = cssFilter(this.stage.filters);
      // Only reapply a CSS filter if it has changed for performance.
      // Might not be necessary here.
      if (this.canvas.style.filter !== filter) {
        this.canvas.style.filter = filter;
      }

      // cssFilter does not include ghost
      this.canvas.style.opacity = '' + Math.max(0, Math.min(1, 1 - this.stage.filters.ghost / 100));
    }
  }
}
