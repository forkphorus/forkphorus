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
    const observer = new FontFaceObserver(name);
    return observer.load();
  }

  /**
   * Loads all Scratch 3 associated fonts
   */
  export function loadScratch3(): Promise<void> {
    return Promise.all([
      loadFont('Knewave'),
      loadFont('Handlee'),
      loadFont('Pixel'),
      loadFont('Griffy'),
      loadFont('Scratch'),
    ]).then(() => undefined);
  }

  /**
   * Loads all Scratch 2 associated fonts
   */
  export function loadScratch2(): Promise<void> {
    return Promise.all([
      loadFont('Donegal One'),
      loadFont('Gloria Hallelujah'),
      loadFont('Mystery Quest'),
      loadFont('Permanent Marker'),
      loadFont('Scratch'),
    ]).then(() => undefined);
  }
}
