import {
    VERTEX_SRC,
    GRAY_SCOTT_FRAG,
    FITZHUGH_NAGUMO_FRAG,
    GIERER_MEINHARDT_FRAG,
    BRUSSELATOR_FRAG,
    SCHNAKENBERG_FRAG,
    RENDER_FRAG,
    COMPARISON_RENDER_FRAG
} from './shaders.js';
import { getInitialConditions, MODEL_DEFS } from './models.js';

const SIM_SIZE = 512;

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = SIM_SIZE;
        this.height = SIM_SIZE;

        const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false });
        if (!gl) throw new Error('WebGL2 not supported');
        this.gl = gl;

        // Check float texture support
        const ext = gl.getExtension('EXT_color_buffer_float');
        if (!ext) {
            console.warn('EXT_color_buffer_float not available, trying alternative');
        }

        this.programs = {};
        this.activeModel = 'grayScott';
        this.pingPong = { textures: [], framebuffers: [], current: 0 };
        this.pingPongB = null; // for comparison mode
        this.comparisonMode = false;
        this.dividerPos = 0.5;

        this._init();
    }

    _init() {
        const gl = this.gl;

        // Compile all shader programs
        const modelShaders = {
            grayScott: GRAY_SCOTT_FRAG,
            fitzhughNagumo: FITZHUGH_NAGUMO_FRAG,
            giererMeinhardt: GIERER_MEINHARDT_FRAG,
            brusselator: BRUSSELATOR_FRAG,
            schnakenberg: SCHNAKENBERG_FRAG
        };

        for (const [name, fragSrc] of Object.entries(modelShaders)) {
            this.programs[name] = this._compileProgram(VERTEX_SRC, fragSrc);
        }
        this.programs.render = this._compileProgram(VERTEX_SRC, RENDER_FRAG);
        this.programs.compRender = this._compileProgram(VERTEX_SRC, COMPARISON_RENDER_FRAG);

        // Create full-screen quad
        this._createQuad();

        // Create ping-pong framebuffers
        this._createPingPong(this.pingPong);

        // Initialize with default model state
        this.resetState(this.activeModel);
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

        // a_position
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
        // a_texCoord
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

        gl.bindVertexArray(null);
    }

    _createFloatTexture(data = null) {
        const gl = this.gl;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA32F,
            this.width, this.height, 0,
            gl.RGBA, gl.FLOAT, data
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        return tex;
    }

    _createFramebuffer(texture) {
        const gl = this.gl;
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error(`Framebuffer incomplete: ${status}`);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return fb;
    }

    _createPingPong(pp) {
        pp.textures = [this._createFloatTexture(), this._createFloatTexture()];
        pp.framebuffers = [
            this._createFramebuffer(pp.textures[0]),
            this._createFramebuffer(pp.textures[1])
        ];
        pp.current = 0;
    }

    _uploadState(pp, data) {
        const gl = this.gl;
        for (let i = 0; i < 2; i++) {
            gl.bindTexture(gl.TEXTURE_2D, pp.textures[i]);
            gl.texSubImage2D(
                gl.TEXTURE_2D, 0, 0, 0,
                this.width, this.height,
                gl.RGBA, gl.FLOAT, data
            );
        }
        pp.current = 0;
    }

    resetState(modelName) {
        const data = getInitialConditions(modelName, this.width, this.height);
        this._uploadState(this.pingPong, data);
        if (this.pingPongB) {
            this._uploadState(this.pingPongB, data);
        }
    }

    switchModel(modelName) {
        this.activeModel = modelName;
        this.resetState(modelName);
    }

    enableComparison(enable) {
        this.comparisonMode = enable;
        if (enable && !this.pingPongB) {
            this.pingPongB = { textures: [], framebuffers: [], current: 0 };
            this._createPingPong(this.pingPongB);
            const data = getInitialConditions(this.activeModel, this.width, this.height);
            this._uploadState(this.pingPongB, data);
        }
        this.dividerPos = 0.5;
    }

    _setUniforms(program, params, brushUniforms) {
        const gl = this.gl;

        // Texel size
        const tsLoc = gl.getUniformLocation(program, 'u_texelSize');
        gl.uniform2f(tsLoc, 1.0 / this.width, 1.0 / this.height);

        // dt
        const dtLoc = gl.getUniformLocation(program, 'u_dt');
        gl.uniform1f(dtLoc, params.dt || 1.0);

        // Brush
        const bpLoc = gl.getUniformLocation(program, 'u_brushPos');
        gl.uniform2f(bpLoc, brushUniforms.brushPos[0], brushUniforms.brushPos[1]);
        const brLoc = gl.getUniformLocation(program, 'u_brushRadius');
        gl.uniform1f(brLoc, brushUniforms.brushRadius);
        const biLoc = gl.getUniformLocation(program, 'u_brushIntensity');
        gl.uniform1f(biLoc, brushUniforms.brushIntensity);

        // State texture on unit 0
        const stateLoc = gl.getUniformLocation(program, 'u_state');
        gl.uniform1i(stateLoc, 0);

        // Model-specific uniforms
        const modelDef = MODEL_DEFS[this.activeModel];
        if (modelDef) {
            for (const p of modelDef.params) {
                const loc = gl.getUniformLocation(program, p.uniform);
                if (loc !== null && params[p.id] !== undefined) {
                    gl.uniform1f(loc, params[p.id]);
                }
            }
        }
    }

    _simulateStep(pp, program, params, brushUniforms) {
        const gl = this.gl;

        const readTex = pp.textures[pp.current];
        const writeFB = pp.framebuffers[1 - pp.current];

        gl.bindFramebuffer(gl.FRAMEBUFFER, writeFB);
        gl.viewport(0, 0, this.width, this.height);
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, readTex);

        this._setUniforms(program, params, brushUniforms);

        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);

        pp.current = 1 - pp.current;
    }

    simulate(steps, params, brushUniforms, paramsB = null) {
        const program = this.programs[this.activeModel];
        const noBrush = { brushPos: [-1, -1], brushRadius: 0, brushIntensity: 0 };

        for (let i = 0; i < steps; i++) {
            this._simulateStep(this.pingPong, program, params, brushUniforms);
            if (this.comparisonMode && this.pingPongB) {
                this._simulateStep(
                    this.pingPongB, program,
                    paramsB || params, noBrush
                );
            }
        }
    }

    render(colormapTex, channel, minVal, maxVal) {
        const gl = this.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        if (this.comparisonMode && this.pingPongB) {
            const program = this.programs.compRender;
            gl.useProgram(program);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.pingPong.textures[this.pingPong.current]);
            gl.uniform1i(gl.getUniformLocation(program, 'u_stateA'), 0);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.pingPongB.textures[this.pingPongB.current]);
            gl.uniform1i(gl.getUniformLocation(program, 'u_stateB'), 1);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, colormapTex);
            gl.uniform1i(gl.getUniformLocation(program, 'u_colormap'), 2);

            gl.uniform1i(gl.getUniformLocation(program, 'u_channel'), channel);
            gl.uniform1f(gl.getUniformLocation(program, 'u_minVal'), minVal);
            gl.uniform1f(gl.getUniformLocation(program, 'u_maxVal'), maxVal);
            gl.uniform1f(gl.getUniformLocation(program, 'u_dividerPos'), this.dividerPos);
        } else {
            const program = this.programs.render;
            gl.useProgram(program);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.pingPong.textures[this.pingPong.current]);
            gl.uniform1i(gl.getUniformLocation(program, 'u_state'), 0);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, colormapTex);
            gl.uniform1i(gl.getUniformLocation(program, 'u_colormap'), 1);

            gl.uniform1i(gl.getUniformLocation(program, 'u_channel'), channel);
            gl.uniform1f(gl.getUniformLocation(program, 'u_minVal'), minVal);
            gl.uniform1f(gl.getUniformLocation(program, 'u_maxVal'), maxVal);
        }

        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);
    }
}
