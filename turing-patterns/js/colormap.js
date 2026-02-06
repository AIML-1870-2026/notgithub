// Color map definitions and 1D texture generation

export const COLOR_MAPS = {
    heat: [
        [0.0,  [0, 0, 0]],
        [0.2,  [30, 0, 80]],
        [0.4,  [180, 0, 30]],
        [0.6,  [255, 120, 0]],
        [0.8,  [255, 230, 50]],
        [1.0,  [255, 255, 255]]
    ],
    ocean: [
        [0.0,  [5, 5, 30]],
        [0.25, [0, 40, 100]],
        [0.5,  [0, 120, 180]],
        [0.75, [79, 195, 247]],
        [1.0,  [200, 240, 255]]
    ],
    grayscale: [
        [0.0,  [0, 0, 0]],
        [1.0,  [255, 255, 255]]
    ],
    neon: [
        [0.0,  [0, 0, 0]],
        [0.25, [139, 92, 246]],
        [0.5,  [0, 255, 128]],
        [0.75, [79, 195, 247]],
        [1.0,  [255, 255, 255]]
    ],
    viridis: [
        [0.0,  [68, 1, 84]],
        [0.25, [59, 82, 139]],
        [0.5,  [33, 145, 140]],
        [0.75, [94, 201, 98]],
        [1.0,  [253, 231, 37]]
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
