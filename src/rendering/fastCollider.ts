namespace P.renderer.fastCollider {
  class FastImageData implements ImageData {
    public readonly width: number;
    public readonly height: number;
    public readonly data: Uint8ClampedArray;

    constructor(imageData: ImageData) {
      this.width = imageData.width;
      this.height = imageData.height;
      this.data = imageData.data;
    }
  }

  export class FastCollider {
    private imageData: Map<P.core.Costume, ImageData> = new Map();

    getImageData(costume: P.core.Costume): ImageData {
      if (!this.imageData.has(costume)) {
        const ctx = costume.getContext();
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.imageData.set(costume, new FastImageData(imageData));
      }
      return this.imageData.get(costume)!;
    }

    spriteTouchesPoint(sprite: P.core.Sprite, x: number, y: number): boolean {
      const costume = sprite.costumes[sprite.currentCostumeIndex];
      const imageData = this.getImageData(costume);

      var cx = (x - sprite.scratchX) / sprite.scale;
      cx = Math.floor(cx / costume.scale + costume.rotationCenterX);
      if (cx < 0) return false;
      if (cx >= imageData.width) return false;

      var cy = (sprite.scratchY - y) / sprite.scale;
      cy = Math.floor(cy / costume.scale + costume.rotationCenterY);
      if (cy < 0) return false;
      if (cy >= imageData.height) return false;

      return imageData.data[4 * (cy * imageData.width + cx) + 3] !== 0;
    }

    spritesIntersect(spriteA: P.core.Sprite, otherSprites: P.core.Sprite[]) {
      const rb = spriteA.rotatedBounds();

      const startX = rb.left | 0;
      const endX = rb.right | 0;
      const startY = rb.bottom | 0;
      const endY = rb.top | 0;

      const primarySprite = {
        sprite: spriteA,
        imageData: this.getImageData(spriteA.costumes[spriteA.currentCostumeIndex]),
        costume: spriteA.costumes[spriteA.currentCostumeIndex],
      };

      const otherCollidables = otherSprites
        .filter((s) => {
          if (!s.visible) return false;
          const ob = s.rotatedBounds();
          if (rb.bottom >= ob.top || ob.bottom >= rb.top || rb.left >= ob.right || ob.left >= rb.right) {
            return false;
          }
          return true;
        })
        .map((s) => {
          return {
            sprite: s,
            imageData: this.getImageData(s.costumes[s.currentCostumeIndex]),
            costume: s.costumes[s.currentCostumeIndex],
          };
        })

      for (var x = startX; x < endX; x++) {
        for (var y = startY; y < endY; y++) {
          var cx = (x - spriteA.scratchX) / spriteA.scale;
          cx = Math.floor(cx / primarySprite.costume.scale + primarySprite.costume.rotationCenterX);
          if (cx < 0) continue;
          if (cx >= primarySprite.imageData.width) continue;

          var cy = (spriteA.scratchY - y) / spriteA.scale;
          cy = Math.floor(cy / primarySprite.costume.scale + primarySprite.costume.rotationCenterY);
          if (cy < 0) continue;
          if (cy >= primarySprite.imageData.height) continue;

          if (primarySprite.imageData.data[4 * (cy * primarySprite.imageData.width + cx) + 3] !== 0) {
            for (const s of otherCollidables) {

              var cx = (x - s.sprite.scratchX) / s.sprite.scale;
              cx = Math.floor(cx / s.costume.scale + s.costume.rotationCenterX);
              if (cx < 0) continue;
              if (cx >= s.imageData.width) continue;

              var cy = (s.sprite.scratchY - y) / s.sprite.scale;
              cy = Math.floor(cy / s.costume.scale + s.costume.rotationCenterY);
              if (cy < 0) continue;
              if (cy >= s.imageData.height) continue;

              if (s.imageData.data[4 * (cy * s.imageData.width + cx) + 3] !== 0) {
                return true;
              }
            }
          }
        }
      }

      return false;
    }
  }
}