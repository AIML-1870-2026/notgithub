/* ========================================
   Petal Wheel — Flower-shaped color picker
   Draws overlapping bezier petals
   Depends on: ColorMath
   ======================================== */

const PetalWheel = (() => {
  'use strict';

  let canvas, ctx;
  let cssSize, center, radius;
  let dragging = false;
  let onColorPick = null;

  // Petal configuration
  const PETAL_COUNT = 12;
  const INNER_COUNT = 12;

  function init(canvasEl, colorCallback) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    onColorPick = colorCallback;

    sizeCanvas();
    bindEvents();
  }

  function sizeCanvas() {
    const container = canvas.parentElement;
    const maxPx = Math.min(container.clientWidth - 16, 380);
    cssSize = maxPx;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = maxPx * dpr;
    canvas.height = maxPx * dpr;
    canvas.style.width = maxPx + 'px';
    canvas.style.height = maxPx + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    center = maxPx / 2;
    radius = maxPx / 2 - 8;
  }

  /* ── Petal shape via bezier curves ── */
  function petalPath(length, width) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Left side curve
    ctx.bezierCurveTo(
      -width * 0.55, length * 0.25,
      -width * 0.45, length * 0.65,
      0, length
    );
    // Right side curve (back to origin)
    ctx.bezierCurveTo(
      width * 0.45, length * 0.65,
      width * 0.55, length * 0.25,
      0, 0
    );
    ctx.closePath();
  }

  function drawPetal(angle, length, width, hue, alpha, satBoost) {
    const rad = (angle - 90) * Math.PI / 180;

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rad);

    petalPath(length, width);

    // Gradient along petal: white center -> saturated hue -> darker tip
    const grad = ctx.createLinearGradient(0, 0, 0, length);
    const [r1, g1, b1] = ColorMath.hslToRgb(hue, 60 + satBoost, 92);
    const [r2, g2, b2] = ColorMath.hslToRgb(hue, 85 + satBoost * 0.5, 55);
    const [r3, g3, b3] = ColorMath.hslToRgb(hue, 70 + satBoost * 0.3, 25);

    grad.addColorStop(0, `rgba(${r1},${g1},${b1},${alpha * 0.85})`);
    grad.addColorStop(0.35, `rgba(${r2},${g2},${b2},${alpha})`);
    grad.addColorStop(0.7, `rgba(${r2},${g2},${b2},${alpha * 0.95})`);
    grad.addColorStop(1, `rgba(${r3},${g3},${b3},${alpha * 0.8})`);

    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle vein line down the center
    ctx.beginPath();
    ctx.moveTo(0, length * 0.15);
    ctx.lineTo(0, length * 0.85);
    ctx.strokeStyle = `rgba(255,255,255,${0.06 * alpha})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.restore();
  }

  function draw(markerAngle, markerRadius) {
    // Clear
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.globalCompositeOperation = 'source-over';

    // ── Outer petals (large, main ring) ──
    const outerLen = radius * 0.92;
    const outerWid = radius * 0.48;
    for (let i = 0; i < PETAL_COUNT; i++) {
      const hue = (i / PETAL_COUNT) * 360;
      const angle = hue;
      drawPetal(angle, outerLen, outerWid, hue, 1.0, 15);
    }

    // ── Mid petals (offset, fill gaps) ──
    const midLen = radius * 0.72;
    const midWid = radius * 0.4;
    for (let i = 0; i < INNER_COUNT; i++) {
      const hue = (i / INNER_COUNT) * 360 + (360 / INNER_COUNT / 2);
      const angle = hue;
      drawPetal(angle, midLen, midWid, hue, 0.85, 10);
    }

    // ── Inner petals (small accent ring) ──
    const innerLen = radius * 0.42;
    const innerWid = radius * 0.3;
    for (let i = 0; i < 8; i++) {
      const hue = (i / 8) * 360 + 22.5;
      const angle = hue;
      drawPetal(angle, innerLen, innerWid, hue, 0.7, 5);
    }

    // ── Center bloom (white core) ──
    const coreR = radius * 0.12;
    const coreGrad = ctx.createRadialGradient(center, center, 0, center, center, coreR);
    coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    coreGrad.addColorStop(0.6, 'rgba(255, 255, 240, 0.7)');
    coreGrad.addColorStop(1, 'rgba(255, 255, 240, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(center, center, coreR, 0, Math.PI * 2);
    ctx.fill();

    // ── Soft outer vignette (fade edges to bg) ──
    const vigR = radius + 8;
    const vigGrad = ctx.createRadialGradient(center, center, radius * 0.85, center, center, vigR);
    vigGrad.addColorStop(0, 'rgba(10, 10, 16, 0)');
    vigGrad.addColorStop(1, 'rgba(10, 10, 16, 0.6)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, cssSize, cssSize);

    // ── Marker ──
    if (markerAngle != null && markerRadius != null) {
      drawMarker(markerAngle, markerRadius);
    }
  }

  function drawMarker(angleDeg, radiusFrac) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    const dist = radiusFrac * radius;
    const mx = center + Math.cos(rad) * dist;
    const my = center + Math.sin(rad) * dist;

    // Glow ring
    ctx.beginPath();
    ctx.arc(mx, my, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();

    // White outer ring
    ctx.beginPath();
    ctx.arc(mx, my, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dark inner ring
    ctx.beginPath();
    ctx.arc(mx, my, 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Filled center dot
    ctx.beginPath();
    ctx.arc(mx, my, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  function getColorAtEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const dx = x - center;
    const dy = y - center;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > radius) return null;

    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;

    return ColorMath.wheelToRgb(angle, dist / radius);
  }

  function handlePointer(e) {
    e.preventDefault();
    const rgb = getColorAtEvent(e);
    if (rgb && onColorPick) onColorPick(rgb[0], rgb[1], rgb[2]);
  }

  function bindEvents() {
    canvas.addEventListener('mousedown', (e) => {
      dragging = true;
      handlePointer(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (dragging) handlePointer(e);
    });
    window.addEventListener('mouseup', () => { dragging = false; });

    canvas.addEventListener('touchstart', (e) => {
      dragging = true;
      handlePointer(e);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      if (dragging) handlePointer(e);
    }, { passive: false });
    canvas.addEventListener('touchend', () => { dragging = false; });
  }

  function resize() {
    sizeCanvas();
  }

  return { init, draw, resize };
})();
