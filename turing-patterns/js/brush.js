// Brush interaction system: mouse/touch painting on the simulation canvas

export class Brush {
    constructor(canvas) {
        this.canvas = canvas;
        this.active = false;
        this.pos = { x: -1, y: -1 };
        this.radius = 20;       // in pixels
        this.intensity = 0.5;

        this.cursorEl = document.getElementById('brush-cursor');

        // Mouse events
        canvas.addEventListener('mousedown', (e) => this._onDown(e));
        canvas.addEventListener('mousemove', (e) => this._onMove(e));
        canvas.addEventListener('mouseup', () => this._onUp());
        canvas.addEventListener('mouseleave', () => this._onLeave());
        canvas.addEventListener('mouseenter', (e) => this._onEnter(e));

        // Touch events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._onDown(e.touches[0]);
        }, { passive: false });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this._onMove(e.touches[0]);
        }, { passive: false });
        canvas.addEventListener('touchend', () => this._onUp());
    }

    _onDown(e) {
        this.active = true;
        this._updatePosition(e);
    }

    _onMove(e) {
        this._updateCursor(e);
        if (this.active) {
            this._updatePosition(e);
        }
    }

    _onUp() {
        this.active = false;
        this.pos = { x: -1, y: -1 };
    }

    _onLeave() {
        this.active = false;
        this.pos = { x: -1, y: -1 };
        if (this.cursorEl) this.cursorEl.style.display = 'none';
    }

    _onEnter(e) {
        this._updateCursor(e);
    }

    _updatePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.pos.x = (e.clientX - rect.left) / rect.width;
        this.pos.y = 1.0 - (e.clientY - rect.top) / rect.height;
    }

    _updateCursor(e) {
        if (!this.cursorEl) return;
        const canvasRect = this.canvas.getBoundingClientRect();
        const containerRect = this.canvas.parentElement.getBoundingClientRect();
        const x = e.clientX - containerRect.left;
        const y = e.clientY - containerRect.top;

        // Scale brush radius from simulation pixels to display pixels
        const displayScale = canvasRect.width / 512;
        const displayRadius = this.radius * displayScale;

        this.cursorEl.style.display = 'block';
        this.cursorEl.style.left = x + 'px';
        this.cursorEl.style.top = y + 'px';
        this.cursorEl.style.width = (displayRadius * 2) + 'px';
        this.cursorEl.style.height = (displayRadius * 2) + 'px';
    }

    setRadius(r) {
        this.radius = r;
    }

    setIntensity(i) {
        this.intensity = i;
    }

    getUniforms() {
        return {
            brushPos: this.active ? [this.pos.x, this.pos.y] : [-1, -1],
            brushRadius: this.radius / 512.0,
            brushIntensity: this.intensity
        };
    }
}
