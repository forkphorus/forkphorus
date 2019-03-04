/// <reference path="phosphorus.ts" />

namespace P.renderer {
  // Import aliases
  import RotationStyle = P.core.RotationStyle;

  export class CanvasRenderer {
    public ctx: CanvasRenderingContext2D;
    public canvas: HTMLCanvasElement;
    public noEffects: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot get 2d rendering context');
      }
      this.ctx = ctx;
      this.canvas = canvas;
    }

    reset(scale: number) {
      // resizes and clears the canvas
      const effectiveScale = scale * P.config.scale;
      this.canvas.width = 480 * effectiveScale;
      this.canvas.height = 360 * effectiveScale;
      this.ctx.scale(effectiveScale, effectiveScale);
    }

    drawImage(image: CanvasImageSource, x: number, y: number) {
      this.ctx.drawImage(image, x, y);
    }

    drawChild(c: P.core.Base) {
      const costume = c.costumes[c.currentCostumeIndex];
      if (!costume) {
        return;
      }

      this.ctx.save();

      const scale = c.stage.zoom * P.config.scale;
      if (P.core.isSprite(c)) {
        this.ctx.translate(((c.scratchX + 240) * scale | 0) / scale, ((180 - c.scratchY) * scale | 0) / scale);
        if (c.rotationStyle === RotationStyle.Normal) {
          this.ctx.rotate((c.direction - 90) * Math.PI / 180);
        } else if (c.rotationStyle === RotationStyle.LeftRight && c.direction < 0) {
          this.ctx.scale(-1, 1);
        }
        this.ctx.scale(c.scale, c.scale);
      }
      this.ctx.scale(costume.scale, costume.scale);
      if (c.isSprite) {
        this.ctx.translate(-costume.rotationCenterX, -costume.rotationCenterY);
      }

      if (!this.noEffects) {
        this.ctx.globalAlpha = Math.max(0, Math.min(1, 1 - c.filters.ghost / 100));

        let filter = '';
        if (c.filters.brightness) {
          filter += 'brightness(' + (100 + c.filters.brightness) + '%) ';
        }
        if (c.filters.color) {
          filter += 'hue-rotate(' + (c.filters.color / 200 * 360) + 'deg) ';
        }
        // Only apply a filter if necessary to fix Firefox performance issue
        if (filter !== '') {
          this.ctx.filter = filter;
        }
      }

      this.ctx.drawImage(costume.image, 0, 0);
      this.ctx.restore();
    }
  }
}
