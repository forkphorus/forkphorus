/// <reference path="phosphorus.ts" />

namespace P.utils {
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
   * @param r Red in the range 0-255
   * @param g Green in the range 0-255
   * @param b Blue in the range 0-255
   * @returns HSL, hue in 0-360, saturation and lightness in 0-1
   */
  export function rgbToHSL(r: number, g: number, b: number): [number, number, number] {
    // https://en.wikipedia.org/wiki/HSL_and_HSV

    r /= 255;
    g /= 255;
    b /= 255;

    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);

    if (min === max) {
      return [0, 0, r];
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

    return [h!, s, l];
  }

  /**
   * @param r Red in the range 0-255
   * @param g Green in the range 0-255
   * @param b Blue in the range 0-255
   * @returns HSV, hue in 0-360, saturation and value in 0-1
   */
  export function rgbToHSV(r: number, g: number, b: number): [number, number, number] {
    // https://en.wikipedia.org/wiki/HSL_and_HSV

    r /= 255;
    g /= 255;
    b /= 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h: number, s: number, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if (max == min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h! /= 6;
    }

    return [h! * 360, s, v];
  }

  /**
   * @param h Hue in the range 0-1 (wrapping)
   * @param s Saturation in the range 0-1
   * @param v Value in the range 0-1
   * @returns RGB, each value in the range 0-255
   */
  export function hsvToRGB(h: number, s: number, v: number): [number, number, number] {
    // https://en.wikipedia.org/wiki/HSL_and_HSV

    var r: number, g: number, b: number;
  
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
  
    switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }
  
    return [r! * 255 | 0, g! * 255 | 0, b! * 255 | 0];
  }

  /**
   * @param h Hue in the range 0-1 (wrapping)
   * @param s Saturation in the range 0-1
   * @param v Value in the range 0-1
   * @returns RGB, each value in the range 0-255
   */
  export function hslToRGB(h: number, s: number, l: number): [number, number, number] {
    // https://en.wikipedia.org/wiki/HSL_and_HSV
    var r: number, g: number, b: number;
  
    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      }
  
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
  
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
  
    return [r * 255 | 0, g * 255 | 0, b * 255 | 0];
  }

  /**
   * 
   * @param h Hue in the range 0-360
   * @param s Saturation in the range 0-1
   * @param v Lightness in the range 0-1
   * @returns HSV, hue in 0-360, saturation and value in 0-1
   */
  export function hslToHSV(h: number, s: number, l: number): [number, number, number] {
    var v = l + s * Math.min(l, 1 - l);
    var s = v === 0 ? 0 : 2 - 2 * l / v;
    return [h, s, v];
  }

  /**
   * 
   * @param h Hue in the range 0-360
   * @param s Saturation in the range 0-1
   * @param v Value in the range 0-1
   * @returns HSL, hue in 0-360, saturation and lightness in 0-1
   */
  export function hsvToHSL(h: number, s: number, v: number): [number, number, number] {
    var l = v - v * s / 2;
    var s = l === 0 ? 0 : (v - l) / Math.min(2 - 2 * l / v);
    return [h, s, l];
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

  /**
   * Create a promise that will resolve after `ms` milliseconds.
   */
  export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  export function parseColor(color: any): number {
    if (typeof color === 'number') {
      return color;
    }
    if (typeof color === 'string') {
      const nValue = +color;
      if (!isNaN(nValue)) {
        return nValue;
      }
      if (color.startsWith('#')) {
        const hex = color.substr(1);
        const parsedHex = parseInt(hex, 16);
        if (hex.length === 6) {
          return parsedHex;
        } else if (hex.length === 3) {
          const r = parsedHex >> 8 & 0xf;
          const g = parsedHex >> 4 & 0xf;
          const b = parsedHex & 0xf;
          return (
            ((r << 4) | r) << 16 |
            ((g << 4) | g) << 8 |
            ((b << 4) | b)
          );
        }
      }
    }
    return 0;
  };

  export function escapeXML(unsafe: string): string {
    return unsafe
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
