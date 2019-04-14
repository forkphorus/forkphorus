/// <reference path="phosphorus.ts" />
/// <reference path="matrix.ts" />

namespace P.renderer {
  // Import aliases
  import RotationStyle = P.core.RotationStyle;

  export interface SpriteRenderer {
    canvas: HTMLCanvasElement;
    /**
     * Resets and resizes the renderer
     */
    reset(scale: number): void;
    /**
     * Draws a Sprite or Stage on this renderer
     */
    drawChild(child: P.core.Base): void;
    /**
     * Draws a canvas covering the full dimensions of this renderer
     */
    drawLayer(canvas: HTMLCanvasElement): void;
  }

  export interface ProjectRenderer extends SpriteRenderer {
    /**
     * The canvas where pen things are drawn
     */
    penLayer: HTMLCanvasElement;
    /**
     * The canvas where the stage is drawn
     */
    stageLayer: HTMLCanvasElement;
    /**
     * Draws a line on the pen canvas
     * @param color Color of the line
     * @param size Width of the line
     * @param x Starting X coordinate in Sratch
     * @param y Starting Y coordinate in Sratch
     * @param x2 Ending X coordinate in Sratch
     * @param y2 Starting Y coordinate in Sratch
     */
    penLine(color: string, size: number, x: number, y: number, x2: number, y2: number): void;
    /**
     * Draws a circular dot on the pen canvas
     * @param color Color of the dot
     * @param size Diameter of the circle
     * @param x Central X coordinate in Scratch
     * @param y Central Y coordinate in Scratch
     */
    penDot(color: string, size: number, x: number, y: number): void;
    /**
     * Stamp a Sprite on the pen layer
     */
    penStamp(sprite: P.core.Sprite): void;
    /**
     * Clear the pen canvas
     */
    penClear(): void;
    /**
     * Resizes the pen canvas without losing the existing drawing.
     */
    penResize(scale: number): void;
    /**
     * Updates & resize the Stage layer. Implicitly calls updateStageFilters()
     */
    updateStage(scale: number): void;
    /**
     * Updates the filters applied to the Stage layer.
     */
    updateStageFilters(): void;
    /**
     * Determines if a Sprite is intersecting a point
     * @param sprite The sprite
     * @param x X coordinate, in Scratch space
     * @param y Y coordinate, in Scratch space
     */
    spriteTouchesPoint(sprite: P.core.Sprite, x: number, y: number): boolean;
    /**
     * Determines if a Sprite is touching another Sprite
     * @param spriteA The first sprite
     * @param spriteB The other sprite
     */
    spritesIntersect(spriteA: P.core.Base, spriteB: P.core.Base): boolean;
    /**
     * Determines if a Sprite is touching a color
     * @param sprite The sprite
     * @param color The RGB color, in number form.
     */
    spriteTouchesColor(sprite: P.core.Base, color: number): boolean;
    /**
     * Determines if one Sprite's color touches another Sprite's color
     * @param sprite The sprite
     * @param spriteColor The color on the Sprite
     * @param otherColor The color on the rest of the stage
     */
    spriteColorTouchesColor(sprite: P.core.Base, spriteColor: number, otherColor: number): boolean;
  }

