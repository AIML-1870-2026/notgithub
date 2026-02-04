import { Vector } from './vector.js';
import { params } from './controls.js';

export class Predator {
    constructor(x, y, width, height) {
        this.position = new Vector(x, y);
        this.velocity = Vector.randomUnit().multiply(params.predatorSpeed * 0.5);
        this.acceleration = new Vector(0, 0);
        this.width = width;
        this.height = height;
        this.maxForce = 0.15;
        this.huntingRadius = 200;
        this.size = 18;
    }

    edges() {
        if (this.position.x > this.width) this.position.x = 0;
        else if (this.position.x < 0) this.position.x = this.width;

        if (this.position.y > this.height) this.position.y = 0;
        else if (this.position.y < 0) this.position.y = this.height;
    }

    chase(boids) {
        const steering = new Vector(0, 0);
        let closestDist = Infinity;
        let closestBoid = null;

        for (const boid of boids) {
            const d = Vector.distance(this.position, boid.position);
            if (d < this.huntingRadius && d < closestDist) {
                closestDist = d;
                closestBoid = boid;
            }
        }

        if (closestBoid) {
            const target = closestBoid.position.copy();
            const predicted = Vector.multiply(closestBoid.velocity, 10);
            target.add(predicted);

            steering.add(Vector.subtract(target, this.position));
            steering.setMagnitude(params.predatorSpeed);
            steering.subtract(this.velocity);
            steering.limit(this.maxForce);
        }

        return steering;
    }

    avoidObstacles(obstacles) {
        const steering = new Vector(0, 0);
        const avoidRadius = 100;

        for (const obstacle of obstacles) {
            const d = Vector.distance(this.position, obstacle.position);
            if (d < avoidRadius + obstacle.radius) {
                const diff = Vector.subtract(this.position, obstacle.position);
                diff.normalize();
                const urgency = Math.max(0, (avoidRadius + obstacle.radius - d) / avoidRadius);
                diff.multiply(urgency * 2);
                steering.add(diff);
            }
        }

        if (steering.magnitude() > 0) {
            steering.setMagnitude(params.predatorSpeed);
            steering.subtract(this.velocity);
            steering.limit(this.maxForce * 2);
        }

        return steering;
    }

    wander() {
        const wanderForce = Vector.randomUnit().multiply(0.5);
        return wanderForce;
    }

    hunt(boids, obstacles) {
        const chase = this.chase(boids);
        const avoidance = this.avoidObstacles(obstacles);
        const wander = this.wander();

        chase.multiply(1.5);
        avoidance.multiply(2.0);
        wander.multiply(0.3);

        this.acceleration.add(chase);
        this.acceleration.add(avoidance);

        if (chase.magnitude() < 0.1) {
            this.acceleration.add(wander);
        }
    }

    update() {
        this.velocity.add(this.acceleration);
        this.velocity.limit(params.predatorSpeed);
        this.position.add(this.velocity);
        this.acceleration.multiply(0);
    }

    draw(ctx) {
        const angle = this.velocity.heading();

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size / 2, -this.size / 2);
        ctx.lineTo(-this.size / 2, this.size / 2);
        ctx.closePath();

        ctx.fillStyle = '#F44336';
        ctx.fill();

        ctx.restore();
    }
}
