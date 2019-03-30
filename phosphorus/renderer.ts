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
   * @param T gay
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

    void main() {
      vec4 color = texture2D(u_texture, v_texcoord);
      color.a *= u_opacity;
      gl_FragColor = color;
    }
    `;

    public canvas: HTMLCanvasElement;
    public gl: WebGLRenderingContext;

    private program: WebGLProgram;
    private quadBuffer: WebGLBuffer;

    private globalScaleMatrix: P.m3.Matrix3;

    private a_position: number;
    private a_texcoord: number;
    private u_matrix: WebGLUniformLocation;
    private u_opacity: WebGLUniformLocation;

    constructor() {
      this.canvas = createCanvas();
      this.gl = this.canvas.getContext('webgl')!;

      this.program = this.compileProgram(WebGLSpriteRenderer.vertexShader, WebGLSpriteRenderer.fragmentShader);

      // Enable transparency blending.
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      // Cache attribute/uniform locations for later
      this.a_position = this.gl.getAttribLocation(this.program, 'a_position');
      this.a_texcoord = this.gl.getAttribLocation(this.program, 'a_texcoord');
      this.u_matrix = this.gl.getUniformLocation(this.program, 'u_matrix')!;
      this.u_opacity = this.gl.getUniformLocation(this.program, 'u_opacity')!;

      // Create the quad buffer that we'll use for positioning, textures later.
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

      // We only have a single shader program, so just get that setup now.
      this.gl.useProgram(this.program);
      this.gl.enableVertexAttribArray(this.a_position);
      this.gl.enableVertexAttribArray(this.a_texcoord);
    }

    /**
     * Compile a single shader
     * @param type The type of the shader. Use this.gl.VERTEX_SHADER or FRAGMENT_SHADER
     * @param source The string source of the shader.
     */
    compileShader(type: number, source: string): WebGLShader {
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
     */
    compileProgram(vs: string, fs: string): WebGLProgram {
      const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vs);
      const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fs);

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
     * Create a WebGL texture
     * @param canvas The source canvas. Dimensions do not matter.
     */
    createTexture(canvas: HTMLCanvasElement): WebGLTexture {
      const texture = this.gl.createTexture();
      if (!texture) {
        throw new Error('Cannot create texture');
      }
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
      return texture;
    }

    reset(scale: number) {
      // Scale the actual canvas
      this.canvas.width = scale * P.config.scale * 480;
      this.canvas.height = scale * P.config.scale * 360;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.globalScaleMatrix = P.m3.scaling(scale, scale);

      // Clear the canvas
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    drawChild(child: P.core.Base) {
      // Create the texture if it doesn't already exist.
      // We'll create a texture only once for performance, memory, etc.
      const costume = child.costumes[child.currentCostumeIndex] as WebGLCostume;
      if (!costume._glTexture) {
        const texture = this.createTexture(costume.image);
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
      P.m3.multiply(matrix, P.m3.translation(240 + child.scratchX, 180 - child.scratchY));
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

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    drawLayer(canvas: HTMLCanvasElement) {
      const texture = this.createTexture(canvas);
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
        // Only apply a filter if necessary, otherwise Firefox performance nosedives.
        if (filter !== '') {
          ctx.filter = filter;
        }
      }

      ctx.drawImage(costume.image, 0, 0);
      ctx.restore();
    }
  }

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
  }

}
