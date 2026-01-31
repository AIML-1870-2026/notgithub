import * as THREE from 'three';
import { CubeGrid } from './Cube.js';
import { Snake } from './Snake.js';
import { AppleManager } from './AppleManager.js';
import { GameState } from './GameState.js';
import { Controls } from './Controls.js';
import { UI } from './UI.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cubeGrid = null;
        this.snake = null;
        this.appleManager = null;
        this.gameState = null;
        this.controls = null;
        this.ui = null;

        this.lastMoveTime = 0;
        this.moveInterval = 200; // milliseconds between moves (will be set by speed setting)

        this.currentFace = 'FRONT';
        this.targetCameraPosition = new THREE.Vector3();
        this.cameraLerpSpeed = 0.15;

        // Camera positions for each face
        this.cameraPositions = {
            FRONT: new THREE.Vector3(0, 5, 35),
            BACK: new THREE.Vector3(0, 5, -35),
            LEFT: new THREE.Vector3(-35, 5, 0),
            RIGHT: new THREE.Vector3(35, 5, 0),
            TOP: new THREE.Vector3(0, 35, 5),
            BOTTOM: new THREE.Vector3(0, -35, -5)
        };

        this.init();
    }

    init() {
        this.setupScene();
        this.setupLighting();
        this.setupGameObjects();
        this.setupUI();
        this.setupEventListeners();
        this.animate();
    }

    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        // Camera - tilted orbit showing 2-3 faces
        this.camera = new THREE.PerspectiveCamera(
            65,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.copy(this.cameraPositions.FRONT);
        this.targetCameraPosition.copy(this.cameraPositions.FRONT);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    setupLighting() {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional lights from multiple angles
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight1.position.set(5, 10, 5);
        this.scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        dirLight2.position.set(-5, 5, -5);
        this.scene.add(dirLight2);
    }

    setupGameObjects() {
        // Create cube grid
        this.cubeGrid = new CubeGrid(this.scene);

        // Create snake
        this.snake = new Snake(this.scene, this.cubeGrid);

        // Create apple manager
        this.appleManager = new AppleManager(this.scene, this.cubeGrid);

        // Create game state
        this.gameState = new GameState();

        // Create controls
        this.controls = new Controls();
    }

    setupUI() {
        this.ui = new UI(this.gameState, this);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());

        // Listen to control events
        this.controls.on('direction', (direction) => {
            if (this.gameState.state === 'PLAYING') {
                // Use direction directly - face coordinates are consistent
                this.snake.setDirection(direction);
            }
        });

        this.controls.on('pause', () => {
            if (this.gameState.state === 'PLAYING') {
                this.gameState.pause();
            } else if (this.gameState.state === 'PAUSED') {
                this.gameState.resume();
            }
        });

        this.controls.on('restart', () => {
            if (this.gameState.state === 'PLAYING' || this.gameState.state === 'PAUSED') {
                this.restartGame();
            }
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    startGame() {
        // Get settings from UI
        const settings = this.ui.getSettings();

        // Apply speed setting
        const speedMap = { 1: 300, 2: 200, 3: 100 };
        this.moveInterval = speedMap[settings.gameSpeed];

        // Reset game objects
        this.snake.reset(settings.startLength);
        this.appleManager.reset(settings.appleCount);

        // Apply colors
        this.snake.setColors(settings.snakeBodyColor, settings.snakeHeadColor);
        this.appleManager.setColor(settings.appleColor);
        this.cubeGrid.setColor(settings.cubeColor);

        // Reset camera
        this.currentFace = 'FRONT';
        this.camera.position.copy(this.cameraPositions.FRONT);
        this.targetCameraPosition.copy(this.cameraPositions.FRONT);

        // Start game state
        this.gameState.start();
        this.lastMoveTime = performance.now();
    }

    restartGame() {
        this.gameState.restart();
        this.startGame();
    }

    update(currentTime) {
        if (this.gameState.state !== 'PLAYING') {
            return;
        }

        // Move snake at intervals
        if (currentTime - this.lastMoveTime >= this.moveInterval) {
            this.lastMoveTime = currentTime;

            // Move snake
            const moveResult = this.snake.move();

            // Check for self-collision
            if (moveResult.collision) {
                this.gameState.gameOver();
                return;
            }

            // Update camera position based on snake face
            const headPos = this.snake.getHeadPosition();
            if (headPos.face !== this.currentFace) {
                this.currentFace = headPos.face;
                this.targetCameraPosition.copy(this.cameraPositions[this.currentFace]);
            }

            // Check for apple collection
            const appleCollected = this.appleManager.checkCollision(headPos);

            if (appleCollected) {
                this.snake.grow();
                this.gameState.incrementScore();
                // Spawn new apple to maintain count
                this.appleManager.spawnApple(this.snake.getBody());
            }
        }

        // Smoothly lerp camera to target position
        this.camera.position.lerp(this.targetCameraPosition, this.cameraLerpSpeed);
        this.camera.lookAt(0, 0, 0);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    animate() {
        requestAnimationFrame((time) => this.animate(time));
        this.update(performance.now());
        this.render();
    }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
