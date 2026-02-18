# Petal Wheel — Spec

## Overview
An interactive RGB color picker built around a flower-shaped petal wheel. Users click or drag on bezier-curve petals to select colors, with the entire UI dynamically theming itself to match the selection. Includes an additive color mixing demo, palette harmony generator, WCAG contrast checker, and color blindness simulator.

## Core Color Model

Colors are represented internally as RGB (0–255 per channel) and converted on the fly:

```
HSL ↔ RGB ↔ HEX
Wheel position → HSL: hue = angle (0–360°), lightness = 100 - (radius% * 100)
Saturation is fixed at 100% on the wheel surface
```

Relative luminance and WCAG contrast ratios follow the W3C formula:
```
L = 0.2126*R' + 0.7152*G' + 0.0722*B'
contrast = (L_lighter + 0.05) / (L_darker + 0.05)
```

## Layout

### Three-Column Hero

The centerpiece of the page is a three-column grid layout:

| Left Panel | Center | Right Panel |
|------------|--------|-------------|
| RGB Sliders | Flower Wheel | Color Viewer |

- **Left:** Three slider rows (R, G, B) with colored channel dots, gradient track backgrounds, and numeric inputs
- **Center:** Flower petal canvas inside a circular frame (`.flower-ring`) with a dynamic colored glow. The glow intensity and color track the selected color via CSS custom properties
- **Right:** Live color swatch showing the selected color, plus HEX/RGB/HSL readout pills. HEX is click-to-copy

On screens < 820px, the layout stacks vertically with the flower on top.

### Header
- Title: "Petal Wheel"
- Subtitle: "Explore how screens create every color from just three lights"

### Collapsible Panels
Three `<details>` panels below the hero, **all collapsed by default:**

1. **Additive Color Mixing** — draggable RGB spotlight demo
2. **Palette Generator** — color harmony swatches
3. **Accessibility Tools** — contrast checker + color blindness sim

## Flower Petal Wheel

The wheel is drawn on a canvas using three concentric rings of bezier-curve petals:

| Ring | Count | Length | Width | Opacity | Purpose |
|------|-------|--------|-------|---------|---------|
| Outer | 12 | 92% of radius | 48% of radius | 1.0 | Main hue ring |
| Mid | 12 (offset 15°) | 72% of radius | 40% of radius | 0.85 | Fill gaps between outer petals |
| Inner | 8 (offset 22.5°) | 42% of radius | 30% of radius | 0.7 | Accent ring |

Each petal is a closed bezier path:
```
moveTo(0, 0)
bezierCurveTo(-w*0.55, len*0.25, -w*0.45, len*0.65, 0, len)  // left side
bezierCurveTo( w*0.45, len*0.65,  w*0.55, len*0.25, 0, 0)    // right side
```

Each petal has:
- A linear gradient from soft white (base) through saturated hue (middle) to dark (tip)
- A subtle center vein line (semi-transparent white stroke)

Additional elements:
- **White center bloom** — radial gradient at the origin (12% of radius)
- **Outer vignette** — fades edges to the page background color
- **Selection marker** — glow ring + white/dark double stroke + filled center dot

### Color Picking
Clicking or dragging maps canvas position to color:
- Angle from center → hue (0–360°)
- Distance from center / radius → lightness (center = white, edge = black)
- Saturation is always 100%

The picker uses math (not pixel sampling), so the visual petal shapes are decorative — any position maps to a deterministic HSL value.

## Dynamic Theming

The selected color is written to CSS custom properties on every update:
```css
--glow-r: [0–255]
--glow-g: [0–255]
--glow-b: [0–255]
```

These drive:
- **Ambient glow** — fixed-position blurred circle behind the page (opacity 0.18)
- **Flower ring box-shadow** — four-layer colored glow around the circular frame
- **Harmony tab active state** — tinted background and border
- **Input focus rings** — colored border and shadow
- **Toast notification borders**
- **Text selection color**

## Additive Color Mixing Demo

Three draggable RGB spotlight circles on a black canvas:
- Composite operation: `lighter` (additive blending)
- Each spot is a radial gradient from full intensity to transparent
- Spot radius: 110px
- Overlapping regions naturally produce Yellow (R+G), Cyan (G+B), Magenta (R+B), White (R+G+B)
- Reset button restores default triangle positions
- **Lazy init:** the canvas initializes only when the panel is first opened (deferred via `toggle` event on the `<details>` element)

## Palette Generator

Generates color harmony swatches based on the current HSL selection:

| Harmony | Angles from base hue |
|---------|---------------------|
| Complementary | +180° |
| Analogous | +30°, −30° |
| Triadic | +120°, +240° |
| Split-Complementary | +150°, +210° |
| Tetradic | +90°, +180°, +270° |

Each swatch card shows the color, its HEX value, and a label. Clicking a swatch copies its HEX. The "Export CSS Variables" button copies a `:root {}` block with named custom properties.

## Accessibility Tools

### Contrast Checker
- **Foreground:** the currently selected color (from the wheel)
- **Background:** user-selectable via native color input (defaults to black)
- Displays the contrast ratio (e.g., "4.50:1")
- Four WCAG badge pills: AA, AA Large, AAA, AAA Large — each shows pass (green) or fail (red)
- Live text preview panel showing foreground on background at two sizes

### Color Blindness Simulator
Simulates three types using matrix transforms:

| Type | Description | Matrix effect |
|------|-------------|---------------|
| Protanopia | No red cones | Red channel redistributed to green/blue |
| Deuteranopia | No green cones | Green channel redistributed to red/blue |
| Tritanopia | No blue cones | Blue channel redistributed to red/green |

Four swatches: Normal + three simulated versions of the selected color.

## File Structure

```
petal_wheel/
  index.html        — DOM structure, three-column hero, collapsible panels
  style.css         — Dark theme, dynamic theming via CSS vars, responsive
  spec.md           — This file
  color-math.js     — Pure math: HSL↔RGB, HEX, luminance, contrast, CB matrices, harmonies
  petal-wheel.js    — Flower canvas renderer, bezier petals, marker, pointer events
  mixing-demo.js    — Additive mixing canvas, draggable spotlights
  palette.js        — Harmony computation, swatch rendering, CSS export
  accessibility.js  — Contrast checker, WCAG badges, color blindness simulation
  app.js            — Main entry: state, event wiring, dynamic theming, lazy init
```

**Load order matters:** color-math → petal-wheel → mixing-demo → palette → accessibility → app

## Technical Details
- Pure vanilla JS — no frameworks or build tools
- Single HTML file entry point loading 6 JS modules via script tags
- All canvases handle device pixel ratio (DPR) for crisp rendering on retina displays
- Window resize triggers wheel and mixing demo redraw (debounced 150ms)
- Font stack: Inter (UI) + JetBrains Mono (numeric values)
- Dark theme with CSS custom properties
- Responsive: three-column grid collapses to single column at 820px
