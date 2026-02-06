// Model definitions: parameter metadata, presets, and initial condition generators

export const MODEL_DEFS = {
    grayScott: {
        name: 'Gray-Scott',
        params: [
            { id: 'feed',  label: 'Feed Rate (f)', uniform: 'u_feed', min: 0, max: 0.1, default: 0.055, step: 0.001 },
            { id: 'kill',  label: 'Kill Rate (k)', uniform: 'u_kill', min: 0, max: 0.1, default: 0.062, step: 0.001 },
            { id: 'Du',    label: 'Diffusion U',   uniform: 'u_Du',   min: 0.05, max: 0.5, default: 0.2097, step: 0.001 },
            { id: 'Dv',    label: 'Diffusion V',   uniform: 'u_Dv',   min: 0.01, max: 0.3, default: 0.105, step: 0.001 },
            { id: 'dt',    label: 'Time Step',      uniform: 'u_dt',   min: 0.2, max: 2.0, default: 1.0, step: 0.1 }
        ],
        normalization: { channel0: [0, 1], channel1: [0, 1] }
    },
    fitzhughNagumo: {
        name: 'FitzHugh-Nagumo',
        params: [
            { id: 'epsilon', label: 'Epsilon',     uniform: 'u_epsilon',  min: 0.001, max: 0.1, default: 0.02, step: 0.001 },
            { id: 'a0',      label: 'a0',          uniform: 'u_a0',       min: -0.5, max: 0.5, default: -0.03, step: 0.01 },
            { id: 'a1',      label: 'a1',          uniform: 'u_a1',       min: 0.5, max: 5.0, default: 2.0, step: 0.1 },
            { id: 'stimulus',label: 'Stimulus (I)', uniform: 'u_stimulus', min: -0.5, max: 0.5, default: 0.0, step: 0.01 },
            { id: 'Dv',      label: 'Diffusion v', uniform: 'u_Dv',       min: 0.1, max: 3.0, default: 1.0, step: 0.1 },
            { id: 'Dw',      label: 'Diffusion w', uniform: 'u_Dw',       min: 0.0, max: 2.0, default: 0.5, step: 0.05 },
            { id: 'dt',      label: 'Time Step',    uniform: 'u_dt',       min: 0.005, max: 0.05, default: 0.015, step: 0.001 }
        ],
        normalization: { channel0: [-1.5, 1.5], channel1: [-1.5, 1.5] }
    },
    giererMeinhardt: {
        name: 'Gierer-Meinhardt',
        params: [
            { id: 'Da',    label: 'Diffusion a',     uniform: 'u_Da',    min: 0.001, max: 0.1, default: 0.01, step: 0.001 },
            { id: 'Dh',    label: 'Diffusion h',     uniform: 'u_Dh',    min: 0.1, max: 2.0, default: 0.5, step: 0.01 },
            { id: 'rho',   label: 'Production (rho)',uniform: 'u_rho',   min: 0.1, max: 5.0, default: 1.0, step: 0.1 },
            { id: 'mu_a',  label: 'Decay a',         uniform: 'u_mu_a',  min: 0.1, max: 3.0, default: 1.0, step: 0.1 },
            { id: 'mu_h',  label: 'Decay h',         uniform: 'u_mu_h',  min: 0.1, max: 3.0, default: 1.0, step: 0.1 },
            { id: 'rho_a', label: 'Base prod a',     uniform: 'u_rho_a', min: 0.0, max: 0.1, default: 0.01, step: 0.001 },
            { id: 'dt',    label: 'Time Step',        uniform: 'u_dt',    min: 0.1, max: 2.0, default: 0.5, step: 0.05 }
        ],
        normalization: { channel0: [0, 5], channel1: [0, 10] }
    },
    brusselator: {
        name: 'Brusselator',
        params: [
            { id: 'A',  label: 'A',            uniform: 'u_A',  min: 0.5, max: 5.0, default: 1.0, step: 0.1 },
            { id: 'B',  label: 'B',            uniform: 'u_B',  min: 1.0, max: 5.0, default: 3.0, step: 0.1 },
            { id: 'Du', label: 'Diffusion u',  uniform: 'u_Du', min: 0.5, max: 5.0, default: 1.0, step: 0.1 },
            { id: 'Dv', label: 'Diffusion v',  uniform: 'u_Dv', min: 2.0, max: 20.0, default: 8.0, step: 0.5 },
            { id: 'dt', label: 'Time Step',     uniform: 'u_dt', min: 0.001, max: 0.02, default: 0.005, step: 0.001 }
        ],
        normalization: { channel0: [0, 5], channel1: [0, 5] }
    },
    schnakenberg: {
        name: 'Schnakenberg',
        params: [
            { id: 'a',  label: 'a',            uniform: 'u_a',  min: 0.01, max: 0.5, default: 0.1, step: 0.01 },
            { id: 'b',  label: 'b',            uniform: 'u_b',  min: 0.5, max: 2.0, default: 0.9, step: 0.01 },
            { id: 'Du', label: 'Diffusion u',  uniform: 'u_Du', min: 0.5, max: 5.0, default: 1.0, step: 0.1 },
            { id: 'Dv', label: 'Diffusion v',  uniform: 'u_Dv', min: 5.0, max: 50.0, default: 20.0, step: 1.0 },
            { id: 'dt', label: 'Time Step',     uniform: 'u_dt', min: 0.001, max: 0.05, default: 0.01, step: 0.001 }
        ],
        normalization: { channel0: [0, 3], channel1: [0, 3] }
    }
};

