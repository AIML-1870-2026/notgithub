import * as THREE from 'three';
import { FaceNavigator } from './FaceNavigator.js';

export class Snake {
    constructor(scene, cubeGrid) {
        this.scene = scene;
        this.cubeGrid = cubeGrid;
        this.navigator = new FaceNavigator(cubeGrid.gridSize);

        this.body = []; // Array of {face, x, y} positions
        this.direction = { x: 1, y: 0 }; // Current movement direction
        this.nextDirection = { x: 1, y: 0 }; // Buffered direction
        this.growPending = false;

        this.bodyColor = 0x00ff00;
        this.headColor = 0x00cc00;

        this.meshes = []; // Visual representations

        this.reset(3);
    }

    reset(length = 3) {
        // Clear existing meshes
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.meshes = [];

        // Initialize snake on FRONT face
        this.body = [];
        for (let i = 0; i < length; i++) {
            this.body.push({
                face: 'FRONT',
                x: 7 - i, // Start near center
                y: 7
            });
        }

        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.growPending = false;

        this.render();
    }

    setDirection(newDirection) {
        // Transform screen-relative direction to face-local direction
        const currentFace = this.body[0].face;
        const localDirection = this.screenToLocalDirection(newDirection, currentFace);

        // Prevent reversing into self
        if (!this.navigator.areDirectionsOpposite(localDirection, this.direction)) {
            this.nextDirection = localDirection;
        }
    }

    // Transform screen-relative direction to face-local direction based on current face
    screenToLocalDirection(screenDir, face) {
        // Each face may need x or y flipped to match screen orientation
        // Based on camera positions viewing each face
        const transforms = {
            FRONT: { flipX: false, flipY: false },   // Reference face, no flip
            BACK: { flipX: true, flipY: false },     // Viewed from behind, x mirrored
            LEFT: { flipX: false, flipY: false },    // Side view
            RIGHT: { flipX: false, flipY: false },   // Side view
            TOP: { flipX: false, flipY: false },     // Top view
            BOTTOM: { flipX: false, flipY: false }   // Bottom view
        };

        const t = transforms[face] || { flipX: false, flipY: false };

        return {
            x: t.flipX ? -screenDir.x : screenDir.x,
            y: t.flipY ? -screenDir.y : screenDir.y
        };
    }

    move() {
        // Update direction from buffer
        this.direction = { ...this.nextDirection };

        // Get current head position
        const head = this.body[0];

        // Calculate new head position
        let newX = head.x + this.direction.x;
        let newY = head.y + this.direction.y;

        // Handle face transitions
        const transition = this.navigator.transition(
            head.face,
            newX,
            newY,
            this.direction
        );

        // Create new head
        const newHead = {
            face: transition.face,
            x: transition.x,
            y: transition.y
        };

        // Check for self-collision (excluding tail if not growing)
        const bodyToCheck = this.growPending ? this.body : this.body.slice(0, -1);
        const collision = bodyToCheck.some(segment =>
            segment.face === newHead.face &&
            segment.x === newHead.x &&
            segment.y === newHead.y
        );

        if (collision) {
            return { collision: true };
        }

        // Update direction if it changed during transition
        this.direction = transition.direction;
        this.nextDirection = transition.direction;

        // Add new head
        this.body.unshift(newHead);

        // Remove tail if not growing
        if (this.growPending) {
            this.growPending = false;
        } else {
            this.body.pop();
        }

        this.render();

        return { collision: false };
    }

    grow() {
        this.growPending = true;
    }

    render() {
        // Clear existing meshes
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.meshes = [];

        // Render each segment
        this.body.forEach((segment, index) => {
            const isHead = index === 0;
            const scale = isHead ? 1.1 : 1.0;
            const color = isHead ? this.headColor : this.bodyColor;

            const geometry = new THREE.BoxGeometry(
                this.cubeGrid.cellSize * scale * 0.9,
                this.cubeGrid.cellSize * scale * 0.9,
                this.cubeGrid.cellSize * scale * 0.9
            );

            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.2
            });

            const mesh = new THREE.Mesh(geometry, material);
            const position = this.cubeGrid.getFacePosition(segment.face, segment.x, segment.y);
            mesh.position.copy(position);

            this.scene.add(mesh);
            this.meshes.push(mesh);
        });
    }

    setColors(bodyColor, headColor) {
        this.bodyColor = new THREE.Color(bodyColor);
        this.headColor = new THREE.Color(headColor);
        this.render();
    }

    getHeadPosition() {
        return this.body[0];
    }

    getBody() {
        return this.body;
    }

    getLength() {
        return this.body.length;
    }
}
