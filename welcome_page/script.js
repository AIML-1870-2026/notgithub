const canvas = document.getElementById('gradient-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let time = 0;
let scrollX = 0;
let baseScrollSpeed = 4;
let scrollSpeed = baseScrollSpeed;

// Sled physics
let sled = {
    x: 0,
    y: 0,
    velocityY: 0,
    rotation: 0,
    targetRotation: 0,
    isJumping: false,
    jumpPower: 0
};

// Terrain
let terrain = [];
const terrainDetail = 5;

// Particles
let snowflakes = [];
let snowSpray = [];

// Background elements
let mountains = [];
let trees = [];

// Controls
let isHoldingJump = false;
let maxJumpPower = 18;
let jumpChargeRate = 0.5;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    sled.x = width * 0.2;
    initTerrain();
    initBackground();
    initSnowflakes();
}

function getTerrainHeight(x) {
    const base = height * 0.55;
    const h1 = Math.sin(x * 0.002) * 120;
    const h2 = Math.sin(x * 0.005 + 2) * 60;
    const h3 = Math.sin(x * 0.01 + 5) * 30;
    const h4 = Math.sin(x * 0.001) * 80;
    return base + h1 + h2 + h3 + h4;
}

function getTerrainSlope(x) {
    const delta = 2;
    return (getTerrainHeight(x + delta) - getTerrainHeight(x - delta)) / (delta * 2);
}

function initTerrain() {
    terrain = [];
    const numPoints = Math.ceil(width / terrainDetail) + 100;
    for (let i = 0; i < numPoints; i++) {
        terrain.push({ x: i * terrainDetail, y: 0 });
    }
}

function initBackground() {
    mountains = [];
    for (let layer = 0; layer < 3; layer++) {
        const count = 5 + layer * 2;
        for (let i = 0; i < count; i++) {
            mountains.push({
                x: (i / count) * width * 2,
                layer,
                width: 200 + Math.random() * 300 - layer * 50,
                height: 100 + Math.random() * 150 - layer * 30
            });
        }
    }

    trees = [];
    for (let i = 0; i < 40; i++) {
        trees.push({
            x: Math.random() * width * 3,
            size: 0.6 + Math.random() * 0.6
        });
    }
}

function initSnowflakes() {
    snowflakes = [];
    for (let i = 0; i < 200; i++) {
        snowflakes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 1 + Math.random() * 3,
            speed: 0.5 + Math.random() * 2,
            drift: Math.random() * 2 - 1,
            opacity: 0.4 + Math.random() * 0.6
        });
    }
}

