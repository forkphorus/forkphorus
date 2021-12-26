// Based on https://github.com/canvg/canvg/blob/f2363191ccc23b7a7d711bfdc02e6ffcf10f3787/dist/node/canvg.d.ts

declare namespace canvg {
  interface IOptions {
    /**
     * WHATWG-compatible `fetch` function.
     */
    fetch?: typeof fetch;
    /**
     * XML/HTML parser from string into DOM Document.
     */
    DOMParser?: typeof DOMParser;
    /**
     * Window object.
     */
    window?: Window;
    /**
     * Whether enable the redraw.
     */
    enableRedraw?: boolean;
    /**
     * Ignore mouse events.
     */
    ignoreMouse?: boolean;
    /**
     * Ignore animations.
     */
    ignoreAnimation?: boolean;
    /**
     * Does not try to resize canvas.
     */
    ignoreDimensions?: boolean;
    /**
     * Does not clear canvas.
     */
    ignoreClear?: boolean;
    /**
     * Scales horizontally to width.
     */
    scaleWidth?: number;
    /**
     * Scales vertically to height.
     */
    scaleHeight?: number;
    /**
     * Draws at a x offset.
     */
    offsetX?: number;
    /**
     * Draws at a y offset.
     */
    offsetY?: number;
    /**
     * Will call the function on every frame, if it returns true, will redraw.
     */
    forceRedraw?(): boolean;
    /**
     * Default `rem` size.
     */
    rootEmSize?: number;
    /**
     * Default `em` size.
     */
    emSize?: number;
    /**
     * Function to create new canvas.
     */
    createCanvas?: (width: number, height: number) => HTMLCanvasElement;
    /**
     * Function to create new image.
     */
    createImage?: (src: string, anonymousCrossOrigin?: boolean) => Promise<CanvasImageSource>;
    /**
     * Load images anonymously.
     */
    anonymousCrossOrigin?: boolean;
  }

  interface CanvgImage {
    render(): Promise<void>;
  }

  export namespace Canvg {
    export function from(canvas: HTMLCanvasElement | CanvasRenderingContext2D, source: string, options: IOptions): Promise<CanvgImage>;
  }
}
