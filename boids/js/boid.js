import { Vector } from './vector.js';
import { params } from './controls.js';

export class Boid {
    constructor(x, y, width, height) {
        this.position = new Vector(x, y);
        this.velocity = Vector.randomUnit().multiply(params.maxSpeed * 0.5);
        this.acceleration = new Vector(0, 0);
        this.width = width;
        this.height = height;
        this.maxForce = 0.2;
        this.size = 10;
    }

    edges() {
        if (this.position.x > this.width) this.position.x = 0;
        else if (this.position.x < 0) this.position.x = this.width;

        if (this.position.y > this.height) this.position.y = 0;
        else if (this.position.y < 0) this.position.y = this.height;
    }

    separation(boids) {
        const steering = new Vector(0, 0);
        let total = 0;

        for (const other of boids) {
            const d = Vector.distance(this.position, other.position);
            if (other !== this && d < params.perceptionRadius && d > 0) {
                const diff = Vector.subtract(this.position, other.position);
                diff.divide(d * d);
                steering.add(diff);
                total++;
            }
        }

        if (total > 0) {
            steering.divide(total);
            steering.setMagnitude(params.maxSpeed);
            steering.subtract(this.velocity);
            steering.limit(this.maxForce);
        }

        return steering;
    }

    alignment(boids) {
        const steering = new Vector(0, 0);
        let total = 0;

        for (const other of boids) {
            const d = Vector.distance(this.position, other.position);
            if (other !== this && d < params.perceptionRadius) {
                steering.add(other.velocity);
                total++;
            }
        }

        if (total > 0) {
            steering.divide(total);
            steering.setMagnitude(params.maxSpeed);
            steering.subtract(this.velocity);
            steering.limit(this.maxForce);
        }

        return steering;
    }

    cohesion(boids) {
        const steering = new Vector(0, 0);
        let total = 0;

        for (const other of boids) {
            const d = Vector.distance(this.position, other.position);
            if (other !== this && d < params.perceptionRadius) {
                steering.add(other.position);
                total++;
            }
        }

        if (total > 0) {
            steering.divide(total);
            steering.subtract(this.position);
            steering.setMagnitude(params.maxSpeed);
            steering.subtract(this.velocity);
            steering.limit(this.maxForce);
        }

        return steering;
    }

    avoidObstacles(obstacles) {
        const steering = new Vector(0, 0);
        const avoidRadius = params.perceptionRadius * 1.5;

        for (const obstacle of obstacles) {
            const d = Vector.distance(this.position, obstacle.position);
            const minDist = obstacle.radius + 20;

            if (d < avoidRadius + obstacle.radius) {
                const diff = Vector.subtract(this.position, obstacle.position);
                diff.normalize();
                const urgency = Math.max(0, (avoidRadius + obstacle.radius - d) / avoidRadius);
                diff.multiply(urgency * 2);
                steering.add(diff);
            }
        }

        if (steering.magnitude() > 0) {
            steering.setMagnitude(params.maxSpeed);
            steering.subtract(this.velocity);
            steering.limit(this.maxForce * 2);
        }

        return steering;
    }

    flee(predators) {
        const steering = new Vector(0, 0);
        const fleeRadius = params.perceptionRadius * 3;

        for (const predator of predators) {
            const d = Vector.distance(this.position, predator.position);
            if (d < fleeRadius) {
                const diff = Vector.subtract(this.position, predator.position);
                diff.divide(d);
                steering.add(diff);
            }
        }

        if (steering.magnitude() > 0) {
            steering.setMagnitude(params.maxSpeed);
            steering.subtract(this.velocity);
            steering.limit(this.maxForce * 2);
        }

        return steering;
    }

    flock(boids, predators, obstacles) {
        const separation = this.separation(boids);
        const alignment = this.alignment(boids);
        const cohesion = this.cohesion(boids);
        const avoidance = this.avoidObstacles(obstacles);
        const flee = this.flee(predators);

        separation.multiply(params.separationWeight);
        alignment.multiply(params.alignmentWeight);
        cohesion.multiply(params.cohesionWeight);
        avoidance.multiply(1.5);
        flee.multiply(2.0);

        this.acceleration.add(separation);
        this.acceleration.add(alignment);
        this.acceleration.add(cohesion);
        this.acceleration.add(avoidance);
        this.acceleration.add(flee);
    }

    update() {
        this.velocity.add(this.acceleration);
        this.velocity.limit(params.maxSpeed);
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

        ctx.fillStyle = '#4FC3F7';
        ctx.fill();

        ctx.restore();
    }
}
