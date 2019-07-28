/// <reference path="phosphorus.ts" />
/// <reference path="matrix.ts" />

namespace P.renderer {
  // Import aliases
  import RotationStyle = P.core.RotationStyle;

  export interface SpriteRenderer {
    canvas: HTMLCanvasElement;
    /**
     * Draws a Sprite or Stage on this renderer
     */
    drawChild(child: P.core.Base): void;
  }

  export interface ProjectRenderer extends SpriteRenderer {
    /**
     * The stage that this renderer is used by.
     * This renderer must only be used by this stage and with sprites within this stage.
     */
    stage: P.core.Stage;
    /**
     * Reset and draw a frame.
     */
    drawFrame(scale: number): void;
    /**
     * Initialize this renderer and append its canvas(es) to a given root node.
     */
    init(root: HTMLElement): void;
    /**
     * Draws a line on the pen canvas
     * @param color Color of the line
     * @param size Width of the line
     * @param x Starting X coordinate in the Scratch coordinate grid
     * @param y Starting Y coordinate in the Scratch coordinate grid
     * @param x2 Ending X coordinate in the Scratch coordinate grid
     * @param y2 Starting Y coordinate in the Scratch coordinate grid
     */
    penLine(color: string, size: number, x: number, y: number, x2: number, y2: number): void;
    /**
     * Draws a circular dot on the pen canvas
     * @param color Color of the dot
     * @param size Diameter of the circle
     * @param x Central X coordinate in the Scratch coordinate grid
     * @param y Central Y coordinate in the Scratch coordinate grid
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
     * Notifies the renderer that the pen layer should be resized.
     * The renderer will do so eventually; not necessarily immediately.
     */
    penResize(scale: number): void;
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
     * Determines if one Sprite's color touches another Sprite's color
     * @param sprite The sprite
     * @param spriteColor The color on the Sprite
     * @param otherColor The color on the rest of the stage
     */
    spriteColorTouchesColor(sprite: P.core.Base, spriteColor: number, otherColor: number): boolean;
  }

  // HELPERS

