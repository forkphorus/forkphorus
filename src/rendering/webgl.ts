/// <reference path="../phosphorus.ts" />
/// <reference path="renderer.ts" />
/// <reference path="matrix.ts" />

namespace P.renderer.webgl {
  import RotationStyle = P.core.RotationStyle;

  const horizontalInvertMatrix = P.m3.scaling(-1, 1);

  class Shaders {
    public static spriteVshSrc = `
    attribute vec2 a_position;
    uniform mat3 u_matrix;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
      v_texcoord = a_position;
    }
    `;
    public static spriteFshSrc = `
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
    #ifdef ENABLE_COLOR_TEST
      uniform vec3 u_colorTest;
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
      if (u_mosaic != 1.0) {
        texcoord = fract(u_mosaic * v_texcoord);
      }
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
      color.rgb /= color.w;
      #ifndef DISABLE_MINIMUM_ALPHA
      if (color.a < minimumAlpha) {
        discard;
      }
      #endif
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
      #ifdef ENABLE_COLOR_TEST
        if (floor(color.rgb/256.0*255.0*vec3(32.0, 32.0, 16.0)) != u_colorTest) {
          discard;
        }
      #endif
      gl_FragColor = color;
    }
    `;
    public static penVshSrc = `
    precision mediump float;
    // [0] = x1
    // [1] = y1
    // [2] = x2
    // [3] = y2
    attribute vec4 a_vertexData;
    // [0] = thickened vertex direction
    // [1] = thickened vertex distance
    attribute vec2 a_lineData;
    // [0] = red
    // [1] = green
    // [2] = blue
    // [3] = alpha
    attribute vec4 a_color;
    varying vec4 v_color;
    void main() {
      vec2 lineDir = normalize(a_vertexData.zw - a_vertexData.xy);
      mat2 rot;
      rot[0] = vec2(cos(a_lineData.x), sin(a_lineData.x));
      rot[1] = vec2(-sin(a_lineData.x), cos(a_lineData.x));
      lineDir *= rot * a_lineData.y;
      vec2 p = (a_vertexData.xy + lineDir);
      p.x /= 240.0;
      p.y /= 180.0;
      gl_Position = vec4(p, 0.0, 1.0);
      v_color = vec4(a_color.xyz / 255.0, a_color.w);
    }`;
    public static penFshSrc = `
    precision mediump float;
    varying vec4 v_color;
    void main() {
      gl_FragColor = v_color;
    }`;

    private gl: WebGLRenderingContext;

    public noEffects: Shader;
    public allEffects: Shader;
    public pen: Shader;
    public shapeEffects: Shader;
    public touchingColorAllEffectsExceptGhost: Shader;
    public touchingColorNoEffects: Shader;

    constructor(gl: WebGLRenderingContext) {
      this.gl = gl;
      this.noEffects = this.createShader(Shaders.spriteVshSrc, Shaders.spriteFshSrc);
      this.allEffects = this.createShader(Shaders.spriteVshSrc, Shaders.spriteFshSrc, [
        'ENABLE_BRIGHTNESS',
        'ENABLE_COLOR',
        'ENABLE_GHOST',
        'ENABLE_FISHEYE',
        'ENABLE_MOSAIC',
        'ENABLE_PIXELATE',
        'ENABLE_WHIRL',
      ]);
      this.pen = this.createShader(Shaders.penVshSrc, Shaders.penFshSrc);
      this.shapeEffects = this.createShader(Shaders.spriteVshSrc, Shaders.spriteFshSrc, [
        'ENABLE_FISHEYE',
        'ENABLE_PIXELATE',
        'ENABLE_MOSAIC',
        'ENABLE_WHIRL',
      ]);
      this.touchingColorAllEffectsExceptGhost = this.createShader(Shaders.spriteVshSrc, Shaders.spriteFshSrc, [
        'ENABLE_BRIGHTNESS',
        'ENABLE_COLOR',
        'ENABLE_FISHEYE',
        'ENABLE_MOSAIC',
        'ENABLE_PIXELATE',
        'ENABLE_WHIRL',
        'ENABLE_COLOR_TEST',
      ]);
      this.touchingColorNoEffects = this.createShader(Shaders.spriteVshSrc, Shaders.spriteFshSrc, [
        'ENABLE_COLOR_TEST',
      ]);
    }

