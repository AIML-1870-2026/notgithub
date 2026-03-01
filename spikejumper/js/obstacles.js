// ── Obstacle Classes ──

import { COLORS, PHYSICS, CANVAS } from './config.js';

// ── Triangle Spike ──
export class TriangleSpike {
    constructor(x, y, variant = 'up', size = 40) {
        this.type = 'spike';
        this.x = x;
        this.y = y;
        this.variant = variant;
        this.size = size;
        this.halfSize = size / 2;
    }

    getBounds() {
        // Forgiving hitbox - smaller than visual
        const f = PHYSICS.COLLISION_FORGIVENESS;
        const s = this.size * f;
        const hs = s / 2;
        if (this.variant === 'up') {
            return { x: this.x - hs, y: this.y - s, w: s, h: s };
        } else if (this.variant === 'down') {
            return { x: this.x - hs, y: this.y, w: s, h: s };
        }
        // floating
        return { x: this.x - hs, y: this.y - hs, w: s, h: s };
    }

    render(ctx, cameraX) {
        const sx = this.x - cameraX;
        if (sx < -60 || sx > CANVAS.WIDTH + 60) return;

        const dir = this.variant === 'down' ? 'down' : 'up';

        ctx.save();
        ctx.translate(sx, this.y);

        // Neon glow aura
        ctx.shadowColor = COLORS.SPIKE;
        ctx.shadowBlur = 12;

        // Main body with brighter gradient
        const grad = ctx.createLinearGradient(0, dir === 'up' ? -this.size : 0, 0, dir === 'up' ? 0 : this.size);
        grad.addColorStop(0, '#ffccdd');
        grad.addColorStop(0.3, COLORS.SPIKE_OUTLINE);
        grad.addColorStop(1, COLORS.SPIKE);
        ctx.fillStyle = grad;
        this._drawTriangle(ctx, 0, 0, this.size, dir);

        ctx.shadowBlur = 0;

        // Highlight edge
        ctx.strokeStyle = COLORS.SPIKE_OUTLINE;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7;
        this._strokeTriangle(ctx, 0, 0, this.size, dir);
        ctx.globalAlpha = 1;

        ctx.restore();
    }

    _drawTriangle(ctx, ox, oy, size, dir) {
        ctx.beginPath();
        if (dir === 'up') {
            ctx.moveTo(ox, oy - size);
            ctx.lineTo(ox - size / 2, oy);
            ctx.lineTo(ox + size / 2, oy);
        } else {
            ctx.moveTo(ox, oy + size);
            ctx.lineTo(ox - size / 2, oy);
            ctx.lineTo(ox + size / 2, oy);
        }
        ctx.closePath();
        ctx.fill();
    }

    _strokeTriangle(ctx, ox, oy, size, dir) {
        ctx.beginPath();
        if (dir === 'up') {
            ctx.moveTo(ox, oy - size);
            ctx.lineTo(ox - size / 2, oy);
            ctx.lineTo(ox + size / 2, oy);
        } else {
            ctx.moveTo(ox, oy + size);
            ctx.lineTo(ox - size / 2, oy);
            ctx.lineTo(ox + size / 2, oy);
        }
        ctx.closePath();
        ctx.stroke();
    }
}

// ── Moving Block ──
export class MovingBlock {
    constructor(x, y, width, height, endX, endY, period = 2.0) {
        this.type = 'moving_block';
        this.startX = x;
        this.startY = y;
        this.endX = endX !== undefined ? endX : x;
        this.endY = endY !== undefined ? endY : y;
        this.width = width || 60;
        this.height = height || 60;
        this.period = period;
        this.time = 0;
        this.x = x;
        this.y = y;
    }

    update(dt) {
        this.time += dt;
        const t = (Math.sin(this.time * Math.PI * 2 / this.period) + 1) / 2;
        this.x = this.startX + (this.endX - this.startX) * t;
        this.y = this.startY + (this.endY - this.startY) * t;
    }

    getBounds() {
        return { x: this.x - this.width / 2, y: this.y - this.height / 2, w: this.width, h: this.height };
    }

