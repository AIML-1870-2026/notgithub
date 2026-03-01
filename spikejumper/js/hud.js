// ── In-Game HUD ──

import { CANVAS, COLORS, PHYSICS } from './config.js';
import { getState, getProgress } from './gameState.js';

const BANNER_FADE_IN = 0.3;
const BANNER_HOLD = 1.4;
const BANNER_FADE_OUT = 0.5;
const BANNER_TOTAL = BANNER_FADE_IN + BANNER_HOLD + BANNER_FADE_OUT;

export function updateZoneBanner(dt) {
    const state = getState();
    const playerWorldX = state.scrollX + PHYSICS.PLAYER_START_X;

    // Find which section the player is currently in
    let sectionIdx = -1;
    for (let i = state.sections.length - 1; i >= 0; i--) {
        if (playerWorldX >= state.sections[i].x) {
            sectionIdx = i;
            break;
        }
    }

    // Trigger banner on new section
    if (sectionIdx !== state.currentSectionIndex && sectionIdx >= 0) {
        const section = state.sections[sectionIdx];
        state.currentSectionIndex = sectionIdx;
        state.zoneBanner = {
            active: true,
            timer: 0,
            name: section.name,
            hint: section.hint
        };
    }

    // Advance banner timer
    if (state.zoneBanner.active) {
        state.zoneBanner.timer += dt;
        if (state.zoneBanner.timer >= BANNER_TOTAL) {
            state.zoneBanner.active = false;
        }
    }
}

export function renderHUD(ctx) {
    const state = getState();
    const progress = getProgress();

    // Progress bar at top
    const barHeight = 3;
    const barY = 0;

    // Background
    ctx.fillStyle = COLORS.PROGRESS_BAR_BG;
    ctx.fillRect(0, barY, CANVAS.WIDTH, barHeight);

    // Fill
    const fillWidth = (progress / 100) * CANVAS.WIDTH;
    const barGrad = ctx.createLinearGradient(0, 0, fillWidth, 0);
    barGrad.addColorStop(0, '#4488ff');
    barGrad.addColorStop(1, '#00e5ff');
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, barY, fillWidth, barHeight);

    // Glow on leading edge
    if (fillWidth > 5) {
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(fillWidth - 2, barY, 2, barHeight);
        ctx.shadowBlur = 0;
    }

    // Stats in top-right corner
    ctx.save();

    const padding = 15;
    const x = CANVAS.WIDTH - padding;
    const y = 28;

    ctx.font = '14px "JetBrains Mono", "Fira Code", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    // Semi-transparent background
    const text1 = `${Math.floor(progress)}%`;
    const text2 = `ATT ${state.attemptNumber}`;
    const speedMult = (state.currentSpeed / state.baseSpeed).toFixed(1);
    const text3 = `${speedMult}x`;

    const totalWidth = 200;
    ctx.fillStyle = COLORS.HUD_BG;
    roundRect(ctx, x - totalWidth, y - 6, totalWidth + 10, 30, 6);
    ctx.fill();

    // Progress %
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 15px "JetBrains Mono", "Fira Code", monospace';
    ctx.fillText(text1, x, y);

    // Attempt
    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.font = '13px "JetBrains Mono", "Fira Code", monospace';
    ctx.fillText(text2, x - 65, y + 1);

    // Speed
    ctx.fillStyle = speedMult !== '1.0' ? '#ffaa44' : COLORS.HUD_TEXT;
    ctx.fillText(text3, x - 140, y + 1);

    ctx.restore();

    // Zone banner
    renderZoneBanner(ctx);
}

function renderZoneBanner(ctx) {
    const state = getState();
    const banner = state.zoneBanner;
    if (!banner.active) return;

    const t = banner.timer;

    // Calculate opacity based on phase
    let alpha;
    if (t < BANNER_FADE_IN) {
        alpha = t / BANNER_FADE_IN;
    } else if (t < BANNER_FADE_IN + BANNER_HOLD) {
        alpha = 1;
    } else {
        alpha = 1 - (t - BANNER_FADE_IN - BANNER_HOLD) / BANNER_FADE_OUT;
    }
    alpha = Math.max(0, Math.min(1, alpha));

    // Slide in from above
    const slideOffset = (1 - alpha) * -20;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(0, slideOffset);

    const cx = CANVAS.WIDTH / 2;
    const bannerY = 60;

    // Background pill
    const nameFont = 'bold 22px "JetBrains Mono", "Fira Code", monospace';
    const hintFont = '14px "JetBrains Mono", "Fira Code", monospace';
    ctx.font = nameFont;
    const nameWidth = ctx.measureText(banner.name).width;
    ctx.font = hintFont;
    const hintWidth = ctx.measureText(banner.hint).width;
    const pillWidth = Math.max(nameWidth, hintWidth) + 60;
    const pillHeight = 58;

    ctx.fillStyle = 'rgba(26, 26, 62, 0.7)';
    roundRect(ctx, cx - pillWidth / 2, bannerY, pillWidth, pillHeight, 10);
    ctx.fill();

    // Accent border
    ctx.strokeStyle = `rgba(0, 229, 255, ${0.5 * alpha})`;
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx - pillWidth / 2, bannerY, pillWidth, pillHeight, 10);
    ctx.stroke();

    // Section name
    ctx.font = nameFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(banner.name, cx, bannerY + 10);
    ctx.shadowBlur = 0;

    // Hint text
    ctx.font = hintFont;
    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.fillText(banner.hint, cx, bannerY + 36);

    ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
