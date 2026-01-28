# Starfield Particle System

## Overview

An interactive 3D starfield visualization built with HTML5 Canvas and vanilla JavaScript. Stars fly toward the viewer with customizable speed, density, and trail effects. Features a subtle cosmic color scheme and nebula background.

**Live Demo**: https://agonderinger11.github.io/AIML_Starfield/

## Features

### Core Visualization
- **3D Perspective Projection**: Stars are positioned in 3D space (x, y, z) and projected onto 2D screen coordinates with perspective scaling
- **Star Movement**: Stars spawn at random positions with far z-depth and travel toward the camera, growing larger as they approach
- **Trail Effects**: Motion trails rendered using position history with gradient fade
- **Nebula Background**: Slowly drifting colored gas clouds for atmosphere

### Customization Controls
| Control | Range | Default | Description |
|---------|-------|---------|-------------|
| Speed | 1-20 | 4 | How fast stars travel toward viewer |
| Density | 100-1000 | 500 | Number of stars in the field |
| Trail Length | 0-20 | 12 | Length of motion trail behind each star |

### UI Features
- **Collapsible Side Panel**: Gear icon on left edge expands to reveal controls
- **Glassmorphism Design**: Translucent panel with backdrop blur
- **Keyboard Shortcuts**: `H` to hide/show controls, `F` for fullscreen

## Technical Implementation

### File Structure
```
starfield/
├── index.html      # HTML structure with canvas and control panel
├── style.css       # Glassmorphism UI styling
├── starfield.js    # Particle system logic
└── spec.md         # This file
```

### Star Class
Each star maintains:
- **Position**: `x`, `y`, `z` coordinates in 3D space
- **Trail History**: Array of previous screen positions for trail rendering
- **Visual Properties**: Random color from palette, random base size

### Perspective Projection
```javascript
const scale = 500 / this.z;
const screenX = centerX + this.x * scale;
const screenY = centerY + this.y * scale;
const size = this.baseSize * scale * 2;
```

### Color Palette
Stars use a subtle cosmic color scheme:
- Pure white (`#ffffff`)
- Soft lavender (`#e8e0ff`)
- Light sky blue (`#d0e8ff`)
- Soft pink-white (`#ffe8f0`)
- Pale cyan (`#e0ffff`)
- Light violet (`#f0e8ff`)
- Ice blue (`#e8f4ff`)

### Animation Loop
Uses `requestAnimationFrame` for smooth 60fps rendering:
1. Clear canvas with slight transparency (motion blur effect)
2. Update and draw nebulae (background layer)
3. Update and draw stars (foreground layer)

## Browser Compatibility

- Modern browsers with HTML5 Canvas support
- CSS backdrop-filter for glassmorphism (graceful degradation on unsupported browsers)
- Fullscreen API for immersive mode

## Future Enhancements

Potential stretch goals:
- Mouse interaction (stars curve away from cursor)
- Warp speed effect (dramatic speed burst)
- Audio reactive mode (stars pulse to music)
- Preset themes (hyperspace, gentle drift, dense cluster)
- Screenshot/recording export
