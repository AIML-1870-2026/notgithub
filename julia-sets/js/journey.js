// Guided exploration controller — smoothly interpolates between fractal waypoints

import { JOURNEYS } from './fractals.js';

export class Journey {
    constructor({ state, interaction, markDirty, updateSliderDisplays }) {
        this.state = state;
        this.interaction = interaction;
        this.markDirty = markDirty;
        this.updateSliderDisplays = updateSliderDisplays;

        this.playing = false;
        this.paused = false;
        this.progress = 0;
        this.waypoints = null;
        this.speed = 1.0;

        this._selectEl = document.getElementById('journey-select');
        this._playBtn = document.getElementById('journeyPlay');
        this._prevBtn = document.getElementById('journeyPrev');
        this._nextBtn = document.getElementById('journeyNext');
        this._speedSlider = document.getElementById('journeySpeed');
        this._speedValue = document.getElementById('journeySpeedValue');
        this._labelEl = document.getElementById('waypoint-label');

        this._initUI();
        this.populateForFractal(state.fractal);

        // Pause journey on user interaction
        const canvas = document.getElementById('fractal-canvas');
        canvas.addEventListener('mousedown', () => this._pauseOnInteraction());
        canvas.addEventListener('touchstart', () => this._pauseOnInteraction());
    }

    _initUI() {
        this._selectEl.addEventListener('change', () => {
            this._updateButtons();
        });

        this._playBtn.addEventListener('click', () => {
            if (this.playing && !this.paused) {
                this.pause();
            } else if (this.paused) {
                this.resume();
            } else {
                this.play();
            }
        });

        this._prevBtn.addEventListener('click', () => this._skipWaypoint(-1));
        this._nextBtn.addEventListener('click', () => this._skipWaypoint(1));

        this._speedSlider.addEventListener('input', () => {
            this.speed = parseFloat(this._speedSlider.value);
            this._speedValue.textContent = this.speed.toFixed(1);
        });
    }

    populateForFractal(fractalType) {
        const journeys = JOURNEYS[fractalType] || [];
        this._selectEl.innerHTML = '<option value="">-- Select a Journey --</option>';
        journeys.forEach((j, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = j.name;
            this._selectEl.appendChild(opt);
        });
        this.stop();
        this._updateButtons();
    }

    play() {
        const idx = parseInt(this._selectEl.value);
        const journeys = JOURNEYS[this.state.fractal] || [];
        if (isNaN(idx) || !journeys[idx]) return;

        this.waypoints = journeys[idx].waypoints;
        this.playing = true;
        this.paused = false;
        this.progress = 0;
        this._playBtn.textContent = 'Pause';
        this._prevBtn.disabled = false;
        this._nextBtn.disabled = false;
    }

    pause() {
        this.paused = true;
        this._playBtn.textContent = 'Resume';
    }

    resume() {
        this.paused = false;
        this._playBtn.textContent = 'Pause';
    }

    stop() {
        this.playing = false;
        this.paused = false;
        this.progress = 0;
        this.waypoints = null;
        this._playBtn.textContent = 'Start Journey';
        this._prevBtn.disabled = true;
        this._nextBtn.disabled = true;
        this._labelEl.classList.add('hidden');
    }

    _pauseOnInteraction() {
        if (this.playing && !this.paused) {
            this.pause();
        }
    }

    _skipWaypoint(direction) {
        if (!this.waypoints || this.waypoints.length < 2) return;
        const totalDur = this._totalDuration();
        const currentTime = this.progress * totalDur;

        // Find current waypoint index
        let elapsed = 0;
        let wpIdx = 0;
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            elapsed += this.waypoints[i].duration;
            if (currentTime < elapsed) { wpIdx = i; break; }
            wpIdx = i + 1;
        }

        const targetIdx = Math.max(0, Math.min(this.waypoints.length - 1, wpIdx + direction));
        // Compute progress for start of target waypoint
        let targetTime = 0;
        for (let i = 0; i < targetIdx; i++) {
            targetTime += this.waypoints[i].duration;
        }
        this.progress = targetTime / totalDur;
        if (!this.playing) this.play();
        if (this.paused) this.resume();
        this.markDirty();
    }

    _updateButtons() {
        const hasSelection = this._selectEl.value !== '';
        this._playBtn.disabled = !hasSelection;
        this._prevBtn.disabled = !this.playing;
        this._nextBtn.disabled = !this.playing;
    }

    update(dt) {
        if (!this.playing || this.paused || !this.waypoints) return false;

        const totalDur = this._totalDuration();
        this.progress += (dt * this.speed) / totalDur;

        if (this.progress >= 1.0) {
            this.stop();
            return true;
        }

        const interpolated = this._interpolateAtProgress(this.progress);

        // Apply params
        if (interpolated.params) {
            for (const [k, v] of Object.entries(interpolated.params)) {
                this.state.params[k] = v;
            }
            this.updateSliderDisplays();
        }

        // Apply view (logarithmic interpolation for zoom)
        if (interpolated.view) {
            this.interaction.centerX = interpolated.view.centerX;
            this.interaction.centerY = interpolated.view.centerY;
            this.interaction.zoom = interpolated.view.zoom;
        }

        // Update waypoint label
        this._showLabel(interpolated.label);
        this.markDirty();
        return true;
    }

    _interpolateAtProgress(progress) {
        const totalDur = this._totalDuration();
        const targetTime = progress * totalDur;

        // Find which segment we're in
        let elapsed = 0;
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const segDur = this.waypoints[i].duration;
            if (targetTime <= elapsed + segDur) {
                const segProgress = (targetTime - elapsed) / segDur;
                return this._lerpWaypoints(this.waypoints[i], this.waypoints[i + 1], this._smoothstep(segProgress));
            }
            elapsed += segDur;
        }

        // At the end
        const last = this.waypoints[this.waypoints.length - 1];
        return { params: last.params || null, view: last.view || null, label: last.label };
    }

    _lerpWaypoints(a, b, t) {
        const result = { label: t < 0.5 ? a.label : b.label };

        // Interpolate params
        if (a.params && b.params) {
            result.params = {};
            for (const key of Object.keys(a.params)) {
                if (key in b.params) {
                    result.params[key] = a.params[key] + (b.params[key] - a.params[key]) * t;
                }
            }
        }

        // Interpolate view (logarithmic for zoom)
        if (a.view && b.view) {
            result.view = {
                centerX: a.view.centerX + (b.view.centerX - a.view.centerX) * t,
                centerY: a.view.centerY + (b.view.centerY - a.view.centerY) * t,
                zoom: Math.exp(Math.log(a.view.zoom) + (Math.log(b.view.zoom) - Math.log(a.view.zoom)) * t),
            };
        }

        return result;
    }

    _smoothstep(t) {
        return t * t * (3 - 2 * t);
    }

    _totalDuration() {
        return this.waypoints.reduce((sum, wp) => sum + wp.duration, 0);
    }

    _showLabel(text) {
        this._labelEl.textContent = text;
        this._labelEl.classList.remove('hidden');
    }
}
