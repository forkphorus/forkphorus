/// <reference path="phosphorus.ts" />

namespace P.utils {
  // Gets the keycode for a key name
  export function getKeyCode(keyName) {
    switch (keyName.toLowerCase()) {
      case 'space': return 32;
      case 'left arrow': return 37;
      case 'up arrow': return 38;
      case 'right arrow': return 39;
      case 'down arrow': return 40;
      case 'any': return 'any';
    }

    return keyName.toUpperCase().charCodeAt(0);
  };

  // Parses a json-ish
  // TODO: this is terrible, remove it
  export function parseJSONish(json) {
    if (!/^\s*\{/.test(json)) throw new SyntaxError('Bad JSON');
    try {
      return JSON.parse(json);
    } catch (e) {}
    if (/[^,:{}\[\]0-9\.\-+EINaefilnr-uy \n\r\t]/.test(json.replace(/"(\\.|[^"\\])*"/g, ''))) {
      throw new SyntaxError('Bad JSON');
    }
    return eval('(' + json + ')');
  };

  // Returns the string representation of an error.
  // TODO: does this need to be here?
  export function stringifyError(error) {
    if (!error) {
      return 'unknown error';
    }
    if (error.stack) {
      return 'Message: ' + error.message + '\nStack:\n' + error.stack;
    }
    return error.toString();
  }

  export function createContinuation(source) {
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
  };

  // Patches an SVG to make it behave more like Scratch.
  export function patchSVG(svg, element) {
    const FONTS = {
      // TODO: Scratch 3
      '': 'Helvetica',
      Donegal: 'Donegal One',
      Gloria: 'Gloria Hallelujah',
      Marker: 'Permanent Marker',
      Mystery: 'Mystery Quest'
    };

    const LINE_HEIGHTS = {
      // TODO: Scratch 3
      Helvetica: 1.13,
      'Donegal One': 1.25,
      'Gloria Hallelujah': 1.97,
      'Permanent Marker': 1.43,
      'Mystery Quest': 1.37
    };

    if (element.nodeType !== 1) return;
    if (element.nodeName === 'text') {
      // Correct fonts
      var font = element.getAttribute('font-family') || '';
      font = FONTS[font] || font;
      if (font) {
        element.setAttribute('font-family', font);
        if (font === 'Helvetica') element.style.fontWeight = 'bold';
      }
      var size = +element.getAttribute('font-size');
      if (!size) {
        element.setAttribute('font-size', size = 18);
      }
      var bb = element.getBBox();
      var x = 4 - .6 * element.transform.baseVal.consolidate().matrix.a;
      var y = (element.getAttribute('y') - bb.y) * 1.1;
      element.setAttribute('x', x);
      element.setAttribute('y', y);
      var lines = element.textContent.split('\n');
      if (lines.length > 1) {
        element.textContent = lines[0];
        var lineHeight = LINE_HEIGHTS[font] || 1;
        for (var i = 1, l = lines.length; i < l; i++) {
          var tspan = document.createElementNS(null, 'tspan');
          tspan.textContent = lines[i];
          tspan.setAttribute('x', '' + x);
          tspan.setAttribute('y', '' + (y + size * i * lineHeight));
          element.appendChild(tspan);
        }
      }
    } else if ((element.hasAttribute('x') || element.hasAttribute('y')) && element.hasAttribute('transform')) {
      element.setAttribute('x', 0);
      element.setAttribute('y', 0);
    }
    [].forEach.call(element.childNodes, patchSVG.bind(null, svg));
  };

  // Converts an external string to an internally recognized rotation style.
  export function asRotationStyle(style) {
    switch (style) {
      case 'left-right': return 'leftRight';
      case 'don\'t rotate': return 'none';
      case 'all around': return 'normal';
      default: return 'normal';
    }
  };

  // Determines the type of a project with its project.json data
  export function projectType(data) {
    if (data.targets) {
      return 3;
    }
    if (data.objName) {
      return 2;
    }
    throw new Error('unknown project: ' + JSON.stringify(data));
  };

  // Converts RGB to HSL
  export function rgbToHSL(rgb) {
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

    var h;
    switch (max) {
      case r: h = ((g - b) / c + 6) % 6; break;
      case g: h = (b - r) / c + 2; break;
      case b: h = (r - g) / c + 4; break;
    }
    h *= 60;

    return [h, s * 100, l * 100];
  }
}
