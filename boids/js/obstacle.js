import { Vector } from './vector.js';

export class Obstacle {
    constructor(x, y, radius = 30) {
        this.position = new Vector(x, y);
        this.radius = radius;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 100, 120, 0.6)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(150, 150, 170, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
