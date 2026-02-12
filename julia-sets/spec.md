# Fractal Explorer — Technical Specification

## Overview
An interactive, GPU-accelerated fractal explorer built with vanilla JavaScript and WebGL2. Supports five fractal types with real-time pan, zoom, parameter adjustment, animation, and a linked Mandelbrot-to-Julia preview mode.

## Features

### Fractal Types
- **Julia Set** — `z → z² + c` where c is a user-adjustable complex constant
- **Mandelbrot Set** — `z → z² + c` where c varies per pixel
- **Burning Ship** — `z → (|Re(z)| + i|Im(z)|)² + c` with absolute value folding
- **Phoenix Fractal** — `z → z² + Re(c) + p·z_prev` with memory of previous iteration
- **Newton Fractal** — Newton's method on `z^n - 1 = 0`, colored by convergence root and speed

### Controls
- **Fractal type tabs** — switch between all 5 fractals
- **Named presets** — pre-configured parameter sets per fractal type
- **Dynamic parameter sliders** — automatically generated based on selected fractal
- **Max iterations** — 50 to 2000 (default: 200)
- **Color palettes** — 8 presets: Classic, Fire, Ocean, Grayscale, Rainbow, Neon, Ice, Magma
- **Animation** — toggleable parameter animation with speed control
- **Fullscreen** — native fullscreen toggle
- **Reset view** — returns to default position and parameters

### Interaction
- **Pan** — mouse drag or single-touch drag
- **Zoom** — scroll wheel (zooms toward cursor) or pinch gesture
- **Linked mode** — when viewing Mandelbrot, hover to see Julia set preview at that c-value; click to switch

### Rendering
- WebGL2 fragment shaders, one program per fractal type
- Smooth coloring via continuous iteration count (`i + 1 - log(log|z|)/log(2)`)
- 1D colormap textures (256×1 RGBA) for palette lookup
- Dirty-flag optimization — no GPU work when idle
- DPR-aware canvas sizing (capped at 2× for performance)

## File Structure

```
julia-sets/
├── index.html          — Canvas, sidebar markup, module entry
├── style.css           — Dark glassmorphism theme, responsive layout
├── spec.md             — This file
└── js/
    ├── main.js         — Entry point, animation loop, linked preview
    ├── renderer.js     — WebGL2 engine: shader compile, uniforms, draw
    ├── shaders.js      — GLSL source for vertex + 5 fractal fragment shaders
    ├── fractals.js     — Fractal definitions, parameters, presets
    ├── controls.js     — Sidebar DOM wiring, dynamic sliders
    ├── colormap.js     — Palette definitions, 1D texture generation
    ├── interaction.js  — Pan/zoom state machine (mouse + touch)
    └── animation.js    — Animated parameter oscillation
```

## Architecture

### Shader Programs
Each fractal has its own fragment shader compiled into a separate WebGL2 program. Shared GLSL blocks (uniforms, coordinate mapping, coloring) are injected via JavaScript template literals. The vertex shader is shared across all programs and renders a fullscreen quad.

### Uniforms
| Uniform | Type | Fractals | Description |
|---------|------|----------|-------------|
| u_resolution | vec2 | All | Canvas pixel dimensions |
| u_center | vec2 | All | Complex plane center |
| u_zoom | float | All | View half-width in complex plane units |
| u_maxIter | int | All | Maximum iteration count |
| u_aspectRatio | float | All | Canvas width / height |
| u_colormap | sampler2D | All | 1D palette texture |
| u_time | float | All | Elapsed time |
| u_juliaC | vec2 | Julia, Phoenix | Complex c parameter |
| u_phoenix | vec2 | Phoenix | Complex p parameter |
| u_degree | int | Newton | Polynomial degree (3–8) |
| u_relaxation | float | Newton | Newton method relaxation factor |

### Coordinate Mapping
Screen UV [0,1]² maps to the complex plane via:
```
re = center.x + (uv.x - 0.5) × 2 × zoom × aspectRatio
im = center.y + (uv.y - 0.5) × 2 × zoom
```
Zoom-toward-cursor keeps the point under the cursor fixed during zooming.

### Color Palettes
Palettes are defined as arrays of color stops, interpolated on the CPU into 256×1 RGBA textures. The shader samples via `texture(u_colormap, vec2(t, 0.5))` where t = normalized iteration count.

### Linked Mandelbrot → Julia
Uses a second 200×200 canvas with its own WebGL2 context. The Julia set preview renders at the c-value under the mouse cursor. On click, switches to Julia mode with that c-value.

## UI Design
- **Collapsible glassmorphism sidebar** on the right (bottom drawer on mobile)
- Dark theme: `#1a1a2e` background, `rgba(20,20,40,0.92)` panel with `backdrop-filter: blur(20px)`
- Accent color: `#4FC3F7` (cyan)
- Responsive: sidebar converts to bottom drawer at 768px breakpoint

## Browser Requirements
- WebGL2 support (Chrome 56+, Firefox 51+, Safari 15+, Edge 79+)
- ES6 module support
