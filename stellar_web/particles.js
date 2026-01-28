import * as THREE from 'three';
import { randomRange, distance, clamp } from './utils.js';

/**
 * Single particle with position, velocity, and movement logic
 */
export class Particle {
    constructor(bounds) {
        this.position = new THREE.Vector3(
            randomRange(-bounds, bounds),
            randomRange(-bounds, bounds),
            randomRange(-bounds, bounds)
        );

        // Start with more varied velocities for natural movement
        this.velocity = new THREE.Vector3(
            randomRange(-1.5, 1.5),
            randomRange(-1.5, 1.5),
            randomRange(-1.5, 1.5)
        );

        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.bounds = bounds;
        this.connections = 0; // Track number of connections
    }

    /**
     * Update particle position with smooth floating movement
     * @param {number} speed - Movement speed multiplier
     * @param {number} deltaTime - Time since last frame
     */
    update(speed, deltaTime) {
        // Add random acceleration more frequently for natural drift
        if (Math.random() < 0.02) { // Increased from 0.01 to 0.02
            this.acceleration.set(
                randomRange(-0.3, 0.3), // Increased from 0.1 to 0.3
                randomRange(-0.3, 0.3),
                randomRange(-0.3, 0.3)
            );
        }

        // Apply acceleration to velocity
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));

        // Apply damping for smooth motion
        this.velocity.multiplyScalar(0.98); // Slightly less damping (was 0.99)

        // Limit velocity
        const maxVelocity = 3.0; // Increased from 2.0 to 3.0
        if (this.velocity.length() > maxVelocity) {
            this.velocity.normalize().multiplyScalar(maxVelocity);
        }

        // Update position with speed multiplier
        this.position.add(this.velocity.clone().multiplyScalar(speed * deltaTime * 10)); // Added 10x multiplier

        // Bounce off boundaries
        this.checkBounds();

        // Decay acceleration
        this.acceleration.multiplyScalar(0.85); // Faster decay (was 0.9)
    }

    /**
     * Keep particle within bounds with bouncing behavior
     */
    checkBounds() {
        ['x', 'y', 'z'].forEach(axis => {
            if (this.position[axis] > this.bounds) {
                this.position[axis] = this.bounds;
                this.velocity[axis] *= -0.8; // Bounce with energy loss
            } else if (this.position[axis] < -this.bounds) {
                this.position[axis] = -this.bounds;
                this.velocity[axis] *= -0.8;
            }
        });
    }

    /**
     * Update bounds (when user changes space size)
     * @param {number} newBounds - New boundary size
     */
    updateBounds(newBounds) {
        this.bounds = newBounds;
        // Clamp position to new bounds
        this.position.x = clamp(this.position.x, -newBounds, newBounds);
        this.position.y = clamp(this.position.y, -newBounds, newBounds);
        this.position.z = clamp(this.position.z, -newBounds, newBounds);
    }
}

/**
 * Manages all particles and their connections
 */