    render(ctx, cameraX) {
        const sx = this.x - cameraX;
        if (sx < -100 || sx > CANVAS.WIDTH + 100) return;

        const hw = this.width / 2;
        const hh = this.height / 2;
        const r = 6;

        ctx.save();
        ctx.translate(sx, this.y);

        // Neon glow
        ctx.shadowColor = COLORS.MOVING_BLOCK_OUTLINE;
        ctx.shadowBlur = 10;

        // Body with rounded corners
        const grad = ctx.createLinearGradient(0, -hh, 0, hh);
        grad.addColorStop(0, COLORS.MOVING_BLOCK_OUTLINE);
        grad.addColorStop(1, COLORS.MOVING_BLOCK);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(-hw, -hh, this.width, this.height, r);
        ctx.fill();

        // Border
        ctx.strokeStyle = COLORS.MOVING_BLOCK_OUTLINE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-hw, -hh, this.width, this.height, r);
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Inner detail lines
        ctx.strokeStyle = 'rgba(170, 102, 238, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-hw + 8, -hh + 8, this.width - 16, this.height - 16, 3);
        ctx.stroke();

        ctx.restore();
    }
}

// ── Rotating Sawblade ──
export class Sawblade {
    constructor(x, y, radius, pathPoints, speed = 1) {
        this.type = 'sawblade';
        this.originX = x;
        this.originY = y;
        this.x = x;
        this.y = y;
        this.radius = radius || 25;
        this.rotation = 0;
        this.teeth = 8;
        this.pathPoints = pathPoints; // array of {x, y} or null for static
        this.pathIndex = 0;
        this.pathSpeed = speed;
        this.pathT = 0;
    }

    update(dt) {
        this.rotation += dt * 5;

        if (this.pathPoints && this.pathPoints.length > 1) {
            this.pathT += dt * this.pathSpeed;
            const len = this.pathPoints.length;
            const i = Math.floor(this.pathT) % len;
            const next = (i + 1) % len;
            const t = this.pathT % 1;
            // Smooth interpolation
            const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            this.x = this.pathPoints[i].x + (this.pathPoints[next].x - this.pathPoints[i].x) * ease;
            this.y = this.pathPoints[i].y + (this.pathPoints[next].y - this.pathPoints[i].y) * ease;
        }
    }

    getBounds() {
        return { cx: this.x, cy: this.y, r: this.radius * PHYSICS.COLLISION_FORGIVENESS, type: 'circle' };
    }

    render(ctx, cameraX) {
        const sx = this.x - cameraX;
        if (sx < -60 || sx > CANVAS.WIDTH + 60) return;

        ctx.save();
        ctx.translate(sx, this.y);
        ctx.rotate(this.rotation);

        // Neon glow
        ctx.shadowColor = COLORS.SAWBLADE;
        ctx.shadowBlur = 18;

        // Outer teeth with gradient
        const teethGrad = ctx.createRadialGradient(0, 0, this.radius * 0.4, 0, 0, this.radius);
        teethGrad.addColorStop(0, COLORS.SAWBLADE_INNER);
        teethGrad.addColorStop(1, COLORS.SAWBLADE);
        ctx.fillStyle = teethGrad;
        ctx.beginPath();
        for (let i = 0; i < this.teeth; i++) {
            const a1 = (Math.PI * 2 / this.teeth) * i;
            const a2 = a1 + Math.PI / this.teeth;
            const outerR = this.radius;
            const innerR = this.radius * 0.65;
            ctx.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
            ctx.lineTo(Math.cos(a2) * innerR, Math.sin(a2) * innerR);
        }
        ctx.closePath();
        ctx.fill();

        // Outer ring stroke for definition
        ctx.strokeStyle = COLORS.SAWBLADE_INNER;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.95, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.shadowBlur = 0;

        // Inner circle
        ctx.fillStyle = COLORS.SAWBLADE_INNER;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Center cross bolt
        ctx.strokeStyle = '#1a0800';
        ctx.lineWidth = 2;
        const boltR = this.radius * 0.12;
        ctx.beginPath();
        ctx.moveTo(-boltR, 0);
        ctx.lineTo(boltR, 0);
        ctx.moveTo(0, -boltR);
        ctx.lineTo(0, boltR);
        ctx.stroke();

        ctx.restore();
    }
}

// ── Laser ──
export class Laser {
    constructor(x, y, length, angle = 90, onTime = 1.5, offTime = 1.0, phase = 0) {
        this.type = 'laser';
        this.x = x;
        this.y = y;
        this.length = length;
        this.angle = angle * Math.PI / 180;
        this.onTime = onTime;
        this.offTime = offTime;
        this.phase = phase;
        this.timer = phase;
        this.active = true;
        this.warningFlash = 0;
    }

    update(dt) {
        this.timer += dt;
        const cycle = this.onTime + this.offTime;
        const t = this.timer % cycle;
        this.active = t < this.onTime;

        // Warning flash before turning on
        const timeBeforeOn = cycle - t;
        if (!this.active && timeBeforeOn < 0.4) {
            this.warningFlash = Math.sin(timeBeforeOn * 20) * 0.5 + 0.5;
        } else {
            this.warningFlash = 0;
        }
    }

