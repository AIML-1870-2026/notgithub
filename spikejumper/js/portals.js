// ── Portal / Ability Zone System ──

import { PORTAL_COLORS, CANVAS, PHYSICS } from './config.js';
import { getState, getPlayer, setPlayer } from './gameState.js';
import * as particles from './particles.js';

export class Portal {
    constructor(x, ability, color) {
        this.x = x;
        this.ability = ability;
        this.color = color || PORTAL_COLORS[ability] || '#ffffff';
        this.width = 30;
        this.height = PHYSICS.GROUND_Y - PHYSICS.CEILING_Y;
        this.y = PHYSICS.CEILING_Y;
        this.time = Math.random() * 10;
        this.triggered = false;
    }

    update(dt) {
        this.time += dt;
    }

    render(ctx, cameraX) {
        const sx = this.x - cameraX;
        if (sx < -50 || sx > CANVAS.WIDTH + 50) return;

        ctx.save();

        const pulse = Math.sin(this.time * 3) * 0.3 + 0.7;
        const barWidth = 6;
        const gapWidth = this.width;
        const topY = this.y;
        const botY = this.y + this.height;

        // Glow field between bars
        const glowGrad = ctx.createLinearGradient(sx - gapWidth / 2, 0, sx + gapWidth / 2, 0);
        glowGrad.addColorStop(0, 'transparent');
        glowGrad.addColorStop(0.3, this.color + '15');
        glowGrad.addColorStop(0.5, this.color + '25');
        glowGrad.addColorStop(0.7, this.color + '15');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(sx - gapWidth / 2, topY, gapWidth, botY - topY);

        // Scanline effect
        ctx.globalAlpha = 0.15 * pulse;
        const scanY = ((this.time * 80) % (botY - topY));
        ctx.fillStyle = this.color;
        ctx.fillRect(sx - gapWidth / 2, topY + scanY - 2, gapWidth, 4);
        ctx.globalAlpha = 1;

        // Left bar
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15 * pulse;
        ctx.fillStyle = this.color;
        ctx.fillRect(sx - gapWidth / 2 - barWidth, topY, barWidth, botY - topY);

        // Right bar
        ctx.fillRect(sx + gapWidth / 2, topY, barWidth, botY - topY);

        ctx.shadowBlur = 0;

        // Ability icon in center
        ctx.globalAlpha = 0.5 + pulse * 0.3;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const iconY = PHYSICS.GROUND_Y - 60;
        let icon = '';
        switch (this.ability) {
            case 'double_jump': icon = '2x'; break;
            case 'gravity_flip': case 'gravity_normal': icon = 'G'; break;
            case 'dash': icon = '>>'; break;
        }
        ctx.fillText(icon, sx, iconY);
        ctx.globalAlpha = 1;

        // Top and bottom caps
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(sx - gapWidth / 2 - barWidth, topY, gapWidth + barWidth * 2, 3);
        ctx.fillRect(sx - gapWidth / 2 - barWidth, botY - 3, gapWidth + barWidth * 2, 3);
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

export class JumpOrb {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color || PORTAL_COLORS.double_jump;
        this.radius = 18;
        this.activationRadius = 50;
        this.used = false;
        this.time = Math.random() * 10;
        this.popTimer = 0;
    }

    reset() {
        this.used = false;
        this.popTimer = 0;
    }

    update(dt) {
        this.time += dt;
        if (this.popTimer > 0) {
            this.popTimer -= dt;
        }
    }

    render(ctx, cameraX) {
        const sx = this.x - cameraX;
        if (sx < -60 || sx > CANVAS.WIDTH + 60) return;

        ctx.save();

        if (this.used) {
            // Dimmed used orb
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.arc(sx, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
            return;
        }

        const pulse = Math.sin(this.time * 4) * 0.3 + 0.7;

        // Outer glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20 * pulse;

        // Outer ring
        ctx.beginPath();
        ctx.arc(sx, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner filled circle
        ctx.beginPath();
        ctx.arc(sx, this.y, this.radius * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.4 + pulse * 0.3;
        ctx.fill();

        ctx.shadowBlur = 0;

        // Arrow/chevron icon inside
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(sx - 5, this.y + 3);
        ctx.lineTo(sx, this.y - 4);
        ctx.lineTo(sx + 5, this.y + 3);
        ctx.stroke();

        ctx.restore();
    }

    isPlayerInRange(playerBounds) {
        if (this.used) return false;
        // Check if player center is within activation radius
        const pcx = playerBounds.x + playerBounds.w / 2;
        const pcy = playerBounds.y + playerBounds.h / 2;
        const dx = pcx - this.x;
        const dy = pcy - this.y;
        return (dx * dx + dy * dy) <= this.activationRadius * this.activationRadius;
    }
}

export class SpeedZone {
    constructor(x, speed) {
        this.x = x;
        this.speed = speed;
        this.triggered = false;
    }
}

export function activatePortal(portal, audio) {
    const player = getPlayer();
    const state = getState();

    switch (portal.ability) {
        case 'gravity_flip':
            setPlayer({ gravityFlipped: !player.gravityFlipped });
            break;
        case 'gravity_normal':
            setPlayer({ gravityFlipped: false });
            break;
        case 'dash':
            setPlayer({ isDashing: true, dashTimer: PHYSICS.DASH_DURATION });
            break;
    }

    particles.spawnPortalSparkle(portal.x, PHYSICS.GROUND_Y - 80, portal.color);

    if (audio) {
        audio.play('portal_enter');
    }
}
