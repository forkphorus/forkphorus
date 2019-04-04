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

  export function createContinuation(source: string): P.runtime.Fn {
    // TODO: make understandable
    var result = '(function() {\n';
    var brackets = 0;
    var delBrackets = 0;
    var shouldDelete = false;
    var here = 0;
    var length = source.length;
    while (here < length) {
      var i = source.indexOf('{', here);
      var j = source.indexOf('}', here);
      var k = source.indexOf('return;', here);
      if (k === -1) k = length;
      if (i === -1 && j === -1) {
        if (!shouldDelete) {
          result += source.slice(here, k);
        }
        break;
      }
      if (i === -1) i = length;
      if (j === -1) j = length;
      if (shouldDelete) {
        if (i < j) {
          delBrackets++;
          here = i + 1;
        } else {
          delBrackets--;
          if (!delBrackets) {
            shouldDelete = false;
          }
          here = j + 1;
        }
      } else {
        if (brackets === 0 && k < i && k < j) {
          result += source.slice(here, k);
          break;
        }
        if (i < j) {
          result += source.slice(here, i + 1);
          brackets++;
          here = i + 1;
        } else {
          result += source.slice(here, j);
          here = j + 1;
          if (source.substr(j, 8) === '} else {') {
            if (brackets > 0) {
              result += '} else {';
              here = j + 8;
            } else {
              shouldDelete = true;
              delBrackets = 0;
            }
          } else {
            if (brackets > 0) {
              result += '}';
              brackets--;
            }
          }
        }
      }
    }
    result += '})';
    return P.runtime.scopedEval(result);
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
