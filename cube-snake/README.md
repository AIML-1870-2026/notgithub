# 3D Cube Snake

A minimalistic 3D snake game played on the surface of a transparent cube. Navigate the snake across all six faces of the cube in a unique twist on the classic snake game.

## Features

- **3D Cube Navigation**: Snake moves seamlessly across all 6 faces of a cube
- **Transparent Grid Design**: Hollow cube made of transparent small cubes showing a clear 3D structure
- **Customizable Settings**:
  - Number of apples (1-10)
  - Game speed (Slow, Medium, Fast)
  - Starting snake length (3-10)
  - Custom colors for snake body, snake head, apples, and cube grid
- **Score Tracking**: Current score and high score (persisted in localStorage)
- **Minimalist UI**: Clean, modern interface with smooth animations
- **Responsive Controls**: Arrow keys or WASD for movement

## How to Play

### Starting the Game

1. Open `index.html` in a web browser using a local web server
2. Click "Start Game" to begin
3. Configure settings if desired before starting

### Controls

- **Arrow Keys** or **WASD**: Move the snake (Up, Down, Left, Right)
- **Space** or **Escape**: Pause/Resume game
- **R**: Restart game

### Gameplay

- Eat apples (red cubes) to grow longer and increase your score
- Avoid running into yourself
- The snake can move across all 6 faces of the cube seamlessly
- The game gets more challenging as the snake grows longer

## Running the Game

This project uses ES6 modules and requires a local web server to run. You cannot simply open the `index.html` file directly in a browser.

### Option 1: Python HTTP Server

```bash
# Navigate to the cube-snake directory
cd cube-snake

# Python 3
python3 -m http.server 8000

# Then open http://localhost:8000 in your browser
```

### Option 2: VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 3: Node.js HTTP Server

```bash
# Install http-server globally
npm install -g http-server

# Run in the cube-snake directory
http-server

# Then open the provided local URL in your browser
```

## Technical Details

### Technology Stack

- **Three.js**: 3D rendering and graphics
- **Vanilla JavaScript**: ES6 modules for game logic
- **HTML5/CSS3**: UI and styling

### Architecture

The game is structured with modular components:

- **main.js**: Entry point, scene setup, and game loop
- **Cube.js**: 15x15 grid system on each cube face
- **Snake.js**: Snake logic, movement, and rendering
- **FaceNavigator.js**: Handles transitions between cube faces
- **AppleManager.js**: Apple spawning and collection
- **GameState.js**: State management (menu, playing, paused, game over)
- **Controls.js**: Keyboard input handling
- **UI.js**: User interface and settings management

### Performance

- Uses `InstancedMesh` where possible for efficient rendering
- Target: 60 FPS
- Grid: 15x15 cells per face (225 cells × 6 faces = 1,350 total cells)

## Customization

### Settings Panel

Access the settings panel from the main menu or while paused:

1. **Number of Apples**: Control difficulty by spawning 1-10 apples simultaneously
2. **Game Speed**: Adjust how quickly the snake moves
3. **Starting Length**: Begin with a longer or shorter snake
4. **Colors**: Customize the visual appearance of all game elements

Settings are automatically saved to localStorage and persist between sessions.

## Browser Compatibility

- Chrome/Edge: Fully supported
- Firefox: Fully supported
- Safari: Fully supported
- Requires WebGL support

## Project Structure

```
cube-snake/
├── index.html           # Main HTML file
├── style.css            # Minimalist styling
├── src/
│   ├── main.js          # Game initialization and loop
│   ├── Cube.js          # Cube grid system
│   ├── Snake.js         # Snake mechanics
│   ├── FaceNavigator.js # Face transition logic
│   ├── AppleManager.js  # Apple management
│   ├── GameState.js     # Game state handling
│   ├── Controls.js      # Input handling
│   └── UI.js            # User interface
├── README.md            # This file
└── spec.md              # Technical specification
```

## Future Enhancements

Potential features for future versions:

- Obstacles on cube faces
- Multiple difficulty levels with increasing speed
- Sound effects and background music
- Multiplayer mode
- Leaderboard system
- Power-ups (slow down, invincibility, etc.)
- Camera rotation controls
- Mobile touch controls

## License

This project is created for educational purposes.

## Author

Created as part of AIML1870 coursework at UNO.
