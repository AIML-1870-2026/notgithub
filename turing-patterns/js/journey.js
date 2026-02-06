// Parameter space journey: predefined paths + user-drawn waypoints

import { MODEL_DEFS } from './models.js';

// Predefined journeys through parameter space (primarily Gray-Scott F/K space)
const JOURNEYS = {
    grayScott: [
        {
            name: 'Spots to Stripes',
            desc: 'Transition from spots through mixed mode to stripe patterns',
            paramX: 'feed', paramY: 'kill',
            waypoints: [
                { feed: 0.03, kill: 0.063 },
                { feed: 0.035, kill: 0.063 },
                { feed: 0.04, kill: 0.062 },
                { feed: 0.045, kill: 0.061 },
                { feed: 0.055, kill: 0.062 }
            ]
        },
        {
            name: 'Calm to Chaos',
            desc: 'From stable patterns into chaotic turbulence',
            paramX: 'feed', paramY: 'kill',
            waypoints: [
                { feed: 0.03, kill: 0.063 },
                { feed: 0.04, kill: 0.06 },
                { feed: 0.05, kill: 0.065 },
                { feed: 0.06, kill: 0.062 },
                { feed: 0.078, kill: 0.061 }
            ]
        },
        {
            name: 'Morphogenesis',
            desc: 'Explore the full range of Gray-Scott pattern formation',
            paramX: 'feed', paramY: 'kill',
            waypoints: [
                { feed: 0.029, kill: 0.057 },
                { feed: 0.0367, kill: 0.0649 },
                { feed: 0.0545, kill: 0.062 },
                { feed: 0.039, kill: 0.058 },
                { feed: 0.03, kill: 0.063 }
            ]
        }
    ],
    fitzhughNagumo: [
        {
            name: 'Spiral Evolution',
            desc: 'Watch spirals form and evolve',
            paramX: 'epsilon', paramY: 'a0',
            waypoints: [
                { epsilon: 0.01, a0: 0.0 },
                { epsilon: 0.02, a0: -0.03 },
                { epsilon: 0.03, a0: -0.05 },
                { epsilon: 0.05, a0: -0.1 }
            ]
        }
    ],
    brusselator: [
        {
            name: 'Instability Onset',
            desc: 'Cross the Turing instability threshold',
            paramX: 'B', paramY: 'Dv',
            waypoints: [
                { A: 1.0, B: 2.0, Dv: 8.0 },
                { A: 1.0, B: 2.5, Dv: 8.0 },
                { A: 1.0, B: 3.0, Dv: 8.0 },
                { A: 1.0, B: 3.5, Dv: 10.0 }
            ]
        }
    ]
};

export class Journey {
    constructor(app) {
        this.app = app;
        this.playing = false;
        this.looping = false;
        this.speed = 50;
        this.progress = 0;
        this.waypoints = null;
        this.customWaypoints = [];
        this.drawingPath = false;
        this.currentModel = 'grayScott';

        // Parameter axes for the 2D map
        this.paramX = 'feed';
        this.paramY = 'kill';

        this._initUI();
    }

