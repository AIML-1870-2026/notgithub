/* ========================================
   Palette Generator
   Depends on: ColorMath
   ======================================== */

const Palette = (() => {
  'use strict';

  let container;
  let currentHarmony = 'complementary';

  function init(containerEl) {
    container = containerEl;
  }

  function update(h, s, l) {
    const angles = ColorMath.harmonies(h, currentHarmony);
    const harmonyLabels = {
      complementary: ['Complement'],
      analogous: ['+30\u00B0', '\u221230\u00B0'],
      triadic: ['120\u00B0', '240\u00B0'],
      split: ['+150\u00B0', '+210\u00B0'],
      tetradic: ['+90\u00B0', '+180\u00B0', '+270\u00B0'],
    };
    const labels = harmonyLabels[currentHarmony] || [];

    const colors = [
      { h, s, l, label: 'Base' },
      ...angles.map((a, i) => ({ h: a, s, l, label: labels[i] || '' })),
    ];

    container.innerHTML = colors.map(c => {
      const [r, g, b] = ColorMath.hslToRgb(c.h, c.s, c.l);
      const hex = ColorMath.rgbToHex(r, g, b);
      return `<div class="swatch-card" data-hex="${hex}" title="Click to copy ${hex}">
        <div class="swatch-color" style="background:${hex}"></div>
        <span class="swatch-hex">${hex}</span>
        <span class="swatch-label">${c.label}</span>
      </div>`;
    }).join('');
  }

  function setHarmony(type) {
    currentHarmony = type;
  }

  function getHarmony() {
    return currentHarmony;
  }

  function exportCSS() {
    const cards = container.querySelectorAll('.swatch-card');
    if (!cards.length) return '';
    const lines = [':root {'];
    cards.forEach((card, i) => {
      const hex = card.dataset.hex;
      const raw = card.querySelector('.swatch-label').textContent;
      const name = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('color-' + i);
      lines.push(`  --${name}: ${hex};`);
    });
    lines.push('}');
    return lines.join('\n');
  }

  return { init, update, setHarmony, getHarmony, exportCSS };
})();
