/// <reference path="phosphorus.ts" />
/// <reference path="utils.ts" />

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
      P.utils.settled(loadFont('Donegal One')),
      P.utils.settled(loadFont('Gloria Hallelujah')),
      P.utils.settled(loadFont('Mystery Quest')),
      P.utils.settled(loadFont('Permanent Marker')),
      P.utils.settled(loadFont('Scratch')),
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
      P.utils.settled(loadFont('Knewave')),
      P.utils.settled(loadFont('Handlee')),
      P.utils.settled(loadFont('Pixel')),
      P.utils.settled(loadFont('Griffy')),
      P.utils.settled(loadFont('Scratch')),
      P.utils.settled(loadFont('Source Serif Pro')),
      P.utils.settled(loadFont('Noto Sans')),
    ]).then(() => void (loadedScratch3 = true));
  }
}