    _initUI() {
        // Journey select dropdown
        this.selectEl = document.getElementById('journey-select');
        this.populateJourneys('grayScott');

        this.selectEl.addEventListener('change', () => {
            const val = this.selectEl.value;
            if (!val) {
                this.waypoints = null;
                document.getElementById('journeyPlay').disabled = true;
                return;
            }
            const journeys = JOURNEYS[this.currentModel] || [];
            const j = journeys.find(j => j.name === val);
            if (j) {
                this.waypoints = j.waypoints;
                this.paramX = j.paramX;
                this.paramY = j.paramY;
                document.getElementById('journeyPlay').disabled = false;
                this._drawMap();
            }
        });

        // Speed
        const speedSlider = document.getElementById('journeySpeed');
        const speedValue = document.getElementById('journeySpeedValue');
        speedSlider.addEventListener('input', () => {
            this.speed = parseInt(speedSlider.value);
            speedValue.textContent = this.speed;
        });

        // Play/Stop
        const playBtn = document.getElementById('journeyPlay');
        playBtn.addEventListener('click', () => {
            if (this.playing) {
                this.stop();
            } else {
                this.play();
            }
        });

        // Loop
        const loopCb = document.getElementById('journeyLoop');
        loopCb.addEventListener('change', () => {
            this.looping = loopCb.checked;
        });

        // Draw path button
        const drawBtn = document.getElementById('journeyDrawPath');
        drawBtn.addEventListener('click', () => {
            this.drawingPath = !this.drawingPath;
            drawBtn.textContent = this.drawingPath ? 'Done Drawing' : 'Draw Path';

            const mapCanvas = document.getElementById('journey-map');
            const mapLabels = document.getElementById('journey-map-labels');
            mapCanvas.classList.toggle('hidden', !this.drawingPath && !this.waypoints);
            mapLabels.classList.toggle('hidden', !this.drawingPath && !this.waypoints);

            if (this.drawingPath) {
                this.customWaypoints = [];
                this._setupMapCanvas();
                this._drawMap();
            } else if (this.customWaypoints.length >= 2) {
                this.waypoints = this.customWaypoints;
                document.getElementById('journeyPlay').disabled = false;
                this.selectEl.value = '';
            }
        });
    }

    populateJourneys(modelName) {
        this.currentModel = modelName;
        const journeys = JOURNEYS[modelName] || [];
        this.selectEl.innerHTML = '<option value="">-- Select a Journey --</option>';
        journeys.forEach(j => {
            const opt = document.createElement('option');
            opt.value = j.name;
            opt.textContent = j.name;
            this.selectEl.appendChild(opt);
        });

        // Set default axes for map
        const modelDef = MODEL_DEFS[modelName];
        if (modelDef && modelDef.params.length >= 2) {
            this.paramX = modelDef.params[0].id;
            this.paramY = modelDef.params[1].id;
        }

        this.stop();
        this.waypoints = null;
        this.customWaypoints = [];
        document.getElementById('journeyPlay').disabled = true;

        const mapCanvas = document.getElementById('journey-map');
        const mapLabels = document.getElementById('journey-map-labels');
        mapCanvas.classList.add('hidden');
        mapLabels.classList.add('hidden');
        this.drawingPath = false;
        document.getElementById('journeyDrawPath').textContent = 'Draw Path';
    }

    _setupMapCanvas() {
        const mapCanvas = document.getElementById('journey-map');
        const mapLabels = document.getElementById('journey-map-labels');
        mapCanvas.classList.remove('hidden');
        mapLabels.classList.remove('hidden');

        // Update axis labels
        const modelDef = MODEL_DEFS[this.currentModel];
        const pX = modelDef.params.find(p => p.id === this.paramX);
        const pY = modelDef.params.find(p => p.id === this.paramY);
        document.querySelector('.x-label').textContent = pX ? pX.label : this.paramX;
        document.querySelector('.y-label').textContent = pY ? pY.label : this.paramY;

        // Only attach click listener once
        if (!this._mapListenerAttached) {
            this._mapListenerAttached = true;
            mapCanvas.addEventListener('click', (e) => {
                if (!this.drawingPath) return;

                const rect = mapCanvas.getBoundingClientRect();
                const nx = (e.clientX - rect.left) / rect.width;
                const ny = 1.0 - (e.clientY - rect.top) / rect.height;

                const md = MODEL_DEFS[this.currentModel];
                const xParam = md.params.find(p => p.id === this.paramX);
                const yParam = md.params.find(p => p.id === this.paramY);

                const wp = {};
                for (const p of md.params) {
                    wp[p.id] = this.app.controlState.params[p.id];
                }
                if (xParam) wp[this.paramX] = xParam.min + nx * (xParam.max - xParam.min);
                if (yParam) wp[this.paramY] = yParam.min + ny * (yParam.max - yParam.min);

                this.customWaypoints.push(wp);
                this._drawMap();
            });
        }
    }

