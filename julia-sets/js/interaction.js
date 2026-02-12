// Pan/zoom state machine with mouse and touch support
// Handles coordinate mapping between screen pixels and the complex plane

export class InteractionManager {
    constructor(canvas, onDirty) {
        this.canvas = canvas;
        this.onDirty = onDirty;

        // Viewport in complex plane coordinates
        this.centerX = 0;
        this.centerY = 0;
        this.zoom = 1.5;

        // Drag state
        this._dragging = false;
        this._dragStartX = 0;
        this._dragStartY = 0;
        this._dragStartCenterX = 0;
        this._dragStartCenterY = 0;

        // Pinch state
        this._prevPinch = null;

        // Mouse position in complex coords (for linked mode)
        this.mouseComplex = null;

        this._bindEvents();
    }

    setView(centerX, centerY, zoom) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.zoom = zoom;
        this.onDirty();
    }

    getViewport() {
        return {
            centerX: this.centerX,
            centerY: this.centerY,
            zoom: this.zoom
        };
    }

    getAspectRatio() {
        return this.canvas.clientWidth / this.canvas.clientHeight;
    }

    // Convert screen pixel to complex plane coordinates
    pixelToComplex(px, py) {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspect = w / h;
        const re = this.centerX + (px / w - 0.5) * 2.0 * this.zoom * aspect;
        const im = this.centerY - (py / h - 0.5) * 2.0 * this.zoom;
        return { re, im };
    }

    _bindEvents() {
        const c = this.canvas;

        // Mouse events
        c.addEventListener('mousedown', (e) => this._onMouseDown(e));
        c.addEventListener('mousemove', (e) => this._onMouseMove(e));
        c.addEventListener('mouseup', () => this._onMouseUp());
        c.addEventListener('mouseleave', () => this._onMouseUp());
        c.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });

        // Touch events
        c.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
        c.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
        c.addEventListener('touchend', (e) => this._onTouchEnd(e));
        c.addEventListener('touchcancel', (e) => this._onTouchEnd(e));
    }

    // --- Mouse ---

    _onMouseDown(e) {
        if (e.button !== 0) return;
        this._dragging = true;
        this._dragStartX = e.clientX;
        this._dragStartY = e.clientY;
        this._dragStartCenterX = this.centerX;
        this._dragStartCenterY = this.centerY;
        this.canvas.style.cursor = 'grabbing';
    }

    _onMouseMove(e) {
        // Track mouse position for linked mode
        const rect = this.canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        this.mouseComplex = this.pixelToComplex(px, py);

        if (!this._dragging) return;

        const dx = e.clientX - this._dragStartX;
        const dy = e.clientY - this._dragStartY;
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspect = w / h;

        this.centerX = this._dragStartCenterX - (dx / w) * 2.0 * this.zoom * aspect;
        this.centerY = this._dragStartCenterY + (dy / h) * 2.0 * this.zoom;
        this.onDirty();
    }

    _onMouseUp() {
        this._dragging = false;
        this.canvas.style.cursor = 'crosshair';
    }

    _onWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const mouseC = this.pixelToComplex(px, py);

        const zoomFactor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
        this.zoom *= zoomFactor;

        // Keep point under cursor fixed
        this.centerX = mouseC.re + (this.centerX - mouseC.re) * zoomFactor;
        this.centerY = mouseC.im + (this.centerY - mouseC.im) * zoomFactor;
        this.onDirty();
    }

    // --- Touch ---

    _onTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const t = e.touches[0];
            this._dragging = true;
            this._dragStartX = t.clientX;
            this._dragStartY = t.clientY;
            this._dragStartCenterX = this.centerX;
            this._dragStartCenterY = this.centerY;
        } else if (e.touches.length === 2) {
            this._dragging = false;
            this._prevPinch = this._getPinchData(e.touches);
        }
    }

    _onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1 && this._dragging) {
            const t = e.touches[0];
            const dx = t.clientX - this._dragStartX;
            const dy = t.clientY - this._dragStartY;
            const w = this.canvas.clientWidth;
            const h = this.canvas.clientHeight;
            const aspect = w / h;

            this.centerX = this._dragStartCenterX - (dx / w) * 2.0 * this.zoom * aspect;
            this.centerY = this._dragStartCenterY + (dy / h) * 2.0 * this.zoom;
            this.onDirty();
        } else if (e.touches.length === 2) {
            const pinch = this._getPinchData(e.touches);
            if (this._prevPinch) {
                const scale = this._prevPinch.dist / pinch.dist;
                const aspect = this.getAspectRatio();

                // Pan based on midpoint shift
                const dx = (pinch.midX - this._prevPinch.midX) / this.canvas.clientWidth * 2 * this.zoom * aspect;
                const dy = (pinch.midY - this._prevPinch.midY) / this.canvas.clientHeight * 2 * this.zoom;
                this.centerX -= dx;
                this.centerY += dy;

                // Zoom toward pinch center
                const midC = this.pixelToComplex(
                    pinch.midX - this.canvas.getBoundingClientRect().left,
                    pinch.midY - this.canvas.getBoundingClientRect().top
                );
                this.zoom *= scale;
                this.centerX = midC.re + (this.centerX - midC.re) * scale;
                this.centerY = midC.im + (this.centerY - midC.im) * scale;

                this.onDirty();
            }
            this._prevPinch = pinch;
        }
    }

    _onTouchEnd(e) {
        if (e.touches.length === 0) {
            this._dragging = false;
            this._prevPinch = null;
        } else if (e.touches.length === 1) {
            // Transition from pinch back to single-touch drag
            this._prevPinch = null;
            const t = e.touches[0];
            this._dragging = true;
            this._dragStartX = t.clientX;
            this._dragStartY = t.clientY;
            this._dragStartCenterX = this.centerX;
            this._dragStartCenterY = this.centerY;
        }
    }

    _getPinchData(touches) {
        const t0 = touches[0];
        const t1 = touches[1];
        return {
            dist: Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY),
            midX: (t0.clientX + t1.clientX) / 2,
            midY: (t0.clientY + t1.clientY) / 2
        };
    }
}
