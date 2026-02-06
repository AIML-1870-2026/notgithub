// UI controls: dynamic slider generation, model switching, presets, all interactive controls

import { MODEL_DEFS, PRESETS, getDefaultParams } from './models.js';
import { updateColormapTexture } from './colormap.js';

export function initControls(app) {
    const state = {
        model: 'grayScott',
        params: getDefaultParams('grayScott'),
        paramsB: getDefaultParams('grayScott'),
        activeSim: 'A',
        channel: 0,
        colorMap: 'heat',
        speed: 10,
        paused: false,
        comparisonMode: true
    };

    // Model tabs
    const modelTabs = document.querySelectorAll('.model-tab');
    modelTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modelTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.model = tab.dataset.model;
            state.params = getDefaultParams(state.model);
            if (state.comparisonMode) {
                state.paramsB = getDefaultParams(state.model);
            }
            renderParamSliders(state);
            renderPresetButtons(state);
            app.onModelChange(state.model);
            app.onJourneyModelChange(state.model);
        });
    });

    // Preset grid
    renderPresetButtons(state);

    // Parameter sliders
    renderParamSliders(state);

    // Brush controls
    const brushSize = document.getElementById('brushSize');
    const brushSizeValue = document.getElementById('brushSizeValue');
    brushSize.addEventListener('input', () => {
        brushSizeValue.textContent = brushSize.value;
        app.brush.setRadius(parseInt(brushSize.value));
    });

    const brushIntensity = document.getElementById('brushIntensity');
    const brushIntensityValue = document.getElementById('brushIntensityValue');
    brushIntensity.addEventListener('input', () => {
        const val = parseInt(brushIntensity.value) / 100;
        brushIntensityValue.textContent = val.toFixed(2);
        app.brush.setIntensity(val);
    });

    // Color map
    const colormapSelect = document.getElementById('colormap-select');
    colormapSelect.addEventListener('change', () => {
        state.colorMap = colormapSelect.value;
        updateColormapTexture(app.renderer.gl, app.colormapTex, state.colorMap);
    });

    // Channel
    const channelSelect = document.getElementById('channel-select');
    channelSelect.addEventListener('change', () => {
        state.channel = parseInt(channelSelect.value);
    });

    // Speed
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    speedSlider.addEventListener('input', () => {
        state.speed = parseInt(speedSlider.value);
        speedValue.textContent = state.speed;
    });

    // Play/Pause
    const playPauseBtn = document.getElementById('playPause');
    playPauseBtn.addEventListener('click', () => {
        state.paused = !state.paused;
        playPauseBtn.textContent = state.paused ? 'Play' : 'Pause';
        playPauseBtn.classList.toggle('paused', state.paused);
    });

    // Reset
    const resetBtn = document.getElementById('reset');
    resetBtn.addEventListener('click', () => {
        state.params = getDefaultParams(state.model);
        if (state.comparisonMode) {
            state.paramsB = getDefaultParams(state.model);
        }
        renderParamSliders(state);
        app.renderer.resetState(state.model);
    });

    // Comparison mode
    const toggleCompBtn = document.getElementById('toggleComparison');
    const compControls = document.getElementById('comparison-controls');
    const divider = document.getElementById('comparison-divider');

    // Set initial comparison UI state
    toggleCompBtn.classList.add('active');
    toggleCompBtn.textContent = 'Disable Comparison';
    compControls.classList.remove('hidden');
    divider.classList.remove('hidden');
    app.renderer.enableComparison(true);

    toggleCompBtn.addEventListener('click', () => {
        state.comparisonMode = !state.comparisonMode;
        toggleCompBtn.classList.toggle('active', state.comparisonMode);
        toggleCompBtn.textContent = state.comparisonMode ? 'Disable Comparison' : 'Enable Comparison';
        compControls.classList.toggle('hidden', !state.comparisonMode);
        divider.classList.toggle('hidden', !state.comparisonMode);

        if (state.comparisonMode) {
            state.paramsB = { ...state.params };
            state.activeSim = 'A';
        } else {
            state.paramsB = null;
        }

        app.renderer.enableComparison(state.comparisonMode);
        renderParamSliders(state);
    });

    // Comparison A/B tabs
    const compTabs = document.querySelectorAll('.comp-tab');
    compTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            compTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.activeSim = tab.dataset.sim;
            renderParamSliders(state);
        });
    });

    // Comparison divider drag
    let draggingDivider = false;
    divider.addEventListener('mousedown', (e) => {
        draggingDivider = true;
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!draggingDivider) return;
        const container = document.getElementById('canvas-container');
        const rect = container.getBoundingClientRect();
        const canvasRect = app.renderer.canvas.getBoundingClientRect();
        const x = (e.clientX - canvasRect.left) / canvasRect.width;
        app.renderer.dividerPos = Math.max(0.02, Math.min(0.98, x));
        divider.style.left = (canvasRect.left - rect.left + x * canvasRect.width) + 'px';
    });
    document.addEventListener('mouseup', () => {
        draggingDivider = false;
    });

    // Education toggle
    const eduToggle = document.getElementById('toggleEducation');
    const eduOverlay = document.getElementById('education-overlay');
    const eduClose = document.getElementById('closeEducation');
    eduToggle.addEventListener('click', () => eduOverlay.classList.remove('hidden'));
    eduClose.addEventListener('click', () => eduOverlay.classList.add('hidden'));
    eduOverlay.addEventListener('click', (e) => {
        if (e.target === eduOverlay) eduOverlay.classList.add('hidden');
    });

    return state;
}

function renderParamSliders(state) {
    const container = document.getElementById('param-sliders');
    container.innerHTML = '';

    const modelDef = MODEL_DEFS[state.model];
    const targetParams = (state.comparisonMode && state.activeSim === 'B')
        ? state.paramsB
        : state.params;

    for (const p of modelDef.params) {
        const group = document.createElement('div');
        group.className = 'control-group';

        const val = targetParams[p.id] !== undefined ? targetParams[p.id] : p.default;

        const label = document.createElement('label');
        label.innerHTML = `${p.label}: <span id="param-${p.id}-val">${formatValue(val, p.step)}</span>`;
        group.appendChild(label);

        const input = document.createElement('input');
        input.type = 'range';
        input.id = `param-${p.id}`;
        input.min = p.min;
        input.max = p.max;
        input.step = p.step;
        input.value = val;

        input.addEventListener('input', () => {
            const v = parseFloat(input.value);
            targetParams[p.id] = v;
            document.getElementById(`param-${p.id}-val`).textContent = formatValue(v, p.step);
        });

        group.appendChild(input);
        container.appendChild(group);
    }
}

function renderPresetButtons(state) {
    const grid = document.getElementById('preset-grid');
    grid.innerHTML = '';

    const presets = PRESETS[state.model] || [];
    presets.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.textContent = preset.name;
        btn.setAttribute('data-tooltip', preset.desc);
        btn.addEventListener('click', () => {
            const targetParams = (state.comparisonMode && state.activeSim === 'B')
                ? state.paramsB
                : state.params;

            for (const [key, val] of Object.entries(preset.params)) {
                targetParams[key] = val;
            }
            renderParamSliders(state);

            // Highlight active preset
            grid.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        grid.appendChild(btn);
    });
}

function formatValue(val, step) {
    if (step >= 1) return Math.round(val).toString();
    const decimals = Math.max(0, -Math.floor(Math.log10(step)));
    return val.toFixed(decimals);
}
