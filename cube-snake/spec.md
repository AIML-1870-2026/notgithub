# 3D Cube Snake - Technical Specification

## Overview

3D Cube Snake is a web-based game that reimagines the classic snake game on the surface of a 3D cube. The game uses Three.js for 3D rendering and implements seamless navigation across all six faces of the cube.

## Core Concepts

### Coordinate System

The game uses a hybrid coordinate system:

1. **3D Grid Coordinates**: Each cell on the cube surface has x, y, z coordinates (0-14 range)
2. **Face-Based 2D Coordinates**: Each face has local (x, y) coordinates (0-14 range)
3. **World Coordinates**: Three.js 3D world positions for rendering

### Cube Structure

- **Grid Size**: 15×15 cells per face
- **Total Cells**: 6 faces × 225 cells = 1,350 cells
- **Cube Size**: 20 units in world space
- **Cell Size**: ~1.33 units (20 / 15)
- **Visualization**: Hollow cube showing only outer shell with transparent cubes

### Face Definitions

```
FRONT:  z = max (14)
BACK:   z = 0
LEFT:   x = 0
RIGHT:  x = max (14)
TOP:    y = max (14)
BOTTOM: y = 0
```

## System Architecture

### Module Dependencies

```
main.js
  ├── Cube.js
  ├── Snake.js
  │   └── FaceNavigator.js
  ├── AppleManager.js
  ├── GameState.js
  ├── Controls.js
  └── UI.js
```

## Component Specifications

### 1. Cube.js - Grid System

**Purpose**: Creates and manages the 3D cube grid structure.

**Key Methods**:

- `createGrid()`: Generates hollow cube shell with transparent cubes
- `gridToWorld(x, y, z)`: Converts grid coordinates to world positions
- `worldToGrid(position)`: Converts world positions to grid coordinates
- `getFacePosition(face, x, y)`: Gets world position for a face coordinate
- `faceToGrid(face, x, y)`: Converts face coordinates to 3D grid coordinates
- `setColor(color)`: Updates cube grid color

**Rendering**:
- Uses `THREE.Mesh` for each grid cube
- Uses `THREE.LineSegments` for cube edges
- Material: `MeshStandardMaterial` with transparency (opacity: 0.15)
- Edge material: `LineBasicMaterial` (opacity: 0.3)

### 2. FaceNavigator.js - Edge Transitions

**Purpose**: Handles snake movement between cube faces.

**Adjacency Mapping**:

```javascript
FRONT face edges:
  top    → TOP
  bottom → BOTTOM
  left   → LEFT
  right  → RIGHT

BACK face edges:
  top    → TOP (rotated)
  bottom → BOTTOM (rotated)
  left   → RIGHT
  right  → LEFT

// Similar mappings for all 6 faces
```

**Key Methods**:

- `transition(face, x, y, direction)`: Calculates new position when crossing edge
- `transformCoordinates(edge, x, y, fromFace, toFace)`: Transforms coordinates between faces
- `rotateDirection(direction, rotation)`: Rotates direction vector for new face orientation
- `areDirectionsOpposite(dir1, dir2)`: Checks if two directions are opposite

**Edge Detection**:
- Detects when coordinates exceed bounds (x/y < 0 or x/y > 14)
- Determines which edge was crossed (top, bottom, left, right)
- Calculates entry position on adjacent face

### 3. Snake.js - Snake Mechanics

**Purpose**: Manages snake state, movement, and rendering.

**Data Structure**:
```javascript
body: [
  { face: 'FRONT', x: 7, y: 7 },  // head
  { face: 'FRONT', x: 6, y: 7 },
  { face: 'FRONT', x: 5, y: 7 }   // tail
]
```

**Key Methods**:

- `move()`: Advances snake one cell, handles collisions
- `grow()`: Flags snake to grow on next move
- `render()`: Updates visual representation of all segments
- `setDirection(newDirection)`: Updates movement direction (with reverse prevention)
- `reset(length)`: Initializes snake with specified length

**Collision Detection**:
- Self-collision: Check if new head position matches any body segment
- Considers both face and (x, y) coordinates
- Returns collision status from `move()`

**Rendering**:
- Head: 1.1× scale, different color
- Body: 1.0× scale, body color
- Uses `MeshStandardMaterial` with emissive properties

### 4. AppleManager.js - Apple System

**Purpose**: Spawns and manages apple positions.

**Key Methods**:

- `spawnApple(snakeBody)`: Generates random apple avoiding snake and other apples
- `checkCollision(headPosition)`: Detects apple collection
- `reset(count)`: Initializes specified number of apples
- `setColor(color)`: Updates apple color

**Spawning Algorithm**:
1. Generate random face (0-5)
2. Generate random x, y coordinates (0-14)
3. Check against snake body positions
4. Check against existing apple positions
5. Retry up to 100 times if occupied

**Rendering**:
- Size: 0.8× cell size
- Material: `MeshStandardMaterial` with higher emissive intensity (0.3)

### 5. GameState.js - State Management

**Purpose**: Manages game states and score tracking.

**States**:
- `MENU`: Initial screen
- `PLAYING`: Active gameplay
- `PAUSED`: Game paused
- `GAME_OVER`: Collision detected

**State Transitions**:
```
MENU → PLAYING (start button)
PLAYING → PAUSED (escape/space)
PAUSED → PLAYING (space/resume)
PLAYING → GAME_OVER (collision)
GAME_OVER → MENU (restart)
```

