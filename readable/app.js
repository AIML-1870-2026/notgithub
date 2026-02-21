/* ========================================
   Readable — Main Application
   Orchestrator, DOM wiring, event handling
   ======================================== */

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // ── State ──
  let bgR = 255, bgG = 255, bgB = 255;
  let fgR = 30,  fgG = 30,  fgB = 30;
  let fontSize = 18;
  let visionType = 'normal';

  // ── Vision Simulation ──
  function applyVision(r, g, b) {
    if (visionType === 'normal') return [r, g, b];
    if (visionType === 'monochromacy') return ColorMath.simulateMonochromacy(r, g, b);
    return ColorMath.simulateCB(r, g, b, visionType);
  }

  // ── Ambient Glow ──
  function updateGlow(r, g, b) {
    const root = document.documentElement.style;
    root.setProperty('--glow-r', r);
    root.setProperty('--glow-g', g);
    root.setProperty('--glow-b', b);
    $('ambientGlow').style.background = `rgb(${r},${g},${b})`;
  }

  // ── Slider Track Gradients ──
  function updateBgTracks() {
    $('bgRTrack').style.background =
      `linear-gradient(to right, rgb(0,${bgG},${bgB}), rgb(255,${bgG},${bgB}))`;
    $('bgGTrack').style.background =
      `linear-gradient(to right, rgb(${bgR},0,${bgB}), rgb(${bgR},255,${bgB}))`;
    $('bgBTrack').style.background =
      `linear-gradient(to right, rgb(${bgR},${bgG},0), rgb(${bgR},${bgG},255))`;
  }

  function updateFgTracks() {
    $('fgRTrack').style.background =
      `linear-gradient(to right, rgb(0,${fgG},${fgB}), rgb(255,${fgG},${fgB}))`;
    $('fgGTrack').style.background =
      `linear-gradient(to right, rgb(${fgR},0,${fgB}), rgb(${fgR},255,${fgB}))`;
    $('fgBTrack').style.background =
      `linear-gradient(to right, rgb(${fgR},${fgG},0), rgb(${fgR},${fgG},255))`;
  }

  // ── Central Setters ──
  function setBgColor(r, g, b, source) {
    bgR = ColorMath.clamp(Math.round(r), 0, 255);
    bgG = ColorMath.clamp(Math.round(g), 0, 255);
    bgB = ColorMath.clamp(Math.round(b), 0, 255);

    if (source !== 'bg-sliders') {
      $('bgRSlider').value = bgR; $('bgRInput').value = bgR;
      $('bgGSlider').value = bgG; $('bgGInput').value = bgG;
      $('bgBSlider').value = bgB; $('bgBInput').value = bgB;
    }

    $('bgChip').style.backgroundColor = `rgb(${bgR},${bgG},${bgB})`;
    $('bgHexLabel').textContent = ColorMath.rgbToHex(bgR, bgG, bgB);

    updateBgTracks();
    updateGlow(bgR, bgG, bgB);
    renderPreview();
    updateStats();
  }

  function setFgColor(r, g, b, source) {
    fgR = ColorMath.clamp(Math.round(r), 0, 255);
    fgG = ColorMath.clamp(Math.round(g), 0, 255);
    fgB = ColorMath.clamp(Math.round(b), 0, 255);

    if (source !== 'fg-sliders') {
      $('fgRSlider').value = fgR; $('fgRInput').value = fgR;
      $('fgGSlider').value = fgG; $('fgGInput').value = fgG;
      $('fgBSlider').value = fgB; $('fgBInput').value = fgB;
    }

    $('fgChip').style.backgroundColor = `rgb(${fgR},${fgG},${fgB})`;
    $('fgHexLabel').textContent = ColorMath.rgbToHex(fgR, fgG, fgB);

    updateFgTracks();
    renderPreview();
    updateStats();
  }

  function setFontSize(px, source) {
    fontSize = ColorMath.clamp(Math.round(px), 12, 72);
    if (source !== 'size-slider') {
      $('sizeSlider').value = fontSize;
    }
    if (source !== 'size-input') {
      $('sizeInput').value = fontSize;
    }
    renderPreview();
    updateStats();
  }

  // ── Preview Render ──
  function renderPreview() {
    const [simBgR, simBgG, simBgB] = applyVision(bgR, bgG, bgB);
    const [simFgR, simFgG, simFgB] = applyVision(fgR, fgG, fgB);
    const card = $('previewCard');
    card.style.backgroundColor = `rgb(${simBgR},${simBgG},${simBgB})`;
    card.style.color = `rgb(${simFgR},${simFgG},${simFgB})`;
    card.style.fontSize = fontSize + 'px';
  }

  // ── Stats ──
  function updateStats() {
    const bgLum = ColorMath.relativeLuminance(bgR, bgG, bgB);
    const fgLum = ColorMath.relativeLuminance(fgR, fgG, fgB);
    const ratio = ColorMath.contrastRatio([bgR, bgG, bgB], [fgR, fgG, fgB]);

    $('contrastDisplay').textContent = ratio.toFixed(2) + ':1';
    $('bgLumDisplay').textContent = bgLum.toFixed(4);
    $('fgLumDisplay').textContent = fgLum.toFixed(4);

    updateWCAGBadges(ratio);
  }

  // ── WCAG Badges (Stretch B) ──
  function updateWCAGBadges(ratio) {
    const normalPass = ratio >= 4.5;
    const largePass = ratio >= 3.0;

    setBadge('badgeNormal', normalPass, 'AA Normal');
    setBadge('badgeLarge', largePass, 'AA Large');
  }

  function setBadge(id, pass, label) {
    const el = $(id);
    el.textContent = (pass ? 'PASS' : 'FAIL') + ' \u2014 ' + label;
    el.classList.toggle('pass', pass);
    el.classList.toggle('fail', !pass);
  }

  // ── Vision Simulation (Stretch A) ──
  function setVisionType(type) {
    visionType = type;
    const isNormal = type === 'normal';

    // Disable/enable color sliders and inputs
    ['bg', 'fg'].forEach(prefix => {
      ['R', 'G', 'B'].forEach(ch => {
        $(prefix + ch + 'Slider').disabled = !isNormal;
        $(prefix + ch + 'Input').disabled = !isNormal;
      });
    });

    // Visual dim via CSS class
    document.querySelectorAll('.control-group--color').forEach(el => {
      el.classList.toggle('controls-disabled', !isNormal);
    });

    // Update hint text
    const hints = {
      normal: '',
      protanopia: 'Protanopia: reduced red sensitivity (no L-cones)',
      deuteranopia: 'Deuteranopia: reduced green sensitivity (no M-cones)',
      tritanopia: 'Tritanopia: reduced blue sensitivity (no S-cones)',
      monochromacy: 'Achromatopsia: no color perception, only luminance',
    };
    $('visionHint').textContent = hints[type] || '';

    renderPreview();
  }

  // ── Presets (Stretch C) ──
  const PRESETS = [
    { label: 'High Contrast',    bg: [255, 255, 255], fg: [0, 0, 0] },
    { label: 'Dark Mode',        bg: [18, 18, 18],    fg: [232, 232, 240] },
    { label: 'Solarized',        bg: [0, 43, 54],     fg: [131, 148, 150] },
    { label: 'Warm Paper',       bg: [255, 252, 240], fg: [60, 40, 20] },
    { label: 'GitHub Light',     bg: [255, 255, 255], fg: [36, 41, 47] },
    { label: 'Low Contrast',     bg: [200, 200, 200], fg: [170, 170, 170] },
    { label: 'Red on Green',     bg: [255, 0, 0],     fg: [0, 255, 0] },
    { label: 'Yellow Clash',     bg: [255, 255, 0],   fg: [255, 200, 0] },
  ];

  function applyPreset(preset) {
    // Reset vision to normal when applying a preset
    if (visionType !== 'normal') {
      document.querySelector('input[name="vision"][value="normal"]').checked = true;
      setVisionType('normal');
    }
    setBgColor(...preset.bg, 'preset');
    setFgColor(...preset.fg, 'preset');
  }

  function buildPresetButtons() {
    const grid = $('presetGrid');
    PRESETS.forEach((p) => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      const bgHex = ColorMath.rgbToHex(...p.bg);
      const fgHex = ColorMath.rgbToHex(...p.fg);
      btn.innerHTML =
        '<span class="preset-swatch-pair">' +
          '<span class="preset-chip" style="background:' + bgHex + '"></span>' +
          '<span class="preset-chip" style="background:' + fgHex + '"></span>' +
        '</span>' +
        '<span class="preset-label">' + p.label + '</span>';
      btn.addEventListener('click', () => applyPreset(p));
      grid.appendChild(btn);
    });
  }

  // ── Slider Wiring ──
  function wireColorSliders(prefix, setFn, sourceId) {
    ['R', 'G', 'B'].forEach(ch => {
      const slider = $(prefix + ch + 'Slider');
      const input = $(prefix + ch + 'Input');

      slider.addEventListener('input', () => {
        input.value = slider.value;
        setFn(
          parseInt($(prefix + 'RSlider').value),
          parseInt($(prefix + 'GSlider').value),
          parseInt($(prefix + 'BSlider').value),
          sourceId
        );
      });

      input.addEventListener('input', () => {
        let v = parseInt(input.value);
        if (isNaN(v)) return;
        v = ColorMath.clamp(v, 0, 255);
        slider.value = v;
        setFn(
          parseInt($(prefix + 'RSlider').value),
          parseInt($(prefix + 'GSlider').value),
          parseInt($(prefix + 'BSlider').value),
          sourceId
        );
      });

      input.addEventListener('blur', () => {
        let v = parseInt(input.value);
        if (isNaN(v)) v = 0;
        input.value = ColorMath.clamp(v, 0, 255);
      });
    });
  }

  // ── Init ──
  function init() {
    buildPresetButtons();

    wireColorSliders('bg', setBgColor, 'bg-sliders');
    wireColorSliders('fg', setFgColor, 'fg-sliders');

    // Size slider
    $('sizeSlider').addEventListener('input', () => {
      $('sizeInput').value = $('sizeSlider').value;
      setFontSize(parseInt($('sizeSlider').value), 'size-slider');
    });

    $('sizeInput').addEventListener('input', () => {
      let v = parseInt($('sizeInput').value);
      if (isNaN(v)) return;
      v = ColorMath.clamp(v, 12, 72);
      $('sizeSlider').value = v;
      setFontSize(v, 'size-input');
    });

    $('sizeInput').addEventListener('blur', () => {
      let v = parseInt($('sizeInput').value);
      if (isNaN(v)) v = 18;
      $('sizeInput').value = ColorMath.clamp(v, 12, 72);
    });

    // Vision radio buttons
    document.querySelectorAll('input[name="vision"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) setVisionType(radio.value);
      });
    });

    // Initial render
    setBgColor(bgR, bgG, bgB, 'init');
    setFgColor(fgR, fgG, fgB, 'init');
    setFontSize(fontSize, 'init');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
