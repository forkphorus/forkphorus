/// <reference path="phosphorus.ts" />

interface FontFaceObserver {
  new(font: string): FontFaceObserver;
  load(text?: string, timeout?: number): Promise<void>;
}
declare var FontFaceObserver: FontFaceObserver;

/**
 * Font helpers
 */
namespace P.fonts {
  const fontFamilyCache: ObjectMap<string> = {};

  export const scratch3 = {
    'Marker': 'fonts/Knewave-Regular.woff',
    'Handwriting': 'fonts/Handlee-Regular.woff',
    'Pixel': 'fonts/Grand9K-Pixel.ttf',
    'Curly': 'fonts/Griffy-Regular.woff',
    'Serif': 'fonts/SourceSerifPro-Regular.woff',
    'Sans Serif': 'fonts/NotoSans-Regular.woff',
  };

  /**
   * Asynchronously load and cache a font
   */
  export function loadLocalFont(fontFamily: string, src: string): Promise<string> {
    if (fontFamilyCache[fontFamily]) {
      return Promise.resolve(fontFamilyCache[fontFamily]);
    }
    return P.io.getAssetManager().loadFont(src)
      .then((blob) => P.io.readers.toDataURL(blob))
      .then((url) => {
        fontFamilyCache[fontFamily] = url;
        return url;
      });
  }

  /**
   * Gets an already loaded and cached font
   */
  function getFont(fontFamily: string): string | null {
    if (!(fontFamily in fontFamilyCache)) {
      return null;
    }
    return fontFamilyCache[fontFamily];
  }

  function getCSSFontFace(fontFamily: string, src: string) {
    return `@font-face { font-family: "${fontFamily}"; src: url("${src}"); }`;
  }

  /**
   * Add an inline <style> element to an SVG containing fonts loaded through loadFontSet
   */
  export function addFontRules(svg: SVGElement, fonts: string[]) {
    const cssRules: string[] = [];
    for (const fontName of fonts) {
      const font = getFont(fontName);
      if (!font) {
        console.warn('unknown font from cache', fontName);
        continue;
      }
      cssRules.push(getCSSFontFace(fontName, font));
    }

    const doc = svg.ownerDocument!;
    const defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.innerHTML = cssRules.join('\n');
    defs.appendChild(style);
    svg.appendChild(style);
  }

  /**
   * Load a CSS @font-face font.
   */
  export function loadWebFont(name: string): Promise<void> {
    const observer = new FontFaceObserver(name);
    return observer.load();
  }
}