export const PRESETS = {
    grayScott: [
        { name: 'Coral',       desc: 'Branching coral-like growth patterns', params: { feed: 0.0545, kill: 0.062, Du: 0.2097, Dv: 0.105, dt: 1.0 } },
        { name: 'Mitosis',     desc: 'Splitting cell-like blobs',            params: { feed: 0.0367, kill: 0.0649, Du: 0.2097, Dv: 0.105, dt: 1.0 } },
        { name: 'Fingerprint', desc: 'Winding labyrinthine ridges',          params: { feed: 0.055, kill: 0.062, Du: 0.2097, Dv: 0.105, dt: 1.0 } },
        { name: 'Zebra',       desc: 'Bold parallel stripe patterns',        params: { feed: 0.04, kill: 0.06, Du: 0.2097, Dv: 0.105, dt: 1.0 } },
        { name: 'Spots',       desc: 'Evenly spaced circular dots',          params: { feed: 0.03, kill: 0.063, Du: 0.2097, Dv: 0.105, dt: 1.0 } },
        { name: 'Worms',       desc: 'Writhing worm-like structures',        params: { feed: 0.078, kill: 0.061, Du: 0.2097, Dv: 0.105, dt: 1.0 } },
        { name: 'Maze',        desc: 'Dense interconnected maze pathways',   params: { feed: 0.029, kill: 0.057, Du: 0.2097, Dv: 0.105, dt: 1.0 } },
        { name: 'Holes',       desc: 'Swiss cheese void patterns',           params: { feed: 0.039, kill: 0.058, Du: 0.2097, Dv: 0.105, dt: 1.0 } }
    ],
    fitzhughNagumo: [
        { name: 'Spiral Waves', desc: 'Rotating spiral wave patterns',       params: { Dv: 1.0, Dw: 0.5, epsilon: 0.02, a0: -0.03, a1: 2.0, stimulus: 0.0, dt: 0.015 } },
        { name: 'Target Waves', desc: 'Expanding concentric ring waves',     params: { Dv: 1.0, Dw: 0.0, epsilon: 0.02, a0: 0.1, a1: 2.0, stimulus: 0.0, dt: 0.015 } },
        { name: 'Chaos',        desc: 'Turbulent chaotic excitation',        params: { Dv: 1.0, Dw: 0.1, epsilon: 0.05, a0: -0.1, a1: 1.5, stimulus: 0.0, dt: 0.01 } },
        { name: 'Breathing',    desc: 'Oscillating breathing pulses',        params: { Dv: 1.0, Dw: 0.5, epsilon: 0.01, a0: 0.0, a1: 2.5, stimulus: 0.1, dt: 0.015 } }
    ],
    giererMeinhardt: [
        { name: 'Spots',     desc: 'Isolated activator peaks',              params: { Da: 0.01, Dh: 0.5, rho: 1.0, mu_a: 1.0, mu_h: 1.0, rho_a: 0.01, dt: 0.5 } },
        { name: 'Stripes',   desc: 'Elongated stripe formations',           params: { Da: 0.02, Dh: 0.8, rho: 1.5, mu_a: 1.2, mu_h: 0.8, rho_a: 0.02, dt: 0.5 } },
        { name: 'Labyrinth', desc: 'Complex branching labyrinth',           params: { Da: 0.03, Dh: 1.0, rho: 2.0, mu_a: 1.0, mu_h: 1.5, rho_a: 0.005, dt: 0.3 } },
        { name: 'Dense Dots',desc: 'Tightly packed small dot patterns',     params: { Da: 0.005, Dh: 0.3, rho: 0.8, mu_a: 0.8, mu_h: 1.2, rho_a: 0.02, dt: 0.5 } }
    ],
    brusselator: [
        { name: 'Hex Spots',       desc: 'Hexagonally arranged spot patterns', params: { A: 1.0, B: 3.0, Du: 1.0, Dv: 8.0, dt: 0.005 } },
        { name: 'Traveling Waves', desc: 'Propagating wavefronts',             params: { A: 1.0, B: 2.5, Du: 1.0, Dv: 12.0, dt: 0.005 } },
        { name: 'Turing Stripes',  desc: 'Classic Turing instability stripes', params: { A: 1.5, B: 3.5, Du: 1.0, Dv: 10.0, dt: 0.004 } }
    ],
    schnakenberg: [
        { name: 'Spots',       desc: 'Round spot array formation',          params: { a: 0.1, b: 0.9, Du: 1.0, Dv: 20.0, dt: 0.01 } },
        { name: 'Mixed Mode',  desc: 'Mixture of spots and short stripes',  params: { a: 0.05, b: 1.0, Du: 1.0, Dv: 30.0, dt: 0.008 } },
        { name: 'Oscillating', desc: 'Slowly oscillating concentration waves', params: { a: 0.2, b: 0.8, Du: 1.0, Dv: 15.0, dt: 0.01 } }
    ]
};

