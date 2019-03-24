/// <reference path="phosphorus.ts" />
/// <reference path="matrix.ts" />

namespace P.renderer {
  // Import aliases
  import RotationStyle = P.core.RotationStyle;

  export interface Renderer {
    /**
     * Resets and resizes the renderer
     */
    reset(scale: number): void;
    drawChildren(children: P.core.Base[]): void;
    drawChild(child: P.core.Base): void;
  }

  interface WebGLCostume extends P.core.Costume {
    _texture: WebGLTexture;
  }

  export class WebGLRenderer implements Renderer {
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

    void main() {
      gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    `;

    public gl: WebGLRenderingContext;

    private program: WebGLProgram;

    private a_position: number;
    private a_texcoord: number;
    private u_matrix: WebGLUniformLocation;

    private texCoordsBuffer: WebGLBuffer;
    private positionBuffer: WebGLBuffer;

    constructor(public canvas: HTMLCanvasElement) {
      this.gl = canvas.getContext('webgl')!;
      this.gl.clearColor(0, 0, 0, 1);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      this.program = this.compileProgram(WebGLRenderer.vertexShader, WebGLRenderer.fragmentShader);

      // Enable transparency blending.
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      // Cache attribute/uniform locations for later
      this.a_position = this.gl.getAttribLocation(this.program, 'a_position');
      this.a_texcoord = this.gl.getAttribLocation(this.program, 'a_texcoord');
      this.u_matrix = this.gl.getUniformLocation(this.program, 'u_matrix')!;

      this.texCoordsBuffer = this.gl.createBuffer()!;
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordsBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
      ]), this.gl.STATIC_DRAW);

      this.positionBuffer = this.gl.createBuffer()!;
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
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
        const error = this.gl.getProgramInfoLog(shader);
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
      this.canvas.width = scale * 480;
      this.canvas.height = scale * 360;

      // Clear the canvas
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    createTexture(costume: P.core.Costume): WebGLTexture {
      const texture = this.gl.createTexture();
      if (!texture) {
        throw new Error('Cannot create texture');
      }
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, costume.image);
      return texture;
    }

    drawChild(child: P.core.Base) {
      // Texture
      const costume = child.costumes[child.currentCostumeIndex] as WebGLCostume;
      if (!costume._texture) {
        const texture = this.createTexture(costume);
        costume._texture = texture;
      }
      this.gl.bindTexture(this.gl.TEXTURE_2D, costume._texture);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordsBuffer);
      this.gl.vertexAttribPointer(this.a_texcoord, 2, this.gl.FLOAT, false, 0, 0);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.vertexAttribPointer(this.a_position, 2, this.gl.FLOAT, false, 0, 0);

      // TODO: do this in the shader
      var matrix = P.m3.projection(this.canvas.width, this.canvas.height);
      matrix = P.m3.multiply(matrix, P.m3.translation(240 + child.scratchX, 180 - child.scratchY));
      if (P.core.isSprite(child)) {
        matrix = P.m3.multiply(matrix, P.m3.rotation(90 - child.direction));
        matrix = P.m3.multiply(matrix, P.m3.scaling(child.scale, child.scale));
      }
      matrix = P.m3.multiply(matrix, P.m3.scaling(costume.scale, costume.scale));
      matrix = P.m3.multiply(matrix, P.m3.translation(-costume.rotationCenterX, -costume.rotationCenterY));
      matrix = P.m3.multiply(matrix, P.m3.scaling(costume.image.width, costume.image.height));

      this.gl.uniformMatrix3fv(this.u_matrix, false, new Float32Array(matrix));

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    drawChildren(children: P.core.Base[]) {
      for (const child of children) {
        this.drawChild(child);
      }
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

  export abstract class Base2DRenderer implements Renderer {
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
  }

  /**
   * A renderer for drawing sprites (or stages)
   */
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

  /**
   * A renderer specifically for the backdrop of a Stage.
   */
  export class StageRenderer extends SpriteRenderer2D {
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
}
