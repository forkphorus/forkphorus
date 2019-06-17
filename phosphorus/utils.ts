/// <reference path="phosphorus.ts" />

namespace P.utils {
  // Returns the string representation of an error.
  // TODO: does this need to be here?
  export function stringifyError(error: any): string {
    if (!error) {
      return 'unknown error';
    }
    if (error.stack) {
      return 'Message: ' + error.message + '\nStack:\n' + error.stack;
    }
    return error.toString();
  }

  import RotationStyle = P.core.RotationStyle;
  /**
   * Parses a Scratch rotation style string to a RotationStyle enum
   */
  export function parseRotationStyle(style: string): RotationStyle {
    switch (style) {
      case 'leftRight':
      case 'left-right':
        return RotationStyle.LeftRight;
      case 'none':
      case 'don\'t rotate':
        return RotationStyle.None;
      case 'normal':
      case 'all around':
        return RotationStyle.Normal;
    }
    console.warn('unknown rotation style', style);
    return RotationStyle.Normal;
  }

  /**
   * Converts an RGB color to an HSL color
   * @param rgb RGB Color
   */
  export function rgbToHSL(rgb: number): [number, number, number] {
    var r = (rgb >> 16 & 0xff) / 0xff;
    var g = (rgb >> 8 & 0xff) / 0xff;
    var b = (rgb & 0xff) / 0xff;

    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);

    if (min === max) {
      return [0, 0, r * 100];
    }

    var c = max - min;
    var l = (min + max) / 2;
    var s = c / (1 - Math.abs(2 * l - 1));

    var h: number;
    switch (max) {
      case r: h = ((g - b) / c + 6) % 6; break;
      case g: h = (b - r) / c + 2; break;
      case b: h = (r - g) / c + 4; break;
    }
    h! *= 60;

    return [h!, s * 100, l * 100];
  }

  /**
   * Clamps a number within a range
   * @param number The number
   * @param min Minimum, inclusive
   * @param max Maximum, inclusive
   */
  export function clamp(number: number, min: number, max: number) {
    return Math.min(max, Math.max(min, number));
  }

  /*
   * Creates a promise that resolves when the original promise resolves or fails.
   */
  export function settled(promise: Promise<any>): Promise<void> {
    return new Promise((resolve, _reject) => {
      promise
        .then(() => resolve())
        .catch(() => resolve());
    });
  }
}
