// https://github.com/canvg/canvg/blob/f2363191ccc23b7a7d711bfdc02e6ffcf10f3787/dist/node/canvg.d.ts

declare namespace canvg {
  export interface Options {
    log?: boolean;
    useCORS?: boolean;
    ignoreMouse?: boolean;
    ignoreDimensions?: boolean;
    ignoreClear?: boolean;
    ignoreAnimation?: boolean;
    enableRedraw?: boolean;

    offsetX?: number;
    offsetY?: number;
    scaleWidth?: number;
    scaleHeight?: number;

    renderCallback?: (dom: Document) => void;
    forceRedraw?: () => boolean;
  }
}

declare function canvg(target?: string | HTMLCanvasElement, s?: string | Document, opts?: canvg.Options): void;
