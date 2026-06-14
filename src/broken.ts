/// <reference path="phosphorus.ts" />
/// <reference path="core.ts" />

namespace P.broken {
  // These are from:
  // https://github.com/scratchfoundation/scratch-storage/tree/2fbf7301217d71f4ca6226bcd1d94904d09263cf/src/builtins
  const DEFAULT_VECTOR_SVG = '<?xml version="1.0"?>\n<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">\n <g>\n  <rect fill="#CCC" height="128" width="128"/>\n  <text fill="black" y="107" x="35.5" font-size="128">?</text>\n </g>\n</svg>\n';
  const DEFAULT_BITMAP_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAAAAADmVT4XAAADZElEQVR42u3a70vbQBgH8O/7vOibvsmbFUEEWUGGUhQ25nDuhSKIUFDxlYi0SAd94atRmFiHCH2x4W8iiNtwowXRgd1QipJYY3N/1F4kTQ6XLKS9yyHcvWyO8MnT5y53Tw5EcIMESIAESIAESIAESIAEPFVAq/6l8G4oAQCp4aniwbUVJ6BVzafwqKXy1VZMgNb+CHzbyK4ZB+Bi0nnk0VyhsDiSoAmvvnMHmGUVAF6UG+0ffsxRhsRHky/AyCsAUpumX0wAAIs6T4CxDADDtcdZsal6gjmdH8AsAEC6+s8Fa48SFExeAKusAEju+V367AmUCi9ANQ0AU3pwcOw2cMEH0FwAAKz5X228pRLR5AI4TgIAtIDL24oLUE94AB6W7LsH/cONN14Ilh44AOqD9s2LQR1KHiB9zgGgOSGeuA3ocPrME1Q4ANaceyePAzrcjHmAZYs9IBeW4/fzHiAwTCwAgTle9ACZK44ALDT9e6x7gL4aT0BQCHb4AqgA5/1TTOMLoJ7vZSMM0H/GHnCeDnu+CrU8vGYPcN5FADBYD0vCaYPDy+i0p337GSMsS1Z4vA3t9QgAZTt0IuIxFRPSKicAQHlvhk3FXF5GhBByMa8qo/sBO6BarwuYbYrYnFKDYEvE7phKgcxvEQBqnvhgiQCUOgoAO4C3JOS3L/hv23UXxVldBECfcueAqpAa0WGy/QeULREAY6aTXRFDgBuA13+ElOncAERMAGaA9hBQD4gQQHsIRE1AZoD2xrgQS5nOZyHgFKmWDSIG4GRAVidiAE4GRB6AzAB2AKIPQFaA5myHA5AV4ESNugZhC7BLR50lIBPAebrzBGQCKAFQNSIMcDvRTQIwAHxNApM3RBygGK0uyhxwOwGsPAgEnPWj5ycRCNiJtBHlAChGKQVwANzPY+CXSMDNWISiLA9AfRA5IhJQ68UnoQAt+AtOPIBKhJosF8B6UM0yLkAxQk2WCyDX9SiUh1gkQAIkoCuAvjGuquMbuijAtwG7MPL8yBICOHSPk3W8Ne8KcEUdmBi6FADYos+QleIH0N/ogOxd7AD6uAS6WRU8WcBdlgZMG/EnYUlwEpLLoQ4PjzGbiA5UsRMRsbQ+5ziDJmYqJuR6NaMomdXuFuZyPSABEiABEiABEiABEiAc8Bd6VyvCEKGqcQAAAABJRU5ErkJggg==';

  let _cachedBitmap: Promise<HTMLImageElement> | null = null;
  let _cachedVector: Promise<HTMLImageElement> | null = null;
  let _cachedSound: AudioBuffer | null = null;

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load fallback image'));
      img.onload = () => resolve(img);
      img.src = src;
    });
  }

  function loadDefaultBitmap(): Promise<HTMLImageElement> {
    if (!_cachedBitmap) {
      _cachedBitmap = loadImage(DEFAULT_BITMAP_URL);
    }
    return _cachedBitmap;
  }

  function loadDefaultVector(): Promise<HTMLImageElement> {
    if (!_cachedVector) {
      _cachedVector = loadImage(`data:image/svg+xml,${encodeURIComponent(DEFAULT_VECTOR_SVG)}`);
    }
    return _cachedVector;
  }

  function loadDefaultSound(): AudioBuffer {
    if (!P.audio.context) {
      throw new Error('No audio context');
    }
    if (!_cachedSound) {
      _cachedSound = P.audio.context.createBuffer(1, 1, 44000);
    }
    return _cachedSound;
  }

  export async function createDefaultBitmap(name: string): Promise<P.core.BitmapCostume> {
    const image = await loadDefaultBitmap();
    return new P.core.BitmapCostume(image, {
      name,
      bitmapResolution: 1,
      rotationCenterX: 64,
      rotationCenterY: 64,
    });
  }

  export async function createDefaultVector(name: string): Promise<P.core.VectorCostume> {
    const svg = await loadDefaultVector();
    return new P.core.VectorCostume(svg, {
      name,
      bitmapResolution: 1,
      rotationCenterX: 64,
      rotationCenterY: 64,
    });
  }

  export function createDefaultSound(name: string): P.core.Sound {
    return new P.core.Sound({
      name,
      buffer: loadDefaultSound(),
    });
  }
}
