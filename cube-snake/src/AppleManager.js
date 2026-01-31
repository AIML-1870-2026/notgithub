import * as THREE from 'three';

export class AppleManager {
    constructor(scene, cubeGrid) {
        this.scene = scene;
        this.cubeGrid = cubeGrid;
        this.apples = []; // Array of {face, x, y, mesh}
        this.color = 0xff0000;
        this.count = 3; // Number of apples to maintain

        this.faces = ['FRONT', 'BACK', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'];
    }

    reset(count = 3) {
        // Clear existing apples
        this.apples.forEach(apple => this.scene.remove(apple.mesh));
        this.apples = [];
        this.count = count;

        // Spawn initial apples
        for (let i = 0; i < count; i++) {
            this.spawnApple([]);
        }
    }

    spawnApple(snakeBody) {
        let position = null;
        let attempts = 0;
        const maxAttempts = 100;

        // Find a valid position not occupied by snake or other apples
        while (!position && attempts < maxAttempts) {
            attempts++;

            const face = this.faces[Math.floor(Math.random() * this.faces.length)];
            const x = Math.floor(Math.random() * this.cubeGrid.gridSize);
            const y = Math.floor(Math.random() * this.cubeGrid.gridSize);

            // Check if position is occupied by snake
            const occupiedBySnake = snakeBody.some(segment =>
                segment.face === face && segment.x === x && segment.y === y
            );

            // Check if position is occupied by another apple
            const occupiedByApple = this.apples.some(apple =>
                apple.face === face && apple.x === x && apple.y === y
            );

            if (!occupiedBySnake && !occupiedByApple) {
                position = { face, x, y };
            }
        }

        if (!position) {
            console.warn('Could not find valid position for apple');
            return;
        }

        // Create apple mesh
        const geometry = new THREE.BoxGeometry(
            this.cubeGrid.cellSize * 0.8,
            this.cubeGrid.cellSize * 0.8,
            this.cubeGrid.cellSize * 0.8
        );

        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.3
        });

        const mesh = new THREE.Mesh(geometry, material);
        const worldPos = this.cubeGrid.getFacePosition(position.face, position.x, position.y);
        mesh.position.copy(worldPos);

        this.scene.add(mesh);

        this.apples.push({
            face: position.face,
            x: position.x,
            y: position.y,
            mesh: mesh
        });
    }

    checkCollision(headPosition) {
        const index = this.apples.findIndex(apple =>
            apple.face === headPosition.face &&
            apple.x === headPosition.x &&
            apple.y === headPosition.y
        );

        if (index !== -1) {
            // Remove collected apple
            const apple = this.apples[index];
            this.scene.remove(apple.mesh);
            this.apples.splice(index, 1);
            return true;
        }

        return false;
    }

    setColor(color) {
        this.color = new THREE.Color(color);
        this.apples.forEach(apple => {
            apple.mesh.material.color.set(this.color);
            apple.mesh.material.emissive.set(this.color);
        });
    }

    getApples() {
        return this.apples;
    }
}
