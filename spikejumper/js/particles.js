// ── Pool-based Particle System ──

const MAX_PARTICLES = 300;
const pool = [];

for (let i = 0; i < MAX_PARTICLES; i++) {
    pool.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: '#fff', size: 3, alpha: 1, gravity: 0, shape: 'rect' });
}

function spawn(opts) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
        if (!pool[i].alive) {
            const p = pool[i];
            p.alive = true;
            p.x = opts.x || 0;
            p.y = opts.y || 0;
            p.vx = opts.vx || 0;
            p.vy = opts.vy || 0;
            p.life = opts.life || 0.5;
            p.maxLife = opts.life || 0.5;
            p.color = opts.color || '#ffffff';
            p.size = opts.size || 3;
            p.alpha = 1;
            p.gravity = opts.gravity || 0;
            p.shape = opts.shape || 'rect';
            return p;
        }
    }
    return null;
}

export function spawnBurst(x, y, count, color, opts = {}) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
        const speed = (opts.speed || 200) * (0.5 + Math.random() * 0.8);
        spawn({
            x: x + (Math.random() - 0.5) * (opts.spread || 10),
            y: y + (Math.random() - 0.5) * (opts.spread || 10),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: (opts.life || 0.5) * (0.6 + Math.random() * 0.6),
            color,
            size: opts.size || (2 + Math.random() * 3),
            gravity: opts.gravity || 400,
            shape: opts.shape || 'rect'
        });
    }
}

export function spawnDust(x, y) {
    for (let i = 0; i < 8; i++) {
        spawn({
            x: x + (Math.random() - 0.5) * 20,
            y,
            vx: (Math.random() - 0.5) * 120,
            vy: -(30 + Math.random() * 80),
            life: 0.3 + Math.random() * 0.3,
            color: '#8899bb',
            size: 2 + Math.random() * 2,
            gravity: 200
        });
    }
}

export function spawnDeathBurst(x, y, color) {
    spawnBurst(x, y, 20, color, { speed: 350, life: 0.6, size: 4, spread: 5, gravity: 300 });
    // Some smaller particles
    spawnBurst(x, y, 10, '#ffffff', { speed: 200, life: 0.4, size: 2, spread: 3, gravity: 200 });
}

export function spawnPortalSparkle(x, y, color) {
    for (let i = 0; i < 12; i++) {
        spawn({
            x: x + (Math.random() - 0.5) * 20,
            y: y + Math.random() * 100 - 50,
            vx: (Math.random() - 0.5) * 60,
            vy: -(80 + Math.random() * 120),
            life: 0.4 + Math.random() * 0.4,
            color,
            size: 2 + Math.random() * 3,
            gravity: -50
        });
    }
}

export function spawnDashTrail(x, y, color) {
    spawn({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: -(60 + Math.random() * 40),
        vy: (Math.random() - 0.5) * 30,
        life: 0.2 + Math.random() * 0.15,
        color,
        size: 3 + Math.random() * 4,
        gravity: 0
    });
}

export function update(dt) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = pool[i];
        if (!p.alive) continue;
        p.life -= dt;
        if (p.life <= 0) {
            p.alive = false;
            continue;
        }
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, p.life / p.maxLife);
    }
}

export function render(ctx, cameraX) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = pool[i];
        if (!p.alive) continue;
        const sx = p.x - cameraX;
        const sy = p.y;
        if (sx < -20 || sx > 1400 || sy < -20 || sy > 740) continue;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(sx, sy, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(sx - p.size * 0.5, sy - p.size * 0.5, p.size, p.size);
        }
    }
    ctx.globalAlpha = 1;
}

export function clear() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
        pool[i].alive = false;
    }
}
