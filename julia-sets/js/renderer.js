import {
    VERTEX_SRC,
    JULIA_FRAG,
    MANDELBROT_FRAG,
    BURNING_SHIP_FRAG,
    PHOENIX_FRAG,
    NEWTON_FRAG
} from './shaders.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false });
        if (!gl) throw new Error('WebGL2 not supported');
        this.gl = gl;

        this.programs = {};
        this.uniformLocations = {};

        this._init();
    }

    _init() {
        const gl = this.gl;

        // Compile all fractal shader programs
        const fractalShaders = {
            julia: JULIA_FRAG,
            mandelbrot: MANDELBROT_FRAG,
            burningShip: BURNING_SHIP_FRAG,
            phoenix: PHOENIX_FRAG,
            newton: NEWTON_FRAG
        };

        for (const [name, fragSrc] of Object.entries(fractalShaders)) {
            this.programs[name] = this._compileProgram(VERTEX_SRC, fragSrc);
            this._cacheUniforms(name);
        }

        // Create fullscreen quad
        this._createQuad();
    }

    _compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader compile error: ${log}`);
        }
        return shader;
    }

    _compileProgram(vertSrc, fragSrc) {
        const gl = this.gl;
        const vert = this._compileShader(gl.VERTEX_SHADER, vertSrc);
        const frag = this._compileShader(gl.FRAGMENT_SHADER, fragSrc);
        const program = gl.createProgram();
        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.bindAttribLocation(program, 0, 'a_position');
        gl.bindAttribLocation(program, 1, 'a_texCoord');
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const log = gl.getProgramInfoLog(program);
            throw new Error(`Program link error: ${log}`);
        }
        gl.deleteShader(vert);
        gl.deleteShader(frag);
        return program;
    }

    _cacheUniforms(name) {
        const gl = this.gl;
        const program = this.programs[name];
        const uniforms = [
            'u_resolution', 'u_center', 'u_zoom', 'u_maxIter',
            'u_aspectRatio', 'u_time', 'u_colormap',
            'u_juliaC', 'u_phoenix', 'u_degree', 'u_relaxation'
        ];
        this.uniformLocations[name] = {};
        for (const u of uniforms) {
            this.uniformLocations[name][u] = gl.getUniformLocation(program, u);
        }
    }

    _createQuad() {
        const gl = this.gl;
        const verts = new Float32Array([
            -1, -1,  0, 0,
             1, -1,  1, 0,
            -1,  1,  0, 1,
             1,  1,  1, 1
        ]);
        this.quadVAO = gl.createVertexArray();
        gl.bindVertexArray(this.quadVAO);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

        gl.bindVertexArray(null);
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio, 2);
        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
    }

    render(state, colormapTex, viewport) {
        const gl = this.gl;
        const program = this.programs[state.fractal];
        const locs = this.uniformLocations[state.fractal];

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(program);

        // Shared uniforms
        gl.uniform2f(locs.u_resolution, this.canvas.width, this.canvas.height);
        gl.uniform2f(locs.u_center, viewport.centerX, viewport.centerY);
        gl.uniform1f(locs.u_zoom, viewport.zoom);
        gl.uniform1i(locs.u_maxIter, state.maxIter);
        gl.uniform1f(locs.u_aspectRatio, this.canvas.width / this.canvas.height);
        gl.uniform1f(locs.u_time, state.time || 0);

        // Colormap texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, colormapTex);
        gl.uniform1i(locs.u_colormap, 0);

        // Fractal-specific uniforms
        if (state.fractal === 'julia' || state.fractal === 'phoenix') {
            gl.uniform2f(locs.u_juliaC, state.params.cReal, state.params.cImag);
        }
        if (state.fractal === 'phoenix') {
            gl.uniform2f(locs.u_phoenix, state.params.pReal, state.params.pImag);
        }
        if (state.fractal === 'newton') {
            gl.uniform1i(locs.u_degree, state.params.degree);
            gl.uniform1f(locs.u_relaxation, state.params.relaxation);
        }

        // Draw
        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);
    }
}