export function getDefaultParams(modelName) {
    const def = MODEL_DEFS[modelName];
    const params = {};
    for (const p of def.params) {
        params[p.id] = p.default;
    }
    return params;
}

export function getInitialConditions(modelName, width, height) {
    const size = width * height * 4;
    const data = new Float32Array(size);

    switch (modelName) {
        case 'grayScott':
            // U = 1.0 everywhere, V = 0.0 with scattered seeds
            for (let i = 0; i < width * height; i++) {
                data[i * 4] = 1.0;     // U
                data[i * 4 + 1] = 0.0; // V
            }
            // Place random circular seeds
            for (let s = 0; s < 12; s++) {
                const cx = Math.random() * width;
                const cy = Math.random() * height;
                const r = 5 + Math.random() * 10;
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const dx = x - cx;
                        const dy = y - cy;
                        if (dx * dx + dy * dy < r * r) {
                            const idx = (y * width + x) * 4;
                            data[idx] = 0.5;
                            data[idx + 1] = 0.25;
                        }
                    }
                }
            }
            break;

        case 'fitzhughNagumo':
            // v = 0, w = 0 + small noise
            for (let i = 0; i < width * height; i++) {
                data[i * 4] = (Math.random() - 0.5) * 0.2;
                data[i * 4 + 1] = (Math.random() - 0.5) * 0.2;
            }
            break;

        case 'giererMeinhardt':
            // a = 1 + noise, h = 1 + noise
            for (let i = 0; i < width * height; i++) {
                data[i * 4] = 1.0 + (Math.random() - 0.5) * 0.1;
                data[i * 4 + 1] = 1.0 + (Math.random() - 0.5) * 0.1;
            }
            break;

        case 'brusselator': {
            // u = A, v = B/A + noise (homogeneous steady state)
            const A = 1.0, B = 3.0;
            for (let i = 0; i < width * height; i++) {
                data[i * 4] = A + (Math.random() - 0.5) * 0.1;
                data[i * 4 + 1] = B / A + (Math.random() - 0.5) * 0.1;
            }
            break;
        }

        case 'schnakenberg': {
            // u = a + b, v = b / (a+b)^2 + noise
            const a = 0.1, b = 0.9;
            const uSS = a + b;
            const vSS = b / (uSS * uSS);
            for (let i = 0; i < width * height; i++) {
                data[i * 4] = uSS + (Math.random() - 0.5) * 0.1;
                data[i * 4 + 1] = vSS + (Math.random() - 0.5) * 0.1;
            }
            break;
        }
    }

    return data;
}
