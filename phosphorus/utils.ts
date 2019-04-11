/// <reference path="phosphorus.ts" />

namespace P.utils {
  // Gets the keycode for a key name
  export function getKeyCode(keyName: string): number | 'any' {
    switch (keyName.toLowerCase()) {
      case 'space': return 32;
      case 'left arrow': return 37;
      case 'up arrow': return 38;
      case 'right arrow': return 39;
      case 'down arrow': return 40;
      case 'any': return 'any';
    }

    return keyName.toUpperCase().charCodeAt(0);
  }

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
   * Parses a Scratch rotation style string to a RoationStyle enum
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

  // Determines the type of a project with its project.json data
  export function projectType(data: unknown): 2 | 3 | null {
    if (typeof data !== 'object' || data === null) {
      return null;
    }
    if ('targets' in data) {
      return 3;
    }
    if ('objName' in data) {
      return 2;
    }
    return null;
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
}
