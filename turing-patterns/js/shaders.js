// GLSL Shader Sources for Turing Pattern Simulation
// All shaders use WebGL2 (GLSL ES 3.00)

export const VERTEX_SRC = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_uv;

void main() {
    v_uv = a_texCoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Shared Laplacian function injected into all simulation shaders
const LAPLACIAN_FUNC = `
vec2 laplacian(sampler2D tex, vec2 uv, vec2 ts) {
    vec2 s = vec2(0.0);
    s += texture(tex, uv).rg * (-1.0);
    s += texture(tex, uv + vec2( ts.x, 0.0)).rg * 0.2;
    s += texture(tex, uv + vec2(-ts.x, 0.0)).rg * 0.2;
    s += texture(tex, uv + vec2(0.0,  ts.y)).rg * 0.2;
    s += texture(tex, uv + vec2(0.0, -ts.y)).rg * 0.2;
    s += texture(tex, uv + vec2( ts.x,  ts.y)).rg * 0.05;
    s += texture(tex, uv + vec2(-ts.x,  ts.y)).rg * 0.05;
    s += texture(tex, uv + vec2( ts.x, -ts.y)).rg * 0.05;
    s += texture(tex, uv + vec2(-ts.x, -ts.y)).rg * 0.05;
    return s;
}
`;

// Shared brush function injected into all simulation shaders
const BRUSH_FUNC = `
float brushEffect(vec2 uv, vec2 bPos, float bRadius) {
    if (bPos.x < 0.0) return 0.0;
    float dist = distance(uv, bPos);
    return smoothstep(bRadius, 0.0, dist);
}
`;

// Shared uniforms declaration for simulation shaders
const SIM_UNIFORMS = `
uniform sampler2D u_state;
uniform vec2 u_texelSize;
uniform float u_dt;
uniform vec2 u_brushPos;
uniform float u_brushRadius;
uniform float u_brushIntensity;
`;

// ---------- Gray-Scott ----------
export const GRAY_SCOTT_FRAG = `#version 300 es
precision highp float;

${SIM_UNIFORMS}
uniform float u_feed;
uniform float u_kill;
uniform float u_Du;
uniform float u_Dv;

in vec2 v_uv;
out vec4 fragColor;

${LAPLACIAN_FUNC}
${BRUSH_FUNC}

void main() {
    vec2 state = texture(u_state, v_uv).rg;
    float U = state.r;
    float V = state.g;

    vec2 lap = laplacian(u_state, v_uv, u_texelSize);

    float uvv = U * V * V;
    float dU = u_Du * lap.r - uvv + u_feed * (1.0 - U);
    float dV = u_Dv * lap.g + uvv - (u_feed + u_kill) * V;

    U += dU * u_dt;
    V += dV * u_dt;

    float b = brushEffect(v_uv, u_brushPos, u_brushRadius) * u_brushIntensity;
    V = clamp(V + b, 0.0, 1.0);
    U = clamp(U, 0.0, 1.0);

    fragColor = vec4(U, V, 0.0, 1.0);
}
`;

// ---------- FitzHugh-Nagumo ----------
export const FITZHUGH_NAGUMO_FRAG = `#version 300 es
precision highp float;

${SIM_UNIFORMS}
uniform float u_Dv;
uniform float u_Dw;
uniform float u_epsilon;
uniform float u_a0;
uniform float u_a1;
uniform float u_stimulus;

in vec2 v_uv;
out vec4 fragColor;

${LAPLACIAN_FUNC}
${BRUSH_FUNC}

void main() {
    vec2 state = texture(u_state, v_uv).rg;
    float v = state.r;
    float w = state.g;

    vec2 lap = laplacian(u_state, v_uv, u_texelSize);

    float dv = u_Dv * lap.r + v - v * v * v - w + u_stimulus;
    float dw = u_Dw * lap.g + u_epsilon * (v - u_a1 * w - u_a0);

    v += dv * u_dt;
    w += dw * u_dt;

    float b = brushEffect(v_uv, u_brushPos, u_brushRadius) * u_brushIntensity;
    v += b;

    v = clamp(v, -2.0, 2.0);
    w = clamp(w, -2.0, 2.0);

    fragColor = vec4(v, w, 0.0, 1.0);
}
`;

// ---------- Gierer-Meinhardt ----------
export const GIERER_MEINHARDT_FRAG = `#version 300 es
precision highp float;

${SIM_UNIFORMS}
uniform float u_Da;
uniform float u_Dh;
uniform float u_rho;
uniform float u_mu_a;
uniform float u_mu_h;
uniform float u_rho_a;

in vec2 v_uv;
out vec4 fragColor;

${LAPLACIAN_FUNC}
${BRUSH_FUNC}

void main() {
    vec2 state = texture(u_state, v_uv).rg;
    float a = state.r;
    float h = state.g;

    vec2 lap = laplacian(u_state, v_uv, u_texelSize);

    float h_safe = max(h, 0.001);
    float da = u_Da * lap.r + u_rho * (a * a / h_safe) - u_mu_a * a + u_rho_a;
    float dh = u_Dh * lap.g + u_rho * a * a - u_mu_h * h;

    a += da * u_dt;
    h += dh * u_dt;

    float b = brushEffect(v_uv, u_brushPos, u_brushRadius) * u_brushIntensity;
    a += b;

    a = max(a, 0.0);
    h = max(h, 0.0);

    fragColor = vec4(a, h, 0.0, 1.0);
}
`;

// ---------- Brusselator ----------
export const BRUSSELATOR_FRAG = `#version 300 es
precision highp float;

${SIM_UNIFORMS}
uniform float u_A;
uniform float u_B;
uniform float u_Du;
uniform float u_Dv;

in vec2 v_uv;
out vec4 fragColor;

${LAPLACIAN_FUNC}
${BRUSH_FUNC}

void main() {
    vec2 state = texture(u_state, v_uv).rg;
    float u = state.r;
    float v = state.g;

    vec2 lap = laplacian(u_state, v_uv, u_texelSize);

    float uuv = u * u * v;
    float du = u_Du * lap.r + u_A - (u_B + 1.0) * u + uuv;
    float dv = u_Dv * lap.g + u_B * u - uuv;

    u += du * u_dt;
    v += dv * u_dt;

    float b = brushEffect(v_uv, u_brushPos, u_brushRadius) * u_brushIntensity;
    u += b;

    u = max(u, 0.0);
    v = max(v, 0.0);

    fragColor = vec4(u, v, 0.0, 1.0);
}
`;

// ---------- Schnakenberg ----------
export const SCHNAKENBERG_FRAG = `#version 300 es
precision highp float;

${SIM_UNIFORMS}
uniform float u_a;
uniform float u_b;
uniform float u_Du;
uniform float u_Dv;

in vec2 v_uv;
out vec4 fragColor;

${LAPLACIAN_FUNC}
${BRUSH_FUNC}

void main() {
    vec2 state = texture(u_state, v_uv).rg;
    float u = state.r;
    float v = state.g;

    vec2 lap = laplacian(u_state, v_uv, u_texelSize);

    float uuv = u * u * v;
    float du = u_Du * lap.r + u_a - u + uuv;
    float dv = u_Dv * lap.g + u_b - uuv;

    u += du * u_dt;
    v += dv * u_dt;

    float b = brushEffect(v_uv, u_brushPos, u_brushRadius) * u_brushIntensity;
    u += b;

    u = max(u, 0.0);
    v = max(v, 0.0);

    fragColor = vec4(u, v, 0.0, 1.0);
}
`;

// ---------- Render / Color Mapping ----------
export const RENDER_FRAG = `#version 300 es
precision highp float;

uniform sampler2D u_state;
uniform sampler2D u_colormap;
uniform int u_channel;
uniform float u_minVal;
uniform float u_maxVal;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec4 state = texture(u_state, v_uv);
    float val = u_channel == 0 ? state.r : state.g;
    float t = clamp((val - u_minVal) / (u_maxVal - u_minVal), 0.0, 1.0);
    vec3 color = texture(u_colormap, vec2(t, 0.5)).rgb;
    fragColor = vec4(color, 1.0);
}
`;

// ---------- Comparison Render (split view) ----------
export const COMPARISON_RENDER_FRAG = `#version 300 es
precision highp float;

uniform sampler2D u_stateA;
uniform sampler2D u_stateB;
uniform sampler2D u_colormap;
uniform int u_channel;
uniform float u_minVal;
uniform float u_maxVal;
uniform float u_dividerPos;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec4 state = v_uv.x < u_dividerPos
        ? texture(u_stateA, v_uv)
        : texture(u_stateB, v_uv);
    float val = u_channel == 0 ? state.r : state.g;
    float t = clamp((val - u_minVal) / (u_maxVal - u_minVal), 0.0, 1.0);
    vec3 color = texture(u_colormap, vec2(t, 0.5)).rgb;

    // Draw divider line
    float divDist = abs(v_uv.x - u_dividerPos);
    if (divDist < 0.003) {
        color = mix(color, vec3(0.31, 0.76, 0.97), 0.8);
    }

    fragColor = vec4(color, 1.0);
}
`;
