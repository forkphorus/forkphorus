/// <reference path="phosphorus.ts" />

interface FontFaceObserver {
  new(font: string): FontFaceObserver;
  load(text?: string, timeout?: number): Promise<void>;
}
declare var FontFaceObserver: FontFaceObserver;

namespace P.fonts {
  /**
   * Dynamically load a remote font
   * @param name The name of the font (font-family)
   */
  export function loadFont(name: string): Promise<void> {
    P.IO.progressHooks.new();
    const observer = new FontFaceObserver(name);
    return observer.load().then(() => {
      P.IO.progressHooks.end();
    });
  }

  var loadedScratch2: boolean = false;
  var loadedScratch3: boolean = false;

  /**
   * Loads all Scratch 2 associated fonts
   */
  export function loadScratch2(): Promise<void> {
    if (loadedScratch2) {
      return Promise.resolve();
    }
    return Promise.all([
      loadFont('Donegal One'),
      loadFont('Gloria Hallelujah'),
      loadFont('Mystery Quest'),
      loadFont('Permanent Marker'),
      loadFont('Scratch'),
    ]).then(() => void (loadedScratch2 = true));
  }

  /**
   * Loads all Scratch 3 associated fonts
   */
  export function loadScratch3(): Promise<void> {
    if (loadedScratch3) {
      return Promise.resolve();
    }
    return Promise.all([
      loadFont('Knewave'),
      loadFont('Handlee'),
      loadFont('Pixel'),
      loadFont('Griffy'),
      loadFont('Scratch'),
    ]).then(() => void (loadedScratch3 = true));
  }
}
