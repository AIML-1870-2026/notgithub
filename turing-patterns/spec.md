# Turing Pattern Reaction-Diffusion Simulation

An interactive WebGL2-powered reaction-diffusion simulator implementing five classic Turing pattern models with real-time parameter control, GPU-accelerated computation, parameter space journey animations, and side-by-side comparison mode.

## Key Highlights

- **Five Models**: Gray-Scott, FitzHugh-Nagumo, Gierer-Meinhardt, Brusselator, Schnakenberg
- **GPU Computation**: All reaction-diffusion math runs on the GPU via WebGL2 fragment shaders
- **Real-Time Control**: Adjust all parameters with immediate visual feedback
- **Pattern Presets**: Named presets for known-interesting parameter combinations with descriptions
- **Color Mapping**: 6 visualization color schemes (Heat, Ocean, Grayscale, Neon, Viridis, Magma)
- **Interactive Painting**: Click and drag to seed chemicals onto the simulation canvas
- **Parameter Journey**: Animate through parameter space along predefined or user-drawn paths
- **Comparison Mode**: Side-by-side overlay with draggable divider to compare two simulations
- **Educational Content**: Built-in explanations of the math and biology behind each model

## Features

### Reaction-Diffusion Models

All models follow the general form: `d[Chemical]/dt = Diffusion * Laplacian + Reaction Terms`

| Model | Chemicals | Key Parameters | Pattern Types |
|-------|-----------|----------------|---------------|
| Gray-Scott | U, V | feed (f), kill (k) | Spots, stripes, coral, mitosis, worms, maze |
| FitzHugh-Nagumo | v, w | epsilon, a0, a1, stimulus | Spiral waves, target waves, chaos |
| Gierer-Meinhardt | a, h | Da, Dh, rho, mu_a, mu_h | Spots, stripes, labyrinths |
| Brusselator | u, v | A, B, Du, Dv | Hexagonal spots, traveling waves, Turing stripes |
| Schnakenberg | u, v | a, b, Du, Dv | Spots, mixed modes, oscillations |

### Pattern Presets

**Gray-Scott (8):** Coral, Mitosis, Fingerprint, Zebra, Spots, Worms, Maze, Holes
**FitzHugh-Nagumo (4):** Spiral Waves, Target Waves, Chaos, Breathing
**Gierer-Meinhardt (4):** Spots, Stripes, Labyrinth, Dense Dots
**Brusselator (3):** Hex Spots, Traveling Waves, Turing Stripes
**Schnakenberg (3):** Spots, Mixed Mode, Oscillating

Each preset includes a hover tooltip describing the pattern.

### Parameter Space Journey

- **Predefined paths**: Curated journeys through parameter space (e.g., "Spots to Stripes", "Calm to Chaos")
- **User-drawn paths**: Click waypoints on a 2D parameter map, then animate along the path
- Speed and loop controls for journey playback

### Comparison Mode

- Overlay toggle with draggable vertical divider
- Two independent simulations running in parallel
- A/B tabs to control each simulation's parameters separately

### Color Maps

Six visualization schemes mapping chemical concentrations to colors:
- **Heat**: Black → purple → red → orange → yellow → white
- **Ocean**: Deep navy → blue → cyan → light cyan
- **Grayscale**: Black → white
- **Neon**: Black → purple → green → cyan → white
- **Viridis**: Dark purple → blue → teal → green → yellow
- **Magma**: Black → purple → pink → orange → cream

### Interactive Brush

- Click & drag to paint chemicals with adjustable size (1-50px) and intensity (0.01-1.0)
- Visual cursor feedback showing brush radius
- Touch support for mobile devices

### Educational Overlay

Modal with sections covering:
- What Turing patterns are (history and concept)
- Each model's equations and behavior
- Real-world examples in nature
- How the GPU simulation works

## Technical Architecture

### WebGL2 Render Pipeline

