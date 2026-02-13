// Fractal type definitions, parameter metadata, and presets

export const FRACTAL_DEFS = {
    julia: {
        name: 'Julia Set',
        params: [
            { id: 'cReal', label: 'c (real)', min: -2, max: 2, default: -0.7269, step: 0.001 },
            { id: 'cImag', label: 'c (imag)', min: -2, max: 2, default: 0.1889, step: 0.001 },
        ],
        defaultView: { centerX: 0, centerY: 0, zoom: 1.5 }
    },
    mandelbrot: {
        name: 'Mandelbrot Set',
        params: [],
        defaultView: { centerX: -0.5, centerY: 0, zoom: 1.5 }
    },
    burningShip: {
        name: 'Burning Ship',
        params: [],
        defaultView: { centerX: -0.4, centerY: -0.5, zoom: 2.0 }
    },
    newton: {
        name: 'Newton Fractal',
        params: [
            { id: 'degree', label: 'Degree', min: 3, max: 8, default: 3, step: 1 },
            { id: 'relaxation', label: 'Relaxation', min: 0.5, max: 2.0, default: 1.0, step: 0.01 },
        ],
        defaultView: { centerX: 0, centerY: 0, zoom: 1.5 }
    },
    phoenix: {
        name: 'Phoenix Fractal',
        params: [
            { id: 'cReal', label: 'c (real)', min: -2, max: 2, default: 0.5667, step: 0.001 },
            { id: 'cImag', label: 'c (imag)', min: -2, max: 2, default: 0.0, step: 0.001 },
            { id: 'pReal', label: 'p (real)', min: -2, max: 2, default: -0.5, step: 0.001 },
            { id: 'pImag', label: 'p (imag)', min: -2, max: 2, default: 0.0, step: 0.001 },
        ],
        defaultView: { centerX: 0, centerY: 0, zoom: 1.5 }
    }
};

export const PRESETS = {
    julia: [
        { name: 'Spiral', params: { cReal: -0.7269, cImag: 0.1889 } },
        { name: 'Dendrite', params: { cReal: -0.1, cImag: 0.651 } },
        { name: 'Douady Rabbit', params: { cReal: -0.123, cImag: 0.745 } },
        { name: 'San Marco', params: { cReal: -0.75, cImag: 0.0 } },
        { name: 'Siegel Disk', params: { cReal: -0.391, cImag: -0.587 } },
        { name: 'Lightning', params: { cReal: -0.4, cImag: -0.59 } },
        { name: 'Starfish', params: { cReal: -0.54, cImag: 0.54 } },
        { name: 'Galaxy', params: { cReal: 0.355, cImag: 0.355 } },
    ],
    mandelbrot: [
        { name: 'Full View', view: { centerX: -0.5, centerY: 0, zoom: 1.5 } },
        { name: 'Seahorse Valley', view: { centerX: -0.747, centerY: 0.1, zoom: 0.01 } },
        { name: 'Elephant Valley', view: { centerX: 0.28, centerY: 0.008, zoom: 0.01 } },
        { name: 'Mini Brot', view: { centerX: -1.768, centerY: 0.001, zoom: 0.0003 } },
        { name: 'Spiral Arm', view: { centerX: -0.1011, centerY: 0.9563, zoom: 0.02 } },
    ],
    burningShip: [
        { name: 'Full View', view: { centerX: -0.4, centerY: -0.5, zoom: 2.0 } },
        { name: 'Ship Hull', view: { centerX: -1.755, centerY: -0.028, zoom: 0.02 } },
        { name: 'Antenna', view: { centerX: -1.862, centerY: -0.003, zoom: 0.006 } },
    ],
    newton: [
        { name: 'Cubic', params: { degree: 3, relaxation: 1.0 } },
        { name: 'Quartic', params: { degree: 4, relaxation: 1.0 } },
        { name: 'Quintic', params: { degree: 5, relaxation: 1.0 } },
        { name: 'Over-relaxed', params: { degree: 3, relaxation: 1.5 } },
        { name: 'Under-relaxed', params: { degree: 3, relaxation: 0.7 } },
    ],
    phoenix: [
        { name: 'Classic', params: { cReal: 0.5667, cImag: 0.0, pReal: -0.5, pImag: 0.0 } },
        { name: 'Feathered', params: { cReal: 0.2, cImag: 0.0, pReal: -0.6, pImag: 0.0 } },
        { name: 'Spiral', params: { cReal: 0.35, cImag: 0.1, pReal: -0.4, pImag: 0.2 } },
    ]
};

