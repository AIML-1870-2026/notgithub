import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ParticleSystem } from './particles.js';
import { createControls } from './controls.js';

// Simulation parameters
const params = {
    nodeCount: 300,
    nodeSize: 3.0, // Larger default for visibility
    nodeOpacity: 0.5,
    nodeColor: 0x00FFFF, // Cosmic Web default
    edgeThickness: 1.0,
    edgeOpacity: 1, // More visible edges
    edgeColor: 0x4488FF,
    connectivityRadius: 125, // Larger radius for more connections
    maxConnectionsPerNode: 10,
    movementSpeed: 20.0,
    spaceBounds: 200,
    showBoundary: false, // Toggle boundary box visibility
    autoRotate: false,
    autoRotateSpeed: 0.5,
    paused: false
};

// Scene, camera, renderer
let scene, camera, renderer, controls;
let particleSystem;
let clock;

/**
 * Initialize Three.js scene
 */
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 500, 1000); // Less aggressive fog

    // Create camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );
    camera.position.set(0, 0, 400); // Start further back to see more particles

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Add orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 800;

    // Add ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add point light
    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(100, 100, 100);
    scene.add(pointLight);

    // Create particle system
    particleSystem = new ParticleSystem(scene, params);

    // Create GUI controls
    createControls(params, particleSystem, (scheme) => {
        console.log(`Applied visual scheme: ${scheme.name}`);
    });

    // Initialize clock
    clock = new THREE.Clock();

    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);

    console.log('=== Stellar Web Simulation Initialized ===');
    console.log(`Rendering ${params.nodeCount} nodes`);
    console.log(`Camera position: (${camera.position.x}, ${camera.position.y}, ${camera.position.z})`);
    console.log(`Space bounds: ${params.spaceBounds}`);
    console.log('If you see this, the simulation is running!');
    console.log('Check if particles are visible in the scene...');
}

/**
 * Handle window resize
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Handle keyboard input
 * @param {KeyboardEvent} event
 */
function onKeyDown(event) {
    switch (event.key) {
        case ' ':
            // Space: Toggle pause
            params.paused = !params.paused;
            console.log(`Animation ${params.paused ? 'paused' : 'resumed'}`);
            break;
        case 'r':
        case 'R':
            // R: Reset camera
            camera.position.set(0, 0, 300);
            controls.target.set(0, 0, 0);
            controls.update();
            console.log('Camera reset');
            break;
        case 'a':
        case 'A':
            // A: Toggle auto-rotate
            params.autoRotate = !params.autoRotate;
            console.log(`Auto-rotate ${params.autoRotate ? 'enabled' : 'disabled'}`);
            break;
    }
}

/**
 * Animation loop
 */
let frameCount = 0;
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    // Update particle system if not paused
    if (!params.paused) {
        particleSystem.update(deltaTime);
    }

    // Auto-rotate camera
    if (params.autoRotate) {
        const time = clock.getElapsedTime();
        const radius = camera.position.length();
        camera.position.x = Math.cos(time * params.autoRotateSpeed * 0.1) * radius;
        camera.position.z = Math.sin(time * params.autoRotateSpeed * 0.1) * radius;
        camera.lookAt(scene.position);
    }

    // Update controls
    controls.update();

    // Render scene
    renderer.render(scene, camera);

    // Update stats display
    if (particleSystem.stats) {
        const connectionsEl = document.getElementById('connections');
        const avgConnectionsEl = document.getElementById('avg-connections');
        if (connectionsEl) connectionsEl.textContent = particleSystem.stats.totalConnections;
        if (avgConnectionsEl) avgConnectionsEl.textContent = particleSystem.stats.avgConnections;
    }

    // Debug: Log first frame render
    frameCount++;
    if (frameCount === 1) {
        console.log('First frame rendered!');
        console.log('Scene children:', scene.children.length);
        console.log('Renderer info:', renderer.info);
    }
}

// Start the simulation
init();
animate();
