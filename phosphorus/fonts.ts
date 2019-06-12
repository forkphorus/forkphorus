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
    'Scratch': 'fonts/Scratch.ttf',
  };

  /**
   * Asynchronously load and cache a font
   */
  function loadLocalFont(fontFamily: string, src: string): Promise<string> {
    if (fontFamilyCache[fontFamily]) {
      return Promise.resolve(fontFamilyCache[fontFamily]);
    }
    return new P.IO.BlobRequest(src, {local: true}).load()
      .then((blob) => P.IO.readers.toDataURL(blob))
      .then((url) => {
        fontFamilyCache[fontFamily] = url;
        return url;
      });
  }

  /**
   * Gets an already loaded and cached font
   */
  function getFont(fontFamily: string): string {
    if (!(fontFamily in fontFamilyCache)) {
      throw new Error('unknown font: ' + fontFamily);
    }
    return fontFamilyCache[fontFamily];
  }

  export function loadFontSet(fonts: ObjectMap<string>): Promise<unknown> {
    const promises: Promise<unknown>[] = [];
    for (const family in fonts) {
      promises.push(loadLocalFont(family, fonts[family]));
    }
    return Promise.all(promises);
  }

  function getCSSFontFace(src: string, fontFamily: string) {
    return `@font-face { font-family: "${fontFamily}"; src: url("${src}"); }`;
  }

  export function addFontRules(svg: SVGElement, fonts: string[]) {
    const cssRules: string[] = [];
    for (const font of fonts) {
      // Dirty hack: we'll just assume helvetica is already present on the user's machine
      if (font === 'Helvetica') continue;
      cssRules.push(getCSSFontFace(getFont(font), font));
    }

    const doc = svg.ownerDocument!;
    const defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.innerHTML = cssRules.join('\n');
    defs.appendChild(style);
    svg.appendChild(style);
  }

  export function loadWebFont(name: string): Promise<void> {
    const observer = new FontFaceObserver(name);
    return observer.load();
  }
}