  /**
   * Create an HTML canvas.
   */
  function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    return canvas;
  }

  /**
   * Creates the CSS filter for a Filter object.
   * The filter is generally an estimation of the actual effect.
   * Includes brightness and color. (does not include ghost)
   */
  function cssFilter(filters: P.core.Filters) {
    let filter = '';
    if (filters.brightness) {
      filter += 'brightness(' + (100 + filters.brightness) + '%) ';
    }
    if (filters.color) {
      filter += 'hue-rotate(' + (filters.color / 200 * 360) + 'deg) ';
    }
    return filter;
  }

  /**
   * Determines if a Sprite's filters will change its shape.
   * @param filters The Sprite's filters
   */
  function filtersChangeShape(filters: P.core.Filters): boolean {
    return filters.fisheye !== 0 ||
      filters.mosaic !== 0 ||
      filters.pixelate !== 0 ||
      filters.whirl !== 0;
  }

  // Used in the WebGL renderer for inverting sprites.
  // Create it only once for memory reasons.
  const horizontalInvertMatrix = P.m3.scaling(-1, 1);

  // Extension of Costume to store the webgl textures
  interface WebGLCostume extends P.core.Costume {
    _glTexture: WebGLTexture;
  }

  export class WebGLSpriteRenderer implements SpriteRenderer {
    public static vertexShader: string = `
    attribute vec2 a_position;
    attribute vec2 a_texcoord;

    uniform mat3 u_matrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
      v_texcoord = a_texcoord;
    }
    `;

    public static fragmentShader: string = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;
    uniform float u_opacity;
    uniform float u_brightness;
    uniform float u_color;
    uniform float u_mosaic;
    uniform float u_whirl;
    uniform float u_fisheye;
    uniform float u_pixelate;
    uniform vec2 u_size;

    const float minimumAlpha = 1.0 / 250.0;
    const vec2 vecCenter = vec2(0.5, 0.5);

    // http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
      vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      // varyings cannot be modified
      vec2 texcoord = v_texcoord;

      // apply mosaic
      texcoord = fract(u_mosaic * v_texcoord);

      // apply pixelate
      if (u_pixelate != 0.0) {
        vec2 texelSize = u_size / u_pixelate;
        texcoord = (floor(texcoord * texelSize) + vecCenter) / texelSize;
      }

      // apply whirl
      {
        const float radius = 0.5;
        vec2 offset = texcoord - vecCenter;
        float offsetMagnitude = length(offset);
        float whirlFactor = max(1.0 - (offsetMagnitude / radius), 0.0);
        float whirlActual = u_whirl * whirlFactor * whirlFactor;
        float sinWhirl = sin(whirlActual);
        float cosWhirl = cos(whirlActual);
        mat2 rotationMatrix = mat2(
          cosWhirl, -sinWhirl,
          sinWhirl, cosWhirl
        );
        texcoord = rotationMatrix * offset + vecCenter;
      }

      // apply fisheye
      {
        vec2 vec = (texcoord - vecCenter) / vecCenter;
        float vecLength = length(vec);
        float r = pow(min(vecLength, 1.0), u_fisheye) * max(1.0, vecLength);
        vec2 unit = vec / vecLength;
        texcoord = vecCenter + r * unit * vecCenter;
      }

      vec4 color = texture2D(u_texture, texcoord);
      if (color.a < minimumAlpha) {
        discard;
      }

      // apply ghost effect
      color.a *= u_opacity;
      // handle premultiplied alpha
      color.rgb *= u_opacity;

      // apply brightness effect
      color.rgb = clamp(color.rgb + vec3(u_brightness), 0.0, 1.0);

      // the color effect is rather long
      // see https://github.com/LLK/scratch-render/blob/008dc5b15b30961301e6b9a08628a063b967a001/src/shaders/sprite.frag#L175-L189
      // code block to avoid leaking variables
      if (u_color != 0.0) {
        vec3 hsv = rgb2hsv(color.rgb);
        // hsv.x = hue
        // hsv.y = saturation
        // hsv.z = value

        // scratch forces all colors to have some minimal amount saturation so there is a visual change
        const float minValue = 0.11 / 2.0;
        const float minSaturation = 0.09;
        if (hsv.z < minValue) hsv = vec3(0.0, 1.0, minValue);
        else if (hsv.y < minSaturation) hsv = vec3(0.0, minSaturation, hsv.z);

        hsv.x = mod(hsv.x + u_color, 1.0);
        if (hsv.x < 0.0) hsv.x += 1.0;
        color = vec4(hsv2rgb(hsv), color.a);  
      }

      gl_FragColor = color;
    }
    `;

    public canvas: HTMLCanvasElement;
    public gl: WebGLRenderingContext;

    protected program: WebGLProgram;
    protected quadBuffer: WebGLBuffer;

    protected globalScaleMatrix: P.m3.Matrix3;

    protected a_position: number;
    protected a_texcoord: number;
    protected u_matrix: WebGLUniformLocation;
    protected u_opacity: WebGLUniformLocation;
    protected u_brightness: WebGLUniformLocation;
    protected u_color: WebGLUniformLocation;
    protected u_mosaic: WebGLUniformLocation;
    protected u_whirl: WebGLUniformLocation;
    protected u_fisheye: WebGLUniformLocation;
    protected u_pixelate: WebGLUniformLocation;
    protected u_size: WebGLUniformLocation;

    constructor() {
      this.canvas = createCanvas();
      const gl = this.canvas.getContext('webgl');
      if (!gl) {
        throw new Error('cannot get webgl rendering context');
      }
      this.gl = gl;

      this.program = this.compileProgram(WebGLSpriteRenderer.vertexShader, WebGLSpriteRenderer.fragmentShader);

      // Enable transparency blending.
      this.gl.enable(this.gl.BLEND);
      // TODO: investigate other blending modes
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      // Cache attribute/uniform locations for later
      this.a_position = this.gl.getAttribLocation(this.program, 'a_position');
      this.a_texcoord = this.gl.getAttribLocation(this.program, 'a_texcoord');
      this.u_matrix = this.getUniformLocation(this.program, 'u_matrix');
      this.u_opacity = this.getUniformLocation(this.program, 'u_opacity');
      this.u_brightness = this.getUniformLocation(this.program, 'u_brightness');
      this.u_color = this.getUniformLocation(this.program, 'u_color');
      this.u_mosaic = this.getUniformLocation(this.program, 'u_mosaic');
      this.u_whirl = this.getUniformLocation(this.program, 'u_whirl');
      this.u_fisheye = this.getUniformLocation(this.program, 'u_fisheye');
      this.u_pixelate = this.getUniformLocation(this.program, 'u_pixelate');
      this.u_size = this.getUniformLocation(this.program, 'u_size');

      // Create the quad buffer that we'll use for positioning and texture coordinates later.
      this.quadBuffer = this.gl.createBuffer()!;
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
      ]), this.gl.STATIC_DRAW);
    }

    /**
     * Compile a single shader
     * @param type The type of the shader. Use this.gl.VERTEX_SHADER or FRAGMENT_SHADER
     * @param source The string source of the shader.
     * @param definitions Flags to define in the shader source.
     */
    compileShader(type: number, source: string, definitions?: string[]): WebGLShader {
      const addDefinition = (def: string) => {
        source = '#define ' + def + '\n' + source;
      }
      if (definitions) {
        for (const def of definitions) {
          addDefinition(def);
        }
      }

      const shader = this.gl.createShader(type);
      if (!shader) {
        throw new Error('Cannot create shader');
      }

      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);

      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        const error = this.gl.getShaderInfoLog(shader);
        this.gl.deleteShader(shader);
        throw new Error('Shader compilation error: ' + error);
      }

      return shader;
    }

    /**
     * Compiles a vertex shader and fragment shader into a program.
     * @param vs Vertex shader source.
     * @param fs Fragment shader source.
     * @param definitions Things to define in the source of both shaders.
     */
    compileProgram(vs: string, fs: string, definitions?: string[]): WebGLProgram {
      const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vs, definitions);
      const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fs, definitions);

      const program = this.gl.createProgram();
      if (!program) {
        throw new Error('Cannot create program');
      }
      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);

      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        const error = this.gl.getProgramInfoLog(program);
        this.gl.deleteProgram(program);
        throw new Error('Program compilation error: ' + error);
      }

      return program;
    }

    /**
     * Compiles the default shader
     * @param definitions Things to define in the shader
     */
    compileDefaultShader(definitions?: string[]) {
      return this.compileProgram(WebGLSpriteRenderer.vertexShader, WebGLSpriteRenderer.fragmentShader, definitions);
    }

    /**
     * Creates a new texture without inserting data.
     * Texture will be bound to TEXTURE_2D, so you can texImage2D() on it
     * Mipmapping will be disabled to allow for any size texture.
     */
    createTexture(): WebGLTexture {
      const texture = this.gl.createTexture();
      if (!texture) {
        throw new Error('Cannot create texture');
      }
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

      return texture;
    }

    /**
     * Converts a canvas to a WebGL texture
     * @param canvas The source canvas. Dimensions do not matter.
     */
    convertToTexture(canvas: HTMLImageElement | HTMLCanvasElement): WebGLTexture {
      const texture = this.createTexture();
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
      return texture;
    }

    /**
     * Get the location of a uniform, or throw an error if it doesn't exist.
     */
    getUniformLocation(program: WebGLProgram, name: string): WebGLUniformLocation {
      const uniform = this.gl.getUniformLocation(program, name);
      if (!uniform) {
        throw new Error('Unknown uniform: ' + name);
      }
      return uniform;
    }

    /**
     * Creates a new framebuffer
     */
    createFramebuffer(): WebGLFramebuffer {
      const frameBuffer = this.gl.createFramebuffer();
      if (!frameBuffer) {
        throw new Error('cannot create frame buffer');
      }
      return frameBuffer;
    }

    reset(scale: number) {
      // Scale the actual canvas
      this.canvas.width = scale * P.config.scale * 480;
      this.canvas.height = scale * P.config.scale * 360;

      this.resetBuffer(scale);
    }

    /**
     * Resizes and resets the current buffer
     * @param scale Scale
     */
    resetBuffer(scale: number) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.globalScaleMatrix = P.m3.scaling(scale, scale);

      // Clear the canvas
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    drawChild(child: P.core.Base) {
      this.gl.useProgram(this.program);
      this._drawChild(child);
    }

    /**
     * Real implementation of drawChild()
     * Shader must be set before calling (allows for using a different shader)
     * @param child The child to draw
     */
    _drawChild(child: P.core.Base) {
      this.gl.enableVertexAttribArray(this.a_position);
      this.gl.enableVertexAttribArray(this.a_texcoord);

      // Create the texture if it doesn't already exist.
      // We'll create a texture only once for performance.
      const costume = child.costumes[child.currentCostumeIndex] as WebGLCostume;
      if (!costume._glTexture) {
        const texture = this.convertToTexture(costume.image);
        costume._glTexture = texture;
      }
      this.gl.bindTexture(this.gl.TEXTURE_2D, costume._glTexture);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
      this.gl.vertexAttribPointer(this.a_texcoord, 2, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
      this.gl.vertexAttribPointer(this.a_position, 2, this.gl.FLOAT, false, 0, 0);

      // TODO: do this in the shader if its possible/faster
      const matrix = P.m3.projection(this.canvas.width, this.canvas.height);
      P.m3.multiply(matrix, this.globalScaleMatrix);
      P.m3.multiply(matrix, P.m3.translation(240 + child.scratchX | 0, 180 - child.scratchY | 0));
      if (P.core.isSprite(child)) {
        if (child.rotationStyle === RotationStyle.Normal && child.direction !== 90) {
          P.m3.multiply(matrix, P.m3.rotation(90 - child.direction));
        } else if (child.rotationStyle === RotationStyle.LeftRight && child.direction < 0) {
          P.m3.multiply(matrix, horizontalInvertMatrix);
        }
        if (child.scale !== 1) {
          P.m3.multiply(matrix, P.m3.scaling(child.scale, child.scale));
        }
      }
      if (costume.scale !== 1) {
        P.m3.multiply(matrix, P.m3.scaling(costume.scale, costume.scale));
      }
      P.m3.multiply(matrix, P.m3.translation(-costume.rotationCenterX, -costume.rotationCenterY));
      P.m3.multiply(matrix, P.m3.scaling(costume.image.width, costume.image.height));
      this.gl.uniformMatrix3fv(this.u_matrix, false, matrix);

      // Effects
      this.gl.uniform1f(this.u_opacity, 1 - child.filters.ghost / 100);
      this.gl.uniform1f(this.u_brightness, child.filters.brightness / 100);
      this.gl.uniform1f(this.u_color, child.filters.color / 200);
      const mosaic = Math.round((Math.abs(child.filters.mosaic) + 10) / 10);
      this.gl.uniform1f(this.u_mosaic, P.utils.clamp(mosaic, 1, 512));
      this.gl.uniform1f(this.u_whirl, child.filters.whirl * Math.PI / -180);
      this.gl.uniform1f(this.u_fisheye, Math.max(0, (child.filters.fisheye + 100) / 100));
      this.gl.uniform1f(this.u_pixelate, Math.abs(child.filters.pixelate) / 10);
      this.gl.uniform2f(this.u_size, costume.image.width, costume.image.height);

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    drawLayer(canvas: HTMLCanvasElement) {
      const texture = this.convertToTexture(canvas);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
      this.gl.vertexAttribPointer(this.a_texcoord, 2, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
      this.gl.vertexAttribPointer(this.a_position, 2, this.gl.FLOAT, false, 0, 0);

      const matrix = P.m3.projection(this.canvas.width, this.canvas.height);
      P.m3.multiply(matrix, this.globalScaleMatrix);
      this.gl.uniformMatrix3fv(this.u_matrix, false, matrix);

      this.gl.uniform1f(this.u_opacity, 1);

      // TODO: is it necessary to delete textures?
      this.gl.deleteTexture(texture);
    }
  }

  export class WebGLProjectRenderer extends WebGLSpriteRenderer implements ProjectRenderer {
    public penLayer: HTMLCanvasElement;
    public stageLayer: HTMLCanvasElement;
    protected fallbackRenderer: ProjectRenderer;

    protected frameBuffer1: WebGLFramebuffer = this.createFramebuffer();
    protected frameBuffer2: WebGLFramebuffer = this.createFramebuffer();

    protected spriteIntersectsSpriteProgram = this.compileDefaultShader(['SPRITE_INTERSECTS_SPRITE']);

    constructor(public stage: P.core.Stage) {
      super();
      this.fallbackRenderer = new ProjectRenderer2D(stage);
      this.penLayer = this.fallbackRenderer.penLayer;
      this.stageLayer = this.fallbackRenderer.stageLayer;
    }

    penLine(color: string, size: number, x: number, y: number, x2: number, y2: number): void {
      this.fallbackRenderer.penLine(color, size, x, y, x2, y2);
    }

    penDot(color: string, size: number, x: number, y: number): void {
      this.fallbackRenderer.penDot(color, size, x, y);
    }

    penStamp(sprite: P.core.Sprite): void {
      this.fallbackRenderer.penStamp(sprite);
    }

    penClear(): void {
      this.fallbackRenderer.penClear();
    }

    penResize(scale: number): void {
      this.fallbackRenderer.penResize(scale);
    }

    updateStage(scale: number): void {
      this.fallbackRenderer.updateStage(scale);
    }

    updateStageFilters(): void {
      this.fallbackRenderer.updateStageFilters();
    }

    spriteTouchesPoint(sprite: core.Sprite, x: number, y: number): boolean {
      // If filters will not change the shape of the sprite, it would be faster
      // to avoid going to the GPU
      if (!filtersChangeShape(sprite.filters)) {
        return this.fallbackRenderer.spriteTouchesPoint(sprite, x, y);
      }

      // Setup WebGL to render to a texture
      const texture = this.createTexture();
      // null = no image data
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 480, 360, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
      const framebuffer = this.createFramebuffer();
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
      const attachmentPoint = this.gl.COLOR_ATTACHMENT0;
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, attachmentPoint, this.gl.TEXTURE_2D, texture, 0);

      // Resizes and properly clears our buffer
      this.resetBuffer(1);

      this.drawChild(sprite);

      // Allocate 4 bytes to store 1 RGBA pixel
      const result = new Uint8Array(4);
      // Coordinates are in pixels from the lower left corner
      // We only care about 1 pixel, the pixel at the mouse cursor.
      this.gl.readPixels(240 + x | 0, 180 + y | 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, result);

      // Send rendering back to the canvas and not the buffer
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      // I don't know if it's necessary to delete these
      this.gl.deleteTexture(texture);
      this.gl.deleteFramebuffer(framebuffer);

      // Just look for a non-zero alpha channel
      return result[3] !== 0;
    }

    spritesIntersect(spriteA: core.Sprite, spriteB: core.Sprite): boolean {
      return this.fallbackRenderer.spritesIntersect(spriteA, spriteB);
    }

    spriteTouchesColor(sprite: core.Base, color: number): boolean {
      return this.fallbackRenderer.spriteTouchesColor(sprite, color);
    }

    spriteColorTouchesColor(sprite: core.Base, spriteColor: number, otherColor: number): boolean {
      return this.spriteColorTouchesColor(sprite, spriteColor, otherColor);
    }
  }

  export class SpriteRenderer2D implements SpriteRenderer {
    public ctx: CanvasRenderingContext2D;
    public canvas: HTMLCanvasElement;
    public noEffects: boolean = false;

    constructor() {
      this.canvas = createCanvas();
      this.ctx = this.canvas.getContext('2d')!;
    }

    reset(scale: number) {
      this._reset(this.ctx, scale);
    }

    drawImage(image: CanvasImageSource, x: number, y: number) {
      this.ctx.drawImage(image, x, y);
    }

    drawChild(c: P.core.Base) {
      this._drawChild(c, this.ctx);
    }

    drawLayer(canvas: HTMLCanvasElement) {
      this.ctx.drawImage(canvas, 0, 0, 480, 360);
    }

    protected _reset(ctx: CanvasRenderingContext2D, scale: number) {
      const effectiveScale = scale * P.config.scale;
      ctx.canvas.width = 480 * effectiveScale;
      ctx.canvas.height = 360 * effectiveScale;
      ctx.scale(effectiveScale, effectiveScale);
    }

    protected _drawChild(c: P.core.Base, ctx: CanvasRenderingContext2D) {
      const costume = c.costumes[c.currentCostumeIndex];
      if (!costume) {
        return;
      }

      ctx.save();

      const scale = c.stage.zoom * P.config.scale;
      ctx.translate(((c.scratchX + 240) * scale | 0) / scale, ((180 - c.scratchY) * scale | 0) / scale);

      // Direction transforms are only applied to Sprites because Stages cannot be rotated.
      if (P.core.isSprite(c)) {
        if (c.rotationStyle === RotationStyle.Normal) {
          ctx.rotate((c.direction - 90) * Math.PI / 180);
        } else if (c.rotationStyle === RotationStyle.LeftRight && c.direction < 0) {
          ctx.scale(-1, 1);
        }
        ctx.scale(c.scale, c.scale);
      }

      ctx.scale(costume.scale, costume.scale);
      ctx.translate(-costume.rotationCenterX, -costume.rotationCenterY);

      if (!this.noEffects) {
        ctx.globalAlpha = Math.max(0, Math.min(1, 1 - c.filters.ghost / 100));

        const filter = cssFilter(c.filters);
        // Only apply a filter if necessary, otherwise Firefox performance
        // nosedives.
        if (filter !== '') {
          ctx.filter = filter;
        }
      }

      ctx.drawImage(costume.image, 0, 0);
      ctx.restore();
    }
  }

  // Renderers used for some features such as collision detection
  const workingRenderer = new SpriteRenderer2D();
  const workingRenderer2 = new SpriteRenderer2D();

  export class ProjectRenderer2D extends SpriteRenderer2D implements ProjectRenderer {
    public stageLayer: HTMLCanvasElement;
    public stageContext: CanvasRenderingContext2D;
    public penLayer: HTMLCanvasElement;
    public penContext: CanvasRenderingContext2D;

    constructor(public stage: P.core.Stage) {
      super();
      this.stageLayer = createCanvas();
      this.stageContext = this.stageLayer.getContext('2d')!;
      this.penLayer = createCanvas();
      this.penContext = this.penLayer.getContext('2d')!;
    }

    updateStage(scale: number) {
      this._reset(this.stageContext, scale);
      this.noEffects = true;
      this._drawChild(this.stage, this.stageContext);
      this.noEffects = false;
      this.updateStageFilters();
    }

    updateStageFilters() {
      const filter = cssFilter(this.stage.filters);
      // Only reapply a CSS filter if it has changed for performance.
      // Might not be necessary here.
      if (this.stageLayer.style.filter !== filter) {
        this.stageLayer.style.filter = filter;
      }

      // cssFilter does not include ghost
      this.stageLayer.style.opacity = '' + Math.max(0, Math.min(1, 1 - this.stage.filters.ghost / 100));
    }

    penClear() {
      this.penContext.clearRect(0, 0, this.penLayer.width, this.penLayer.height);
    }

    penResize(scale: number) {
      const cachedCanvas = document.createElement('canvas');
      cachedCanvas.width = this.penLayer.width;
      cachedCanvas.height = this.penLayer.height;
      cachedCanvas.getContext('2d')!.drawImage(this.penLayer, 0, 0);
      this._reset(this.penContext, scale);
      this.penContext.drawImage(cachedCanvas, 0, 0, 480, 360);
    }

    penDot(color: string, size: number, x: number, y: number) {
      this.penContext.fillStyle = color;
      this.penContext.beginPath();
      this.penContext.arc(240 + x, 180 - y, size / 2, 0, 2 * Math.PI, false);
      this.penContext.fill();
    }

    penLine(color: string, size: number, x1: number, y1: number, x2: number, y2: number) {
      this.penContext.lineCap = 'round';
      if (size % 2 > .5 && size % 2 < 1.5) {
        x1 -= .5;
        y1 -= .5;
        x2 -= .5;
        y2 -= .5;
      }
      this.penContext.strokeStyle = color;
      this.penContext.lineWidth = size;
      this.penContext.beginPath();
      this.penContext.moveTo(240 + x1, 180 - y1);
      this.penContext.lineTo(240 + x2, 180 - y2);
      this.penContext.stroke();
    }

    penStamp(sprite: P.core.Sprite) {
      this._drawChild(sprite, this.penContext);
    }

    spriteTouchesPoint(sprite: P.core.Sprite, x: number, y: number) {
      const costume = sprite.costumes[sprite.currentCostumeIndex];
      const bounds = sprite.rotatedBounds();
      if (x < bounds.left || y < bounds.bottom || x > bounds.right || y > bounds.top) {
        return false;
      }

      var cx = (x - sprite.scratchX) / sprite.scale;
      var cy = (sprite.scratchY - y) / sprite.scale;
      if (sprite.rotationStyle === RotationStyle.Normal && sprite.direction !== 90) {
        const d = (90 - sprite.direction) * Math.PI / 180;
        const ox = cx;
        const s = Math.sin(d), c = Math.cos(d);
        cx = c * ox - s * cy;
        cy = s * ox + c * cy;
      } else if (sprite.rotationStyle === RotationStyle.LeftRight && sprite.direction < 0) {
        cx = -cx;
      }

      const positionX = Math.round(cx * costume.bitmapResolution + costume.rotationCenterX);
      const positionY = Math.round(cy * costume.bitmapResolution + costume.rotationCenterY);
      const data = costume.context().getImageData(positionX, positionY, 1, 1).data;
      return data[3] !== 0;
    }

    spritesIntersect(spriteA: P.core.Base, spriteB: P.core.Base) {
      if (!spriteB.visible) return false;

      const mb = spriteA.rotatedBounds();
      const ob = spriteB.rotatedBounds();

      if (mb.bottom >= ob.top || ob.bottom >= mb.top || mb.left >= ob.right || ob.left >= mb.right) {
        return false;
      }

      const left = Math.max(mb.left, ob.left);
      const top = Math.min(mb.top, ob.top);
      const right = Math.min(mb.right, ob.right);
      const bottom = Math.max(mb.bottom, ob.bottom);

      const width = right - left;
      const height = top - bottom;

      if (width < 1 || height < 1) {
        return false;
      }

      workingRenderer.canvas.width = width;
      workingRenderer.canvas.height = height;

      workingRenderer.ctx.save();
      workingRenderer.noEffects = true;

      workingRenderer.ctx.translate(-(left + 240), -(180 - top));
      workingRenderer.drawChild(spriteA);
      workingRenderer.ctx.globalCompositeOperation = 'source-in';
      workingRenderer.drawChild(spriteB);

      workingRenderer.noEffects = false;
      workingRenderer.ctx.restore();

      const data = workingRenderer.ctx.getImageData(0, 0, width, height).data;
      const length = data.length;

      for (var j = 0; j < length; j += 4) {
        // check for the opacity byte being a non-zero number
        if (data[j + 3]) {
          return true;
        }
      }

      return false;
    }

    spriteTouchesColor(sprite: P.core.Base, color: number) {
      const b = sprite.rotatedBounds();

      workingRenderer.canvas.width = b.right - b.left;
      workingRenderer.canvas.height = b.top - b.bottom;

      workingRenderer.ctx.save();
      workingRenderer.ctx.translate(-(240 + b.left), -(180 - b.top));

      sprite.stage.drawAll(workingRenderer, sprite);
      workingRenderer.ctx.globalCompositeOperation = 'destination-in';
      workingRenderer.drawChild(sprite);

      workingRenderer.ctx.restore();

      const data = workingRenderer.ctx.getImageData(0, 0, b.right - b.left, b.top - b.bottom).data;

      color = color & 0xffffff;
      const length = (b.right - b.left) * (b.top - b.bottom) * 4;
      for (var i = 0; i < length; i += 4) {
        if ((data[i] << 16 | data[i + 1] << 8 | data[i + 2]) === color && data[i + 3]) {
          return true;
        }
      }

      return false;
    }

    spriteColorTouchesColor(sprite: P.core.Base, spriteColor: number, otherColor: number) {
      var rb = sprite.rotatedBounds();

      workingRenderer.canvas.width = workingRenderer2.canvas.width = rb.right - rb.left;
      workingRenderer.canvas.height = workingRenderer2.canvas.height = rb.top - rb.bottom;

      workingRenderer.ctx.save();
      workingRenderer2.ctx.save();
      workingRenderer.ctx.translate(-(240 + rb.left), -(180 - rb.top));
      workingRenderer2.ctx.translate(-(240 + rb.left), -(180 - rb.top));

      sprite.stage.drawAll(workingRenderer, sprite);
      workingRenderer.drawChild(sprite);

      workingRenderer.ctx.restore();

      var dataA = workingRenderer.ctx.getImageData(0, 0, rb.right - rb.left, rb.top - rb.bottom).data;
      var dataB = workingRenderer.ctx.getImageData(0, 0, rb.right - rb.left, rb.top - rb.bottom).data;

      spriteColor = spriteColor & 0xffffff;
      otherColor = otherColor & 0xffffff;

      var length = dataA.length;
      for (var i = 0; i < length; i += 4) {
        var touchesSource = (dataB[i] << 16 | dataB[i + 1] << 8 | dataB[i + 2]) === spriteColor && dataB[i + 3];
        var touchesOther = (dataA[i] << 16 | dataA[i + 1] << 8 | dataA[i + 2]) === otherColor && dataA[i + 3];
        if (touchesSource && touchesOther) {
          return true;
        }
      }

      return false;
    }
  }
}