export const JOURNEYS = {
    julia: [
        {
            name: 'Classic Tour',
            waypoints: [
                { label: 'Spiral',        params: { cReal: -0.7269, cImag: 0.1889 }, duration: 3 },
                { label: 'Dendrite',      params: { cReal: -0.1, cImag: 0.651 },     duration: 3 },
                { label: 'Douady Rabbit', params: { cReal: -0.123, cImag: 0.745 },   duration: 3 },
                { label: 'San Marco',     params: { cReal: -0.75, cImag: 0.0 },      duration: 3 },
                { label: 'Siegel Disk',   params: { cReal: -0.391, cImag: -0.587 },  duration: 3 },
                { label: 'Lightning',     params: { cReal: -0.4, cImag: -0.59 },     duration: 3 },
                { label: 'Starfish',      params: { cReal: -0.54, cImag: 0.54 },     duration: 3 },
                { label: 'Galaxy',        params: { cReal: 0.355, cImag: 0.355 },    duration: 3 },
            ]
        },
        {
            name: 'C-Orbit Circle',
            waypoints: Array.from({ length: 13 }, (_, i) => ({
                label: `${i * 30}\u00B0`,
                params: { cReal: +(0.7885 * Math.cos(i * Math.PI / 6)).toFixed(4), cImag: +(0.7885 * Math.sin(i * Math.PI / 6)).toFixed(4) },
                duration: 2,
            }))
        }
    ],
    mandelbrot: [
        {
            name: 'Famous Locations',
            waypoints: [
                { label: 'Overview',        view: { centerX: -0.5, centerY: 0, zoom: 1.5 },          duration: 3 },
                { label: 'Seahorse Valley', view: { centerX: -0.747, centerY: 0.1, zoom: 0.01 },     duration: 5 },
                { label: 'Overview',        view: { centerX: -0.5, centerY: 0, zoom: 1.5 },          duration: 3 },
                { label: 'Elephant Valley', view: { centerX: 0.28, centerY: 0.008, zoom: 0.01 },     duration: 5 },
                { label: 'Overview',        view: { centerX: -0.5, centerY: 0, zoom: 1.5 },          duration: 3 },
                { label: 'Mini Brot',       view: { centerX: -1.768, centerY: 0.001, zoom: 0.0003 }, duration: 6 },
                { label: 'Overview',        view: { centerX: -0.5, centerY: 0, zoom: 1.5 },          duration: 3 },
            ]
        }
    ],
    burningShip: [
        {
            name: 'Ship Tour',
            waypoints: [
                { label: 'Full View', view: { centerX: -0.4, centerY: -0.5, zoom: 2.0 },      duration: 3 },
                { label: 'Ship Hull', view: { centerX: -1.755, centerY: -0.028, zoom: 0.02 },  duration: 5 },
                { label: 'Full View', view: { centerX: -0.4, centerY: -0.5, zoom: 2.0 },      duration: 3 },
                { label: 'Antenna',   view: { centerX: -1.862, centerY: -0.003, zoom: 0.006 }, duration: 5 },
                { label: 'Full View', view: { centerX: -0.4, centerY: -0.5, zoom: 2.0 },      duration: 3 },
            ]
        }
    ],
    newton: [
        {
            name: 'Degree Ladder',
            waypoints: [
                { label: 'Cubic',   params: { degree: 3, relaxation: 1.0 }, duration: 3 },
                { label: 'Quartic', params: { degree: 4, relaxation: 1.0 }, duration: 3 },
                { label: 'Quintic', params: { degree: 5, relaxation: 1.0 }, duration: 3 },
                { label: 'Sextic',  params: { degree: 6, relaxation: 1.0 }, duration: 3 },
                { label: 'Septic',  params: { degree: 7, relaxation: 1.0 }, duration: 3 },
                { label: 'Octic',   params: { degree: 8, relaxation: 1.0 }, duration: 3 },
            ]
        },
        {
            name: 'Relaxation Sweep',
            waypoints: [
                { label: 'Under-relaxed', params: { degree: 3, relaxation: 0.5 }, duration: 3 },
                { label: 'Standard',      params: { degree: 3, relaxation: 1.0 }, duration: 3 },
                { label: 'Over-relaxed',  params: { degree: 3, relaxation: 1.5 }, duration: 3 },
                { label: 'Extreme',       params: { degree: 3, relaxation: 2.0 }, duration: 3 },
            ]
        }
    ],
    phoenix: [
        {
            name: 'Parameter Sweep',
            waypoints: [
                { label: 'Classic',   params: { cReal: 0.5667, cImag: 0, pReal: -0.5, pImag: 0 },   duration: 3 },
                { label: 'Feathered', params: { cReal: 0.2, cImag: 0, pReal: -0.6, pImag: 0 },      duration: 3 },
                { label: 'Spiral',    params: { cReal: 0.35, cImag: 0.1, pReal: -0.4, pImag: 0.2 }, duration: 3 },
                { label: 'Classic',   params: { cReal: 0.5667, cImag: 0, pReal: -0.5, pImag: 0 },   duration: 3 },
            ]
        }
    ],
};

export function getDefaultParams(fractalType) {
    const def = FRACTAL_DEFS[fractalType];
    const params = {};
    for (const p of def.params) {
        params[p.id] = p.default;
    }
    return params;
}