```
Per Frame (N simulation steps + 1 render pass):

  For i = 0 to stepsPerFrame:
    1. Bind write framebuffer
    2. Activate model-specific shader program
    3. Bind read texture (chemical state) to sampler
    4. Set uniforms (dt, model params, brush data)
    5. Draw full-screen quad
    6. Swap ping-pong buffers

  Then:
    7. Bind default framebuffer (screen)
    8. Activate render shader
    9. Bind state texture + colormap texture
    10. Draw full-screen quad (color-mapped output)
```

### Ping-Pong Framebuffer Technique

Two RGBA32F float textures (512x512) alternate as read/write targets. Chemical concentrations are stored in the R and G channels. Wrap mode is REPEAT for seamless torus topology.

### Discrete Laplacian

3x3 weighted kernel applied in each simulation shader:
```
[0.05  0.2  0.05]
[0.2  -1.0  0.2 ]
[0.05  0.2  0.05]
```

### Shader Programs

7 compiled programs sharing one vertex shader:
- 5 model simulation shaders (Gray-Scott, FitzHugh-Nagumo, Gierer-Meinhardt, Brusselator, Schnakenberg)
- 1 standard render shader (single simulation)
- 1 comparison render shader (split view with divider)

## Project Structure

```
turing-patterns/
├── index.html           # Entry point, HTML layout with canvas + control panel
├── style.css            # Split layout, glassmorphism styling, responsive design
├── spec.md              # This file
└── js/
    ├── main.js          # Entry point: init WebGL, wire modules, animation loop
    ├── renderer.js      # WebGL2 engine: shader compilation, framebuffer ping-pong
    ├── shaders.js       # All GLSL shader source strings (vertex + 6 fragment)
    ├── models.js        # Model parameter metadata, presets, initial conditions
    ├── controls.js      # DOM event wiring, dynamic slider generation, model switching
    ├── brush.js         # Mouse/touch canvas interaction, brush uniforms
    ├── colormap.js      # Color map definitions, 1D texture generation
    ├── journey.js       # Parameter space journey system
    ├── comparison.js    # Comparison mode divider positioning
    └── education.js     # Educational overlay content
```

## Module Specifications

### renderer.js
- `Renderer(canvas)` - Creates WebGL2 context, compiles shaders, sets up framebuffers
- `switchModel(name)` - Change active simulation program and reset state
- `resetState(name)` - Reinitialize textures with model-appropriate initial conditions
- `simulate(steps, params, brushUniforms, paramsB?)` - Run N simulation steps
- `render(colormapTex, channel, minVal, maxVal)` - Draw color-mapped output to screen
- `enableComparison(bool)` - Toggle comparison mode (creates second framebuffer set)

### models.js
- `MODEL_DEFS` - Parameter metadata per model (id, label, uniform, min, max, default, step)
- `PRESETS` - Named preset parameter sets per model with descriptions
- `getDefaultParams(model)` - Returns default parameter object
- `getInitialConditions(model, w, h)` - Returns Float32Array of initial texture data

### controls.js
- `initControls(app)` - Wires all DOM elements, returns reactive state object
- Dynamically generates parameter sliders when model changes
- Manages play/pause, reset, comparison tabs, color map, channel selection

### journey.js
- `Journey(app)` - Parameter space journey controller
- `play()` / `stop()` - Start/stop journey playback
- `update(state)` - Called each frame to interpolate parameters
- User-drawn path via 2D canvas click-to-place waypoints

## Controls

| Action | Input |
|--------|-------|
| Paint chemicals | Click & drag on canvas |
| Adjust brush size | Brush size slider |
| Switch model | Model tab buttons |
| Apply preset | Preset buttons (hover for description) |
| Play/Pause simulation | Play/Pause button |
| Reset simulation | Reset button |
| Change speed | Speed slider (1-40 steps/frame) |
| Change colors | Color map dropdown |
| Switch channel | Display channel dropdown |
| Start journey | Select journey + Play Journey button |
| Draw custom path | Draw Path button + click on parameter map |
| Toggle comparison | Enable Comparison button |
| Adjust divider | Drag comparison divider |
| View education | About Turing Patterns button |

