import { Flock } from './flock.js';
import { initControls, params } from './controls.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let flock;
let controls;
let paused = false;

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

function animate() {
    if (!paused) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        flock.run(ctx);
    }

    requestAnimationFrame(animate);
}

init();
