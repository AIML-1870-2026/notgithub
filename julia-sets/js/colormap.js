// Color palette definitions and 1D texture generation

export const COLOR_MAPS = {
    classic: [
        [0.0,  [0, 7, 100]],
        [0.16, [32, 107, 203]],
        [0.42, [237, 255, 255]],
        [0.6425, [255, 170, 0]],
        [0.8575, [0, 2, 0]],
        [1.0,  [0, 7, 100]]
    ],
    fire: [
        [0.0,  [0, 0, 0]],
        [0.25, [128, 0, 0]],
        [0.5,  [255, 128, 0]],
        [0.75, [255, 255, 0]],
        [1.0,  [255, 255, 255]]
    ],
    ocean: [
        [0.0,  [0, 0, 30]],
        [0.25, [0, 40, 120]],
        [0.5,  [0, 130, 200]],
        [0.75, [100, 200, 255]],
        [1.0,  [220, 245, 255]]
    ],
    grayscale: [
        [0.0,  [0, 0, 0]],
        [1.0,  [255, 255, 255]]
    ],
    rainbow: [
        [0.0,   [255, 0, 0]],
        [0.167, [255, 255, 0]],
        [0.333, [0, 255, 0]],
        [0.5,   [0, 255, 255]],
        [0.667, [0, 0, 255]],
        [0.833, [255, 0, 255]],
        [1.0,   [255, 0, 0]]
    ],
    neon: [
        [0.0,  [0, 0, 0]],
        [0.25, [139, 92, 246]],
        [0.5,  [0, 255, 128]],
        [0.75, [79, 195, 247]],
        [1.0,  [255, 255, 255]]
    ],
    ice: [
        [0.0,  [255, 255, 255]],
        [0.33, [180, 220, 255]],
        [0.67, [80, 120, 200]],
        [1.0,  [20, 20, 80]]
    ],
    magma: [
        [0.0,  [0, 0, 4]],
        [0.25, [81, 18, 124]],
        [0.5,  [183, 55, 121]],
        [0.75, [254, 159, 109]],
        [1.0,  [252, 253, 191]]
    ]
};

function interpolateStops(stops, t) {
    if (t <= stops[0][0]) return stops[0][1].slice();
    if (t >= stops[stops.length - 1][0]) return stops[stops.length - 1][1].slice();

    for (let i = 0; i < stops.length - 1; i++) {
        const [t0, c0] = stops[i];
        const [t1, c1] = stops[i + 1];
        if (t >= t0 && t <= t1) {
            const f = (t - t0) / (t1 - t0);
            return [
                Math.round(c0[0] + (c1[0] - c0[0]) * f),
                Math.round(c0[1] + (c1[1] - c0[1]) * f),
                Math.round(c0[2] + (c1[2] - c0[2]) * f)
            ];
        }
    }
    return [0, 0, 0];
}

export function generateColormapTexture(gl, mapName) {
    const stops = COLOR_MAPS[mapName];
    const data = new Uint8Array(256 * 4);

    for (let i = 0; i < 256; i++) {
        const t = i / 255;
        const rgb = interpolateStops(stops, t);
        data[i * 4 + 0] = rgb[0];
        data[i * 4 + 1] = rgb[1];
        data[i * 4 + 2] = rgb[2];
        data[i * 4 + 3] = 255;
    }

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
}

export function updateColormapTexture(gl, tex, mapName) {
    const stops = COLOR_MAPS[mapName];
    const data = new Uint8Array(256 * 4);

    for (let i = 0; i < 256; i++) {
        const t = i / 255;
        const rgb = interpolateStops(stops, t);
        data[i * 4 + 0] = rgb[0];
        data[i * 4 + 1] = rgb[1];
        data[i * 4 + 2] = rgb[2];
        data[i * 4 + 3] = 255;
    }

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
}
