/* ========================================
   App — Main entry point
   Wires all modules together
   ======================================== */

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // ── State ──
  let r = 128, g = 128, b = 128;

  // ── Toast ──
  function showToast(msg) {
    const container = $('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied ' + text);
    });
  }

  // ── Dynamic theming ──
  function updateTheme(r, g, b) {
    const root = document.documentElement;
    root.style.setProperty('--glow-r', r);
    root.style.setProperty('--glow-g', g);
    root.style.setProperty('--glow-b', b);

    // Ambient glow follows selected color
    const glow = $('ambientGlow');
    glow.style.background = `rgb(${r}, ${g}, ${b})`;
  }

  // ── Central color update ──
  function setColor(nr, ng, nb, source) {
    r = ColorMath.clamp(Math.round(nr), 0, 255);
    g = ColorMath.clamp(Math.round(ng), 0, 255);
    b = ColorMath.clamp(Math.round(nb), 0, 255);

    // Dynamic theming
    updateTheme(r, g, b);

    // Sliders + number inputs
    if (source !== 'sliders') {
      $('rSlider').value = r;
      $('gSlider').value = g;
      $('bSlider').value = b;
      $('rInput').value = r;
      $('gInput').value = g;
      $('bInput').value = b;
    }

    // Color values
    const hex = ColorMath.rgbToHex(r, g, b);
    const [h, s, l] = ColorMath.rgbToHsl(r, g, b);

    // Live swatch
    const swatch = $('colorSwatch');
    swatch.style.backgroundColor = `rgb(${r},${g},${b})`;
    swatch.style.boxShadow = `0 4px 30px rgba(${r},${g},${b},0.25)`;
    $('hexValue').textContent = hex;

    // Readouts
    $('hexCopy').textContent = hex;
    $('rgbValue').textContent = `rgb(${r}, ${g}, ${b})`;
    $('hslValue').textContent = `hsl(${h}, ${s}%, ${l}%)`;

    // Slider track gradients
    $('rTrack').style.background =
      `linear-gradient(to right, rgb(0,${g},${b}), rgb(255,${g},${b}))`;
    $('gTrack').style.background =
      `linear-gradient(to right, rgb(${r},0,${b}), rgb(${r},255,${b}))`;
    $('bTrack').style.background =
      `linear-gradient(to right, rgb(${r},${g},0), rgb(${r},${g},255))`;

    // Wheel
    const pos = ColorMath.rgbToWheel(r, g, b);
    PetalWheel.draw(pos.angle, pos.radius);

    // Palette
    Palette.update(h, s, l);

    // Accessibility
    A11y.update(r, g, b);
  }

  // ── Init ──
  function init() {
    // Petal wheel
    PetalWheel.init($('wheelCanvas'), (pr, pg, pb) => {
      setColor(pr, pg, pb, 'wheel');
    });

    // Mixing demo — deferred until its panel opens (canvas needs dimensions)
    let mixingInited = false;
    const mixingCanvas = $('mixingCanvas');
    const mixingPanel = mixingCanvas.closest('details');
    mixingPanel.addEventListener('toggle', () => {
      if (mixingPanel.open && !mixingInited) {
        MixingDemo.init(mixingCanvas);
        mixingInited = true;
      }
    });

    // Palette
    Palette.init($('paletteSwatches'));

    // Set initial color
    setColor(128, 128, 128, 'init');

    // ── Slider events ──
    ['r', 'g', 'b'].forEach(ch => {
      const slider = $(ch + 'Slider');
      const numInput = $(ch + 'Input');

      slider.addEventListener('input', () => {
        numInput.value = slider.value;
        setColor(
          parseInt($('rSlider').value),
          parseInt($('gSlider').value),
          parseInt($('bSlider').value),
          'sliders'
        );
      });

      numInput.addEventListener('input', () => {
        let v = parseInt(numInput.value);
        if (isNaN(v)) return;
        v = ColorMath.clamp(v, 0, 255);
        slider.value = v;
        setColor(
          parseInt($('rSlider').value),
          parseInt($('gSlider').value),
          parseInt($('bSlider').value),
          'sliders'
        );
      });

      numInput.addEventListener('blur', () => {
        let v = parseInt(numInput.value);
        if (isNaN(v)) v = 0;
        numInput.value = ColorMath.clamp(v, 0, 255);
      });
    });

    // ── Hex click-to-copy (swatch + readout) ──
    $('colorSwatch').addEventListener('click', () => {
      copyText($('hexValue').textContent);
    });

    $('hexCopy').addEventListener('click', () => {
      copyText($('hexCopy').textContent);
    });

    // ── Mixing demo reset ──
    $('resetMixing').addEventListener('click', () => {
      MixingDemo.reset();
    });

    // ── Harmony tabs ──
    document.querySelectorAll('.harmony-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.harmony-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        Palette.setHarmony(btn.dataset.harmony);
        const [h, s, l] = ColorMath.rgbToHsl(r, g, b);
        Palette.update(h, s, l);
      });
    });

    // ── Palette swatch click-to-copy ──
    $('paletteSwatches').addEventListener('click', (e) => {
      const card = e.target.closest('.swatch-card');
      if (card && card.dataset.hex) copyText(card.dataset.hex);
    });

    // ── Export palette ──
    $('exportPalette').addEventListener('click', () => {
      const css = Palette.exportCSS();
      if (css) {
        navigator.clipboard.writeText(css).then(() => {
          showToast('Palette CSS copied to clipboard');
        });
      }
    });

    // ── Background color picker ──
    $('bgPicker').addEventListener('input', (e) => {
      const rgb = ColorMath.hexToRgb(e.target.value);
      A11y.setBgColor(rgb);
      A11y.update(r, g, b);
    });

    // ── Window resize ──
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        PetalWheel.resize();
        if (mixingInited) MixingDemo.resize();
        const pos = ColorMath.rgbToWheel(r, g, b);
        PetalWheel.draw(pos.angle, pos.radius);
      }, 150);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
