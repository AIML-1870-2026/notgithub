// ── Canvas Rendering Pipeline ──

import { CANVAS, COLORS, PHYSICS } from './config.js';
import { getState, getPlayer } from './gameState.js';
import { getShakeOffset } from './camera.js';
import { renderPlayer } from './player.js';
import * as particles from './particles.js';
import * as effects from './effects.js';
import { renderHUD } from './hud.js';

let canvas, ctx;
let time = 0;

export function initRenderer() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return { canvas, ctx };
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    // Compute scale to fit logical resolution into viewport
    const scaleX = cw / CANVAS.WIDTH;
    const scaleY = ch / CANVAS.HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    const displayW = Math.floor(CANVAS.WIDTH * scale);
    const displayH = Math.floor(CANVAS.HEIGHT * scale);

    canvas.width = CANVAS.WIDTH * dpr;
    canvas.height = CANVAS.HEIGHT * dpr;
    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function getCtx() { return ctx; }
export function getCanvas() { return canvas; }

export function render(dt, gameTime) {
    const state = getState();
    time = gameTime;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS.HEIGHT);
    bgGrad.addColorStop(0, COLORS.BG_GRADIENT_TOP);
    bgGrad.addColorStop(1, COLORS.BG_GRADIENT_BOTTOM);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // Apply shake offset
    const shake = getShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // Parallax grid background
    renderGrid(state.scrollX);

    // Ground body (beneath obstacles)
    renderGroundBody(state.scrollX);

    // Ceiling (if gravity flip is active or nearby)
    if (state.player.gravityFlipped) {
        renderCeiling(state.scrollX);
    }

    // Portals
    for (const portal of state.portals) {
        portal.render(ctx, state.scrollX);
    }

    // Jump orbs
    for (const orb of state.jumpOrbs) {
        orb.render(ctx, state.scrollX);
    }

    // Obstacles
    for (const obs of state.obstacles) {
        obs.render(ctx, state.scrollX);
    }

    // Ground edge glow (on top of obstacles so spikes look embedded)
    renderGroundEdge(state.scrollX);

    // Player
    renderPlayer(ctx, state.scrollX);

    // Particles
    particles.render(ctx, state.scrollX);

    ctx.restore();

    // HUD (no shake applied)
    renderHUD(ctx);

    // Screen effects (flash, fade)
    effects.render(ctx);
}

