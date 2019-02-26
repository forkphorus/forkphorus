namespace P.renderer {
  export class CanvasRenderer {
    public ctx: CanvasRenderingContext2D;
    public canvas: HTMLCanvasElement;
    public noEffects: boolean = false;

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

    drawChild(c) {
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

        if (!this.noEffects) {
          this.ctx.globalAlpha = Math.max(0, Math.min(1, 1 - c.filters.ghost / 100));

          let filter = '';
          if (c.filters.brightness) {
            filter += 'brightness(' + (100 + c.filters.brightness) + '%) ';
          }
          if (c.filters.color) {
            filter += 'hue-rotate(' + (c.filters.color / 200 * 360) + 'deg) ';
          }
          this.ctx.filter = filter;
        }

        this.ctx.drawImage(costume.image, 0, 0);
        this.ctx.restore();
      }
    }
  }
}
