// Sidebar DOM wiring, dynamic slider generation, and UI state management

import { FRACTAL_DEFS, PRESETS, getDefaultParams } from './fractals.js';
import { COLOR_MAPS, updateColormapTexture } from './colormap.js';

export function initControls(app) {
    const { renderer, interaction, animation, colormapTex, markDirty } = app;
    const gl = renderer.gl;


    // Application state
    const state = {
        fractal: 'julia',
        params: getDefaultParams('julia'),
        maxIter: 200,
        palette: 'classic',
        time: 0,
        linkedMode: false,
        colorCycling: false,
        colorCycleSpeed: 1.0,
        colorOffset: 0,
        colorMode: 0,
    };

    const fractalChangeCallbacks = [];

    // --- Fractal type tabs ---
    const fractalTabs = document.querySelectorAll('.fractal-tab');
    fractalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const type = tab.dataset.fractal;
            if (type === state.fractal) return;

            fractalTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            state.fractal = type;
            state.params = getDefaultParams(type);
            const def = FRACTAL_DEFS[type];
            interaction.setView(def.defaultView.centerX, def.defaultView.centerY, def.defaultView.zoom);

            renderParamSliders();
            renderPresets();
            updateLinkedSection();
            updateAnimSection();
            fractalChangeCallbacks.forEach(cb => cb(type));
            markDirty();
        });
    });

    // --- Dynamic parameter sliders ---
    const paramContainer = document.getElementById('param-sliders');

    function renderParamSliders() {
        const def = FRACTAL_DEFS[state.fractal];
        paramContainer.innerHTML = '';

        if (def.params.length === 0) {
            paramContainer.innerHTML = '<p class="hint">No adjustable parameters</p>';
            return;
        }

        for (const p of def.params) {
            const group = document.createElement('div');
            group.className = 'control-group';

            const label = document.createElement('label');
            const valueSpan = document.createElement('span');
            valueSpan.id = `val-${p.id}`;
            valueSpan.textContent = state.params[p.id].toFixed(p.step < 1 ? 3 : 0);
            label.textContent = `${p.label}: `;
            label.appendChild(valueSpan);

            const input = document.createElement('input');
            input.type = 'range';
            input.id = `slider-${p.id}`;
            input.min = p.min;
            input.max = p.max;
            input.step = p.step;
            input.value = state.params[p.id];

            input.addEventListener('input', () => {
                const val = parseFloat(input.value);
                state.params[p.id] = val;
                valueSpan.textContent = val.toFixed(p.step < 1 ? 3 : 0);
                markDirty();
            });

            group.appendChild(label);
            group.appendChild(input);
            paramContainer.appendChild(group);
        }
    }

    // Update slider displays (e.g., during animation)
    function updateSliderDisplays() {
        const def = FRACTAL_DEFS[state.fractal];
        for (const p of def.params) {
            const slider = document.getElementById(`slider-${p.id}`);
            const valSpan = document.getElementById(`val-${p.id}`);
            if (slider && valSpan) {
                slider.value = state.params[p.id];
                valSpan.textContent = state.params[p.id].toFixed(p.step < 1 ? 3 : 0);
            }
        }
    }

    // --- Presets ---
    const presetGrid = document.getElementById('preset-grid');

    function renderPresets() {
        const fractalPresets = PRESETS[state.fractal] || [];
        presetGrid.innerHTML = '';

        for (const preset of fractalPresets) {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.textContent = preset.name;
            btn.addEventListener('click', () => {
                if (preset.params) {
                    for (const [key, val] of Object.entries(preset.params)) {
                        state.params[key] = val;
                    }
                    renderParamSliders();
                }
                if (preset.view) {
                    interaction.setView(preset.view.centerX, preset.view.centerY, preset.view.zoom);
                }
                markDirty();
            });
            presetGrid.appendChild(btn);
        }
    }

    // --- Max iterations slider ---
    const maxIterSlider = document.getElementById('maxIter');
    const maxIterValue = document.getElementById('maxIterValue');
    maxIterSlider.addEventListener('input', () => {
        state.maxIter = parseInt(maxIterSlider.value);
        maxIterValue.textContent = state.maxIter;
        markDirty();
    });

    // --- Color palette ---
    const paletteSelect = document.getElementById('palette-select');
    paletteSelect.addEventListener('change', () => {
        state.palette = paletteSelect.value;
        updateColormapTexture(gl, colormapTex, state.palette);
        markDirty();
    });

    // --- Color cycling ---
    const colorCycleToggle = document.getElementById('colorCycleToggle');
    const colorCycleSpeedSlider = document.getElementById('colorCycleSpeed');
    const colorCycleSpeedValue = document.getElementById('colorCycleSpeedValue');
    const colorCycleSpeedGroup = document.getElementById('colorCycleSpeedGroup');

    colorCycleToggle.addEventListener('change', () => {
        state.colorCycling = colorCycleToggle.checked;
        colorCycleSpeedGroup.style.display = state.colorCycling ? '' : 'none';
        markDirty();
    });

    colorCycleSpeedSlider.addEventListener('input', () => {
        state.colorCycleSpeed = parseFloat(colorCycleSpeedSlider.value);
        colorCycleSpeedValue.textContent = state.colorCycleSpeed.toFixed(1);
    });

    // --- Coloring mode ---
    const colorModeSelect = document.getElementById('color-mode');
    colorModeSelect.addEventListener('change', () => {
        state.colorMode = parseInt(colorModeSelect.value);
        markDirty();
    });

    // --- Animation ---
    const animToggle = document.getElementById('animToggle');
    const animSpeedSlider = document.getElementById('animSpeed');
    const animSpeedValue = document.getElementById('animSpeedValue');
    const animSection = document.getElementById('animation-section');

    animToggle.addEventListener('click', () => {
        const active = animation.toggle();
        animToggle.textContent = active ? 'Stop' : 'Animate';
        animToggle.classList.toggle('animating', active);
    });

    animSpeedSlider.addEventListener('input', () => {
        const speed = parseFloat(animSpeedSlider.value);
        animation.setSpeed(speed);
        animSpeedValue.textContent = speed.toFixed(1);
    });

    function updateAnimSection() {
        const canAnimate = ['julia', 'phoenix', 'newton'].includes(state.fractal);
        animSection.style.display = canAnimate ? '' : 'none';
        if (!canAnimate && animation.active) {
            animation.toggle();
            animToggle.textContent = 'Animate';
            animToggle.classList.remove('animating');
        } else if (canAnimate && !animation.active) {
            animation.toggle();
            animToggle.textContent = 'Stop';
            animToggle.classList.add('animating');
        }
    }

    // --- Linked Mandelbrot -> Julia ---
    const linkedSection = document.getElementById('linked-section');
    const linkedCheckbox = document.getElementById('linkedMode');

    linkedCheckbox.addEventListener('change', () => {
        state.linkedMode = linkedCheckbox.checked;
    });

    function updateLinkedSection() {
        linkedSection.style.display = state.fractal === 'mandelbrot' ? '' : 'none';
        if (state.fractal !== 'mandelbrot') {
            state.linkedMode = false;
            linkedCheckbox.checked = false;
        }
    }

    // --- Fullscreen ---
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    // --- Reset view ---
    const resetBtn = document.getElementById('resetView');
    resetBtn.addEventListener('click', () => {
        const def = FRACTAL_DEFS[state.fractal];
        state.params = getDefaultParams(state.fractal);
        interaction.setView(def.defaultView.centerX, def.defaultView.centerY, def.defaultView.zoom);
        renderParamSliders();
        markDirty();
    });

    // --- Sidebar toggle ---
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        // Resize after animation completes
        setTimeout(() => {
            renderer.resize();
            markDirty();
        }, 350);
    });

    // Initial render of dynamic sections
    renderParamSliders();
    renderPresets();
    updateLinkedSection();
    updateAnimSection();

    return {
        state,
        updateSliderDisplays,
        onFractalChange(cb) { fractalChangeCallbacks.push(cb); }
    };
}
