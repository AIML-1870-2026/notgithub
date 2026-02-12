// Animated parameter oscillation for fractal exploration

export class AnimationController {
    constructor() {
        this.active = false;
        this.speed = 1.0;
        this._startTime = 0;
    }

    toggle() {
        this.active = !this.active;
        if (this.active) {
            this._startTime = performance.now() / 1000;
        }
        return this.active;
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    update(state) {
        if (!this.active) return false;

        const elapsed = (performance.now() / 1000 - this._startTime) * this.speed;

        if (state.fractal === 'julia') {
            state.params.cReal = 0.7885 * Math.cos(elapsed);
            state.params.cImag = 0.7885 * Math.sin(elapsed);
            return true;
        }

        if (state.fractal === 'phoenix') {
            state.params.pReal = -0.5 + 0.3 * Math.sin(elapsed);
            return true;
        }

        if (state.fractal === 'newton') {
            state.params.relaxation = 1.0 + 0.3 * Math.sin(elapsed * 0.5);
            return true;
        }

        return false;
    }
}