  /**
   * Create an HTML canvas with any type of context.
   */
  function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    return canvas;
  }

  /**
   * Create an HTML canvas with a 2d context.
   * Throws an error if a context cannot be obtained.
   */
  function create2dCanvas(): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2d rendering context');
    }
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  /**
   * Determines if a Sprite's filters will change its shape.
   * @param filters The Sprite's filters
   */
  function filtersAffectShape(filters: P.core.Filters): boolean {
    return filters.fisheye !== 0 ||
      filters.mosaic !== 0 ||
      filters.pixelate !== 0 ||
      filters.whirl !== 0;
  }

  // WEBGL

  // Used in the WebGL renderer for inverting sprites.
  const horizontalInvertMatrix = P.m3.scaling(-1, 1);

  // Extension of Costume to store the webgl textures
  interface WebGLCostume extends P.core.Costume {
    _glTexture: WebGLTexture;
  }

  class ShaderVariant {
    protected uniformLocations: {[name: string]: WebGLUniformLocation} = {};
    protected attributeLocations: {[name: string]: number} = {};

    constructor(public gl: WebGLRenderingContext, public program: WebGLProgram) {
      // When loaded we'll lookup all of our attributes and uniforms, and store
      // their locations locally.
      // WebGL can tell us how many there are, so we can do lookups.

      const activeUniforms: number = gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
      for (let index = 0; index < activeUniforms; index++) {
        const info = gl.getActiveUniform(program, index);
        if (!info) {
          throw new Error('uniform at index ' + index + ' does not exist');
        }
        const name = info.name;
        const location = gl.getUniformLocation(program, name);
        if (!location) {
          throw new Error('uniform named ' + name + ' does not exist');
        }
        this.uniformLocations[name] = location;
      }

      const activeAttributes: number = gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
      for (let index = 0; index < activeAttributes; index++) {
        const info = gl.getActiveAttrib(program, index);
        if (!info) {
          throw new Error('attribute at index ' + index + ' does not exist');
        }
        // Attribute index is location, I believe.
        this.attributeLocations[info.name] = index;
      }
    }

    /**
     * Sets a uniform to a float
     * @param name The name of the uniform
     * @param value A float
     */
    uniform1f(name: string, value: number) {
      const location = this.getUniform(name);
      this.gl.uniform1f(location, value);
    }

    /**
     * Sets a uniform to a vec2
     * @param name The name of the uniform
     * @param a The first value
     * @param b The second value
     */
    uniform2f(name: string, a: number, b: number) {
      const location = this.getUniform(name);
      this.gl.uniform2f(location, a, b);
    }

    /**
     * Sets a uniform to a 3x3 matrix
     * @param name The name of the uniform
     * @param value The 3x3 matrix
     */
    uniformMatrix3(name: string, value: P.m3.Matrix3) {
      const location = this.getUniform(name);
      this.gl.uniformMatrix3fv(location, false, value);
    }

    /**
     * Determines if this shader variant contains a uniform.
     * @param name The name of the uniform
     */
    hasUniform(name: string) {
      return this.uniformLocations.hasOwnProperty(name);
    }

    /**
     * Determines the location of a uniform, or errors if it does not exist.
     * @param name The name of the uniform
     */
    getUniform(name: string): WebGLUniformLocation {
      if (!this.hasUniform(name)) {
        throw new Error('uniform of name ' + name + ' does not exist');
      }
      return this.uniformLocations[name];
    }

    /**
     * Binds a buffer to an attribute
     * @param name The name of the attribute
     * @param value The WebGL buffer to bind
     */
    attributeBuffer(name: string, value: WebGLBuffer) {
      if (!this.hasAttribute(name)) {
        throw new Error('attribute of name ' + name + ' does not exist');
      }
      const location = this.attributeLocations[name];
      this.gl.enableVertexAttribArray(location);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, value);
      this.gl.vertexAttribPointer(location, 2, this.gl.FLOAT, false, 0, 0);
    }

    /**
     * Determines if this shader contains an attribute
     * @param name The name of the attribute
     */
    hasAttribute(name: string) {
      return this.attributeLocations.hasOwnProperty(name);
    }

    /**
     * Determines the location of an attribute, and errors if it does not exist.
     * @param name The name of the attribute
     */
    getAttribute(name: string) {
      if (!this.hasAttribute(name)) {
        throw new Error('attribute of name ' + name + ' does not exist');
      }
      return this.attributeLocations[name];
    }
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
    #ifndef ONLY_SHAPE_FILTERS
      uniform float u_brightness;
      uniform float u_color;
    #endif
    uniform float u_opacity;
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
      {
        texcoord = fract(u_mosaic * v_texcoord);
      }

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
      #ifndef ONLY_SHAPE_FILTERS
        color.rgb = clamp(color.rgb + vec3(u_brightness), 0.0, 1.0);
      #endif

      // The color effect is rather complicated. See:
      // https://github.com/LLK/scratch-render/blob/008dc5b15b30961301e6b9a08628a063b967a001/src/shaders/sprite.frag#L175-L189
      #ifndef ONLY_SHAPE_FILTERS
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
      #endif

      gl_FragColor = color;
    }
    `;

    public canvas: HTMLCanvasElement;
    public gl: WebGLRenderingContext;

    protected quadBuffer: WebGLBuffer;
    protected globalScaleMatrix: P.m3.Matrix3;
    protected renderingShader: ShaderVariant;

    constructor() {
      this.canvas = createCanvas();
      const gl = this.canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
      });
      if (!gl) {
        throw new Error('cannot get webgl rendering context');
      }
      this.gl = gl;

      this.renderingShader = this.compileVariant([]);

      // Enable blending
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

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
     * Compiles a variant of the default shader.
     * @param definitions Things to define in the shader
     */
    compileVariant(definitions: string[]): ShaderVariant {
      const program = this.compileProgram(WebGLSpriteRenderer.vertexShader, WebGLSpriteRenderer.fragmentShader, definitions);
      return new ShaderVariant(this.gl, program);
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
     * Creates a new framebuffer
     */
    createFramebuffer(): WebGLFramebuffer {
      const frameBuffer = this.gl.createFramebuffer();
      if (!frameBuffer) {
        throw new Error('cannot create frame buffer');
      }
      return frameBuffer;
    }

    /**
     * Reset and resize this renderer.
     */
    reset(scale: number) {
      this.canvas.width = scale * P.config.scale * 480;
      this.canvas.height = scale * P.config.scale * 360;
      this.resetFramebuffer(scale);
    }

    /**
     * Resizes and resets the current framebuffer
     * @param scale Scale
     */
    resetFramebuffer(scale: number) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.globalScaleMatrix = P.m3.scaling(scale, scale);

      // Clear the canvas
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    drawChild(child: P.core.Base) {
      this._drawChild(child, this.renderingShader);
    }

    /**
     * Real implementation of drawChild()
     * @param child The child to draw
     */
    _drawChild(child: P.core.Base, shader: ShaderVariant) {
      this.gl.useProgram(shader.program);

      // Create the texture if it doesn't already exist.
      // We'll create a texture only once for performance.
      const costume = child.costumes[child.currentCostumeIndex] as WebGLCostume;
      if (!costume._glTexture) {
        const texture = this.convertToTexture(costume.get(1));
        costume._glTexture = texture;
      }
      this.gl.bindTexture(this.gl.TEXTURE_2D, costume._glTexture);

      shader.attributeBuffer('a_texcoord', this.quadBuffer);
      shader.attributeBuffer('a_position', this.quadBuffer);

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
      P.m3.multiply(matrix, P.m3.scaling(costume.width, costume.height));

      shader.uniformMatrix3('u_matrix', matrix);

      // Effects
      if (shader.hasUniform('u_opacity')) {
        shader.uniform1f('u_opacity', 1 - child.filters.ghost / 100);
      }
      if (shader.hasUniform('u_brightness')) {
        shader.uniform1f('u_brightness', child.filters.brightness / 100);
      }
      if (shader.hasUniform('u_color')) {
        shader.uniform1f('u_color', child.filters.color / 200);
      }
      if (shader.hasUniform('u_mosaic')) {
        const mosaic = Math.round((Math.abs(child.filters.mosaic) + 10) / 10);
        shader.uniform1f('u_mosaic', P.utils.clamp(mosaic, 1, 512));
      }
      if (shader.hasUniform('u_whirl')) {
        shader.uniform1f('u_whirl', child.filters.whirl * Math.PI / -180);
      }
      if (shader.hasUniform('u_fisheye')) {
        shader.uniform1f('u_fisheye', Math.max(0, (child.filters.fisheye + 100) / 100));
      }
      if (shader.hasUniform('u_pixelate')) {
        shader.uniform1f('u_pixelate', Math.abs(child.filters.pixelate) / 10);
      }
      if (shader.hasUniform('u_size')) {
        shader.uniform2f('u_size', costume.width, costume.height);
      }

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    drawTexture(texture: WebGLTexture) {
      const shader = this.renderingShader;
      this.gl.useProgram(shader.program);

      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

      shader.attributeBuffer('a_texcoord', this.quadBuffer);
      shader.attributeBuffer('a_position', this.quadBuffer);

      const matrix = P.m3.projection(this.canvas.width, this.canvas.height);
      P.m3.multiply(matrix, this.globalScaleMatrix);
      P.m3.multiply(matrix, P.m3.translation(240, 180));
      P.m3.multiply(matrix, P.m3.scaling(1, -1));
      P.m3.multiply(matrix, P.m3.translation(-240, -180));
      P.m3.multiply(matrix, P.m3.scaling(480, 360));

      shader.uniformMatrix3('u_matrix', matrix);

      // Effects
      if (shader.hasUniform('u_opacity')) {
        shader.uniform1f('u_opacity', 1 - 0 / 100);
      }
      if (shader.hasUniform('u_brightness')) {
        shader.uniform1f('u_brightness', 0 / 100);
      }
      if (shader.hasUniform('u_color')) {
        shader.uniform1f('u_color', 0 / 200);
      }
      if (shader.hasUniform('u_mosaic')) {
        const mosaic = Math.round((Math.abs(0) + 10) / 10);
        shader.uniform1f('u_mosaic', P.utils.clamp(mosaic, 1, 512));
      }
      if (shader.hasUniform('u_whirl')) {
        shader.uniform1f('u_whirl', 0 * Math.PI / -180);
      }
      if (shader.hasUniform('u_fisheye')) {
        shader.uniform1f('u_fisheye', Math.max(0, (0 + 100) / 100));
      }
      if (shader.hasUniform('u_pixelate')) {
        shader.uniform1f('u_pixelate', Math.abs(0) / 10);
      }
      if (shader.hasUniform('u_size')) {
        shader.uniform2f('u_size', 480, 360);
      }

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    drawLayer(canvas: HTMLCanvasElement) {
      const shader = this.renderingShader;
      this.gl.useProgram(shader.program);

      const texture = this.convertToTexture(canvas);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

      shader.attributeBuffer('a_texcoord', this.quadBuffer);
      shader.attributeBuffer('a_position', this.quadBuffer);

      const matrix = P.m3.projection(this.canvas.width, this.canvas.height);
      P.m3.multiply(matrix, this.globalScaleMatrix);

      shader.uniformMatrix3('u_matrix', matrix);
      shader.uniform1f('u_opacity', 1);

      // TODO: is it necessary to delete textures?
      this.gl.deleteTexture(texture);
    }
  }

  export class WebGLProjectRenderer extends WebGLSpriteRenderer implements ProjectRenderer {
    public penLayer: HTMLCanvasElement;
    public stageLayer: HTMLCanvasElement;

    protected penTexture: WebGLTexture;
    protected penBuffer: WebGLFramebuffer;

    protected fallbackRenderer: ProjectRenderer;
    protected shaderOnlyShapeFilters = this.compileVariant(['ONLY_SHAPE_FILTERS']);

    constructor(public stage: P.core.Stage) {
      super();

      this.fallbackRenderer = new ProjectRenderer2D(stage);

      this.penTexture = this.createTexture();
      this.penBuffer = this.createFramebuffer();
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 480, 360, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.penBuffer);
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.penTexture, 0);

      this.reset(1);
    }

    drawFrame(scale: number) {
      this.reset(scale);
      this.drawChild(this.stage);
      this.drawTexture(this.penTexture);
      for (var i = 0; i < this.stage.children.length; i++) {
        var child = this.stage.children[i];
        if (!child.visible) {
          continue;
        }
        this.drawChild(child);
      }
    }

    init(root: HTMLElement) {
      root.appendChild(this.canvas);
    }

    penLine(color: string, size: number, x: number, y: number, x2: number, y2: number): void {
      // this.fallbackRenderer.penLine(color, size, x, y, x2, y2);
    }

    penDot(color: string, size: number, x: number, y: number): void {
      // this.fallbackRenderer.penDot(color, size, x, y);
    }

    penStamp(sprite: P.core.Sprite): void {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.penBuffer);
      this.gl.viewport(0, 0, 480, 360);
      this.drawChild(sprite);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    penClear(): void {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.penBuffer);
      // this.fallbackRenderer.penClear();
    }

    penResize(scale: number): void {
      // this.fallbackRenderer.penResize(scale);
    }

    spriteTouchesPoint(sprite: core.Sprite, x: number, y: number): boolean {
      // If filters will not change the shape of the sprite, it would be faster
      // to avoid going to the GPU
      if (!filtersAffectShape(sprite.filters)) {
        return this.fallbackRenderer.spriteTouchesPoint(sprite, x, y);
      }

      const texture = this.createTexture();
      const framebuffer = this.createFramebuffer();
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
      this.resetFramebuffer(1);

      this._drawChild(sprite, this.shaderOnlyShapeFilters);

      // Allocate 4 bytes to store 1 RGBA pixel
      const result = new Uint8Array(4);
      // Coordinates are in pixels from the lower left corner
      // We only care about 1 pixel, the pixel at the mouse cursor.
      this.gl.readPixels(240 + x | 0, 180 + y | 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, result);

      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

      // I don't know if it's necessary to delete these
      this.gl.deleteTexture(texture);
      this.gl.deleteFramebuffer(framebuffer);

      // Just look for a non-zero alpha channel
      return result[3] !== 0;
    }

    spritesIntersect(spriteA: core.Sprite, otherSprites: core.Base[]): boolean {
      return this.fallbackRenderer.spritesIntersect(spriteA, otherSprites);
    }

    spriteTouchesColor(sprite: core.Base, color: number): boolean {
      return this.fallbackRenderer.spriteTouchesColor(sprite, color);
    }

    spriteColorTouchesColor(sprite: core.Base, spriteColor: number, otherColor: number): boolean {
      return this.fallbackRenderer.spriteColorTouchesColor(sprite, spriteColor, otherColor);
    }
  }

  /**
   * Creates the CSS filter for a Filter object.
   * The filter is generally an estimation of the actual effect.
   * Includes brightness and color. (does not include ghost)
   */
  function getCSSFilter(filters: P.core.Filters) {
    let filter = '';
    if (filters.brightness) {
      filter += 'brightness(' + (100 + filters.brightness) + '%) ';
    }
    if (filters.color) {
      filter += 'hue-rotate(' + (filters.color / 200 * 360) + 'deg) ';
    }
    return filter;
  }

  export class SpriteRenderer2D implements SpriteRenderer {
    public ctx: CanvasRenderingContext2D;
    public canvas: HTMLCanvasElement;
    public noEffects: boolean = false;

    constructor() {
      const { canvas, ctx } = create2dCanvas();
      this.canvas = canvas;
      this.ctx = ctx;
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

    drawScene(stage: P.core.Stage, skip?: P.core.Base) {
      for (var i = 0; i < stage.children.length; i++) {
        var child = stage.children[i];
        if (!child.visible || child === skip) {
          continue;
        }
        this.drawChild(child);
      }
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

      const globalScale = c.stage.zoom * P.config.scale;
      ctx.translate(((c.scratchX + 240) * globalScale | 0) / globalScale, ((180 - c.scratchY) * globalScale | 0) / globalScale);

      let objectScale = costume.scale;
      // Direction transforms are only applied to Sprites because Stages cannot be rotated.
      if (P.core.isSprite(c)) {
        if (c.rotationStyle === RotationStyle.Normal) {
          ctx.rotate((c.direction - 90) * Math.PI / 180);
        } else if (c.rotationStyle === RotationStyle.LeftRight && c.direction < 0) {
          ctx.scale(-1, 1);
        }
        objectScale *= c.scale;
      }

      if (!this.noEffects) {
        ctx.globalAlpha = Math.max(0, Math.min(1, 1 - c.filters.ghost / 100));

        const filter = getCSSFilter(c.filters);
        // Only apply a filter when needed because of a Firefox performance bug
        if (filter !== '') {
          ctx.filter = filter;
        }
      }

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(costume.get(objectScale * c.stage.zoom), -costume.rotationCenterX * objectScale, -costume.rotationCenterY * objectScale, costume.width * objectScale, costume.height * objectScale);
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

    private penLayerModified: boolean = false;
    private penLayerTargetScale: number = -1;
    private penLayerMaxScale: number = -1;

    constructor(public stage: P.core.Stage) {
      super();
      const { ctx: stageContext, canvas: stageLayer } = create2dCanvas();
      this.stageContext = stageContext;
      this.stageLayer = stageLayer;

      const { ctx: penContext, canvas: penLayer } = create2dCanvas();
      this.penContext = penContext;
      this.penLayer = penLayer;
    }

    updateStage(scale: number) {
      this._reset(this.stageContext, scale);
      this.noEffects = true;
      this._drawChild(this.stage, this.stageContext);
      this.noEffects = false;
      this.updateStageFilters();
    }

    updateStageFilters() {
      const filter = getCSSFilter(this.stage.filters);
      // Only reapply a CSS filter if it has changed for performance.
      // Might not be necessary here.
      if (this.stageLayer.style.filter !== filter) {
        this.stageLayer.style.filter = filter;
      }

      // cssFilter does not include ghost
      this.stageLayer.style.opacity = '' + Math.max(0, Math.min(1, 1 - this.stage.filters.ghost / 100));
    }

    init(root: HTMLCanvasElement) {
      root.appendChild(this.stageLayer);
      root.appendChild(this.penLayer);
      root.appendChild(this.canvas);
    }

    drawFrame(scale: number) {
      this.reset(scale);
      this.drawScene(this.stage);
      // TODO: don't update stage every frame
      this.updateStage(scale);
    }

    penClear() {
      this.penLayerModified = false;
      if (this.penLayerTargetScale !== -1) {
        this._reset(this.penContext, this.penLayerTargetScale);
        this.penLayerTargetScale = -1;
      }
      this.penContext.clearRect(0, 0, 480, 360);
    }

    penResize(scale: number) {
      if (scale > this.penLayerMaxScale) {
        // Immediately scale up
        this.penLayerMaxScale = scale;
        const cachedCanvas = document.createElement('canvas');
        cachedCanvas.width = this.penLayer.width;
        cachedCanvas.height = this.penLayer.height;
        cachedCanvas.getContext('2d')!.drawImage(this.penLayer, 0, 0);
        this._reset(this.penContext, scale);
        this.penContext.drawImage(cachedCanvas, 0, 0, 480, 360);
      } else if (!this.penLayerModified) {
        // Immediately scale down if no changes have been made
        this._reset(this.penContext, scale);
      } else {
        // Attempt again later
        this.penLayerTargetScale = scale;
      }
    }

    penDot(color: string, size: number, x: number, y: number) {
      this.penLayerModified = true;
      this.penContext.fillStyle = color;
      this.penContext.beginPath();
      this.penContext.arc(240 + x, 180 - y, size / 2, 0, 2 * Math.PI, false);
      this.penContext.fill();
    }

    penLine(color: string, size: number, x1: number, y1: number, x2: number, y2: number) {
      this.penLayerModified = true;
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
      this.penLayerModified = true;
      this._drawChild(sprite, this.penContext);
    }

    spriteTouchesPoint(sprite: P.core.Sprite, x: number, y: number) {
      const bounds = sprite.rotatedBounds();
      if (x < bounds.left || y < bounds.bottom || x > bounds.right || y > bounds.top) {
        return false;
      }

      const costume = sprite.costumes[sprite.currentCostumeIndex];
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
      const data = costume.getContext().getImageData(positionX, positionY, 1, 1).data;
      return data[3] !== 0;
    }

    spritesIntersect(spriteA: core.Base, otherSprites: core.Base[]) {
      const mb = spriteA.rotatedBounds();

      for (var i = 0; i < otherSprites.length; i++) {
        const spriteB = otherSprites[i];
        if (!spriteB.visible) continue;

        const ob = spriteB.rotatedBounds();

        if (mb.bottom >= ob.top || ob.bottom >= mb.top || mb.left >= ob.right || ob.left >= mb.right) {
          continue;
        }

        const left = Math.max(mb.left, ob.left);
        const top = Math.min(mb.top, ob.top);
        const right = Math.min(mb.right, ob.right);
        const bottom = Math.max(mb.bottom, ob.bottom);

        const width = right - left;
        const height = top - bottom;

        // dimensions that are less than 1 or are NaN will throw when we try to get image data
        if (width < 1 || height < 1 || width !== width || height !== height) {
          continue;
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
      }
      return false;
    }

    spriteTouchesColor(sprite: P.core.Base, color: number) {
      const b = sprite.rotatedBounds();

      workingRenderer.canvas.width = b.right - b.left;
      workingRenderer.canvas.height = b.top - b.bottom;

      workingRenderer.ctx.save();
      workingRenderer.ctx.translate(-(240 + b.left), -(180 - b.top));

      workingRenderer.drawScene(this.stage, sprite);
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

      workingRenderer.drawScene(this.stage, sprite);
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
