// Keyboard shortcut manager and help overlay

import { PRESETS } from './fractals.js';

const FRACTAL_TYPES = ['julia', 'mandelbrot', 'burningShip', 'newton', 'phoenix'];

export class KeyboardManager {
    constructor({ state, interaction, animation, markDirty, updateSliderDisplays }) {
        this.state = state;
        this.interaction = interaction;
        this.animation = animation;
        this.markDirty = markDirty;
        this.updateSliderDisplays = updateSliderDisplays;
        this.presetIndex = -1;

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            this._handleKey(e);
        });
    }

    _handleKey(e) {
        switch (e.key) {
            case ' ':
                e.preventDefault();
                document.getElementById('animToggle').click();
                break;
            case '1': case '2': case '3': case '4': case '5': {
                const type = FRACTAL_TYPES[parseInt(e.key) - 1];
                const tab = document.querySelector(`[data-fractal="${type}"]`);
                if (tab) tab.click();
                this.presetIndex = -1;
                break;
            }
            case 'r': case 'R':
                document.getElementById('resetView').click();
                break;
            case 'c': case 'C': {
                const cb = document.getElementById('colorCycleToggle');
                cb.checked = !cb.checked;
                cb.dispatchEvent(new Event('change'));
                break;
            }
            case 'ArrowLeft':
                e.preventDefault();
                this._cyclePreset(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this._cyclePreset(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.interaction.zoom /= 1.2;
                this.markDirty();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.interaction.zoom *= 1.2;
                this.markDirty();
                break;
            case '?':
                this._toggleOverlay();
                break;
        }
    }

    _cyclePreset(direction) {
        const presets = PRESETS[this.state.fractal];
        if (!presets || presets.length === 0) return;
        this.presetIndex = ((this.presetIndex + direction) % presets.length + presets.length) % presets.length;
        // Click the preset button in the grid
        const buttons = document.querySelectorAll('#preset-grid .preset-btn');
        if (buttons[this.presetIndex]) buttons[this.presetIndex].click();
    }

    _toggleOverlay() {
        const overlay = document.getElementById('shortcut-overlay');
        overlay.classList.toggle('hidden');
    }
}
