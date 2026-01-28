# Stellar Web Simulation

An interactive 3D particle network visualization using Three.js where nodes dynamically connect based on proximity, creating mesmerizing web-like patterns in 3D space.

## Key Highlights

- **Dynamic Network**: Connections form and break in real-time as nodes float naturally through 3D space
- **Fully Controllable**: Adjust every aspect - from network size to movement speed to visual styling
- **Live Statistics**: Watch connection counts change as the network evolves
- **5 Visual Themes**: Pre-configured color schemes from cosmic to crystalline
- **Natural Physics**: Organic floating movement with velocity damping and random acceleration
- **Performance Optimized**: Handles 200-1000 nodes at 60 FPS with efficient rendering

## Features

### Interactive Controls

#### Visual Schemes
- **Preset Selector**: Choose from 5 distinct visual themes
- Quick-apply different color schemes and node styles

#### Node Properties
- **Node Count**: Adjust from 50 to 1000 particles
- **Node Size**: Scale particle size (0.5 - 5.0 units)
- **Node Opacity**: Control particle transparency (0.0 - 1.0)
- **Node Color**: Custom color picker for nodes

#### Edge Properties
- **Edge Thickness**: Adjust connection line width (0.1 - 3.0 units)
- **Edge Opacity**: Control connection transparency (0.0 - 1.0)
- **Edge Color**: Custom color picker for connections

#### Connection Properties
- **Connectivity Radius**: Distance threshold for node connections (10 - 150 units)
- **Max Connections**: Limit connections per node (1 - 20)

#### Space & Movement
- **Network Area Size**: Define 3D space volume (50 - 500 units) - controls how spread out the network is
- **Show Boundary Box**: Toggle visual boundary cube to see the network limits
- **Movement Speed**: Control particle velocity (0.0 - 40.0) - higher values create more dynamic motion
- **Pause/Resume**: Freeze animation

#### Camera Controls
- **Auto Rotate**: Automatic camera rotation around the network
- **Rotation Speed**: Control auto-rotation speed (0.0 - 2.0)

#### Real-Time Statistics
- **Connection Count**: Live display of total active connections
- **Avg Connections**: Average connections per node (updates in real-time)

### Visual Schemes

Each scheme includes pre-configured node/edge colors, sizes, and opacities that can be further customized:

#### 1. Cosmic Web (Default)
- **Nodes**: Bright cyan (#00FFFF)
- **Edges**: Faint blue (#4488FF) with full opacity
- Mimics galaxy cluster large-scale structure
- Clean, space-themed aesthetic

#### 2. Neural Network
- **Nodes**: Magenta/purple (#FF00FF)
- **Edges**: Electric cyan (#00FFFF) with full opacity
- Brain-like organic network appearance
- Vibrant, high-contrast colors

#### 3. Bioluminescent Ocean
- **Nodes**: Turquoise (#00CED1)
- **Edges**: Soft green (#00FF88) with full opacity
- Deep sea plankton network aesthetic
- Ethereal underwater glow effect

#### 4. Fire Network
- **Nodes**: Orange-red (#FF4500)
- **Edges**: Bright yellow (#FFFF00) with full opacity
- Energetic burning constellation effect
- Hot, dynamic color palette

#### 5. Crystalline Matrix
- **Nodes**: Light gray (#DDDDDD)
- **Edges**: Medium gray (#AAAAAA) with full opacity
- Sci-fi data structure visualization
- Clean, minimalist geometric design

### Particle Behavior

#### Movement Physics
- **Natural Floating**: Particles drift in 3D space with organic, fluid motion
- **Random Acceleration**: Frequent direction changes create unpredictable, natural paths
- **Velocity Damping**: Smooth deceleration prevents jerky movements
- **Speed Multiplier**: Adjustable from 0 (static) to 40 (very fast)
- **Boundary Bouncing**: Particles bounce with energy loss when hitting space limits

#### Connection Dynamics
- **Proximity-Based**: Connections automatically form when nodes enter each other's radius
- **Real-Time Breaking**: Connections disappear when nodes drift apart
- **Distance-Fading**: Edge opacity decreases with distance (closer = brighter)
- **Connection Limiting**: Max connections per node prevents performance issues
- **Additive Blending**: Overlapping connections create glowing effects

#### Visual Rendering
- **Points-Based Rendering**: Efficient GPU-accelerated particle display
- **Additive Blending**: Nodes glow brighter when overlapping
- **Dynamic Sizing**: Node and edge properties update in real-time
- **Depth Management**: Proper rendering of overlapping elements

### Camera Controls
- **Mouse Drag**: Rotate view
- **Mouse Wheel**: Zoom in/out
- **Right Click Drag**: Pan camera
- **Auto-Rotate**: Automatic orbital camera movement
- **Keyboard Shortcuts**:
  - `SPACE`: Pause/Resume animation
  - `R`: Reset camera position
  - `A`: Toggle auto-rotate

## How It Works

### The Network Algorithm

Each animation frame:
1. **Particles Update**: Each particle receives random acceleration, updates velocity with damping, and moves through 3D space
2. **Boundary Check**: Particles bounce off the network area boundaries
3. **Connection Scan**: For each particle, find all neighbors within connectivity radius
4. **Connection Limiting**: Sort by distance and connect to closest neighbors (up to max connections)
5. **Edge Rendering**: Create line geometries with distance-based opacity
6. **Stats Update**: Calculate total connections and averages

### Performance Optimizations
- **Points Rendering**: All nodes rendered in single draw call using THREE.Points
- **Connection Limiting**: Max connections per node prevents O(n²) edge explosion
- **Distance Culling**: Only nodes within radius are considered for connections
- **Buffer Geometry**: Efficient vertex updates without recreating objects
- **Additive Blending**: GPU handles glow effects without extra processing

## Technical Stack

- **Three.js**: 3D rendering engine (v0.160.0)
- **lil-gui**: Real-time parameter controls (v0.19)
- **ES6 Modules**: Modern JavaScript architecture
- **WebGL**: Hardware-accelerated graphics
- **CDN Delivery**: No build process required

## File Structure

```
stellar_web/
├── index.html          # Main HTML entry point with canvas and info overlay
├── style.css           # Styling for UI, canvas, and lil-gui theme
├── main.js             # Three.js scene setup, animation loop, and event handlers
├── particles.js        # Particle class and ParticleSystem with connection logic
├── controls.js         # GUI controls, visual scheme presets, and parameter management
├── utils.js            # Helper functions (distance, color, math utilities)
├── spec.md             # This documentation file
├── README.md           # Quick start guide and troubleshooting
└── test.html           # Simple Three.js test page for debugging
```

## Performance

- **Target**: 60 FPS with 200-500 nodes
- **Optimizations**:
  - Maximum connections per node to reduce edge count
  - Efficient distance calculations
  - Connection opacity based on distance
  - WebGL hardware acceleration

## Usage

### Quick Start

**Important**: This project uses ES6 modules and requires a web server (cannot be opened directly as `file://`).

1. **Start a local web server** in the `stellar_web` directory:
   ```bash
   python3 -m http.server 8000
   ```

2. **Open in browser**: Navigate to `http://localhost:8000`

3. **Explore the controls**: Use the GUI panel on the right side

4. **Try different visual schemes**: Select from the dropdown menu

5. **Adjust the network**:
   - Drag "Network Area Size" to control spread
   - Adjust "Connectivity Radius" to see more/fewer connections
   - Change "Movement Speed" to see dynamic connection changes

6. **Watch the stats**: Connection count updates in real-time (top-left)

7. **Keyboard shortcuts**:
   - `SPACE`: Pause/Resume
   - `R`: Reset camera
   - `A`: Toggle auto-rotate

See [README.md](README.md) for detailed setup instructions and troubleshooting.

## Implemented Features

### Core Functionality
- ✓ Real-time dynamic connection system
- ✓ Natural particle floating with physics
- ✓ Adjustable network area size
- ✓ Visual boundary box
- ✓ Live connection statistics
- ✓ 5 preset visual schemes
- ✓ Full parameter customization via GUI
- ✓ Distance-based edge opacity
- ✓ Additive blending for glow effects
- ✓ Efficient Points-based rendering

### Future Enhancements

**Visual Effects**
- Particle trails and motion blur
- Post-processing effects (bloom, depth of field)
- Chromatic aberration and lens effects
- Node pulsing based on connection count
- Edge pulse animations

**Interaction**
- Node interaction modes (attraction, repulsion, orbital forces)
- Mouse influence (attract/repel nodes with cursor)
- Click-to-highlight individual nodes and connections
- Drag nodes to reposition

**Audio**
- Audio reactivity (microphone input)
- Node size pulses with amplitude
- Connectivity radius syncs to bass
- Color spectrum shifts with frequency

**Export & Sharing**
- Screenshot capture
- Video recording
- Export configuration as JSON
- Share URL with encoded parameters
- Preset library system

**Platform Support**
- Mobile touch controls optimization
- Multi-touch gestures
- VR/AR support
- Performance profiles for different devices

## Browser Compatibility

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebGL support and ES6 module compatibility.

## Experimentation Ideas

Try these configurations for interesting effects:

### Dense Network Core
- Network Area Size: 100
- Node Count: 500
- Connectivity Radius: 120
- Movement Speed: 10
- **Result**: Constantly shifting dense web with many connections

### Sparse Galaxy
- Network Area Size: 400
- Node Count: 300
- Connectivity Radius: 60
- Movement Speed: 5
- **Result**: Spread-out nodes with occasional connections, galaxy-like

### Rapid Evolution
- Network Area Size: 200
- Node Count: 400
- Connectivity Radius: 100
- Movement Speed: 30
- **Result**: Fast-changing connections, very dynamic

### Minimal Network
- Network Area Size: 300
- Node Count: 100
- Connectivity Radius: 80
- Movement Speed: 3
- Enable Boundary Box
- **Result**: Easy to track individual nodes and connection changes

### Crystalline Structure
- Select "Crystalline Matrix" scheme
- Network Area Size: 150
- Node Count: 600
- Connectivity Radius: 50
- Movement Speed: 2
- **Result**: Slow-moving geometric web, almost architectural

## Credits

Built with Three.js and lil-gui libraries.
Developed as an interactive educational tool for exploring network dynamics and 3D visualization.
