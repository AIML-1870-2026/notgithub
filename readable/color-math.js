/* ========================================
   Color Math — Pure utility functions
   No DOM dependencies
   ======================================== */

const ColorMath = (() => {
  'use strict';

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v =>
      clamp(v, 0, 255).toString(16).padStart(2, '0')
    ).join('');
  }

  function hexToRgb(hex) {
    const m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
  }

  function relativeLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function contrastRatio(rgb1, rgb2) {
    const l1 = relativeLuminance(...rgb1);
    const l2 = relativeLuminance(...rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  const cbMatrices = {
    protanopia:   [0.567, 0.433, 0,     0.558, 0.442, 0,     0, 0.242, 0.758],
    deuteranopia: [0.625, 0.375, 0,     0.7,   0.3,   0,     0, 0.3,   0.7],
    tritanopia:   [0.95,  0.05,  0,     0,     0.433, 0.567, 0, 0.475, 0.525],
  };

  function simulateCB(r, g, b, type) {
    const m = cbMatrices[type];
    if (!m) return [r, g, b];
    return [
      clamp(Math.round(m[0] * r + m[1] * g + m[2] * b), 0, 255),
      clamp(Math.round(m[3] * r + m[4] * g + m[5] * b), 0, 255),
      clamp(Math.round(m[6] * r + m[7] * g + m[8] * b), 0, 255),
    ];
  }

  function simulateMonochromacy(r, g, b) {
    const gray = clamp(Math.round(0.299 * r + 0.587 * g + 0.114 * b), 0, 255);
    return [gray, gray, gray];
  }

  return {
    clamp, rgbToHex, hexToRgb,
    relativeLuminance, contrastRatio,
    simulateCB, simulateMonochromacy,
  };
})();