function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#4A90B8');
    gradient.addColorStop(0.4, '#7AB8D6');
    gradient.addColorStop(0.7, '#B8D4E8');
    gradient.addColorStop(1, '#DCE8F0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Sun
    ctx.fillStyle = '#FFF8DC';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 50;
    ctx.beginPath();
    ctx.arc(width * 0.85, height * 0.15, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawMountains() {
    const layers = [
        { color: '#5A7A8A', parallax: 0.05, yBase: 0.35 },
        { color: '#6A8A9A', parallax: 0.1, yBase: 0.4 },
        { color: '#7A9AAA', parallax: 0.15, yBase: 0.45 }
    ];

    for (const m of mountains) {
        const layer = layers[m.layer];
        const x = ((m.x - scrollX * layer.parallax) % (width * 2)) - 200;
        const baseY = height * layer.yBase;

        // Mountain body
        ctx.fillStyle = layer.color;
        ctx.beginPath();
        ctx.moveTo(x, baseY + 100);
        ctx.lineTo(x + m.width * 0.5, baseY - m.height);
        ctx.lineTo(x + m.width, baseY + 100);
        ctx.closePath();
        ctx.fill();

        // Snow cap
        ctx.fillStyle = '#F0F5F8';
        ctx.beginPath();
        ctx.moveTo(x + m.width * 0.5, baseY - m.height);
        ctx.lineTo(x + m.width * 0.35, baseY - m.height + m.height * 0.35);
        ctx.lineTo(x + m.width * 0.65, baseY - m.height + m.height * 0.35);
        ctx.closePath();
        ctx.fill();
    }
}

function drawTree(x, baseY, size) {
    const trunkWidth = 8 * size;
    const trunkHeight = 20 * size;

    // Trunk
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - trunkWidth / 2, baseY - trunkHeight, trunkWidth, trunkHeight + 5);

    // Tree layers
    const layers = 4;
    for (let i = 0; i < layers; i++) {
        const layerY = baseY - trunkHeight - i * 25 * size;
        const layerWidth = (50 - i * 8) * size;
        const layerHeight = 35 * size;

        // Dark green
        ctx.fillStyle = '#2E5A3C';
        ctx.beginPath();
        ctx.moveTo(x, layerY - layerHeight);
        ctx.lineTo(x - layerWidth / 2, layerY);
        ctx.lineTo(x + layerWidth / 2, layerY);
        ctx.closePath();
        ctx.fill();

        // Snow on branches
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.moveTo(x, layerY - layerHeight);
        ctx.lineTo(x - layerWidth * 0.3, layerY - layerHeight * 0.5);
        ctx.lineTo(x + layerWidth * 0.3, layerY - layerHeight * 0.5);
        ctx.closePath();
        ctx.fill();
    }
}

function drawTrees() {
    for (const tree of trees) {
        const x = ((tree.x - scrollX * 0.4) % (width * 3)) - 100;
        const groundY = getTerrainHeight(x + scrollX * 0.4 + scrollX * 0.6);
        drawTree(x, groundY, tree.size);
    }
}

function drawTerrain() {
    // Update terrain
    for (let i = 0; i < terrain.length; i++) {
        const worldX = i * terrainDetail + scrollX;
        terrain[i].x = i * terrainDetail;
        terrain[i].y = getTerrainHeight(worldX);
    }

    // Main snow surface
    ctx.fillStyle = '#FAFCFF';
    ctx.beginPath();
    ctx.moveTo(-10, height + 10);

    for (const point of terrain) {
        ctx.lineTo(point.x, point.y);
    }

    ctx.lineTo(width + 10, height + 10);
    ctx.closePath();
    ctx.fill();

    // Surface shine
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < terrain.length; i++) {
        if (i === 0) ctx.moveTo(terrain[i].x, terrain[i].y);
        else ctx.lineTo(terrain[i].x, terrain[i].y);
    }
    ctx.stroke();

    // Shadow under surface
    ctx.fillStyle = '#E0E8F0';
    ctx.beginPath();
    ctx.moveTo(-10, height + 10);
    for (const point of terrain) {
        ctx.lineTo(point.x, point.y + 30);
    }
    ctx.lineTo(width + 10, height + 10);
    ctx.closePath();
    ctx.fill();
}

function updateSled() {
    const groundY = getTerrainHeight(sled.x + scrollX);
    const slope = getTerrainSlope(sled.x + scrollX);
    sled.targetRotation = Math.atan(slope);

    // Smooth rotation
    sled.rotation += (sled.targetRotation - sled.rotation) * 0.15;

    if (sled.isJumping) {
        // Apply gravity
        sled.velocityY += 0.6;
        sled.y += sled.velocityY;

        // Check landing
        if (sled.y >= groundY - 20) {
            sled.y = groundY - 20;
            sled.isJumping = false;
            sled.velocityY = 0;

            // Landing spray
            for (let i = 0; i < 15; i++) {
                snowSpray.push({
                    x: sled.x + Math.random() * 40 - 20,
                    y: sled.y + 15,
                    vx: Math.random() * 6 - 3,
                    vy: -Math.random() * 5 - 2,
                    life: 1,
                    size: 2 + Math.random() * 4
                });
            }
        }
    } else {
        sled.y = groundY - 20;

        // Charge jump
        if (isHoldingJump && sled.jumpPower < maxJumpPower) {
            sled.jumpPower += jumpChargeRate;
        }
    }

    // Speed based on slope
    const slopeBoost = slope * 2;
    scrollSpeed = baseScrollSpeed + slopeBoost + (sled.isJumping ? 1 : 0);
    scrollSpeed = Math.max(2, Math.min(10, scrollSpeed));

    // Continuous snow spray while moving
    if (!sled.isJumping && Math.random() > 0.5) {
        snowSpray.push({
            x: sled.x + 25,
            y: sled.y + 12,
            vx: 2 + Math.random() * 3,
            vy: -Math.random() * 2,
            life: 1,
            size: 1 + Math.random() * 3
        });
    }
}

