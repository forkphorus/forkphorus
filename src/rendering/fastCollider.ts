namespace P.renderer.fastCollider {
  export class FastCollider {
    private imageData: Map<P.core.Costume, ImageData> = new Map();

    getImageData(costume: P.core.Costume): ImageData {
      if (!this.imageData.has(costume)) {
        // if (costume instanceof P.core.BitmapCostume) {
        const ctx = costume.getContext();
        this.imageData.set(costume, ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
        // } else {
        //   throw new Error('Unsupported costume');
        // }
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

      const alpha = imageData.data[4 * (cy * imageData.width + cx) + 3];
      // const alpha = imageData.data[(cy * (imageData.width * 4)) + (cx * 4) + 3];

      if (alpha !== 0){
        // window.e=window.e||[];
        // window.e.push([sprite.name, cx, cy, 4 * (cy * imageData.width + cx) + 3, imageData.data.length, alpha]);
        // if(sprite.name==='Sprite2'){
          // var p = document.createElement('div');
          // p.style.width='1px';
          // p.style.height='1px';
          // p.style.background='red';
          // p.style.position='absolute';
          // p.style.left = (240 + x) + 'px';
          // p.style.top = (180 - y) + 'px';
          // sprite.stage.ui.appendChild(p);
        // }
      }

      return alpha !== 0;
    }

    spritesIntersect(spriteA: P.core.Sprite, otherSprites: P.core.Sprite[]) {
      const rb = spriteA.rotatedBounds();

      const startX = rb.left | 0;
      const endX = rb.right | 0;
      const startY = rb.bottom | 0;
      const endY = rb.top | 0;

      const otherCollidables = otherSprites
        .filter((s) => {
          const ob = s.rotatedBounds();
          if (rb.bottom >= ob.top || ob.bottom >= rb.top || rb.left >= ob.right || ob.left >= rb.right) {
            return false;
          }
          return s.visible;
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
          if (this.spriteTouchesPoint(spriteA, x, y)) {
            for (const s of otherCollidables) {

              var cx = (x - s.sprite.scratchX) / s.sprite.scale;
              cx = Math.floor(cx / s.costume.scale + s.costume.rotationCenterX);
              if (cx < 0) continue;
              if (cx >= s.imageData.width) continue;

              var cy = (s.sprite.scratchY - y) / s.sprite.scale;
              cy = Math.floor(cy / s.costume.scale + s.costume.rotationCenterY);
              if (cy < 0) continue;
              if (cy >= s.imageData.height) continue;

              const alpha = s.imageData.data[4 * (cy * s.imageData.width + cx) + 3];

              if (alpha !== 0) {
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