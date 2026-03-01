// ── Camera & Screen Shake ──

import { CANVAS } from './config.js';

let shakeIntensity = 0;
let shakeDuration = 0;
let shakeMaxDuration = 0;
let offsetX = 0;
let offsetY = 0;

export function triggerShake(intensity, duration) {
    shakeIntensity = intensity;
    shakeDuration = duration;
    shakeMaxDuration = duration;
}

export function updateShake(dt) {
    if (shakeDuration <= 0) {
        offsetX = 0;
        offsetY = 0;
        return;
    }
    shakeDuration -= dt;
    const decay = Math.max(0, shakeDuration / shakeMaxDuration);
    offsetX = (Math.random() - 0.5) * 2 * shakeIntensity * decay;
    offsetY = (Math.random() - 0.5) * 2 * shakeIntensity * decay;
}

export function getShakeOffset() {
    return { x: offsetX, y: offsetY };
}

export function getCameraX(scrollX) {
    return scrollX;
}

export function worldToScreen(worldX, worldY, cameraX) {
    return {
        x: worldX - cameraX + offsetX,
        y: worldY + offsetY
    };
}

export function isOnScreen(worldX, width, cameraX) {
    const screenX = worldX - cameraX;
    return screenX + width > -100 && screenX < CANVAS.WIDTH + 100;
}
