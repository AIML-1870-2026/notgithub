// Main entry point: initializes WebGL, wires modules, runs animation loop

import { Renderer } from './renderer.js';
import { Brush } from './brush.js';
import { initControls } from './controls.js';
import { generateColormapTexture } from './colormap.js';
import { MODEL_DEFS } from './models.js';
import { Journey } from './journey.js';
import { initComparison } from './comparison.js';
import { initEducation } from './education.js';

const canvas = document.getElementById('sim-canvas');

// Initialize renderer
let renderer;
try {
    renderer = new Renderer(canvas);
} catch (e) {
    document.body.innerHTML = `<div style="color:#fff;padding:40px;font-family:sans-serif;">
        <h2>WebGL2 Required</h2>
        <p>${e.message}</p>
        <p>Please use a modern browser with WebGL2 support (Chrome, Firefox, Edge, Safari 15+).</p>
    </div>`;
    throw e;
}

// Initialize brush
const brush = new Brush(canvas);

// Generate initial colormap texture
const colormapTex = generateColormapTexture(renderer.gl, 'heat');

// Application object passed to controls and journey
const app = {
    renderer,
    brush,
    colormapTex,
    controlState: null,
    onModelChange(modelName) {
        renderer.switchModel(modelName);
    },
    onJourneyModelChange(modelName) {
        journey.populateJourneys(modelName);
    }
};

// Initialize controls (returns reactive state object)
const controlState = initControls(app);
app.controlState = controlState;

// Initialize journey
const journey = new Journey(app);

// Initialize comparison divider positioning
initComparison(canvas);

// Initialize education overlay
initEducation();

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update journey if playing
    journey.update(controlState);

    if (!controlState.paused) {
        const noBrush = { brushPos: [-1, -1], brushRadius: 0, brushIntensity: 0 };
        renderer.simulate(
            controlState.speed,
            controlState.params,
            brush.getUniforms(),
            controlState.paramsB
        );
    }

    // Get normalization for current model
    const modelDef = MODEL_DEFS[controlState.model];
    const norm = controlState.channel === 0
        ? modelDef.normalization.channel0
        : modelDef.normalization.channel1;

    renderer.render(colormapTex, controlState.channel, norm[0], norm[1]);
}

animate();
