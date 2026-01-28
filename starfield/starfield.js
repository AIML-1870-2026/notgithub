// Starfield Particle System
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

// Configuration
let config = {
    speed: 4,
    density: 500,
    trailLength: 12
};

// Stars array
let stars = [];

// Canvas dimensions
let width, height, centerX, centerY;

// Star colors (subtle purple/blue/cyan cosmic tints)
const starColors = [
    '#ffffff',       // Pure white
    '#e8e0ff',       // Soft lavender
    '#d0e8ff',       // Light sky blue
    '#ffe8f0',       // Soft pink-white
    '#e0ffff',       // Pale cyan
    '#f0e8ff',       // Light violet
    '#e8f4ff'        // Ice blue
];

// Nebula configuration
const nebulae = [];
const nebulaColors = [
    'rgba(138, 43, 226, 0.05)',  // Purple
    'rgba(65, 105, 225, 0.05)',  // Royal blue
    'rgba(255, 105, 180, 0.04)', // Pink
    'rgba(0, 191, 255, 0.04)',   // Deep sky blue
    'rgba(148, 0, 211, 0.04)'    // Dark violet
];

// Star class
class Star {
    constructor() {
        this.reset();
    }

    reset() {
        // Random position in 3D space
        this.x = (Math.random() - 0.5) * width * 2;
        this.y = (Math.random() - 0.5) * height * 2;
        this.z = Math.random() * 2000;

        // Trail history
        this.prevPositions = [];

        // Visual properties
        this.color = starColors[Math.floor(Math.random() * starColors.length)];
        this.baseSize = Math.random() * 1.5 + 0.5;
    }

    update() {
        // Store previous screen position for trail
        const prevScreen = this.getScreenPosition();
        if (prevScreen) {
            this.prevPositions.unshift({ x: prevScreen.x, y: prevScreen.y, size: prevScreen.size });
            // Limit trail length based on config
            while (this.prevPositions.length > config.trailLength) {
                this.prevPositions.pop();
            }
        }

        // Move star toward camera (decrease z)
        this.z -= config.speed * 2;

        // Reset star if it passes the camera
        if (this.z <= 0) {
            this.reset();
            this.z = 2000;
            this.prevPositions = [];
        }
    }

    getScreenPosition() {
        // Perspective projection
        const scale = 500 / this.z;
        const screenX = centerX + this.x * scale;
        const screenY = centerY + this.y * scale;
        const size = this.baseSize * scale * 2;

        // Check if star is on screen
        if (screenX < -50 || screenX > width + 50 || screenY < -50 || screenY > height + 50) {
            return null;
        }

        return { x: screenX, y: screenY, size: Math.max(0.5, size) };
    }

    draw() {
        const pos = this.getScreenPosition();
        if (!pos) return;

        // Draw trail
        if (config.trailLength > 0 && this.prevPositions.length > 0) {
            const lastPos = this.prevPositions[this.prevPositions.length - 1];

            // Helper to convert hex to rgba
            const hexToRgba = (hex, alpha) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            // Create gradient for trail with multiple color stops
            const gradient = ctx.createLinearGradient(pos.x, pos.y, lastPos.x, lastPos.y);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(0.3, hexToRgba(this.color, 0.6));
            gradient.addColorStop(0.7, hexToRgba(this.color, 0.2));
            gradient.addColorStop(1, 'transparent');

            // Draw main trail line
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            for (let i = 0; i < this.prevPositions.length; i++) {
                ctx.lineTo(this.prevPositions[i].x, this.prevPositions[i].y);
            }
            ctx.strokeStyle = gradient;
            ctx.lineWidth = pos.size * 0.8;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Add glow layer for more definition
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            for (let i = 0; i < Math.min(3, this.prevPositions.length); i++) {
                ctx.lineTo(this.prevPositions[i].x, this.prevPositions[i].y);
            }
            ctx.strokeStyle = this.color;
            ctx.lineWidth = pos.size * 0.4;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Draw star
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Add glow effect for larger/closer stars
        if (pos.size > 2) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, pos.size * 2, 0, Math.PI * 2);
            const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, pos.size * 2);
            glow.addColorStop(0, this.color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fill();
        }
    }
}

// Nebula class for background effect
class Nebula {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = Math.random() * 300 + 200;
        this.color = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
        this.drift = {
            x: (Math.random() - 0.5) * 0.2,
            y: (Math.random() - 0.5) * 0.2
        };
    }

    update() {
        this.x += this.drift.x;
        this.y += this.drift.y;

        // Wrap around screen
        if (this.x < -this.radius) this.x = width + this.radius;
        if (this.x > width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = height + this.radius;
        if (this.y > height + this.radius) this.y = -this.radius;
    }

    draw() {
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

// Initialize canvas size
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    centerX = width / 2;
    centerY = height / 2;
}

// Initialize stars
function initStars() {
    stars = [];
    for (let i = 0; i < config.density; i++) {
        const star = new Star();
        star.z = Math.random() * 2000; // Distribute stars at various depths
        stars.push(star);
    }
}

// Initialize nebulae
function initNebulae() {
    nebulae.length = 0;
    for (let i = 0; i < 8; i++) {
        nebulae.push(new Nebula());
    }
}

// Update star count when density changes
function updateStarCount() {
    const diff = config.density - stars.length;
    if (diff > 0) {
        // Add stars
        for (let i = 0; i < diff; i++) {
            const star = new Star();
            star.z = Math.random() * 2000;
            stars.push(star);
        }
    } else if (diff < 0) {
        // Remove stars
        stars.splice(0, -diff);
    }
}

// Animation loop
function animate() {
    // Clear canvas with slight transparency for motion blur effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, width, height);

    // Draw nebulae (background)
    nebulae.forEach(nebula => {
        nebula.update();
        nebula.draw();
    });

    // Update and draw stars
    stars.forEach(star => {
        star.update();
        star.draw();
    });

    requestAnimationFrame(animate);
}

// Control panel functionality
const controlPanel = document.getElementById('controlPanel');
const toggleBtn = document.getElementById('toggleBtn');
const speedSlider = document.getElementById('speedSlider');
const densitySlider = document.getElementById('densitySlider');
const trailSlider = document.getElementById('trailSlider');
const speedValue = document.getElementById('speedValue');
const densityValue = document.getElementById('densityValue');
const trailValue = document.getElementById('trailValue');
const fullscreenBtn = document.getElementById('fullscreenBtn');

// Toggle control panel
toggleBtn.addEventListener('click', () => {
    controlPanel.classList.toggle('open');
});

// Slider event listeners
speedSlider.addEventListener('input', (e) => {
    config.speed = parseInt(e.target.value);
    speedValue.textContent = config.speed;
});

densitySlider.addEventListener('input', (e) => {
    config.density = parseInt(e.target.value);
    densityValue.textContent = config.density;
    updateStarCount();
});

trailSlider.addEventListener('input', (e) => {
    config.trailLength = parseInt(e.target.value);
    trailValue.textContent = config.trailLength;
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'h') {
        controlPanel.classList.toggle('hidden');
    } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
    }
});

// Fullscreen functionality
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen error:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

fullscreenBtn.addEventListener('click', toggleFullscreen);

// Handle window resize
window.addEventListener('resize', () => {
    resize();
    initNebulae();
});

// Initialize and start
resize();
initStars();
initNebulae();
animate();