## Parameter Ranges

### Gray-Scott
| Parameter | Min | Max | Default | Step |
|-----------|-----|-----|---------|------|
| Feed (f) | 0.0 | 0.1 | 0.055 | 0.001 |
| Kill (k) | 0.0 | 0.1 | 0.062 | 0.001 |
| Diffusion U | 0.05 | 0.5 | 0.2097 | 0.001 |
| Diffusion V | 0.01 | 0.3 | 0.105 | 0.001 |
| Time Step | 0.2 | 2.0 | 1.0 | 0.1 |

### FitzHugh-Nagumo
| Parameter | Min | Max | Default | Step |
|-----------|-----|-----|---------|------|
| Epsilon | 0.001 | 0.1 | 0.02 | 0.001 |
| a0 | -0.5 | 0.5 | -0.03 | 0.01 |
| a1 | 0.5 | 5.0 | 2.0 | 0.1 |
| Stimulus (I) | -0.5 | 0.5 | 0.0 | 0.01 |
| Diffusion v | 0.1 | 3.0 | 1.0 | 0.1 |
| Diffusion w | 0.0 | 2.0 | 0.5 | 0.05 |
| Time Step | 0.005 | 0.05 | 0.015 | 0.001 |

### Gierer-Meinhardt
| Parameter | Min | Max | Default | Step |
|-----------|-----|-----|---------|------|
| Diffusion a | 0.001 | 0.1 | 0.01 | 0.001 |
| Diffusion h | 0.1 | 2.0 | 0.5 | 0.01 |
| Production (rho) | 0.1 | 5.0 | 1.0 | 0.1 |
| Decay a | 0.1 | 3.0 | 1.0 | 0.1 |
| Decay h | 0.1 | 3.0 | 1.0 | 0.1 |
| Base prod a | 0.0 | 0.1 | 0.01 | 0.001 |
| Time Step | 0.1 | 2.0 | 0.5 | 0.05 |

### Brusselator
| Parameter | Min | Max | Default | Step |
|-----------|-----|-----|---------|------|
| A | 0.5 | 5.0 | 1.0 | 0.1 |
| B | 1.0 | 5.0 | 3.0 | 0.1 |
| Diffusion u | 0.5 | 5.0 | 1.0 | 0.1 |
| Diffusion v | 2.0 | 20.0 | 8.0 | 0.5 |
| Time Step | 0.001 | 0.02 | 0.005 | 0.001 |

### Schnakenberg
| Parameter | Min | Max | Default | Step |
|-----------|-----|-----|---------|------|
| a | 0.01 | 0.5 | 0.1 | 0.01 |
| b | 0.5 | 2.0 | 0.9 | 0.01 |
| Diffusion u | 0.5 | 5.0 | 1.0 | 0.1 |
| Diffusion v | 5.0 | 50.0 | 20.0 | 1.0 |
| Time Step | 0.001 | 0.05 | 0.01 | 0.001 |

## Performance

- **Target**: 60 FPS with 10-40 simulation steps per frame
- **Grid Resolution**: 512x512 (262,144 cells)
- **GPU Requirements**: WebGL2 with RGBA32F float textures
- **Rendering**: All computation on GPU via fragment shaders

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 15+ (WebGL2)
- Edge 90+

## Design

- **Theme**: Dark (#1a1a2e background, #000 canvas)
- **Accents**: Cyan (#4FC3F7), Purple (#8b5cf6)
- **UI**: Glassmorphism panels with backdrop blur
- **Font**: System font stack, monospace for values
- **Layout**: 70/30 split (canvas / controls), responsive to mobile (stacks vertically)
