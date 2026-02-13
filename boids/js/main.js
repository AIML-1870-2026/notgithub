import { Flock } from './flock.js';
import { initControls, params } from './controls.js';
import { LiveChart } from './chart.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Stats DOM elements
const fpsDisplay = document.getElementById('fpsValue');
const boidCountStat = document.getElementById('boidCountStat');
const predatorCountStat = document.getElementById('predatorCountStat');
const obstacleCountStat = document.getElementById('obstacleCountStat');
const avgSpeedStat = document.getElementById('avgSpeedStat');

// Chart
const chart = new LiveChart(document.getElementById('chartCanvas'));

// Legend toggle buttons
document.querySelectorAll('.legend-item').forEach(btn => {
    btn.addEventListener('click', () => {
        const key = btn.dataset.series;
        const visible = chart.toggle(key);
        btn.classList.toggle('active', visible);
    });
});

let width, height;
let flock;
let controls;
let paused = false;

// FPS tracking
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;
let fpsUpdateTimer = 0;
const FPS_UPDATE_INTERVAL = 500;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    if (flock) {
        flock.resize(width, height);
    }
}

function init() {
    resize();

    flock = new Flock(width, height);

    for (let i = 0; i < params.boidCount; i++) {
        flock.addBoid();
    }

    controls = initControls(flock, {
        onPauseToggle: (isPaused) => {
            paused = isPaused;
        }
    });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (e.shiftKey) {
            flock.addPredator(x, y);
        } else {
            flock.addObstacle(x, y, 25 + Math.random() * 20);
        }
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        flock.addPredator(x, y);
    });

    window.addEventListener('resize', resize);

    animate();
}

function updateStats(now) {
    frameCount++;
    fpsUpdateTimer += now - lastFrameTime;
    lastFrameTime = now;

    if (fpsUpdateTimer >= FPS_UPDATE_INTERVAL) {
        fps = Math.round((frameCount * 1000) / fpsUpdateTimer);
        fpsDisplay.textContent = fps;
        frameCount = 0;
        fpsUpdateTimer = 0;

        const avgSpeed = flock.getAverageSpeed();

        // Update stat text
        boidCountStat.textContent = flock.boids.length;
        predatorCountStat.textContent = flock.predators.length;
        obstacleCountStat.textContent = flock.obstacles.length;
        avgSpeedStat.textContent = avgSpeed.toFixed(1);

        // Push data to chart
        chart.push({
            fps,
            avgSpeed,
            boids: flock.boids.length
        });

        chart.draw();
    }
}

function animate(now = performance.now()) {
    updateStats(now);

    if (!paused) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        flock.run(ctx);
    }

    requestAnimationFrame(animate);
}

init();
