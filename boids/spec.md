# Boids Simulation - Project Specification

## Overview

A 2D boids flocking simulation using JavaScript and HTML Canvas. This project implements Craig Reynolds' classic flocking algorithm with additional features including obstacle avoidance, predator/prey dynamics, and interactive controls.

## Features

- **Core Flocking Behaviors** (Reynolds' Rules)
  - Separation: Boids steer away from nearby flockmates
  - Alignment: Boids match velocity with nearby flockmates
  - Cohesion: Boids steer toward the center of nearby flockmates

- **Obstacle Avoidance**: Boids navigate around static obstacles
- **Predator/Prey Dynamics**: Predators chase boids; boids flee from predators
- **Interactive Controls**: Real-time parameter adjustment via sliders and buttons

---

## Project Structure

```
boids/
├── index.html          # Main HTML file with canvas
├── spec.md             # This specification file
├── css/
│   └── style.css       # Styling for UI controls and layout
└── js/
    ├── main.js         # Entry point, initialization, animation loop
    ├── boid.js         # Boid class with flocking behaviors
    ├── predator.js     # Predator class (chases boids)
    ├── obstacle.js     # Obstacle class (static objects to avoid)
    ├── flock.js        # Flock manager (handles all boids)
    ├── vector.js       # 2D Vector utility class
    └── controls.js     # UI controls and parameter management
```

---

## Core Components

### Vector Class (`js/vector.js`)

A 2D vector utility class for position and velocity calculations.

**Methods:**
| Method | Description |
|--------|-------------|
| `add(v)` | Add another vector |
| `subtract(v)` | Subtract another vector |
| `multiply(n)` | Multiply by scalar |
| `divide(n)` | Divide by scalar |
| `magnitude()` | Get vector length |
| `normalize()` | Normalize to unit vector |
| `limit(max)` | Limit magnitude to max |
| `setMagnitude(n)` | Set magnitude to n |
| `static distance(v1, v2)` | Distance between two vectors |

---

### Boid Class (`js/boid.js`)

Individual flocking agent.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `position` | Vector | Current position |
| `velocity` | Vector | Current velocity |
| `acceleration` | Vector | Current acceleration |
| `maxSpeed` | Number | Maximum speed limit |
| `maxForce` | Number | Maximum steering force |
| `perceptionRadius` | Number | Range for detecting neighbors |

**Behaviors:**
| Method | Description |
|--------|-------------|
| `separation(boids)` | Steer away from nearby boids |
| `alignment(boids)` | Match velocity with nearby boids |
| `cohesion(boids)` | Steer toward center of nearby boids |
| `avoidObstacles(obstacles)` | Steer away from obstacles |
| `flee(predators)` | Run away from predators |
| `edges()` | Handle screen wrapping |
| `flock(boids, predators, obstacles)` | Apply all behaviors |
| `update()` | Update position based on velocity |
| `draw(ctx)` | Render as triangle |

---

### Predator Class (`js/predator.js`)

Predator that hunts boids.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `position` | Vector | Current position |
| `velocity` | Vector | Current velocity |
| `acceleration` | Vector | Current acceleration |
| `maxSpeed` | Number | Maximum speed (faster than boids) |
| `huntingRadius` | Number | Range for detecting prey |

**Behaviors:**
| Method | Description |
|--------|-------------|
| `chase(boids)` | Steer toward nearest boid cluster |
| `avoidObstacles(obstacles)` | Navigate around obstacles |
| `edges()` | Handle screen wrapping |
| `update()` | Update position |
| `draw(ctx)` | Render as larger triangle (red) |

---

### Obstacle Class (`js/obstacle.js`)

Static obstacle for boids to avoid.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `position` | Vector | Center position |
| `radius` | Number | Size of obstacle |

**Methods:**
| Method | Description |
|--------|-------------|
| `draw(ctx)` | Render as circle |

---

### Flock Class (`js/flock.js`)

Manager for all simulation entities.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `boids` | Array | All boid instances |
| `predators` | Array | All predator instances |
| `obstacles` | Array | All obstacle instances |

**Methods:**
| Method | Description |
|--------|-------------|
| `run()` | Update and draw all entities |
| `addBoid(x, y)` | Add new boid at position |
| `addPredator(x, y)` | Add new predator at position |
| `addObstacle(x, y, r)` | Add new obstacle |
| `clearObstacles()` | Remove all obstacles |
| `reset()` | Reset entire simulation |

---

### Controls (`js/controls.js`)

UI interaction and parameter management.

**Sliders:**
| Control | Range | Default |
|---------|-------|---------|
| Number of Boids | 10-300 | 100 |
| Max Speed | 1-10 | 4 |
| Perception Radius | 20-150 | 50 |
| Separation Weight | 0-3 | 1.5 |
| Alignment Weight | 0-3 | 1.0 |
| Cohesion Weight | 0-3 | 1.0 |
| Predator Speed | 1-10 | 4.5 |

**Buttons:**
- Add Predator
- Remove Predator
- Clear Obstacles
- Reset Simulation
- Pause/Play

**Mouse Interaction:**
- Click on canvas: Add obstacle
- Shift+Click: Add predator

---

## Algorithms

### Flocking Force Calculation

```
totalForce = separation * separationWeight
           + alignment * alignmentWeight
           + cohesion * cohesionWeight
           + obstacleAvoidance * avoidWeight
           + flee * fleeWeight
```

### Separation Algorithm
1. For each boid within perception radius:
   - Calculate vector pointing away from neighbor
   - Weight by inverse of distance (closer = stronger repulsion)
2. Average all repulsion vectors
3. Normalize and scale by max force

### Alignment Algorithm
1. Calculate average velocity of all boids within perception radius
2. Create steering force toward that average velocity
3. Limit to max force

### Cohesion Algorithm
1. Calculate center of mass of all boids within perception radius
2. Create steering force toward that center
3. Limit to max force

### Obstacle Avoidance
1. For each obstacle within detection range:
   - Calculate perpendicular escape vector
   - Weight by inverse of distance to obstacle surface
2. Sum all escape vectors

### Predator Chase
1. Find center of mass of all boids within hunting radius
2. Steer toward that center
3. Apply with moderate force for realistic pursuit

### Flee Behavior
1. For each predator within flee radius:
   - Calculate vector pointing away from predator
   - Weight by inverse of distance (closer = more urgent)
2. Apply with high weight (survival priority)

---

## Default Parameters

| Parameter | Value |
|-----------|-------|
| Canvas Width | 100% viewport |
| Canvas Height | 100% viewport |
| Initial Boids | 100 |
| Max Speed | 4 |
| Max Force | 0.2 |
| Perception Radius | 50px |
| Separation Weight | 1.5 |
| Alignment Weight | 1.0 |
| Cohesion Weight | 1.0 |
| Predator Speed | 4.5 |
| Predator Hunting Radius | 150px |
| Flee Weight | 2.0 |
| Obstacle Avoidance Weight | 1.5 |

---

## Visual Design

### Boids
- Shape: Triangle pointing in direction of velocity
- Color: Light blue (#4FC3F7)
- Size: 10px length

### Predators
- Shape: Larger triangle
- Color: Red (#F44336)
- Size: 18px length

### Obstacles
- Shape: Circle
- Color: Semi-transparent gray
- Border: Darker gray

### Canvas
- Background: Dark (#1a1a2e)
- Full viewport size
- Responsive to window resize

---

## User Interaction

1. **Adjust Parameters**: Use sliders in control panel
2. **Add Obstacles**: Click anywhere on canvas
3. **Add Predator**: Shift+Click on canvas or use button
4. **Pause/Resume**: Click pause button
5. **Reset**: Click reset button to restore defaults

---

## Performance Considerations

- Target: 60 FPS with 100+ boids
- Optimization strategies if needed:
  - Spatial partitioning (quadtree)
  - Limit neighbor checks
  - RequestAnimationFrame for smooth rendering
