// GLSL Shader Sources for Fractal Explorer
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

// Shared uniforms injected into all fractal shaders
const COMMON_UNIFORMS = `
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_zoom;
uniform int u_maxIter;
uniform float u_aspectRatio;
uniform float u_time;
`;

// Shared coloring function using 1D texture lookup
const COLORING_FUNC = `
uniform sampler2D u_colormap;

vec3 getColor(float iter, float maxIter) {
    if (iter >= maxIter) return vec3(0.0);
    float t = iter / maxIter;
    return texture(u_colormap, vec2(t, 0.5)).rgb;
}
`;

// Shared coordinate mapping
const COORD_FUNC = `
vec2 pixelToComplex(vec2 uv) {
    vec2 centered = (uv - 0.5) * 2.0;
    centered.x *= u_aspectRatio;
    return u_center + centered * u_zoom;
}
`;

// ---------- Julia Set ----------
export const JULIA_FRAG = `#version 300 es
precision highp float;

${COMMON_UNIFORMS}
uniform vec2 u_juliaC;

in vec2 v_uv;
out vec4 fragColor;

${COLORING_FUNC}
${COORD_FUNC}

void main() {
    vec2 z = pixelToComplex(v_uv);
    vec2 c = u_juliaC;
    float i;
    for (i = 0.0; i < float(u_maxIter); i += 1.0) {
        if (dot(z, z) > 4.0) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }
    // Smooth iteration count
    if (i < float(u_maxIter)) {
        float log_zn = log(dot(z, z)) / 2.0;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        i = i + 1.0 - nu;
    }
    vec3 col = getColor(i, float(u_maxIter));
    fragColor = vec4(col, 1.0);
}
`;

// ---------- Mandelbrot Set ----------
export const MANDELBROT_FRAG = `#version 300 es
precision highp float;

${COMMON_UNIFORMS}

in vec2 v_uv;
out vec4 fragColor;

${COLORING_FUNC}
${COORD_FUNC}

void main() {
    vec2 c = pixelToComplex(v_uv);
    vec2 z = vec2(0.0);
    float i;
    for (i = 0.0; i < float(u_maxIter); i += 1.0) {
        if (dot(z, z) > 4.0) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }
    if (i < float(u_maxIter)) {
        float log_zn = log(dot(z, z)) / 2.0;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        i = i + 1.0 - nu;
    }
    vec3 col = getColor(i, float(u_maxIter));
    fragColor = vec4(col, 1.0);
}
`;

// ---------- Burning Ship ----------
export const BURNING_SHIP_FRAG = `#version 300 es
precision highp float;

${COMMON_UNIFORMS}

in vec2 v_uv;
out vec4 fragColor;

${COLORING_FUNC}
${COORD_FUNC}

void main() {
    vec2 c = pixelToComplex(v_uv);
    // Flip Y for Burning Ship (conventional orientation)
    c.y = -c.y;
    vec2 z = vec2(0.0);
    float i;
    for (i = 0.0; i < float(u_maxIter); i += 1.0) {
        if (dot(z, z) > 4.0) break;
        z = vec2(abs(z.x), abs(z.y));
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }
    if (i < float(u_maxIter)) {
        float log_zn = log(dot(z, z)) / 2.0;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        i = i + 1.0 - nu;
    }
    vec3 col = getColor(i, float(u_maxIter));
    fragColor = vec4(col, 1.0);
}
`;

// ---------- Phoenix Fractal ----------
export const PHOENIX_FRAG = `#version 300 es
precision highp float;

${COMMON_UNIFORMS}
uniform vec2 u_juliaC;
uniform vec2 u_phoenix;

in vec2 v_uv;
out vec4 fragColor;

${COLORING_FUNC}
${COORD_FUNC}

void main() {
    vec2 z = pixelToComplex(v_uv);
    vec2 zPrev = vec2(0.0);
    float cRe = u_juliaC.x;
    float pRe = u_phoenix.x;
    float pIm = u_phoenix.y;
    float i;
    for (i = 0.0; i < float(u_maxIter); i += 1.0) {
        if (dot(z, z) > 4.0) break;
        vec2 zNew;
        // z_new = z^2 + c_re + p * z_prev
        zNew.x = z.x * z.x - z.y * z.y + cRe + pRe * zPrev.x - pIm * zPrev.y;
        zNew.y = 2.0 * z.x * z.y + u_juliaC.y + pRe * zPrev.y + pIm * zPrev.x;
        zPrev = z;
        z = zNew;
    }
    if (i < float(u_maxIter)) {
        float log_zn = log(dot(z, z)) / 2.0;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        i = i + 1.0 - nu;
    }
    vec3 col = getColor(i, float(u_maxIter));
    fragColor = vec4(col, 1.0);
}
`;

// ---------- Newton Fractal ----------
export const NEWTON_FRAG = `#version 300 es
precision highp float;

${COMMON_UNIFORMS}
uniform int u_degree;
uniform float u_relaxation;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_colormap;

${COORD_FUNC}

// Complex multiplication
vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

// Complex division
vec2 cdiv(vec2 a, vec2 b) {
    float denom = dot(b, b);
    return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / denom;
}

// Complex power (integer exponent)
vec2 cpow(vec2 z, int n) {
    vec2 result = vec2(1.0, 0.0);
    for (int i = 0; i < 8; i++) {
        if (i >= n) break;
        result = cmul(result, z);
    }
    return result;
}

void main() {
    vec2 z = pixelToComplex(v_uv);
    float epsilon = 0.0001;
    float i;
    int deg = u_degree;

    for (i = 0.0; i < float(u_maxIter); i += 1.0) {
        // f(z) = z^n - 1
        vec2 fz = cpow(z, deg) - vec2(1.0, 0.0);
        // f'(z) = n * z^(n-1)
        vec2 fpz = float(deg) * cpow(z, deg - 1);

        if (dot(fpz, fpz) < 1e-12) break;

        vec2 delta = cdiv(fz, fpz);
        z -= u_relaxation * delta;

        if (dot(delta, delta) < epsilon * epsilon) break;
    }

    // Color by which root z converged to
    float angle = atan(z.y, z.x);
    float PI = 3.14159265359;
    float rootIndex = mod(floor((angle / (2.0 * PI) + 0.5) * float(deg) + 0.5), float(deg));

    // Map root + convergence speed to color
    float shade = 1.0 - i / float(u_maxIter);
    shade = pow(shade, 0.5);
    float t = (rootIndex + 0.5) / float(deg);
    vec3 rootColor = texture(u_colormap, vec2(t, 0.5)).rgb;
    vec3 col = rootColor * shade;

    fragColor = vec4(col, 1.0);
}
`;