    getBounds() {
        if (!this.active) return null;
        // Compute AABB of laser beam
        const ex = this.x + Math.cos(this.angle) * this.length;
        const ey = this.y + Math.sin(this.angle) * this.length;
        const beamWidth = 8;
        const minX = Math.min(this.x, ex) - beamWidth;
        const maxX = Math.max(this.x, ex) + beamWidth;
        const minY = Math.min(this.y, ey) - beamWidth;
        const maxY = Math.max(this.y, ey) + beamWidth;
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    render(ctx, cameraX) {
        const sx = this.x - cameraX;
        if (sx < -this.length - 50 || sx > CANVAS.WIDTH + this.length + 50) return;

        const ex = sx + Math.cos(this.angle) * this.length;
        const ey = this.y + Math.sin(this.angle) * this.length;

        ctx.save();

        if (this.active) {
            // Wide outer glow beam
            ctx.shadowColor = COLORS.LASER_ON;
            ctx.shadowBlur = 25;
            ctx.strokeStyle = COLORS.LASER_GLOW;
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(sx, this.y);
            ctx.lineTo(ex, ey);
            ctx.stroke();

            // Main beam
            ctx.shadowBlur = 15;
            ctx.strokeStyle = COLORS.LASER_ON;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(sx, this.y);
            ctx.lineTo(ex, ey);
            ctx.stroke();

            ctx.shadowBlur = 0;

            // Inner bright core
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(sx, this.y);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Emitter housing
            ctx.fillStyle = COLORS.LASER_ON;
            ctx.shadowColor = COLORS.LASER_ON;
            ctx.shadowBlur = 12;
            ctx.fillRect(sx - 4, this.y - 6, 8, 12);
        } else {
            // Inactive dashed line
            ctx.setLineDash([6, 8]);
            ctx.strokeStyle = COLORS.LASER_OFF;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx, this.y);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.setLineDash([]);

            // Warning flash
            if (this.warningFlash > 0) {
                ctx.globalAlpha = this.warningFlash * 0.4;
                ctx.strokeStyle = COLORS.LASER_ON;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(sx, this.y);
                ctx.lineTo(ex, ey);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Emitter housing dim
            ctx.fillStyle = 'rgba(0, 255, 204, 0.2)';
            ctx.fillRect(sx - 4, this.y - 6, 8, 12);
        }

        ctx.restore();
    }
}

// ── Low Ceiling Block (for dash sections) ──
export class LowCeiling {
    constructor(x, y, width, height) {
        this.type = 'low_ceiling';
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height || 30;
    }

    getBounds() {
        return { x: this.x, y: this.y, w: this.width, h: this.height };
    }

    update() {}

    render(ctx, cameraX) {
        const sx = this.x - cameraX;
        if (sx + this.width < -20 || sx > CANVAS.WIDTH + 20) return;

        ctx.save();

        const grad = ctx.createLinearGradient(0, this.y, 0, this.y + this.height);
        grad.addColorStop(0, '#3a2560');
        grad.addColorStop(1, '#2a1850');
        ctx.fillStyle = grad;
        ctx.fillRect(sx, this.y, this.width, this.height);

        // Neon border glow
        ctx.shadowColor = COLORS.PORTAL_DASH;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = COLORS.PORTAL_DASH;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        ctx.strokeRect(sx, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Bottom edge glow line
        ctx.shadowColor = COLORS.PORTAL_DASH;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = COLORS.PORTAL_DASH;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx, this.y + this.height);
        ctx.lineTo(sx + this.width, this.y + this.height);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Hazard stripes
        ctx.fillStyle = 'rgba(255, 170, 0, 0.08)';
        const stripeW = 15;
        for (let i = 0; i < this.width / stripeW; i++) {
            if (i % 2 === 0) {
                ctx.fillRect(sx + i * stripeW, this.y, stripeW, this.height);
            }
        }

        ctx.restore();
    }
}

// ── Collision Helpers ──
export function aabbIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleRectIntersect(cx, cy, r, rect) {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (r * r);
}

export function checkCollision(playerBounds, obstacle) {
    const bounds = obstacle.getBounds();
    if (!bounds) return false;

    if (bounds.type === 'circle') {
        return circleRectIntersect(bounds.cx, bounds.cy, bounds.r, playerBounds);
    }
    return aabbIntersect(playerBounds, bounds);
}