function drawSled() {
    ctx.save();
    ctx.translate(sled.x, sled.y);
    ctx.rotate(sled.rotation);

    // Sled shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sled base
    const sledGradient = ctx.createLinearGradient(-30, 0, -30, 12);
    sledGradient.addColorStop(0, '#C0392B');
    sledGradient.addColorStop(1, '#922B21');
    ctx.fillStyle = sledGradient;

    ctx.beginPath();
    ctx.moveTo(-30, 5);
    ctx.quadraticCurveTo(-35, 0, -30, -5);
    ctx.lineTo(25, -5);
    ctx.quadraticCurveTo(28, -3, 28, 5);
    ctx.lineTo(-30, 5);
    ctx.fill();

    // Sled runners
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(-28, 8, 50, 4);

    // Runner shine
    ctx.fillStyle = '#6A6A6A';
    ctx.fillRect(-28, 8, 50, 1);

    // Person - legs
    ctx.fillStyle = '#1E3A5F';
    ctx.fillRect(-8, -8, 8, 12);
    ctx.fillRect(5, -8, 8, 12);

    // Person - body
    const bodyGradient = ctx.createLinearGradient(0, -35, 0, -5);
    bodyGradient.addColorStop(0, '#E74C3C');
    bodyGradient.addColorStop(1, '#C0392B');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, -22, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Person - head
    ctx.fillStyle = '#FDBF6F';
    ctx.beginPath();
    ctx.arc(0, -45, 12, 0, Math.PI * 2);
    ctx.fill();

    // Rosy cheeks
    ctx.fillStyle = '#F5A0A0';
    ctx.beginPath();
    ctx.arc(-7, -43, 3, 0, Math.PI * 2);
    ctx.arc(7, -43, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath();
    ctx.arc(-4, -47, 2, 0, Math.PI * 2);
    ctx.arc(4, -47, 2, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -43, 5, 0.3, Math.PI - 0.3);
    ctx.stroke();

    // Hat
    ctx.fillStyle = '#2980B9';
    ctx.beginPath();
    ctx.arc(0, -50, 13, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-13, -53, 26, 5);

    // Hat band
    ctx.fillStyle = '#1A5276';
    ctx.fillRect(-13, -53, 26, 3);

    // Pom pom
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, -62, 6, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.strokeStyle = '#E74C3C';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -25);
    ctx.lineTo(-22, -10);
    ctx.moveTo(10, -25);
    ctx.lineTo(22, -10);
    ctx.stroke();

    // Mittens
    ctx.fillStyle = '#2980B9';
    ctx.beginPath();
    ctx.arc(-22, -8, 5, 0, Math.PI * 2);
    ctx.arc(22, -8, 5, 0, Math.PI * 2);
    ctx.fill();

    // Jump power indicator
    if (isHoldingJump && !sled.isJumping) {
        ctx.fillStyle = `rgba(255, 255, 0, ${0.3 + sled.jumpPower / maxJumpPower * 0.5})`;
        ctx.beginPath();
        ctx.arc(0, -45, 20 + sled.jumpPower, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawSnowSpray() {
    for (let i = snowSpray.length - 1; i >= 0; i--) {
        const p = snowSpray[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= 0.03;

        if (p.life <= 0) {
            snowSpray.splice(i, 1);
            continue;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSnowflakes() {
    for (const flake of snowflakes) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();

        flake.y += flake.speed;
        flake.x += flake.drift - scrollSpeed * 0.2;

        if (flake.y > height + 10) {
            flake.y = -10;
            flake.x = Math.random() * width;
        }
        if (flake.x < -10) flake.x = width + 10;
        if (flake.x > width + 10) flake.x = -10;
    }
}

function drawUI() {
    // Instructions
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, height - 45, 350, 35);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.fillText('Hold SPACE or Click to charge jump, release to jump!', 20, height - 22);
}

function jump() {
    if (!sled.isJumping && sled.jumpPower > 0) {
        sled.isJumping = true;
        sled.velocityY = -sled.jumpPower;
        sled.jumpPower = 0;

        // Jump spray
        for (let i = 0; i < 10; i++) {
            snowSpray.push({
                x: sled.x + Math.random() * 30 - 15,
                y: sled.y + 15,
                vx: Math.random() * 4 - 2,
                vy: -Math.random() * 3,
                life: 1,
                size: 2 + Math.random() * 3
            });
        }
    }
}

function animate() {
    time++;
    scrollX += scrollSpeed;

    updateSled();

    drawSky();
    drawMountains();
    drawTrees();
    drawTerrain();
    drawSnowSpray();
    drawSled();
    drawSnowflakes();
    drawUI();

    requestAnimationFrame(animate);
}

// Controls
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        isHoldingJump = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        isHoldingJump = false;
        jump();
    }
});

canvas.addEventListener('mousedown', () => {
    isHoldingJump = true;
});

canvas.addEventListener('mouseup', () => {
    isHoldingJump = false;
    jump();
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isHoldingJump = true;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isHoldingJump = false;
    jump();
});

window.addEventListener('resize', resize);
resize();
animate();
