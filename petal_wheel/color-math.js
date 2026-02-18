/* ========================================
   Color Math — Pure utility functions
   No DOM dependencies
   ======================================== */

const ColorMath = (() => {
  'use strict';

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    if (s === 0) {
      const v = Math.round(l * 255);
      return [v, v, v];
    }
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
      Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      Math.round(hue2rgb(p, q, h) * 255),
      Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    ];
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

  function wheelToRgb(angleDeg, radiusFrac) {
    const l = 100 - radiusFrac * 100;
    return hslToRgb(angleDeg, 100, clamp(l, 0, 100));
  }

  function rgbToWheel(r, g, b) {
    const [h, , l] = rgbToHsl(r, g, b);
    return { angle: h, radius: 1 - l / 100 };
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

  function harmonies(h, type) {
    switch (type) {
      case 'complementary': return [(h + 180) % 360];
      case 'analogous': return [(h + 30) % 360, (h - 30 + 360) % 360];
      case 'triadic': return [(h + 120) % 360, (h + 240) % 360];
      case 'split': return [(h + 150) % 360, (h + 210) % 360];
      case 'tetradic': return [(h + 90) % 360, (h + 180) % 360, (h + 270) % 360];
      default: return [];
    }
  }

  return {
    clamp, rgbToHsl, hslToRgb, rgbToHex, hexToRgb,
    wheelToRgb, rgbToWheel,
    relativeLuminance, contrastRatio,
    simulateCB, harmonies,
  };
})();