export function renderMenuBackground(gameTime) {
    time = gameTime;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS.HEIGHT);
    bgGrad.addColorStop(0, COLORS.BG_GRADIENT_TOP);
    bgGrad.addColorStop(1, COLORS.BG_GRADIENT_BOTTOM);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    renderGrid(gameTime * 60);
    renderGroundBody(gameTime * 60);

    // Animated player bouncing on title screen
    const bounceY = PHYSICS.GROUND_Y - PHYSICS.PLAYER_SIZE - Math.abs(Math.sin(gameTime * 2.5)) * 80;
    ctx.save();
    const px = CANVAS.WIDTH / 2 - 100;

    // Player body
    ctx.translate(px + PHYSICS.PLAYER_SIZE / 2, bounceY + PHYSICS.PLAYER_SIZE / 2);
    const rot = Math.sin(gameTime * 2.5) * 0.3;
    ctx.rotate(rot);

    const hs = PHYSICS.PLAYER_SIZE / 2;
    const bodyGrad = ctx.createLinearGradient(-hs, -hs, hs, hs);
    bodyGrad.addColorStop(0, '#5599ff');
    bodyGrad.addColorStop(1, COLORS.PLAYER);
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(-hs, -hs, PHYSICS.PLAYER_SIZE, PHYSICS.PLAYER_SIZE);
    ctx.strokeStyle = '#6aadff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-hs, -hs, PHYSICS.PLAYER_SIZE, PHYSICS.PLAYER_SIZE);

    // Eyes
    const eyeSize = PHYSICS.PLAYER_SIZE * 0.22;
    const eyeY = -hs * 0.3;
    const eyeSpacing = PHYSICS.PLAYER_SIZE * 0.28;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    const pupilSize = eyeSize * 0.55;
    ctx.beginPath(); ctx.arc(-eyeSpacing + 2, eyeY, pupilSize, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeSpacing + 2, eyeY, pupilSize, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(-eyeSpacing + 0.5, eyeY - 2, pupilSize * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeSpacing + 0.5, eyeY - 2, pupilSize * 0.35, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // Some floating spikes for decoration
    const spikePositions = [
        { x: px + 200, y: PHYSICS.GROUND_Y },
        { x: px + 260, y: PHYSICS.GROUND_Y },
        { x: px + 320, y: PHYSICS.GROUND_Y }
    ];
    for (const sp of spikePositions) {
        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.shadowColor = COLORS.SPIKE;
        ctx.shadowBlur = 12;
        const grad = ctx.createLinearGradient(0, -35, 0, 0);
        grad.addColorStop(0, '#ffccdd');
        grad.addColorStop(0.3, COLORS.SPIKE_OUTLINE);
        grad.addColorStop(1, COLORS.SPIKE);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(-18, 0);
        ctx.lineTo(18, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Ground edge glow on top of spikes
    renderGroundEdge();
}

function renderGrid(scrollX) {
    // 3-layer parallax perspective grid
    const layers = [
        { speed: 0.05, alpha: 0.05, spacing: 120, color: '100, 140, 220' },
        { speed: 0.15, alpha: 0.08, spacing: 80, color: '100, 160, 255' },
        { speed: 0.3, alpha: 0.10, spacing: 50, color: '130, 180, 255' }
    ];

    const vanishY = CANVAS.HEIGHT * 0.15;
    const horizonY = CANVAS.HEIGHT * 0.3;

    for (const layer of layers) {
        const offset = (scrollX * layer.speed) % layer.spacing;

        ctx.strokeStyle = `rgba(${layer.color}, ${layer.alpha})`;
        ctx.lineWidth = 1;

        // Vertical lines with perspective convergence
        const numLines = Math.ceil(CANVAS.WIDTH / layer.spacing) + 2;
        for (let i = -1; i < numLines; i++) {
            const baseX = i * layer.spacing - offset;
            const topX = CANVAS.WIDTH / 2 + (baseX - CANVAS.WIDTH / 2) * 0.3;

            ctx.beginPath();
            ctx.moveTo(topX, vanishY);
            ctx.lineTo(baseX, CANVAS.HEIGHT);
            ctx.stroke();
        }

        // Horizontal lines with perspective spacing
        const numH = 12;
        for (let i = 0; i < numH; i++) {
            const t = i / numH;
            const y = horizonY + (CANVAS.HEIGHT - horizonY) * (t * t);
            const lineAlpha = layer.alpha * (0.3 + t * 0.7);

            ctx.strokeStyle = `rgba(${layer.color}, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS.WIDTH, y);
            ctx.stroke();
        }
    }
}

// Ground body + surface grid (drawn beneath obstacles)
function renderGroundBody(scrollX) {
    const groundY = PHYSICS.GROUND_Y;

    // Ground body
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, CANVAS.HEIGHT);
    groundGrad.addColorStop(0, '#2a2a55');
    groundGrad.addColorStop(1, '#1e1e45');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, CANVAS.WIDTH, CANVAS.HEIGHT - groundY);

    // Scrolling grid lines on the ground surface
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.06)';
    ctx.lineWidth = 1;
    const gridSpace = 60;
    const offset = scrollX % gridSpace;
    for (let i = -1; i < CANVAS.WIDTH / gridSpace + 2; i++) {
        const x = i * gridSpace - offset;
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x, CANVAS.HEIGHT);
        ctx.stroke();
    }
}

// Ground edge glow (drawn on top of obstacles so spikes look embedded)
function renderGroundEdge() {
    const groundY = PHYSICS.GROUND_Y;

    // Glowing edge line
    ctx.shadowColor = COLORS.GROUND_EDGE;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = COLORS.GROUND_EDGE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(CANVAS.WIDTH, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Secondary glow band
    const edgeGrad = ctx.createLinearGradient(0, groundY - 12, 0, groundY + 12);
    edgeGrad.addColorStop(0, 'transparent');
    edgeGrad.addColorStop(0.5, COLORS.GROUND_EDGE_GLOW);
    edgeGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, groundY - 12, CANVAS.WIDTH, 24);
}

function renderCeiling(scrollX) {
    const ceilY = PHYSICS.CEILING_Y;

    // Ceiling body
    const ceilGrad = ctx.createLinearGradient(0, 0, 0, ceilY);
    ceilGrad.addColorStop(0, '#1e1e45');
    ceilGrad.addColorStop(1, '#2a2a55');
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(0, 0, CANVAS.WIDTH, ceilY);

    // Glowing edge
    ctx.shadowColor = COLORS.PORTAL_GRAVITY_FLIP;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = COLORS.PORTAL_GRAVITY_FLIP;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, ceilY);
    ctx.lineTo(CANVAS.WIDTH, ceilY);
    ctx.stroke();
    ctx.shadowBlur = 0;
}
