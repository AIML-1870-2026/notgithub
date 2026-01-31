export class FaceNavigator {
    constructor(gridSize = 15) {
        this.gridSize = gridSize;
        this.max = gridSize - 1;

        // Each face is an independent 15x15 grid
        // When crossing an edge, snake wraps to the OPPOSITE edge of the adjacent face
        // This eliminates shared edges entirely
        this.adjacency = {
            FRONT: { top: 'TOP', bottom: 'BOTTOM', left: 'LEFT', right: 'RIGHT' },
            BACK: { top: 'TOP', bottom: 'BOTTOM', left: 'RIGHT', right: 'LEFT' },
            LEFT: { top: 'TOP', bottom: 'BOTTOM', left: 'BACK', right: 'FRONT' },
            RIGHT: { top: 'TOP', bottom: 'BOTTOM', left: 'FRONT', right: 'BACK' },
            TOP: { top: 'BACK', bottom: 'FRONT', left: 'LEFT', right: 'RIGHT' },
            BOTTOM: { top: 'FRONT', bottom: 'BACK', left: 'LEFT', right: 'RIGHT' }
        };
    }

    // Check if position is within bounds
    isInBounds(x, y) {
        return x >= 0 && x <= this.max && y >= 0 && y <= this.max;
    }

    // Handle face transition when crossing an edge
    // Simple wrap: cross one edge, appear at opposite edge of new face
    transition(currentFace, x, y, direction) {
        // Clamp the parallel coordinate to valid range
        const clampedX = Math.max(0, Math.min(this.max, x));
        const clampedY = Math.max(0, Math.min(this.max, y));

        // Check if we crossed an edge
        if (y > this.max) {
            // Crossed top edge → enter new face from bottom (y=0)
            return {
                face: this.adjacency[currentFace].top,
                x: clampedX,
                y: 0,
                direction: { ...direction }
            };
        }

        if (y < 0) {
            // Crossed bottom edge → enter new face from top (y=max)
            return {
                face: this.adjacency[currentFace].bottom,
                x: clampedX,
                y: this.max,
                direction: { ...direction }
            };
        }

        if (x < 0) {
            // Crossed left edge → enter new face from right (x=max)
            return {
                face: this.adjacency[currentFace].left,
                x: this.max,
                y: clampedY,
                direction: { ...direction }
            };
        }

        if (x > this.max) {
            // Crossed right edge → enter new face from left (x=0)
            return {
                face: this.adjacency[currentFace].right,
                x: 0,
                y: clampedY,
                direction: { ...direction }
            };
        }

        // No edge crossed, stay on current face
        return { face: currentFace, x, y, direction: { ...direction } };
    }

    // Get opposite direction (for preventing reverse movement)
    getOppositeDirection(direction) {
        return { x: -direction.x, y: -direction.y };
    }

    // Check if two directions are opposite
    areDirectionsOpposite(dir1, dir2) {
        return dir1.x === -dir2.x && dir1.y === -dir2.y;
    }
}
