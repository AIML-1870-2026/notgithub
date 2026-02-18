/* ========================================
   Accessibility Tools
   Contrast checker + color blindness sim
   Depends on: ColorMath
   ======================================== */

const A11y = (() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  let bgColor = [0, 0, 0];

  function update(r, g, b) {
    // Foreground swatch
    $('fgSwatch').style.backgroundColor = `rgb(${r},${g},${b})`;
    $('fgHex').textContent = ColorMath.rgbToHex(r, g, b);

    // Contrast
    const ratio = ColorMath.contrastRatio([r, g, b], bgColor);
    $('contrastRatio').textContent = ratio.toFixed(2) + ':1';

    setBadge('aaSmall', ratio >= 4.5);
    setBadge('aaLarge', ratio >= 3);
    setBadge('aaaSmall', ratio >= 7);
    setBadge('aaaLarge', ratio >= 4.5);

    // Preview
    const preview = $('contrastPreview');
    preview.style.backgroundColor = `rgb(${bgColor[0]},${bgColor[1]},${bgColor[2]})`;
    preview.style.color = `rgb(${r},${g},${b})`;

    // Color blindness
    $('normalSwatch').style.backgroundColor = `rgb(${r},${g},${b})`;
    const types = ['protan', 'deutan', 'tritan'];
    types.forEach(t => {
      const sim = ColorMath.simulateCB(r, g, b, t + 'opia');
      $(t + 'Swatch').style.backgroundColor = `rgb(${sim[0]},${sim[1]},${sim[2]})`;
    });
  }

  function setBadge(id, pass) {
    const el = $(id);
    el.classList.toggle('pass', pass);
    el.classList.toggle('fail', !pass);
  }

  function setBgColor(rgb) {
    bgColor = rgb;
    $('bgSwatch').style.backgroundColor = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    $('bgHex').textContent = ColorMath.rgbToHex(rgb[0], rgb[1], rgb[2]);
  }

  function getBgColor() {
    return bgColor;
  }

  return { update, setBgColor, getBgColor };
})();
