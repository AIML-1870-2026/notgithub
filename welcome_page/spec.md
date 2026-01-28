# Portfolio Page Specification

## Project Overview
A single-page portfolio website featuring an interactive, playable sledding game as the full-screen background.

**Live Site**: https://agonderinger11.github.io/portfolio/

## Features

### Welcome Display
- **Name**: "Austin Gonderinger" prominently displayed
- **Greeting**: "Thanks for stopping by."
- **Frosted glass overlay** for text readability over game

### Playable Sledding Game
- **Infinite procedural terrain** - never-ending snowy hills
- **Jump mechanic** - hold to charge, release to jump
- **Physics-based movement** - speed varies with slope
- **Responsive controls** - keyboard (SPACE) and touch/click

### Visual Elements
- **Parallax mountains** - 3 layers with snow caps
- **Pine trees** with snow on branches
- **Falling snowflakes** - 200 particles
- **Snow spray effects** - on landing and while sledding
- **Sun with glow effect**
- **Gradient sky** - blue to white

### Character Design
- Person on red sled
- Red jacket, blue hat with pom-pom
- Rosy cheeks, smile, blue mittens
- Smooth rotation following terrain slope

## Technical Requirements

### HTML (index.html)
- HTML5 document structure
- Canvas element for game rendering
- Overlay container for name/greeting

### CSS (style.css)
- Full-viewport canvas
- Centered text overlay with backdrop blur
- Responsive typography using `clamp()`

### JavaScript (script.js)
- **Terrain Generation**: Layered sine waves for procedural hills
- **Physics Engine**: Gravity, velocity, slope-based speed
- **Rendering**: Canvas 2D with parallax layers
- **Input Handling**: Keyboard, mouse, and touch events
- **Particle System**: Snowflakes and spray effects

## Controls
| Input | Action |
|-------|--------|
| Hold SPACE | Charge jump |
| Release SPACE | Jump |
| Click/Hold | Charge jump (mouse) |
| Release Click | Jump (mouse) |
| Tap/Hold | Charge jump (touch) |
| Release Tap | Jump (touch) |

## File Structure
```
portfolio/
├── index.html    # Page structure
├── style.css     # Styling and layout
├── script.js     # Game logic and rendering
└── spec.md       # This specification
```

## Deployment (GitHub Pages)
1. Repository: https://github.com/agonderinger11/portfolio
2. Branch: `main`
3. GitHub Pages enabled via Settings > Pages
4. Auto-deploys on push to main

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (touch support)

## Performance
- Targets 60fps animation
- Efficient particle management
- Procedural generation (no large assets)