    /**
     * Compile a single shader
     * @param type The type of the shader. Use this.gl.VERTEX_SHADER or FRAGMENT_SHADER
     * @param source The string source of the shader.
     * @param definitions Flags to define in the shader source.
     */
    private compileShader(type: number, source: string, definitions?: string[]): WebGLShader {
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
     * @param definitions Flags to define in the shader source.
     */
    private compileProgram(vs: string, fs: string, definitions?: string[]): WebGLProgram {
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

      // Once the program is linked, shaders can be safely removed
      this.gl.deleteShader(vertexShader);
      this.gl.deleteShader(fragmentShader);

      return program;
    }

    /**
     * Compile a `Shader`
     */
    private createShader(vs: string, fs: string, definitions?: string[]): Shader {
      const program = this.compileProgram(vs, fs, definitions);
      return new Shader(this.gl, program);
    }
  }

  class Shader {
    protected uniformLocations: { [name: string]: WebGLUniformLocation } = {};
    protected attributeLocations: { [name: string]: number } = {};

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
        this.attributeLocations[info.name] = gl.getAttribLocation(program, info.name);
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
     * Sets a uniform to a vec3
     * @param name The name of the uniform
     * @param a The first value
     * @param b The second value
     * @param c The third value
     */
    uniform3f(name: string, a: number, b: number, c: number) {
      const location = this.getUniform(name);
      this.gl.uniform3f(location, a, b, c);
    }