export class ParticleSystem {
    constructor(scene, params) {
        this.scene = scene;
        this.params = params;
        this.particles = [];
        this.edges = [];

        // Node mesh instances - use Points for better visibility and performance
        this.nodeGeometry = new THREE.BufferGeometry();
        this.nodeMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 5.0, // Larger default size
            transparent: true,
            opacity: 1.0,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false // Prevent z-fighting with overlapping points
        });
        this.nodePoints = null; // Will be created in initParticles
        this.nodeGroup = new THREE.Group();
        this.scene.add(this.nodeGroup);

        // Also add sphere meshes for more prominent nodes (optional, can toggle)
        this.useSpheres = false;
        if (this.useSpheres) {
            this.sphereGeometry = new THREE.SphereGeometry(1, 8, 8);
            this.sphereMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1.0
            });
        }

        // Edge line instances
        this.edgeGroup = new THREE.Group();
        this.scene.add(this.edgeGroup);

        // Boundary box (optional visual guide)
        this.boundaryBox = null;
        this.showBoundary = false; // Can be toggled
        this.createBoundaryBox();

        this.initParticles();
    }

    /**
     * Create a visual boundary box
     */
    createBoundaryBox() {
        if (this.boundaryBox) {
            this.scene.remove(this.boundaryBox);
        }

        const size = this.params.spaceBounds * 2;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.1
        });

        this.boundaryBox = new THREE.LineSegments(edges, material);
        this.scene.add(this.boundaryBox);
        this.boundaryBox.visible = this.showBoundary;
    }

    /**
     * Create initial set of particles
     */
    initParticles() {
        this.clearParticles();

        // Create particle data
        const positions = [];
        for (let i = 0; i < this.params.nodeCount; i++) {
            const particle = new Particle(this.params.spaceBounds);
            this.particles.push(particle);

            positions.push(particle.position.x, particle.position.y, particle.position.z);
        }

        // Create Points object for all nodes
        this.nodeGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3)
        );

        if (this.nodePoints) {
            this.nodeGroup.remove(this.nodePoints);
        }

        this.nodePoints = new THREE.Points(this.nodeGeometry, this.nodeMaterial);
        this.nodeGroup.add(this.nodePoints);

        console.log(`Initialized ${this.params.nodeCount} particles`);
        console.log(`Points object created:`, this.nodePoints);
        console.log(`First few particle positions:`, this.particles.slice(0, 3).map(p => p.position));
        console.log(`NodeGroup has ${this.nodeGroup.children.length} children`);
    }

    /**
     * Clear all particles and visuals
     */
    clearParticles() {
        this.particles = [];

        // Remove Points object
        if (this.nodePoints) {
            this.nodeGroup.remove(this.nodePoints);
            this.nodeGeometry.dispose();
            this.nodeGeometry = new THREE.BufferGeometry();
        }

        // Remove all edges
        this.clearEdges();
    }

    /**
     * Clear all edge lines
     */
    clearEdges() {
        while (this.edgeGroup.children.length > 0) {
            const line = this.edgeGroup.children[0];
            this.edgeGroup.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        }
        this.edges = [];
    }

    /**
     * Update particle count
     * @param {number} newCount - New particle count
     */
    updateNodeCount(newCount) {
        if (newCount !== this.particles.length) {
            this.params.nodeCount = newCount;
            this.initParticles();
        }
    }

    /**
     * Update all particles and connections
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Reset connection counts
        this.particles.forEach(p => p.connections = 0);

        // Update particle positions
        const positions = this.nodeGeometry.attributes.position.array;

        this.particles.forEach((particle, i) => {
            particle.update(this.params.movementSpeed, deltaTime);

            // Update position in buffer
            const i3 = i * 3;
            positions[i3] = particle.position.x;
            positions[i3 + 1] = particle.position.y;
            positions[i3 + 2] = particle.position.z;
        });

        // Mark positions as needing update
        this.nodeGeometry.attributes.position.needsUpdate = true;

        // Update material properties
        this.nodeMaterial.size = this.params.nodeSize * 2; // Scale for visibility
        this.nodeMaterial.opacity = this.params.nodeOpacity;
        this.nodeMaterial.color.set(this.params.nodeColor);

        // Update connections
        this.updateConnections();
    }

    /**
     * Calculate and render connections between nearby particles
     */
    updateConnections() {
        this.clearEdges();
        const radius = this.params.connectivityRadius;
        const maxConnections = this.params.maxConnectionsPerNode;
        let totalConnections = 0;

        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];

            // Skip if already at max connections
            if (p1.connections >= maxConnections) continue;

            // Find nearby particles
            const nearby = [];

            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];

                // Skip if p2 is at max connections
                if (p2.connections >= maxConnections) continue;

                const dist = distance(p1.position, p2.position);

                if (dist < radius) {
                    nearby.push({ particle: p2, distance: dist, index: j });
                }
            }

            // Sort by distance and limit connections
            nearby.sort((a, b) => a.distance - b.distance);
            const connectionsToMake = Math.min(
                nearby.length,
                maxConnections - p1.connections
            );

            for (let k = 0; k < connectionsToMake; k++) {
                const { particle: p2, distance: dist } = nearby[k];

                // Create edge line
                const points = [p1.position, p2.position];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);

                // Calculate edge opacity based on distance (closer = more opaque)
                const distanceRatio = 1 - (dist / radius);
                const edgeOpacity = this.params.edgeOpacity * distanceRatio;

                const material = new THREE.LineBasicMaterial({
                    color: this.params.edgeColor,
                    transparent: true,
                    opacity: edgeOpacity,
                    linewidth: this.params.edgeThickness, // Note: linewidth > 1 only works in WebGL2
                    blending: THREE.AdditiveBlending // Makes lines glow
                });

                const line = new THREE.Line(geometry, material);
                this.edgeGroup.add(line);

                // Increment connection counts
                p1.connections++;
                p2.connections++;
                totalConnections++;

                // Stop if p2 reached max connections
                if (p2.connections >= maxConnections) {
                    break;
                }
            }
        }

        // Store stats for display
        this.stats = {
            totalConnections: totalConnections,
            avgConnections: (totalConnections * 2 / this.particles.length).toFixed(2)
        };
    }

    /**
     * Update visual scheme colors
     * @param {number} nodeColor - Node color hex
     * @param {number} edgeColor - Edge color hex
     */
    updateColors(nodeColor, edgeColor) {
        this.params.nodeColor = nodeColor;
        this.params.edgeColor = edgeColor;

        // Update node color
        this.nodeMaterial.color.set(nodeColor);
    }

    /**
     * Update space bounds
     * @param {number} newBounds - New boundary size
     */
    updateBounds(newBounds) {
        this.params.spaceBounds = newBounds;
        this.particles.forEach(particle => particle.updateBounds(newBounds));
        this.createBoundaryBox(); // Update visual boundary
    }

    /**
     * Toggle boundary box visibility
     * @param {boolean} visible - Show or hide boundary
     */
    toggleBoundary(visible) {
        this.showBoundary = visible;
        if (this.boundaryBox) {
            this.boundaryBox.visible = visible;
        }
    }
}
