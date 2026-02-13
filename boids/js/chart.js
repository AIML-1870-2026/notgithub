const HISTORY_LENGTH = 200;

const SERIES_CONFIG = {
    fps:      { label: 'FPS',       color: '#66BB6A', maxDefault: 120 },
    boids:    { label: 'Boids',     color: '#FFA726', maxDefault: 300 },
    avgSpeed: { label: 'Avg Speed', color: '#4FC3F7', maxDefault: 10 }
};

export class LiveChart {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.series = {};

        for (const key of Object.keys(SERIES_CONFIG)) {
            this.series[key] = {
                data: [],
                visible: true
            };
        }
    }

    push(values) {
        for (const [key, value] of Object.entries(values)) {
            if (!this.series[key]) continue;
            const arr = this.series[key].data;
            arr.push(value);
            if (arr.length > HISTORY_LENGTH) {
                arr.shift();
            }
        }
    }

    toggle(key) {
        if (this.series[key]) {
            this.series[key].visible = !this.series[key].visible;
            return this.series[key].visible;
        }
        return false;
    }

    draw() {
        const { canvas, ctx } = this;
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Background
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(30, 30, 50, 0.85)';
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 10);
        ctx.fill();

        const pad = { top: 8, right: 8, bottom: 20, left: 32 };
        const plotW = w - pad.left - pad.right;
        const plotH = h - pad.top - pad.bottom;

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        const gridRows = 4;
        for (let i = 0; i <= gridRows; i++) {
            const y = pad.top + (plotH / gridRows) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + plotW, y);
            ctx.stroke();
        }

        // Draw each visible series
        const keys = Object.keys(SERIES_CONFIG);
        for (const key of keys) {
            const series = this.series[key];
            if (!series.visible || series.data.length < 2) continue;

            const config = SERIES_CONFIG[key];
            const data = series.data;

            // Auto-scale: use the max of the data or the default max, whichever is larger
            const dataMax = Math.max(...data);
            const scaleMax = Math.max(config.maxDefault, dataMax * 1.1) || 1;

            ctx.strokeStyle = config.color;
            ctx.lineWidth = 1.5;
            ctx.lineJoin = 'round';
            ctx.beginPath();

            for (let i = 0; i < data.length; i++) {
                const x = pad.left + (i / (HISTORY_LENGTH - 1)) * plotW;
                const y = pad.top + plotH - (data[i] / scaleMax) * plotH;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Y-axis labels (use FPS scale as reference if visible, else avgSpeed)
        const refKey = keys.find(k => this.series[k].visible) || 'fps';
        const refData = this.series[refKey].data;
        const refMax = refData.length > 0
            ? Math.max(SERIES_CONFIG[refKey].maxDefault, Math.max(...refData) * 1.1)
            : SERIES_CONFIG[refKey].maxDefault;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '9px -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= gridRows; i++) {
            const val = Math.round(refMax * (1 - i / gridRows));
            const y = pad.top + (plotH / gridRows) * i;
            ctx.fillText(val, pad.left - 4, y);
        }

        // Time label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '8px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('time \u2192', pad.left + plotW / 2, h - 14);
    }
}
