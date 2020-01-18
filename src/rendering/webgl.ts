/// <reference path="../phosphorus.ts" />
/// <reference path="renderer.ts" />
/// <reference path="matrix.ts" />

namespace P.renderer.webgl {
  import RotationStyle = P.core.RotationStyle;

  function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    return canvas;
  }

  function filtersAffectShape(filters: P.core.Filters): boolean {
    return filters.fisheye !== 0 ||
      filters.mosaic !== 0 ||
      filters.pixelate !== 0 ||
      filters.whirl !== 0;
  }

  const horizontalInvertMatrix = P.m3.scaling(-1, 1);

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
     * Sets a uniform to a vec4
     * @param name The name of the uniform
     * @param a The first value
     * @param b The second value
     */
    uniform4f(name: string, a: number, b: number, c: number, d: number) {
      const location = this.getUniform(name);
      this.gl.uniform4f(location, a, b, c, d);
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

    uniform mat3 u_matrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
      v_texcoord = a_position;
    }
    `;

    public static fragmentShader: string = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;

    #ifdef ENABLE_BRIGHTNESS
      uniform float u_brightness;
    #endif
    #ifdef ENABLE_COLOR
      uniform float u_color;
    #endif
    #ifdef ENABLE_GHOST
      uniform float u_opacity;
    #endif
    #ifdef ENABLE_MOSAIC
      uniform float u_mosaic;
    #endif
    #ifdef ENABLE_WHIRL
      uniform float u_whirl;
    #endif
    #ifdef ENABLE_FISHEYE
      uniform float u_fisheye;
    #endif
    #ifdef ENABLE_PIXELATE
      uniform float u_pixelate;
      uniform vec2 u_size;
    #endif

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

      #ifdef ENABLE_MOSAIC
        texcoord = fract(u_mosaic * v_texcoord);
      #endif

      #ifdef ENABLE_PIXELATE
      if (u_pixelate != 0.0) {
        vec2 texelSize = u_size / u_pixelate;
        texcoord = (floor(texcoord * texelSize) + vecCenter) / texelSize;
      }
      #endif

      #ifdef ENABLE_WHIRL
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
      #endif

      #ifdef ENABLE_FISHEYE
      {
        vec2 vec = (texcoord - vecCenter) / vecCenter;
        float vecLength = length(vec);
        float r = pow(min(vecLength, 1.0), u_fisheye) * max(1.0, vecLength);
        vec2 unit = vec / vecLength;
        texcoord = vecCenter + r * unit * vecCenter;
      }
      #endif

      vec4 color = texture2D(u_texture, texcoord);
      if (color.a < minimumAlpha) {
        discard;
      }

      #ifdef ENABLE_GHOST
        color.a *= u_opacity;
      #endif

      #ifdef ENABLE_COLOR
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

      #ifdef ENABLE_BRIGHTNESS
        color.rgb = clamp(color.rgb + vec3(u_brightness), 0.0, 1.0);
      #endif

      gl_FragColor = color;
    }
    `;

    public canvas: HTMLCanvasElement;
    public gl: WebGLRenderingContext;

    protected quadBuffer: WebGLBuffer;

    protected globalScaleMatrix: P.m3.Matrix3 = P.m3.scaling(1, 1);

    protected allFiltersShader: ShaderVariant;
    protected noFiltersShader: ShaderVariant;

    private boundFramebuffer: WebGLFramebuffer | null = null;

    private costumeTextures: Map<P.core.ImageLOD, WebGLTexture> = new Map();

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

      this.noFiltersShader = this.compileVariant([]);

      this.allFiltersShader = this.compileVariant([
        'ENABLE_BRIGHTNESS',
        'ENABLE_COLOR',
        'ENABLE_GHOST',
        'ENABLE_FISHEYE',
        'ENABLE_MOSAIC',
        'ENABLE_PIXELATE',
      ]);

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
    protected compileShader(type: number, source: string, definitions?: string[]): WebGLShader {
      if (definitions) {
        for (const def of definitions) {
          source = '#define ' + def + '\n' + source;
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
    protected compileProgram(vs: string, fs: string, definitions?: string[]): WebGLProgram {
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
    protected compileVariant(definitions: string[]): ShaderVariant {
      const program = this.compileProgram(WebGLSpriteRenderer.vertexShader, WebGLSpriteRenderer.fragmentShader, definitions);
      return new ShaderVariant(this.gl, program);
    }

    /**
     * Creates a new texture without inserting data.
     * Texture will be bound to TEXTURE_2D, so you can texImage2D() on it
     */
    protected createTexture(): WebGLTexture {
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
    protected convertToTexture(canvas: HTMLImageElement | HTMLCanvasElement): WebGLTexture {
      const texture = this.createTexture();
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
      return texture;
    }

    /**
     * Creates a new framebuffer
     */
    protected createFramebuffer(): WebGLFramebuffer {
      const frameBuffer = this.gl.createFramebuffer();
      if (!frameBuffer) {
        throw new Error('cannot create frame buffer');
      }
      return frameBuffer;
    }

    protected bindFramebuffer(buffer: WebGLFramebuffer | null) {
      if (buffer === this.boundFramebuffer) {
        return;
      }
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, buffer);
      this.boundFramebuffer = buffer;
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
     * @param scale Zoom level
     */
    protected resetFramebuffer(scale: number) {
      this.gl.viewport(0, 0, 480 * scale, 360 * scale);
      // the first element of the matrix is the x-scale, so we can use that to only recreate the matrix when needed
      if (this.globalScaleMatrix[0] !== scale) {
        this.globalScaleMatrix = P.m3.scaling(scale, scale);
      }

      // Clear the canvas
      this.gl.clearColor(255, 255, 255, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    drawChild(child: P.core.Base) {
      this._drawChild(child, this.allFiltersShader);
    }

    /**
     * Real implementation of drawChild()
     * @param child The child to draw
     */
    protected _drawChild(child: P.core.Base, shader: ShaderVariant) {
      this.gl.useProgram(shader.program);

      // Create the texture if it doesn't already exist.
      // We'll create a texture only once for performance.
      const costume = child.costumes[child.currentCostumeIndex];
      const lod = costume.get(P.core.isSprite(child) ? child.scale : 1);
      if (!this.costumeTextures.has(lod)) {
        const texture = this.convertToTexture(lod.image);
        this.costumeTextures.set(lod, texture);
      }
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.costumeTextures.get(lod)!);

      shader.attributeBuffer('a_position', this.quadBuffer);

      // TODO: optimize
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

    /**
     * Draw a texture covering the entire screen
     * @param texture The texture to draw. Must belong to this renderer.
     */
    protected drawTextureOverlay(texture: WebGLTexture) {
      const shader = this.noFiltersShader;
      this.gl.useProgram(shader.program);

      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

      shader.attributeBuffer('a_position', this.quadBuffer);

      const matrix = P.m3.projection(this.canvas.width, this.canvas.height);
      P.m3.multiply(matrix, this.globalScaleMatrix);
      P.m3.multiply(matrix, P.m3.translation(240, 180));
      P.m3.multiply(matrix, P.m3.scaling(1, -1));
      P.m3.multiply(matrix, P.m3.translation(-240, -180));
      P.m3.multiply(matrix, P.m3.scaling(480, 360));

      shader.uniformMatrix3('u_matrix', matrix);

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
  }

  export class WebGLProjectRenderer extends WebGLSpriteRenderer implements ProjectRenderer {
    public static readonly PEN_DOT_VERTEX_SHADER = `
    attribute vec2 a_position;
    varying vec2 v_position;
    uniform mat3 u_matrix;
    void main() {
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
      v_position = a_position;
    }
    `;
    public static readonly PEN_DOT_FRAGMENT_SHADER = `
    precision mediump float;
    uniform vec4 u_color;
    varying vec2 v_position;
    void main() {
      float x = (v_position.x - 0.5) * 2.0;
      float y = (v_position.y - 0.5) * 2.0;
      if (sqrt(x * x + y * y) >= 1.0) {
        discard;
      }
      gl_FragColor = u_color;
    }
    `;
    public static readonly PEN_LINE_VERTEX_SHADER = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0, 1);
    }
    `
    public static readonly PEN_LINE_FRAGMENT_SHADER = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
    `;

    public penLayer: HTMLCanvasElement;
    public stageLayer: HTMLCanvasElement;
    public zoom: number = 1;

    protected penTexture: WebGLTexture;
    protected penBuffer: WebGLFramebuffer;

    protected fallbackRenderer: ProjectRenderer;
    protected shaderOnlyShapeFilters = this.compileVariant(['ONLY_SHAPE_FILTERS']);
    protected penDotShader: ShaderVariant;
    protected penLineShader: ShaderVariant;

    constructor(public stage: P.core.Stage) {
      super();

      this.fallbackRenderer = new P.renderer.canvas2d.ProjectRenderer2D(stage);

      this.penTexture = this.createTexture();
      this.penBuffer = this.createFramebuffer();
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 480, 360, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.penBuffer);
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.penTexture, 0);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

      this.penDotShader = new ShaderVariant(this.gl, this.compileProgram(
        WebGLProjectRenderer.PEN_DOT_VERTEX_SHADER,
        WebGLProjectRenderer.PEN_DOT_FRAGMENT_SHADER,
      ));
      this.penLineShader = new ShaderVariant(this.gl, this.compileProgram(
        WebGLProjectRenderer.PEN_LINE_VERTEX_SHADER,
        WebGLProjectRenderer.PEN_LINE_FRAGMENT_SHADER,
      ));

      this.reset(1);
    }

    drawFrame() {
      this.bindFramebuffer(null);
      this.reset(this.zoom);
      this.drawChild(this.stage);
      this.drawTextureOverlay(this.penTexture);
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

    onStageFiltersChanged() {
      // no-op; we always re-render the stage in full
    }

    penLine(color: P.core.PenColor, size: number, x: number, y: number, x2: number, y2: number): void {
      this.bindFramebuffer(this.penBuffer);

      const shader = this.penLineShader;
      this.gl.useProgram(shader.program);

      const buffer = this.gl.createBuffer();
      if (buffer === null) {
        throw new Error('buffer is null');
      }
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
        x / 240, y / 180,
        x2 / 240, y2 / 180,
      ]), this.gl.STATIC_DRAW);
      shader.attributeBuffer('a_position', buffer);

      const parts = color.toParts();
      shader.uniform4f('u_color', parts[0], parts[1], parts[2], parts[3]);
      this.gl.drawArrays(this.gl.LINES, 0, 2);

      this.gl.deleteBuffer(buffer);
    }

    penDot(color: P.core.PenColor, size: number, x: number, y: number): void {
      this.bindFramebuffer(this.penBuffer);

      const shader = this.penDotShader;
      this.gl.useProgram(shader.program);

      shader.attributeBuffer('a_position', this.quadBuffer);
      const matrix = P.m3.projection(this.canvas.width, this.canvas.height);
      P.m3.multiply(matrix, P.m3.translation(240 + x - size / 2 | 0, 180 - y - size / 2 | 0));
      P.m3.multiply(matrix, P.m3.scaling(size, size));
      shader.uniformMatrix3('u_matrix', matrix);

      const parts = color.toParts();
      shader.uniform4f('u_color', parts[0], parts[1], parts[2], parts[3]);

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    penStamp(sprite: P.core.Sprite): void {
      this.bindFramebuffer(this.penBuffer);
      this.drawChild(sprite);
    }

    penClear(): void {
      this.bindFramebuffer(this.penBuffer);
      this.gl.clearColor(255, 255, 255, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    resize(scale: number): void {
      this.zoom = scale;
      // TODO: resize pen layer
    }

    spriteTouchesPoint(sprite: core.Sprite, x: number, y: number): boolean {
      // If filters will not change the shape of the sprite, it would be faster
      // to avoid going to the GPU
      if (!filtersAffectShape(sprite.filters)) {
        return this.fallbackRenderer.spriteTouchesPoint(sprite, x, y);
      }

      const texture = this.createTexture();
      const framebuffer = this.createFramebuffer();
      this.bindFramebuffer(framebuffer);
      this.resetFramebuffer(1);

      this._drawChild(sprite, this.shaderOnlyShapeFilters);

      // Allocate 4 bytes to store 1 RGBA pixel
      const result = new Uint8Array(4);
      // Coordinates are in pixels from the lower left corner
      // We only care about 1 pixel, the pixel at the mouse cursor.
      this.gl.readPixels(240 + x | 0, 180 + y | 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, result);

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
}