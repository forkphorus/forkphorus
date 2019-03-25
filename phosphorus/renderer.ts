/// <reference path="phosphorus.ts" />
/// <reference path="matrix.ts" />

namespace P.renderer {
  // Import aliases
  import RotationStyle = P.core.RotationStyle;

  export interface ProjectRenderer {
    /**
     * Resets and resizes the renderer
     */
    reset(scale: number): void;
    /**
     * Draws several Sprites or Stages at once, allowing for the renderer
     * to optimize the rendering.
     */
    drawChildren(children: P.core.Base[]): void;
    /**
     * Draws a Sprite or Stage on this renderer
     */
    drawChild(child: P.core.Base): void;
    drawLayer(canvas: HTMLCanvasElement): void;
  }

  export interface PenRenderer {
    /**
     * Draws a line
     * @param color Color of the line (canvas fillStyle)
     * @param size Width of the line (think radius)
     * @param x1 X coordinate of start, in the Scratch grid.
     * @param y1 Y coordinate of start, in the Scratch grid.
     * @param x2 X coordinate of end, in the Scratch grid.
     * @param y2 Y coordinate of end, in the Scratch grid.
     */
    drawLine(color: string, size: number, x1: number, y1: number, x2: number, y2: number): void;
    /**
     * Creates a pen dot.
     * @param color Color
     * @param size Radius
     * @param x X coordinate, in the Scratch grid.
     * @param y Y coordinate, in the Scratch grid.
     */
    dot(color: string, size: number, x: number, y: number): void;
    /**
     * Stamps a Sprite.
     */
    stamp(child: P.core.Sprite): void;
    /**
     * Resizes the renderer while preserving the canvas's content
     */
    resize(scale: number): void;
    /**
     * Clear the renderer
     */
    clear(): void;
  }

  interface WebGLCostume extends P.core.Costume {
    _glTexture: WebGLTexture;
  }

  const horizontalInvertMatrix = P.m3.scaling(-1, 1);

  export class WebGLProjectRenderer implements ProjectRenderer {
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

    public gl: WebGLRenderingContext;

    private program: WebGLProgram;
    private quadBuffer: WebGLBuffer;

    private a_position: number;
    private a_texcoord: number;
    private u_matrix: WebGLUniformLocation;
    private u_opacity: WebGLUniformLocation;

