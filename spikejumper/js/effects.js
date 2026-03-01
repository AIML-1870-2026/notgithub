// ── Visual Effects (Flash, Freeze Frame) ──

import { CANVAS, COLORS } from './config.js';

let flashAlpha = 0;
let flashDuration = 0;
let flashMaxDuration = 0;
let flashColor = COLORS.FLASH_WHITE;

let fadeAlpha = 0;
let fadeDuration = 0;
let fadeMaxDuration = 0;
let fadeIn = false;

export function triggerFlash(duration, color) {
    flashAlpha = 1;
    flashDuration = duration;
    flashMaxDuration = duration;
    flashColor = color || COLORS.FLASH_WHITE;
}

export function triggerFadeOut(duration) {
    fadeAlpha = 0;
    fadeDuration = duration;
    fadeMaxDuration = duration;
    fadeIn = false;
}

export function triggerFadeIn(duration) {
    fadeAlpha = 1;
    fadeDuration = duration;
    fadeMaxDuration = duration;
    fadeIn = true;
}

export function update(dt) {
    if (flashDuration > 0) {
        flashDuration -= dt;
        flashAlpha = Math.max(0, flashDuration / flashMaxDuration);
    }

    if (fadeDuration > 0) {
        fadeDuration -= dt;
        if (fadeIn) {
            fadeAlpha = Math.max(0, fadeDuration / fadeMaxDuration);
        } else {
            fadeAlpha = 1 - (fadeDuration / fadeMaxDuration);
        }
    }
}

export function render(ctx) {
    if (flashAlpha > 0.01) {
        ctx.globalAlpha = flashAlpha * 0.6;
        ctx.fillStyle = flashColor;
        ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
        ctx.globalAlpha = 1;
    }

    if (fadeAlpha > 0.01) {
        ctx.globalAlpha = fadeAlpha;
        ctx.fillStyle = COLORS.BG;
        ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
        ctx.globalAlpha = 1;
    }
}

export function isFlashing() {
    return flashDuration > 0;
}
