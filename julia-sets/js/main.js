// Entry point — wires all modules together and runs the animation loop

import { Renderer } from './renderer.js';
import { generateColormapTexture, updateColormapTexture } from './colormap.js';
import { FRACTAL_DEFS, getDefaultParams } from './fractals.js';
import { InteractionManager } from './interaction.js';
import { AnimationController } from './animation.js';
import { initControls } from './controls.js';
import { KeyboardManager } from './keyboard.js';
import { Journey } from './journey.js';
import { InfiniteZoom } from './infiniteZoom.js';

// --- Error display helper ---
function showError(msg) {
    console.error(msg);
    const el = document.getElementById('error-display');
    if (el) {
        el.style.display = 'block';
        el.textContent += msg + '\n';
    }
}

try {

// --- Canvas setup ---
const canvas = document.getElementById('fractal-canvas');
if (!canvas) throw new Error('Canvas element #fractal-canvas not found');

const renderer = new Renderer(canvas);

let dirty = true;
function markDirty() {
    dirty = true;
}

function resizeCanvas() {
    renderer.resize();
    dirty = true;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Core modules ---
const colormapTex = generateColormapTexture(renderer.gl, 'classic');

const interaction = new InteractionManager(canvas, markDirty);
const defaultView = FRACTAL_DEFS.julia.defaultView;
interaction.setView(defaultView.centerX, defaultView.centerY, defaultView.zoom);

const animation = new AnimationController();

// --- Controls ---
const { state, updateSliderDisplays, onFractalChange } = initControls({
    renderer,
    interaction,
    animation,
    colormapTex,
    markDirty
});

// --- Keyboard shortcuts ---
new KeyboardManager({ state, interaction, animation, markDirty, updateSliderDisplays });

// --- Journey mode ---
const journey = new Journey({ state, interaction, markDirty, updateSliderDisplays });
onFractalChange((type) => journey.populateForFractal(type));

// --- Infinite zoom ---
const infiniteZoom = new InfiniteZoom(interaction, markDirty);
document.getElementById('infiniteZoomToggle').addEventListener('change', (e) => {
    infiniteZoom.enabled = e.target.checked;
});

// --- Three-finger swipe to switch fractals ---
const fractalOrder = ['julia', 'mandelbrot', 'burningShip', 'newton', 'phoenix'];
interaction.onSwitch = (direction) => {
    const currentIndex = fractalOrder.indexOf(state.fractal);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + direction + fractalOrder.length) % fractalOrder.length;
    document.querySelector(`[data-fractal="${fractalOrder[nextIndex]}"]`).click();
};

// --- Julia preview for linked mode ---
const previewCanvas = document.getElementById('julia-preview');
let previewRenderer = null;
let previewColormapTex = null;
let previewPalette = null;

function initPreview() {
    if (previewRenderer) return;
    try {
        previewRenderer = new Renderer(previewCanvas);
        previewColormapTex = generateColormapTexture(previewRenderer.gl, state.palette);
        previewPalette = state.palette;
    } catch (e) {
        console.warn('Could not init preview renderer:', e);
    }
}

canvas.addEventListener('mousemove', (e) => {
    if (!state.linkedMode || state.fractal !== 'mandelbrot') {
        previewCanvas.style.display = 'none';
        return;
    }

    initPreview();
    if (!previewRenderer) return;

    // Sync palette if changed
    if (previewPalette !== state.palette) {
        updateColormapTexture(previewRenderer.gl, previewColormapTex, state.palette);
        previewPalette = state.palette;
    }

    const complex = interaction.mouseComplex;
    if (!complex) return;

    // Position preview near cursor
    const offset = 20;
    let left = e.clientX + offset;
    let top = e.clientY + offset;

    // Keep on screen
    if (left + 200 > window.innerWidth) left = e.clientX - 200 - offset;
    if (top + 200 > window.innerHeight) top = e.clientY - 200 - offset;

    previewCanvas.style.display = 'block';
    previewCanvas.style.left = left + 'px';
    previewCanvas.style.top = top + 'px';

    // Render Julia set for this c value
    const previewState = {
        fractal: 'julia',
        params: { cReal: complex.re, cImag: complex.im },
        maxIter: Math.min(state.maxIter, 150),
        time: 0
    };
    const previewViewport = { centerX: 0, centerY: 0, zoom: 1.5 };
    previewRenderer.render(previewState, previewColormapTex, previewViewport);
});

canvas.addEventListener('mouseleave', () => {
    previewCanvas.style.display = 'none';
});

// Click on Mandelbrot to switch to Julia at the hovered c-value
canvas.addEventListener('click', () => {
    if (!state.linkedMode || state.fractal !== 'mandelbrot') return;
    const complex = interaction.mouseComplex;
    if (!complex) return;

    const cReal = complex.re;
    const cImag = complex.im;

    // Use the tab click to properly switch all UI (sliders, presets, sections)
    state.fractal = '_switching';
    document.querySelector('[data-fractal="julia"]').click();

    // Override the default params with the clicked c-value
    state.params.cReal = cReal;
    state.params.cImag = cImag;
    updateSliderDisplays();

    previewCanvas.style.display = 'none';
    markDirty();
});

// --- Animation loop ---
let lastTime = performance.now();
function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    const paramChanged = animation.update(state);
    if (paramChanged) {
        dirty = true;
        updateSliderDisplays();
    }

    if (journey.update(dt)) {
        dirty = true;
    }

    if (infiniteZoom.update(state, dt)) {
        dirty = true;
    }

    if (interaction.updateInertia(dt)) {
        dirty = true;
    }

    if (!dirty) return;
    dirty = false;

    try {
        const viewport = interaction.getViewport();
        renderer.render(state, colormapTex, viewport);

        // Update zoom depth indicator
        const defaultZoom = FRACTAL_DEFS[state.fractal].defaultView.zoom;
        const depth = defaultZoom / viewport.zoom;
        const depthEl = document.getElementById('zoom-depth');
        const indicatorEl = document.getElementById('zoom-indicator');
        if (infiniteZoom.isTransitioning()) {
            depthEl.textContent = '\u21BB Resetting...';
            indicatorEl.classList.remove('warning');
        } else if (depth > 1.5) {
            const exp = Math.log10(depth);
            depthEl.textContent = `10^${exp.toFixed(1)}x`;
            indicatorEl.classList.toggle('warning', viewport.zoom < 5e-7);
        } else {
            depthEl.textContent = '1x';
            indicatorEl.classList.remove('warning');
        }
    } catch (e) {
        showError('Render error: ' + e.message);
    }
}

requestAnimationFrame(animate);

} catch (e) {
    showError('Init error: ' + e.message + '\n' + e.stack);
}
