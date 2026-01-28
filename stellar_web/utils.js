import * as THREE from 'three';

/**
 * Calculate distance between two 3D points
 * @param {THREE.Vector3} p1 - First point
 * @param {THREE.Vector3} p2 - Second point
 * @returns {number} Distance
 */
export function distance(p1, p2) {
    return p1.distanceTo(p2);
}

/**
 * Generate random float between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random value
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Convert hex color to THREE.Color
 * @param {string} hex - Hex color string
 * @returns {THREE.Color} Three.js color
 */
export function hexToColor(hex) {
    return new THREE.Color(hex);
}

/**
 * Lerp between two colors
 * @param {THREE.Color} color1 - Start color
 * @param {THREE.Color} color2 - End color
 * @param {number} t - Interpolation value (0-1)
 * @returns {THREE.Color} Interpolated color
 */
export function lerpColor(color1, color2, t) {
    const result = new THREE.Color();
    result.r = color1.r + (color2.r - color1.r) * t;
    result.g = color1.g + (color2.g - color1.g) * t;
    result.b = color1.b + (color2.b - color1.b) * t;
    return result;
}

/**
 * Map a value from one range to another
 * @param {number} value - Input value
 * @param {number} inMin - Input minimum
 * @param {number} inMax - Input maximum
 * @param {number} outMin - Output minimum
 * @param {number} outMax - Output maximum
 * @returns {number} Mapped value
 */
export function map(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Input value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Generate a color based on position (for rainbow effects)
 * @param {THREE.Vector3} position - 3D position
 * @param {number} bounds - Space bounds
 * @returns {THREE.Color} Position-based color
 */
export function colorFromPosition(position, bounds) {
    const hue = map(position.x, -bounds, bounds, 0, 1);
    return new THREE.Color().setHSL(hue, 0.8, 0.6);
}

/**
 * Generate a heat map color based on value
 * @param {number} value - Value (0-1)
 * @returns {THREE.Color} Heat map color (blue to red)
 */
export function heatMapColor(value) {
    const clamped = clamp(value, 0, 1);
    // Blue (0) -> Cyan (0.25) -> Green (0.5) -> Yellow (0.75) -> Red (1)
    return new THREE.Color().setHSL((1 - clamped) * 0.7, 1, 0.5);
}
