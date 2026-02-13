// Infinite zoom illusion — when float precision runs out, smoothly resets view

import { FRACTAL_DEFS } from './fractals.js';

export class InfiniteZoom {
    constructor(interaction, markDirty) {
        this.interaction = interaction;
        this.markDirty = markDirty;
        this.enabled = false;
        this.transitioning = false;
        this.transitionProgress = 0;
        this.transitionDuration = 2.0; // seconds
        this.precisionLimit = 5e-7;

        this._savedZoom = 0;
        this._savedCenter = { x: 0, y: 0 };
        this._targetZoom = 0;
        this._targetCenter = { x: 0, y: 0 };
    }

    update(state, dt) {
        if (!this.enabled) return false;

        if (this.transitioning) {
            return this._updateTransition(dt);
        }

        // Check if zoom has hit precision limit
        if (this.interaction.zoom < this.precisionLimit) {
            this._beginTransition(state);
            return true;
        }

        return false;
    }

    _beginTransition(state) {
        this.transitioning = true;
        this.transitionProgress = 0;
        this._savedZoom = this.interaction.zoom;
        this._savedCenter = { x: this.interaction.centerX, y: this.interaction.centerY };

        const def = FRACTAL_DEFS[state.fractal];
        this._targetZoom = def.defaultView.zoom;
        this._targetCenter = { x: def.defaultView.centerX, y: def.defaultView.centerY };
    }

    _updateTransition(dt) {
        this.transitionProgress += dt / this.transitionDuration;

        if (this.transitionProgress >= 1.0) {
            this.transitioning = false;
            this.interaction.zoom = this._targetZoom;
            this.interaction.centerX = this._targetCenter.x;
            this.interaction.centerY = this._targetCenter.y;
            this.markDirty();
            return true;
        }

        // Smoothstep easing
        const t = this.transitionProgress;
        const s = t * t * (3 - 2 * t);

        // Logarithmic interpolation for zoom (linear looks jerky)
        const logSaved = Math.log(this._savedZoom);
        const logTarget = Math.log(this._targetZoom);
        this.interaction.zoom = Math.exp(logSaved + (logTarget - logSaved) * s);

        // Linear interpolation for center
        this.interaction.centerX = this._savedCenter.x + (this._targetCenter.x - this._savedCenter.x) * s;
        this.interaction.centerY = this._savedCenter.y + (this._targetCenter.y - this._savedCenter.y) * s;

        this.markDirty();
        return true;
    }

    isTransitioning() {
        return this.transitioning;
    }
}