    constructor(public canvas: HTMLCanvasElement) {
      this.gl = canvas.getContext('webgl')!;

      this.program = this.compileProgram(WebGLProjectRenderer.vertexShader, WebGLProjectRenderer.fragmentShader);

      // Enable transparency blending.
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      // Cache attribute/uniform locations for later
      this.a_position = this.gl.getAttribLocation(this.program, 'a_position');
      this.a_texcoord = this.gl.getAttribLocation(this.program, 'a_texcoord');
      this.u_matrix = this.gl.getUniformLocation(this.program, 'u_matrix')!;
      this.u_opacity = this.gl.getUniformLocation(this.program, 'u_opacity')!;

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

    reset(scale: number) {
      this.canvas.width = scale * P.config.scale * 480;
      this.canvas.height = scale * P.config.scale * 360;

      // Clear the canvas
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

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

    drawChild(child: P.core.Base) {
      // Texture
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

      // TODO: do this in the shader
      var matrix = P.m3.projection(this.canvas.width, this.canvas.height);
      matrix = P.m3.multiply(matrix, P.m3.translation(240 + child.scratchX, 180 - child.scratchY));
      if (P.core.isSprite(child)) {
        if (child.rotationStyle === RotationStyle.Normal && child.direction !== 90) {
          matrix = P.m3.multiply(matrix, P.m3.rotation(90 - child.direction));
        } else if (child.rotationStyle === RotationStyle.LeftRight && child.direction < 0) {
          matrix = P.m3.multiply(matrix, horizontalInvertMatrix);
        }
        matrix = P.m3.multiply(matrix, P.m3.scaling(child.scale, child.scale));
      }
      matrix = P.m3.multiply(matrix, P.m3.scaling(costume.scale, costume.scale));
      matrix = P.m3.multiply(matrix, P.m3.translation(-costume.rotationCenterX, -costume.rotationCenterY));
      matrix = P.m3.multiply(matrix, P.m3.scaling(costume.image.width, costume.image.height));
      this.gl.uniformMatrix3fv(this.u_matrix, false, matrix);

      this.gl.uniform1f(this.u_opacity, 1 - child.filters.ghost / 100);

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    drawChildren(children: P.core.Base[]) {
      for (const child of children) {
        this.drawChild(child);
      }
    }

    drawLayer(canvas: HTMLCanvasElement) {
      const texture = this.createTexture(canvas);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
      this.gl.vertexAttribPointer(this.a_texcoord, 2, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
      this.gl.vertexAttribPointer(this.a_position, 2, this.gl.FLOAT, false, 0, 0);

      const matrix = P.m3.projection(this.canvas.width, this.canvas.height);
      this.gl.uniformMatrix3fv(this.u_matrix, false, matrix);

      this.gl.uniform1f(this.u_opacity, 1);

      this.gl.deleteTexture(texture);
    }
  }

  export class WebGLPenRednerer extends WebGLProjectRenderer implements PenRenderer {
    drawLine(color, size, x1, y1, x2, y2) {
      // TODO
    }

    dot(color, size, x, y) {
      // TODO
    }

    stamp(child) {
      // this.drawChild(child);
    }

    resize(scale) {
      // TODO
    }

    clear() {
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clearDepth(this.gl.COLOR_BUFFER_BIT);
    }
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

  export abstract class Base2DRenderer implements ProjectRenderer {
    public ctx: CanvasRenderingContext2D;
    public canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
      const ctx = canvas.getContext('2d')!;
      this.ctx = ctx;
      this.canvas = canvas;
    }

    /**
     * Resizes and clears the renderer
     */
    reset(scale: number) {
      const effectiveScale = scale * P.config.scale;
      this.canvas.width = 480 * effectiveScale;
      this.canvas.height = 360 * effectiveScale;
      this.ctx.scale(effectiveScale, effectiveScale);
    }

    drawImage(image: CanvasImageSource, x: number, y: number) {
      this.ctx.drawImage(image, x, y);
    }

    abstract drawChild(child: P.core.Base): void;

    drawChildren(children: P.core.Base[]): void {
      for (const child of children) {
        this.drawChild(child);
      }
    }

    drawLayer(canvas: HTMLCanvasElement) {
      this.ctx.drawImage(canvas, 0, 0, this.canvas.width, this.canvas.height);
    }
  }

  export class SpriteRenderer2D extends Base2DRenderer {
    public noEffects: boolean = false;

    drawChild(c: P.core.Base) {
      const costume = c.costumes[c.currentCostumeIndex];
      if (!costume) {
        return;
      }

      this.ctx.save();

      const scale = c.stage.zoom * P.config.scale;
      this.ctx.translate(((c.scratchX + 240) * scale | 0) / scale, ((180 - c.scratchY) * scale | 0) / scale);

      // Direction transforms are only applied to Sprites because Stages cannot be rotated.
      if (P.core.isSprite(c)) {
        if (c.rotationStyle === RotationStyle.Normal) {
          this.ctx.rotate((c.direction - 90) * Math.PI / 180);
        } else if (c.rotationStyle === RotationStyle.LeftRight && c.direction < 0) {
          this.ctx.scale(-1, 1);
        }
        this.ctx.scale(c.scale, c.scale);
      }

      this.ctx.scale(costume.scale, costume.scale);
      this.ctx.translate(-costume.rotationCenterX, -costume.rotationCenterY);

      if (!this.noEffects) {
        this.ctx.globalAlpha = Math.max(0, Math.min(1, 1 - c.filters.ghost / 100));

        const filter = cssFilter(c.filters);
        // Only apply a filter if necessary, otherwise Firefox performance nosedives.
        if (filter !== '') {
          this.ctx.filter = filter;
        }
      }

      this.ctx.drawImage(costume.image, 0, 0);
      this.ctx.restore();
    }
  }

  export class StageRenderer2D extends SpriteRenderer2D {
    constructor(canvas: HTMLCanvasElement, private stage: P.core.Stage) {
      super(canvas);
      // We handle effects in other ways, so forcibly disable SpriteRenderer's filters
      this.noEffects = true;
    }

    drawStage() {
      this.drawChild(this.stage);
      this.updateFilters();
    }

    updateFilters() {
      const filter = cssFilter(this.stage.filters);
      // Only reapply a CSS filter if it has changed for performance.
      // Might not be necessary here.
      if (this.canvas.style.filter !== filter) {
        this.canvas.style.filter = filter;
      }

      // cssFilter does not include ghost
      this.canvas.style.opacity = '' + Math.max(0, Math.min(1, 1 - this.stage.filters.ghost / 100));
    }
  }

  export class PenRenderer2D extends SpriteRenderer2D implements PenRenderer {
    private currentSize: number;

    drawLine(color: string, size: number, x1: number, y1: number, x2: number, y2: number) {
      this.ctx.lineCap = 'round';
      if (size % 2 > .5 && size % 2 < 1.5) {
        x1 -= .5;
        y1 -= .5;
        x2 -= .5;
        y2 -= .5;
      }
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = size;
      this.ctx.beginPath();
      this.ctx.moveTo(240 + x1, 180 - y1);
      this.ctx.lineTo(240 + x2, 180 - y2);
      this.ctx.stroke();
    }

    dot(color: string, size: number, x: number, y: number) {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(240 + x, 180 - y, size / 2, 0, 2 * Math.PI, false);
      this.ctx.fill();
    }

    stamp(child: core.Base) {
      this.drawChild(child);
    }

    resize(scale: number) {
      const cachedCanvas = document.createElement('canvas');
      cachedCanvas.width = this.canvas.width;
      cachedCanvas.height = this.canvas.height;
      cachedCanvas.getContext('2d')!.drawImage(this.canvas, 0, 0);
      super.reset(scale);
      this.ctx.drawImage(cachedCanvas, 0, 0, this.canvas.width, this.canvas.height);
    }

    clear() {
      this.canvas.width = this.canvas.width;
      this.canvas.height = this.canvas.height;
    }
  }
}
