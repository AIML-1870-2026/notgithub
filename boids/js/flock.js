import { Boid } from './boid.js';
import { Predator } from './predator.js';
import { Obstacle } from './obstacle.js';
import { params } from './controls.js';

export class Flock {
    constructor(width, height) {
        this.boids = [];
        this.predators = [];
        this.obstacles = [];
        this.width = width;
        this.height = height;
    }

    addBoid(x, y) {
        const boid = new Boid(
            x ?? Math.random() * this.width,
            y ?? Math.random() * this.height,
            this.width,
            this.height
        );
        this.boids.push(boid);
    }

    removeBoid() {
        if (this.boids.length > 0) {
            this.boids.pop();
        }
    }

    addPredator(x, y) {
        const predator = new Predator(
            x ?? Math.random() * this.width,
            y ?? Math.random() * this.height,
            this.width,
            this.height
        );
        this.predators.push(predator);
    }

    removePredator() {
        if (this.predators.length > 0) {
            this.predators.pop();
        }
    }

    addObstacle(x, y, radius = 30) {
        const obstacle = new Obstacle(x, y, radius);
        this.obstacles.push(obstacle);
    }

    clearObstacles() {
        this.obstacles = [];
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        for (const boid of this.boids) {
            boid.width = width;
            boid.height = height;
        }

        for (const predator of this.predators) {
            predator.width = width;
            predator.height = height;
        }
    }

    setBoidCount(count) {
        while (this.boids.length < count) {
            this.addBoid();
        }
        while (this.boids.length > count) {
            this.removeBoid();
        }
    }

    getAverageSpeed() {
        if (this.boids.length === 0) return 0;
        let total = 0;
        for (const boid of this.boids) {
            total += boid.velocity.magnitude();
        }
        return total / this.boids.length;
    }

    reset() {
        this.boids = [];
        this.predators = [];
        this.obstacles = [];

        for (let i = 0; i < params.boidCount; i++) {
            this.addBoid();
        }
    }

    run(ctx) {
        for (const obstacle of this.obstacles) {
            obstacle.draw(ctx);
        }

        for (const boid of this.boids) {
            boid.flock(this.boids, this.predators, this.obstacles);
            boid.update();
            boid.edges();
            boid.draw(ctx);
        }

        for (const predator of this.predators) {
            predator.hunt(this.boids, this.obstacles);
            predator.update();
            predator.edges();
            predator.draw(ctx);
        }
    }
}
