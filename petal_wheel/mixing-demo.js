/* ========================================
   Additive Color Mixing Demo
   Draggable RGB spotlight circles
   Depends on: ColorMath
   ======================================== */

const MixingDemo = (() => {
  'use strict';

  let canvas, ctx;
  let cssW, cssH;
  const SPOT_R = 110;

  const spots = {
    r: { x: 0, y: 0 },
    g: { x: 0, y: 0 },
    b: { x: 0, y: 0 },
  };

  let dragging = null; // { key, offX, offY }

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');

    sizeCanvas();
    resetPositions();
    draw();
    bindEvents();
  }

  function sizeCanvas() {
    const container = canvas.parentElement;
    const maxW = container.clientWidth;
    const w = Math.min(maxW, 620);
    const h = Math.round(w * 0.6);
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cssW = w;
    cssH = h;
  }

  function resetPositions() {
    spots.r.x = cssW * 0.3;
    spots.r.y = cssH * 0.35;
    spots.g.x = cssW * 0.7;
    spots.g.y = cssH * 0.35;
    spots.b.x = cssW * 0.5;
    spots.b.y = cssH * 0.68;
  }

  function draw() {
    // Clear in device pixels
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.globalCompositeOperation = 'lighter';

    const colors = [
      { spot: spots.r, color: [255, 0, 0] },
      { spot: spots.g, color: [0, 255, 0] },
      { spot: spots.b, color: [0, 0, 255] },
    ];

    colors.forEach(({ spot, color }) => {
      const grad = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, SPOT_R);
      grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]}, 1)`);
      grad.addColorStop(0.55, `rgba(${color[0]},${color[1]},${color[2]}, 0.6)`);
      grad.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, SPOT_R, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';
  }

  function getCSSCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function hitTest(mx, my) {
    for (const key of ['r', 'g', 'b']) {
      const s = spots[key];
      const dx = mx - s.x;
      const dy = my - s.y;
      if (dx * dx + dy * dy < SPOT_R * SPOT_R) {
        return { key, offX: dx, offY: dy };
      }
    }
    return null;
  }

  function onDown(e) {
    e.preventDefault();
    const { x, y } = getCSSCoords(e);
    const hit = hitTest(x, y);
    if (hit) dragging = hit;
  }

  function onMove(e) {
    if (!dragging) return;
    e.preventDefault();
    const { x, y } = getCSSCoords(e);
    const s = spots[dragging.key];
    s.x = ColorMath.clamp(x - dragging.offX, 0, cssW);
    s.y = ColorMath.clamp(y - dragging.offY, 0, cssH);
    draw();
  }

  function onUp() {
    dragging = null;
  }

  function bindEvents() {
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);
  }

  function resize() {
    sizeCanvas();
    resetPositions();
    draw();
  }

  function reset() {
    resetPositions();
    draw();
  }

  return { init, draw, resize, reset };
})();
