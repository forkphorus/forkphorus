/// <reference path="../phosphorus.ts" />

namespace P.renderer {
  // Abstract definition for renderers.

  export interface ProjectRenderer {
    /**
     * The canvas used by this renderer.
     */
    canvas: HTMLCanvasElement;
    /**
     * The stage that this renderer is used by.
     * This renderer must only be used by this stage and with sprites within this stage.
     */
    stage: P.core.Stage;
    /**
     * Reset and draw a new frame.
     */
    drawFrame(): void;
    /**
     * Initialize this renderer and append its canvas(es) to a given root node.
     */
    init(root: HTMLElement): void;
    /**
     * Delete this renderer.
     */
    destroy(): void;
    /**
     * Called when the filters on the stage have changed.
     */
    onStageFiltersChanged(): void;
    /**
     * Asks this renderer to resize itself.
     * Renderer may choose what to resize and when.
     * @param scale Zoom level of the renderer, 1 = 1x zoom. Does not include device pixel ratio.
     */
    resize(scale: number): void;
    /**
     * Draws a line on the pen canvas
     * @param color Color of the line
     * @param size Width of the line
     * @param x Starting X coordinate in the Scratch coordinate grid
     * @param y Starting Y coordinate in the Scratch coordinate grid
     * @param x2 Ending X coordinate in the Scratch coordinate grid
     * @param y2 Starting Y coordinate in the Scratch coordinate grid
     */
    penLine(color: P.core.PenColor, size: number, x: number, y: number, x2: number, y2: number): void;
    /**
     * Draws a circular dot on the pen layer
     * @param color Color of the dot
     * @param size Diameter of the circle
     * @param x Central X coordinate in the Scratch coordinate grid
     * @param y Central Y coordinate in the Scratch coordinate grid
     */
    penDot(color: P.core.PenColor, size: number, x: number, y: number): void;
    /**
     * Stamp a Sprite on the pen layer
     */
    penStamp(sprite: P.core.Base): void;
    /**
     * Clear the pen layer
     */
    penClear(): void;
    /**
     * Determines if a Sprite is intersecting a point
     * @param sprite The sprite
     * @param x X coordinate in the Scratch coordinate grid
     * @param y Y coordinate in the Scratch coordinate grid
     */
    spriteTouchesPoint(sprite: P.core.Sprite, x: number, y: number): boolean;
    /**
     * Determines if a Sprite is touching another Sprite
     * @param spriteA The first sprite
     * @param spriteB Other sprites to test for collision
     */
    spritesIntersect(spriteA: P.core.Base, otherSprites: P.core.Base[]): boolean;
    /**
     * Determines if a Sprite is touching a color
     * @param sprite The sprite
     * @param color The RGB color, in number form.
     */
    spriteTouchesColor(sprite: P.core.Base, color: number): boolean;
    /**
     * Determines if a color from one object is touching a color
     * @param sprite The sprite
     * @param spriteColor The color on the Sprite
     * @param otherColor The color on the rest of the stage
     */
    spriteColorTouchesColor(sprite: P.core.Base, spriteColor: number, otherColor: number): boolean;
  }
}