**Persistence**:
- High score stored in `localStorage`
- Key: `cubeSnakeHighScore`

### 6. Controls.js - Input Handling

**Purpose**: Captures and processes keyboard input.

**Key Bindings**:
```
Movement:
  Arrow Keys: Up, Down, Left, Right
  WASD: W(up), A(left), S(down), D(right)

Game Control:
  Space: Pause/Resume
  Escape: Pause
  R: Restart
```

**Event System**:
- Uses observer pattern
- Emits events: `direction`, `pause`, `restart`

### 7. UI.js - User Interface

**Purpose**: Manages screen transitions and settings.

**Screens**:
- Menu screen
- Game screen (HUD)
- Pause screen
- Game over screen
- Settings screen

**Settings Management**:
```javascript
{
  appleCount: 1-10,
  gameSpeed: 1-3 (Slow, Medium, Fast),
  startLength: 3-10,
  snakeBodyColor: '#00ff00',
  snakeHeadColor: '#00cc00',
  appleColor: '#ff0000',
  cubeColor: '#ffffff'
}
```

**Persistence**:
- Settings stored in `localStorage`
- Key: `cubeSnakeSettings`

### 8. main.js - Game Loop

**Purpose**: Initializes game and runs main loop.

**Initialization**:
1. Create Three.js scene
2. Setup camera (PerspectiveCamera at position [25, 20, 25])
3. Create renderer with antialiasing
4. Add lighting (ambient + directional)
5. Initialize all game systems

**Game Loop**:
```javascript
update(currentTime) {
  if (state !== PLAYING) return;

  if (currentTime - lastMoveTime >= moveInterval) {
    moveSnake();
    checkCollisions();
    checkAppleCollection();
  }
}
```

**Speed Settings**:
```javascript
1 (Slow):   300ms per move
2 (Medium): 200ms per move
3 (Fast):   100ms per move
```

## Rendering Pipeline

### Scene Setup

```javascript
Scene: Background color 0x0a0a0a (dark)
Camera: FOV 65°, positioned at (25, 20, 25)
Lighting:
  - AmbientLight: 0xffffff, intensity 0.6
  - DirectionalLight 1: position (5, 10, 5), intensity 0.4
  - DirectionalLight 2: position (-5, 5, -5), intensity 0.3
```

### Render Order

1. Cube grid (transparent, rendered first)
2. Snake segments (opaque)
3. Apples (opaque, emissive)

### Materials

**Grid Cubes**:
```javascript
MeshStandardMaterial {
  color: user-defined,
  transparent: true,
  opacity: 0.15,
  side: DoubleSide
}
```

**Snake**:
```javascript
MeshStandardMaterial {
  color: user-defined,
  emissive: color,
  emissiveIntensity: 0.2
}
```

**Apples**:
```javascript
MeshStandardMaterial {
  color: user-defined,
  emissive: color,
  emissiveIntensity: 0.3
}
```

## Performance Considerations

### Optimization Strategies

1. **Efficient Cube Grid**:
   - Only render outer shell (not full 15³ cube)
   - Reduces mesh count from 3,375 to 1,350

2. **Snake Rendering**:
   - Remove old meshes before creating new ones
   - Avoid memory leaks

3. **Movement Timing**:
   - Frame-independent movement using timestamps
   - Prevents speed variations across different frame rates

### Target Performance

- **FPS**: 60
- **Mesh Count**: ~1,400 (grid + snake + apples)
- **Draw Calls**: Moderate (not using InstancedMesh due to dynamic positions)

## Data Persistence

### localStorage Keys

1. `cubeSnakeHighScore`: Integer, high score value
2. `cubeSnakeSettings`: JSON string, user settings object

### Settings Schema

```json
{
  "appleCount": 3,
  "gameSpeed": 2,
  "startLength": 3,
  "snakeBodyColor": "#00ff00",
  "snakeHeadColor": "#00cc00",
  "appleColor": "#ff0000",
  "cubeColor": "#ffffff"
}
```

## Edge Cases and Error Handling

### Apple Spawning

- Maximum 100 attempts to find valid position
- Logs warning if no position found (extremely rare)

### Face Transitions

- Comprehensive mapping for all 24 edge transitions (6 faces × 4 edges)
- Fallback to original position if mapping missing

### Direction Changes

- Prevents 180° turns (running into self)
- Input buffering prevents missed inputs during rapid key presses

## Browser Compatibility

**Requirements**:
- WebGL support
- ES6 module support
- localStorage API

**Tested Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Technical Improvements

1. **Rendering Optimization**:
   - Use InstancedMesh for static grid
   - Implement object pooling for snake segments

2. **Physics**:
   - Smooth interpolation between cells
   - Camera follow with smooth transitions

3. **Networking**:
   - WebSocket integration for multiplayer
   - Server-side validation

4. **Audio**:
   - Web Audio API integration
   - Spatial audio based on 3D position

## Dependencies

- **Three.js**: r170 (latest stable)
- **No build tools**: Pure ES6 modules
- **No external libraries**: Vanilla JavaScript only

## Development Notes

- Code follows ES6 module patterns
- Object-oriented architecture with clear separation of concerns
- Event-driven communication between modules
- No framework dependencies for easy understanding and modification