    _drawMap() {
        const mapCanvas = document.getElementById('journey-map');
        const ctx = mapCanvas.getContext('2d');
        const w = mapCanvas.width;
        const h = mapCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Background grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * w;
            const y = (i / 10) * h;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        const points = this.drawingPath ? this.customWaypoints : (this.waypoints || []);
        if (points.length === 0) return;

        const modelDef = MODEL_DEFS[this.currentModel];
        const xParam = modelDef.params.find(p => p.id === this.paramX);
        const yParam = modelDef.params.find(p => p.id === this.paramY);
        if (!xParam || !yParam) return;

        const toCanvas = (wp) => {
            const nx = (wp[this.paramX] - xParam.min) / (xParam.max - xParam.min);
            const ny = (wp[this.paramY] - yParam.min) / (yParam.max - yParam.min);
            return { x: nx * w, y: (1 - ny) * h };
        };

        // Draw path line
        ctx.strokeStyle = '#4FC3F7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const first = toCanvas(points[0]);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < points.length; i++) {
            const p = toCanvas(points[i]);
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        // Draw waypoint dots
        points.forEach((wp, i) => {
            const p = toCanvas(wp);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = i === 0 ? '#2e7d32' : (i === points.length - 1 ? '#c62828' : '#4FC3F7');
            ctx.fill();
        });

        // Draw progress indicator
        if (this.playing && this.waypoints) {
            const current = this._interpolateAtProgress(this.progress);
            const cp = toCanvas(current);
            ctx.beginPath();
            ctx.arc(cp.x, cp.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = '#4FC3F7';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    _interpolateAtProgress(t) {
        const wps = this.waypoints;
        if (!wps || wps.length === 0) return {};
        if (wps.length === 1) return { ...wps[0] };

        const totalSegments = wps.length - 1;
        const segFloat = t * totalSegments;
        const segIdx = Math.min(Math.floor(segFloat), totalSegments - 1);
        const segT = segFloat - segIdx;

        const a = wps[segIdx];
        const b = wps[segIdx + 1];
        const result = {};
        for (const key of Object.keys(a)) {
            result[key] = a[key] + (b[key] - a[key]) * segT;
        }
        return result;
    }

    play() {
        if (!this.waypoints || this.waypoints.length < 2) return;
        this.playing = true;
        this.progress = 0;
        const btn = document.getElementById('journeyPlay');
        btn.textContent = 'Stop Journey';
        btn.classList.add('playing');

        const mapCanvas = document.getElementById('journey-map');
        const mapLabels = document.getElementById('journey-map-labels');
        mapCanvas.classList.remove('hidden');
        mapLabels.classList.remove('hidden');
    }

    stop() {
        this.playing = false;
        this.progress = 0;
        const btn = document.getElementById('journeyPlay');
        btn.textContent = 'Play Journey';
        btn.classList.remove('playing');
    }

    update(controlState) {
        if (!this.playing || !this.waypoints) return;

        // Advance progress based on speed
        const increment = (this.speed / 5000);
        this.progress += increment;

        if (this.progress >= 1.0) {
            if (this.looping) {
                this.progress = 0;
            } else {
                this.progress = 1.0;
                this.stop();
                return;
            }
        }

        // Interpolate parameters and apply
        const interpolated = this._interpolateAtProgress(this.progress);
        for (const [key, val] of Object.entries(interpolated)) {
            controlState.params[key] = val;
        }

        // Update slider displays
        const modelDef = MODEL_DEFS[this.currentModel];
        for (const p of modelDef.params) {
            const valEl = document.getElementById(`param-${p.id}-val`);
            const sliderEl = document.getElementById(`param-${p.id}`);
            if (valEl && controlState.params[p.id] !== undefined) {
                const v = controlState.params[p.id];
                const decimals = Math.max(0, -Math.floor(Math.log10(p.step)));
                valEl.textContent = v.toFixed(decimals);
                if (sliderEl) sliderEl.value = v;
            }
        }

        this._drawMap();
    }
}