    /**
     * Sets a uniform to a vec4
     * @param name The name of the uniform
     * @param a The first value
     * @param b The second value
     * @param c The third value
     * @param d The fourth value
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

  export class WebGLProjectRenderer implements ProjectRenderer {
    public canvas: HTMLCanvasElement;
    public gl: WebGLRenderingContext;
    public stage: P.core.Stage;

    private penTexture: WebGLTexture;
    private penFramebuffer: WebGLFramebuffer;
    private collisionTexture: WebGLTexture;
    private collisionDepthRenderbuffer: WebGLRenderbuffer;
    private collisionFramebuffer: WebGLFramebuffer;
    private rescaleFramebuffer: WebGLFramebuffer;
    private collisionTexture2: WebGLTexture;
    private collisionFramebuffer2: WebGLFramebuffer;

    private shaders: Shaders;

    private currentShader: Shader;
    private currentFramebuffer: WebGLFramebuffer | null;
    private currentWidth: number = 480;
    private currentHeight: number = 360;
    private scissorsEnabled: boolean = false;

    private quadBuffer: WebGLBuffer;
    private zoom: number = 1;
    private globalScaleMatrix: P.m3.Matrix3 = P.m3.scaling(1, 1);

    private costumeTextures: Map<P.core.Costume, WebGLTexture> = new Map();


    private penCoords: Float32Array = new Float32Array(65536);
    private penLines: Float32Array = new Float32Array(32768);
    private penColors: Float32Array = new Float32Array(65536);

    private penCoordsIndex: number = 0;
    private penLinesIndex: number = 0;
    private penColorsIndex: number = 0;

    private positionBuffer: WebGLBuffer;
    private lineBuffer: WebGLBuffer;
    private colorBuffer: WebGLBuffer;

    constructor(stage: P.core.Stage) {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;

      const gl = canvas.getContext('webgl', {alpha: false});
      if (!gl) throw new Error('cannot get webgl rendering context');

      this.stage = stage;
      this.canvas = canvas;
      this.gl = gl;
      this.shaders = new Shaders(gl);

      this.gl.clearColor(0, 0, 0, 0);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

      // Enable blending
      gl.enable(this.gl.BLEND);
      gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);

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

      // Setup textures, renderbuffers and framebuffers used for pen and collision
      this.penTexture = this.createTexture();
      this.fillTexture(this.penTexture, 480, 360, null);
      this.penFramebuffer = this.createFramebuffer(this.penTexture);

      this.collisionTexture = this.createTexture();
      this.fillTexture(this.collisionTexture, 480, 360, null);
      this.collisionDepthRenderbuffer = this.createDepthRenderbuffer(480, 360);
      this.collisionFramebuffer = this.createFramebuffer(this.collisionTexture, this.collisionDepthRenderbuffer);

      this.collisionTexture2 = this.createTexture();
      this.fillTexture(this.collisionTexture2, 480, 360, null);
      this.collisionFramebuffer2 = this.createFramebuffer(this.collisionTexture2);

      // Similar to collision framebuffer, but without depth attachment.
      // During collision both texture and renderbuffer stay 480x360.
      // Rescaling pen requires other resolutions. In order for framebuffer to
      // be considered complete, resolutions of all attachments need to match.
      // The thing below is done to avoid rescaling depth rendebuffer, when
      // reusing collision texture to rescale pen. This texture multipurpose
      // degrades performance during rescaling (which is rare, so it is not a
      // big deal), but saves memory for 1 screen sized texture.
      this.rescaleFramebuffer = this.createFramebuffer(this.collisionTexture);

      // Creating buffers to store pen lines before they are drawn
      this.positionBuffer = this.gl.createBuffer()!;
      this.lineBuffer = this.gl.createBuffer()!;
      this.colorBuffer = this.gl.createBuffer()!;

      // Allocating space for buffers.
      // Later gl.bufferSubData is used to update their contents
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.penCoords, gl.STREAM_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.penLines, gl.STREAM_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.penColors, gl.STREAM_DRAW);
    }

    drawFrame(): void {
      this.disableScissors();
      this.drawPendingOperations();
      this.useShader(this.shaders.allEffects);
      this.resetCanvas(this.zoom);
      this.drawChild(this.stage);
      this.drawTextureOverlay(this.penTexture);

      this.useShader(this.shaders.allEffects);
      for (var i = 0; i < this.stage.children.length; i++) {
        var child = this.stage.children[i];
        if (child.visible) {
          this.drawChild(child);
        }
      }

      // We flush to ensure that the GPU finishes rendering as quickly as possible.
      // This is especially important as we do not use requestAnimationFrame.
      // Unlike finish(), flush() does not block the main thread. This is important.
      this.gl.flush();
    }

    init(root: HTMLElement): void {
      root.appendChild(this.canvas);
    }

    destroy(): void {
      const extension = this.gl.getExtension('WEBGL_lose_context');
      if (extension) {
        extension.loseContext();
      }
    }

    onStageFiltersChanged(): void {}

    resize(scale: number): void {
      this.zoom = scale;
    }

    penLine(color: P.core.PenColor, size: number, x1: number, y1: number, x2: number, y2: number): void {
      if (x1 == x2 && y1 == y2) {
        this.penDot(color, size, x1, y1);
        return;
      }

      const circleRes = this.getCircleResolution(size);

      // Redraw when buffers are full.
      if (this.buffersCanFit(24 * (circleRes + 1))) {
        this.drawPendingOperations();
      }

      // draw line
      // first triangle
      // first coordinates
      this.penCoords[this.penCoordsIndex] = x1;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y1;
      this.penCoordsIndex++;

      // first coordinates supplement
      this.penCoords[this.penCoordsIndex] = x2;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y2;
      this.penCoordsIndex++;

      // first vertex description
      this.penLines[this.penLinesIndex] = -Math.PI / 2;
      this.penLinesIndex++;
      this.penLines[this.penLinesIndex] = size / 2;
      this.penLinesIndex++;

      // second coordinates
      this.penCoords[this.penCoordsIndex] = x2;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y2;
      this.penCoordsIndex++;

      // second coordinates supplement
      this.penCoords[this.penCoordsIndex] = x1;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y1;
      this.penCoordsIndex++;

      // second vertex description
      this.penLines[this.penLinesIndex] = Math.PI / 2;
      this.penLinesIndex++;
      this.penLines[this.penLinesIndex] = size / 2;
      this.penLinesIndex++;

      // third coordinates
      this.penCoords[this.penCoordsIndex] = x1;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y1;
      this.penCoordsIndex++;

      // third coordinates supplement
      this.penCoords[this.penCoordsIndex] = x2;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y2;
      this.penCoordsIndex++;

      // second vertex description
      this.penLines[this.penLinesIndex] = Math.PI / 2;
      this.penLinesIndex++;
      this.penLines[this.penLinesIndex] = size / 2;
      this.penLinesIndex++;

      // second triangle
      // first coordinates
      this.penCoords[this.penCoordsIndex] = x1;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y1;
      this.penCoordsIndex++;

      // first coordinates supplement
      this.penCoords[this.penCoordsIndex] = x2;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y2;
      this.penCoordsIndex++;

      //first vertex description
      this.penLines[this.penLinesIndex] = Math.PI / 2;
      this.penLinesIndex++;
      this.penLines[this.penLinesIndex] = size / 2;
      this.penLinesIndex++;

      // second coordinates
      this.penCoords[this.penCoordsIndex] = x2;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y2;
      this.penCoordsIndex++;

      // second coordinates supplement
      this.penCoords[this.penCoordsIndex] = x1;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y1;
      this.penCoordsIndex++;

      // second vertex description
      this.penLines[this.penLinesIndex] = -Math.PI / 2;
      this.penLinesIndex++;
      this.penLines[this.penLinesIndex] = size / 2;
      this.penLinesIndex++;

      // third coordinates
      this.penCoords[this.penCoordsIndex] = x2;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y2;
      this.penCoordsIndex++;

      // third coordinates supplement
      this.penCoords[this.penCoordsIndex] = x1;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y1;
      this.penCoordsIndex++;

      // second vertex description
      this.penLines[this.penLinesIndex] = Math.PI / 2;
      this.penLinesIndex++;
      this.penLines[this.penLinesIndex] = size / 2;
      this.penLinesIndex++;

      for (var i = 0; i < circleRes; i++) {
        // first endcap
        // first coordinates
        this.penCoords[this.penCoordsIndex] = x2;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y2;
        this.penCoordsIndex++;

        // first coordinates supplement
        this.penCoords[this.penCoordsIndex] = x1;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y1;
        this.penCoordsIndex++;

        // first vertex description
        this.penLines[this.penLinesIndex] = 0;
        this.penLinesIndex++;
        this.penLines[this.penLinesIndex] = 0;
        this.penLinesIndex++;

        // second coordinates
        this.penCoords[this.penCoordsIndex] = x2;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y2;
        this.penCoordsIndex++;

        // second coordinates supplement
        this.penCoords[this.penCoordsIndex] = x1;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y1;
        this.penCoordsIndex++;

        // second vertex description
        this.penLines[this.penLinesIndex] = Math.PI / 2 + i / circleRes * Math.PI;
        this.penLinesIndex++;
        this.penLines[this.penLinesIndex] = size / 2;
        this.penLinesIndex++;

        // third coordinates
        this.penCoords[this.penCoordsIndex] = x2;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y2;
        this.penCoordsIndex++;

        // third coordinates supplement
        this.penCoords[this.penCoordsIndex] = x1;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y1;
        this.penCoordsIndex++;

        // third vertex description
        this.penLines[this.penLinesIndex] = Math.PI / 2 + (i + 1) / circleRes * Math.PI;
        this.penLinesIndex++;
        this.penLines[this.penLinesIndex] = size / 2;
        this.penLinesIndex++;

        // second endcap
        // first coordinates
        this.penCoords[this.penCoordsIndex] = x1;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y1;
        this.penCoordsIndex++;

        // first coordinates supplement
        this.penCoords[this.penCoordsIndex] = x2;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y2;
        this.penCoordsIndex++;

        // first vertex description
        this.penLines[this.penLinesIndex] = 0;
        this.penLinesIndex++;
        this.penLines[this.penLinesIndex] = 0;
        this.penLinesIndex++;

        // second coordinates
        this.penCoords[this.penCoordsIndex] = x1;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y1;
        this.penCoordsIndex++;

        // second coordinates supplement
        this.penCoords[this.penCoordsIndex] = x2;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y2;
        this.penCoordsIndex++;

        // second vertex description
        this.penLines[this.penLinesIndex] = Math.PI / 2 + i / circleRes * Math.PI;
        this.penLinesIndex++;
        this.penLines[this.penLinesIndex] = size / 2;
        this.penLinesIndex++;

        // third coordinates
        this.penCoords[this.penCoordsIndex] = x1;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y1;
        this.penCoordsIndex++;

        // third coordinates supplement
        this.penCoords[this.penCoordsIndex] = x2;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y2;
        this.penCoordsIndex++;

        // third vertex description
        this.penLines[this.penLinesIndex] = Math.PI / 2 + (i + 1) / circleRes * Math.PI;
        this.penLinesIndex++;
        this.penLines[this.penLinesIndex] = size / 2;
        this.penLinesIndex++;
      }

      const [r, g, b, a] = color.toParts();

      // set color of vertices
      for (var i = 0; i < circleRes * 6 + 6; i++) {
        this.penColors[this.penColorsIndex] = r;
        this.penColorsIndex++;
        this.penColors[this.penColorsIndex] = g;
        this.penColorsIndex++;
        this.penColors[this.penColorsIndex] = b;
        this.penColorsIndex++;
        this.penColors[this.penColorsIndex] = a;
        this.penColorsIndex++;
      }
    }

    penDot(color: P.core.PenColor, size: number, x: number, y: number): void {
      const circleRes = this.getCircleResolution(size);

      // Redraw when buffers are full.
      if (this.buffersCanFit(12 * circleRes)) {
        this.drawPendingOperations();
      }

      for (var i = 1; i < circleRes; i++) {
        // first endcap
        // first coordinates
        this.penCoords[this.penCoordsIndex] = x;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y;
        this.penCoordsIndex++;

        // first coordinates supplement
        this.penCoords[this.penCoordsIndex] = x + 1;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y + 1;
        this.penCoordsIndex++;

        // first vertex description
        this.penLines[this.penLinesIndex] = 0;
        this.penLinesIndex++;
        this.penLines[this.penLinesIndex] = 0;
        this.penLinesIndex++;

        // second coordinates
        this.penCoords[this.penCoordsIndex] = x;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y;
        this.penCoordsIndex++;

        // second coordinates supplement
        this.penCoords[this.penCoordsIndex] = x + 1;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y + 1;
        this.penCoordsIndex++;

        // second vertex description
        this.penLines[this.penLinesIndex] = Math.PI / 2 + (i - 1) / circleRes * 2 * Math.PI;
        this.penLinesIndex++;
        this.penLines[this.penLinesIndex] = size / 2;
        this.penLinesIndex++;

        // third coordinates
        this.penCoords[this.penCoordsIndex] = x;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y;
        this.penCoordsIndex++;

        // third coordinates supplement
        this.penCoords[this.penCoordsIndex] = x + 1;
        this.penCoordsIndex++;
        this.penCoords[this.penCoordsIndex] = y + 1;
        this.penCoordsIndex++;

        // third vertex description
        this.penLines[this.penLinesIndex] = Math.PI / 2 + i / circleRes * 2 * Math.PI;
        this.penLinesIndex++;
        this.penLines[this.penLinesIndex] = size / 2;
        this.penLinesIndex++;
      }

      this.penCoords[this.penCoordsIndex] = x;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y;
      this.penCoordsIndex++;

      this.penCoords[this.penCoordsIndex] = x + 1;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y + 1;
      this.penCoordsIndex++;

      this.penLines[this.penLinesIndex] = 0;
      this.penLinesIndex++;
      this.penLines[this.penLinesIndex] = 0;
      this.penLinesIndex++;

      this.penCoords[this.penCoordsIndex] = x;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y;
      this.penCoordsIndex++;

      this.penCoords[this.penCoordsIndex] = x + 1;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y + 1;
      this.penCoordsIndex++;

      this.penLines[this.penLinesIndex] = Math.PI / 2 + (circleRes - 1) / circleRes * 2 * Math.PI;
      this.penLinesIndex++;
      this.penLines[this.penLinesIndex] = size / 2;
      this.penLinesIndex++;

      this.penCoords[this.penCoordsIndex] = x;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y;
      this.penCoordsIndex++;

      // third coordinates supplement
      this.penCoords[this.penCoordsIndex] = x + 1;
      this.penCoordsIndex++;
      this.penCoords[this.penCoordsIndex] = y + 1;
      this.penCoordsIndex++;

      // third vertex description
      this.penLines[this.penLinesIndex] = Math.PI / 2;
      this.penLinesIndex++;
      this.penLines[this.penLinesIndex] = size / 2;
      this.penLinesIndex++;

      const [r, g, b, a] = color.toParts();

      // set color of vertices
      for (var i = 0; i < circleRes * 3; i++) {
        this.penColors[this.penColorsIndex] = r;
        this.penColorsIndex++;
        this.penColors[this.penColorsIndex] = g;
        this.penColorsIndex++;
        this.penColors[this.penColorsIndex] = b;
        this.penColorsIndex++;
        this.penColors[this.penColorsIndex] = a;
        this.penColorsIndex++;
      }
    }

    penStamp(sprite: P.core.Base): void {
      this.disableScissors();
      this.useFramebuffer(this.penFramebuffer, this.canvas.width, this.canvas.height);
      this.drawPendingOperations();
      this.useShader(this.shaders.allEffects);
      this.drawChild(sprite);
    }

    penClear(): void {
      this.disableScissors();
      this.useFramebuffer(this.penFramebuffer, this.canvas.width, this.canvas.height);
      this.penCoordsIndex = 0;
      this.penLinesIndex = 0;
      this.penColorsIndex = 0;
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    spriteTouchesPoint(sprite: P.core.Sprite, x: number, y: number): boolean {
      const bounds = sprite.rotatedBounds();
      if (x < bounds.left || y < bounds.bottom || x > bounds.right || y > bounds.top || sprite.scale === 0) {
        return false;
      }

      // We will render one pixel of the sprite, and see if it has a non-zero alpha.
      const cx = 240 + x | 0;
      const cy = 180 + y | 0;

      this.enableScissors();
      this.useFramebuffer(this.collisionFramebuffer, 480, 360);
      this.gl.scissor(cx, cy, 1, 1);
      const globalScaleMatrixBackup = this.globalScaleMatrix;
      this.globalScaleMatrix = P.m3.scaling(1, 1);

      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      this.useShader(this.shaders.shapeEffects);
      this.drawChild(sprite);
      this.globalScaleMatrix = globalScaleMatrixBackup;

      // Allocate 4 bytes to store 1 RGBA pixel
      const result = new Uint8Array(4);
      this.gl.readPixels(cx, cy, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, result);

      return result[3] !== 0;
    }

    // All 3 touching blocks are implemented by resetting depth buffer
    // to -1, then first rendering one or multiple sprites with only
    // depth write (with z=0, which is mid-way between -1 and 1) and then
    // using gl.EQUALS depth test with color write enabled, rendering the
    // other sprite. Usage of stencil buffer and stencil test for this
    // purpose would probably make more logical sense, but since WebGL 1 doesn't
    // provide a supported-everywhere way to only use stencil buffer without
    // depth buffer, current way of doing it ends up being more efficient.

    spritesIntersect(spriteA: core.Sprite, otherSprites: core.Base[]): boolean {
      this.enableScissors();
      this.useFramebuffer(this.collisionFramebuffer, 480, 360);
      this.useShader(this.shaders.shapeEffects);

      const mb = spriteA.rotatedBounds();

      for (const spriteB of otherSprites) {
        if (!spriteB.visible || spriteA === spriteB) {
          continue;
        }

        const ob = spriteB.rotatedBounds();
        if (mb.bottom >= ob.top || ob.bottom >= mb.top || mb.left >= ob.right || ob.left >= mb.right) {
          continue;
        }

        const left = Math.round(Math.max(-240, mb.left, ob.left));
        const top = Math.round(Math.min(180, mb.top, ob.top));
        const right = Math.round(Math.min(240, mb.right, ob.right));
        const bottom = Math.round(Math.max(-180, mb.bottom, ob.bottom));

        const width = Math.max(right - left, 1);
        const height = Math.max(top - bottom, 1);

        this.gl.scissor(240 + left, 180 + bottom, width, height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.colorMask(false, false, false, false);
        this.gl.enable(this.gl.DEPTH_TEST); // Depth writing only occurs with depth test enabled
        this.gl.depthFunc(this.gl.ALWAYS);

        const globalScaleMatrixBackup = this.globalScaleMatrix;
        this.globalScaleMatrix = P.m3.scaling(1, 1);
        this.drawChild(spriteA);

        this.gl.depthFunc(this.gl.EQUAL);
        this.gl.colorMask(true, true, true, true);

        this.drawChild(spriteB);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.globalScaleMatrix = globalScaleMatrixBackup;

        var data = new Uint8Array(width * height * 4);
        this.gl.readPixels(
          240 + left,
          180 + bottom,
          width,
          height,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          data
        );

        var length = data.length;
        for (var j = 0; j < length; j += 4) {
          if (data[j + 3]) {
            return true;
          }
        }
      }

      return false;
    }

    spriteTouchesColor(sprite: P.core.Base, color: number): boolean {
      color += color < 0 ? 0x100000000 : 0;

      this.drawPendingOperations();
      this.enableScissors();
      this.useFramebuffer(this.collisionFramebuffer2, 480, 360);

      const mb = sprite.rotatedBounds();

      const left = Math.max(-240, Math.round(mb.left));
      const top = Math.min(180, Math.round(mb.top));
      const right = Math.min(240, Math.round(mb.right));
      const bottom = Math.max(-180, Math.round(mb.bottom));

      const width = Math.max(right - left, 1);
      const height = Math.max(top - bottom, 1);

      this.gl.scissor(240 + left, 180 + bottom, width, height);
      this.gl.clearColor(1, 1, 1, 1);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.clearColor(0, 0, 0, 0);

      const globalScaleMatrixBackup = this.globalScaleMatrix;
      this.globalScaleMatrix = P.m3.scaling(1, 1);
      this.drawAllExcept(sprite);

      this.useFramebuffer(this.collisionFramebuffer, 480, 360);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      this.gl.colorMask(false, false, false, false);
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.depthFunc(this.gl.ALWAYS);

      this.drawTextureOverlayWithColor(this.collisionTexture2, color);

      this.gl.depthFunc(this.gl.EQUAL);
      this.gl.colorMask(true, true, true, true);

      this.useShader(this.shaders.shapeEffects);
      this.drawChild(sprite);
      this.gl.disable(this.gl.DEPTH_TEST);
      this.globalScaleMatrix = globalScaleMatrixBackup;

      var data = new Uint8Array(width * height * 4);
      this.gl.readPixels(
        240 + left,
        180 + bottom,
        width,
        height,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        data
      );

      var length = data.length;
      for (var j = 0; j < length; j += 4) {
        if (data[j + 3]) {
          return true;
        }
      }

      return false;
    }

    spriteColorTouchesColor(sprite: P.core.Base, spriteColor: number, otherColor: number): boolean {
      spriteColor += spriteColor < 0 ? 0x100000000 : 0;
      otherColor += otherColor < 0 ? 0x100000000 : 0;

      this.drawPendingOperations();
      this.enableScissors();
      this.useFramebuffer(this.collisionFramebuffer2, 480, 360);

      const mb = sprite.rotatedBounds();

      const left = Math.max(-240, Math.round(mb.left));
      const top = Math.min(180, Math.round(mb.top));
      const right = Math.min(240, Math.round(mb.right));
      const bottom = Math.max(-180, Math.round(mb.bottom));

      const width = Math.max(right - left, 1);
      const height = Math.max(top - bottom, 1);

      this.gl.scissor(240 + left, 180 + bottom, width, height);
      this.gl.clearColor(1, 1, 1, 1);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.clearColor(0, 0, 0, 0);

      const globalScaleMatrixBackup = this.globalScaleMatrix;
      this.globalScaleMatrix = P.m3.scaling(1, 1);
      this.drawAllExcept(sprite);

      this.useFramebuffer(this.collisionFramebuffer, 480, 360);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      this.gl.colorMask(false, false, false, false);
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.depthFunc(this.gl.ALWAYS);

      this.drawTextureOverlayWithColor(this.collisionTexture2, otherColor);

      this.gl.depthFunc(this.gl.EQUAL);
      this.gl.colorMask(true, true, true, true);

      this.useShader(this.shaders.touchingColorAllEffectsExceptGhost);
      this.currentShader.uniform3f("u_colorTest", Math.floor((Math.floor(spriteColor/65536)%256)/8), Math.floor((Math.floor(spriteColor/256)%256)/8), Math.floor((spriteColor%256)/16));
      this.drawChild(sprite);
      this.gl.disable(this.gl.DEPTH_TEST);
      this.globalScaleMatrix = globalScaleMatrixBackup;

      var data = new Uint8Array(width * height * 4);
      this.gl.readPixels(
        240 + left,
        180 + bottom,
        width,
        height,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        data
      );

      var length = data.length;
      for (var j = 0; j < length; j += 4) {
        if (data[j + 3]) {
          return true;
        }
      }

      return false;
    }

    private drawChild(child: P.core.Base): void {
      let shader = this.currentShader;

      // Rescale if possible
      const costume = child.costumes[child.currentCostumeIndex];
      if (costume.isScalable) {
        let vectorCostume = costume as P.core.VectorCostume;
        let oldScale = vectorCostume.currentScale;
        if (P.core.isSprite(child)) {
          costume.requestSize(child.stage.zoom * P.config.scale * costume.scale * child.scale);
        } else {
          costume.requestSize(child.stage.zoom * P.config.scale * costume.scale);
        }
        if (vectorCostume.currentScale !== oldScale && this.costumeTextures.has(costume)) {
          const texture = this.costumeTextures.get(costume)!;
          const image = costume.getImage();
          this.fillTexture(texture, null, null, image);
        }
      }

      // Create the texture if it doesn't already exist.
      if (!this.costumeTextures.has(costume)) {
        const image = costume.getImage();
        const texture = this.createTexture(costume.isScalable ? this.gl.LINEAR : this.gl.NEAREST);
        this.fillTexture(texture, null, null, image);
        this.costumeTextures.set(costume, texture);
      }
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.costumeTextures.get(costume)!);

      shader.attributeBuffer('a_position', this.quadBuffer);

      // TODO: optimize
      const matrix = P.m3.projection(this.currentWidth, this.currentHeight);
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

    private drawAllExcept(skip: P.core.Base): void {
      this.useShader(this.shaders.allEffects);

      this.drawChild(this.stage);
      this.drawTextureOverlay(this.penTexture);
      this.useShader(this.shaders.allEffects);

      for (var i = 0; i < this.stage.children.length; i++) {
        var child = this.stage.children[i];
        if (child.visible && child !== skip) {
          this.drawChild(child);
        }
      }
    }

    private drawTextureOverlay(texture: WebGLTexture, keepShader: boolean = false): void {
      let shader;
      if (keepShader) {
        shader = this.currentShader;
      } else {
        shader = this.shaders.noEffects;
        this.useShader(shader);
      }

      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

      shader.attributeBuffer('a_position', this.quadBuffer);

      const matrix = P.m3.projection(this.currentWidth, this.currentHeight);
      P.m3.multiply(matrix, this.globalScaleMatrix);
      P.m3.multiply(matrix, P.m3.translation(240, 180));
      P.m3.multiply(matrix, P.m3.scaling(1, -1));
      P.m3.multiply(matrix, P.m3.translation(-240, -180));
      P.m3.multiply(matrix, P.m3.scaling(480, 360));

      shader.uniformMatrix3('u_matrix', matrix);

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    private drawTextureOverlayWithColor(texture: WebGLTexture, color: number): void {
      const shader = this.shaders.touchingColorNoEffects;
      this.useShader(shader);
      shader.uniform3f("u_colorTest", Math.floor((Math.floor(color/65536)%256)/8), Math.floor((Math.floor(color/256)%256)/8), Math.floor((color%256)/16));

      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

      shader.attributeBuffer('a_position', this.quadBuffer);

      const matrix = P.m3.projection(this.currentWidth, this.currentHeight);
      P.m3.multiply(matrix, this.globalScaleMatrix);
      P.m3.multiply(matrix, P.m3.translation(240, 180));
      P.m3.multiply(matrix, P.m3.scaling(1, -1));
      P.m3.multiply(matrix, P.m3.translation(-240, -180));
      P.m3.multiply(matrix, P.m3.scaling(480, 360));

      shader.uniformMatrix3('u_matrix', matrix);

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    private drawPendingOperations(): void {
      if (this.penCoordsIndex === 0) {
        return;
      }
      this.disableScissors();

      const gl = this.gl;
      const shader = this.shaders.pen;

      this.useShader(shader);
      this.useFramebuffer(this.penFramebuffer, this.canvas.width, this.canvas.height);

      // Upload position data
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.penCoords);
      gl.vertexAttribPointer(shader.getAttribute('a_vertexData'), 4, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(shader.getAttribute('a_vertexData'));

      // Upload line info data
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.penLines);
      gl.vertexAttribPointer(shader.getAttribute('a_lineData'), 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(shader.getAttribute('a_lineData'));

      // Upload color data
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.penColors);
      gl.vertexAttribPointer(shader.getAttribute('a_color'), 4, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(shader.getAttribute('a_color'));

      gl.drawArrays(gl.TRIANGLES, 0, (this.penCoordsIndex + 1) / 4);

      this.penCoordsIndex = 0;
      this.penLinesIndex = 0;
      this.penColorsIndex = 0;
    }

    private createDepthRenderbuffer(width: number, height: number): WebGLRenderbuffer {
      const depthBuffer = this.gl.createRenderbuffer();
      if (!depthBuffer) throw new Error('Cannot create rendebuffer');
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthBuffer);
      this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);
      return depthBuffer;
    }

    private createTexture(filtering: number = this.gl.NEAREST): WebGLTexture {
      const texture = this.gl.createTexture();
      if (!texture) throw new Error('Cannot create texture');
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, filtering);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, filtering);
      return texture;
    }

    private fillTexture(texture: WebGLTexture, width: number | null, height: number | null, content): void {
      const gl = this.gl;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (content) {
        if (width && height) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, content);
        } else {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, content);
        }
      } else {
        if (width && height) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        } else {
          throw new Error("fillTexture: both size and content can't be empty");
        }
      }
    }

    private createFramebuffer(texture: WebGLTexture, depth?: WebGLRenderbuffer): WebGLFramebuffer {
      const framebuffer = this.gl.createFramebuffer();
      if (!framebuffer) throw new Error('Cannot create framebuffer');
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
      if (depth) {
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, depth);
      }
      return framebuffer;
    }

    private useShader(shader: Shader): void {
      if (this.currentShader !== shader) {
        this.gl.useProgram(shader.program);
        this.currentShader = shader;
      }
    }

    private useFramebuffer(fb: WebGLFramebuffer | null, w: number, h: number): void {
      if (this.currentFramebuffer !== fb) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
        this.currentFramebuffer = fb;
      }
      if (this.currentWidth !== w || this.currentHeight !== h) {
        this.gl.viewport(0, 0, w, h);
        this.currentWidth = w;
        this.currentHeight = h;
      }
    }

    private enableScissors(): void {
      if (!this.scissorsEnabled) {
        this.gl.enable(this.gl.SCISSOR_TEST);
        this.scissorsEnabled = true;
      }
    }

    private disableScissors(): void {
      if (this.scissorsEnabled) {
        this.gl.disable(this.gl.SCISSOR_TEST);
        this.scissorsEnabled = false;
      }
    }

    private resetCanvas(scale: number): void {
      const effectiveScale = scale * P.config.scale;
      if (this.globalScaleMatrix[0] !== effectiveScale) {
        this.globalScaleMatrix = P.m3.scaling(effectiveScale, effectiveScale);
      }

      const width = Math.max(1, 480 * effectiveScale) | 0;
      const height = Math.max(1, 360 * effectiveScale) | 0;

      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.fillTexture(this.collisionTexture, width, height, null);
        this.useFramebuffer(this.rescaleFramebuffer, width, height);
        this.drawTextureOverlay(this.penTexture);
        this.fillTexture(this.penTexture, width, height, null);
        this.useFramebuffer(this.penFramebuffer, width, height);
        this.drawTextureOverlay(this.collisionTexture);
        this.fillTexture(this.collisionTexture, 480, 360, null);
      }
      this.useFramebuffer(null, width, height);
      this.gl.clearColor(1, 1, 1, 1);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.clearColor(0, 0, 0, 0);
    }

    private buffersCanFit(size: number): boolean {
      return this.penCoordsIndex + size > this.penCoords.length;
    }

    private getCircleResolution(size: number): number {
      return Math.max(Math.ceil(size * this.globalScaleMatrix[0]), 3);
    }
  }
}