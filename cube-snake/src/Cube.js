import * as THREE from 'three';

export class CubeGrid {
    constructor(scene) {
        this.scene = scene;
        this.gridSize = 15; // 15x15 grid per face
        this.cubeSize = 20; // Total size of the cube
        this.cellSize = this.cubeSize / this.gridSize; // Size of each small cube
        this.gap = 0.05; // Small gap between cubes for grid appearance

        this.gridCubes = [];
        this.color = 0xffffff;

        this.createGrid();
    }

    createGrid() {
        const geometry = new THREE.BoxGeometry(
            this.cellSize - this.gap,
            this.cellSize - this.gap,
            this.cellSize - this.gap
        );

        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });

        const edgeGeometry = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.3
        });

        // Create only outer shell cubes
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                // FRONT face (z = max)
                this.addGridCube(i, j, this.gridSize - 1, geometry, material, edgeGeometry, edgeMaterial);

                // BACK face (z = 0)
                this.addGridCube(i, j, 0, geometry, material, edgeGeometry, edgeMaterial);

                // LEFT face (x = 0)
                if (j !== 0 && j !== this.gridSize - 1) { // Avoid duplicates at edges
                    this.addGridCube(0, i, j, geometry, material, edgeGeometry, edgeMaterial);
                }

                // RIGHT face (x = max)
                if (j !== 0 && j !== this.gridSize - 1) { // Avoid duplicates at edges
                    this.addGridCube(this.gridSize - 1, i, j, geometry, material, edgeGeometry, edgeMaterial);
                }

                // TOP face (y = max)
                if (i !== 0 && i !== this.gridSize - 1 && j !== 0 && j !== this.gridSize - 1) {
                    this.addGridCube(i, this.gridSize - 1, j, geometry, material, edgeGeometry, edgeMaterial);
                }

                // BOTTOM face (y = 0)
                if (i !== 0 && i !== this.gridSize - 1 && j !== 0 && j !== this.gridSize - 1) {
                    this.addGridCube(i, 0, j, geometry, material, edgeGeometry, edgeMaterial);
                }
            }
        }
    }

    addGridCube(x, y, z, geometry, material, edgeGeometry, edgeMaterial) {
        const mesh = new THREE.Mesh(geometry, material);
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);

        const position = this.gridToWorld(x, y, z);
        mesh.position.copy(position);
        edges.position.copy(position);

        this.scene.add(mesh);
        this.scene.add(edges);

        this.gridCubes.push({ mesh, edges });
    }

    gridToWorld(x, y, z) {
        // Convert grid coordinates to world coordinates
        // Grid goes from 0 to gridSize-1, center the cube at origin
        const offset = (this.cubeSize / 2) - (this.cellSize / 2);
        return new THREE.Vector3(
            x * this.cellSize - offset,
            y * this.cellSize - offset,
            z * this.cellSize - offset
        );
    }

    worldToGrid(position) {
        // Convert world coordinates back to grid coordinates
        const offset = (this.cubeSize / 2) - (this.cellSize / 2);
        return {
            x: Math.round((position.x + offset) / this.cellSize),
            y: Math.round((position.y + offset) / this.cellSize),
            z: Math.round((position.z + offset) / this.cellSize)
        };
    }

    setColor(color) {
        this.color = new THREE.Color(color);
        this.gridCubes.forEach(cube => {
            cube.mesh.material.color.set(this.color);
            cube.edges.material.color.set(this.color);
        });
    }

    // Get position on a specific face
    getFacePosition(face, x, y) {
        const gridCoords = this.faceToGrid(face, x, y);
        return this.gridToWorld(gridCoords.x, gridCoords.y, gridCoords.z);
    }

    // Convert face coordinates (face name + 2D coords) to 3D grid coordinates
    faceToGrid(face, x, y) {
        const max = this.gridSize - 1;

        switch(face) {
            case 'FRONT':
                return { x: x, y: y, z: max };
            case 'BACK':
                return { x: max - x, y: y, z: 0 };
            case 'LEFT':
                return { x: 0, y: y, z: max - x };
            case 'RIGHT':
                return { x: max, y: y, z: x };
            case 'TOP':
                return { x: x, y: max, z: max - y };
            case 'BOTTOM':
                return { x: x, y: 0, z: y };
            default:
                return { x: 0, y: 0, z: 0 };
        }
    }

    // Get the face name from 3D grid coordinates
    gridToFace(x, y, z) {
        const max = this.gridSize - 1;

        if (z === max) return 'FRONT';
        if (z === 0) return 'BACK';
        if (x === 0) return 'LEFT';
        if (x === max) return 'RIGHT';
        if (y === max) return 'TOP';
        if (y === 0) return 'BOTTOM';

        return null;
    }
}
