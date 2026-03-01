// ── Reachability Calculator ──
// Utility for level design: determines what heights and positions
// the player can reach given the physics constants.
//
// Usage: call validateLevel() from the browser console to check
// all jump orb placements. Import and use getJumpArc() to compute
// exact trajectories for obstacle and orb placement.

import { PHYSICS } from './config.js';

// Returns the player's Y position (top of sprite) at time t after jumping
// from groundY with full jump velocity.
function playerYAtTime(t, groundY, jumpVelocity, gravity) {
    return groundY + jumpVelocity * t + 0.5 * gravity * t * t;
}

// Returns key metrics about the player's jump arc.
export function getJumpMetrics(scrollSpeed = 420) {
    const groundY = PHYSICS.GROUND_Y - PHYSICS.PLAYER_SIZE; // 544
    const vy = PHYSICS.JUMP_VELOCITY;   // -700
    const g = PHYSICS.GRAVITY;          // 2400
    const halfSize = PHYSICS.PLAYER_SIZE / 2; // 18

    // Time to reach peak height (vy + g * t = 0)
    const timeToPeak = -vy / g;

    // Peak Y (top of sprite)
    const peakY = playerYAtTime(timeToPeak, groundY, vy, g);

    // Peak Y (center of sprite)
    const peakCenterY = peakY + halfSize;

    // Total air time (land back on ground)
    const totalAirTime = -2 * vy / g;

    // Horizontal distance covered during full jump
    const jumpDistance = scrollSpeed * totalAirTime;

    // Short hop metrics (velocity cut to SHORT_HOP_CUTOFF)
    const shortHopVy = PHYSICS.SHORT_HOP_CUTOFF; // -350
    const shortHopTimeToPeak = -shortHopVy / g;
    const shortHopPeakY = groundY + shortHopVy * shortHopTimeToPeak + 0.5 * g * shortHopTimeToPeak * shortHopTimeToPeak;

    return {
        groundY,            // 544 - player top when on ground
        groundCenterY: groundY + halfSize,  // 562
        peakY,              // ~442 - highest point (player top)
        peakCenterY,        // ~460 - highest point (player center)
        timeToPeak,         // ~0.292s
        totalAirTime,       // ~0.583s
        jumpDistance,        // ~245px at 420 speed
        maxJumpHeight: groundY - peakY,  // ~102px
        shortHopPeakY,      // ~518 (player top)
        shortHopPeakCenterY: shortHopPeakY + halfSize
    };
}

// Returns the player center Y at a given horizontal offset from jump start.
// Returns null if the offset is beyond the jump distance.
export function getPlayerCenterYAtOffset(xOffset, scrollSpeed = 420) {
    const groundY = PHYSICS.GROUND_Y - PHYSICS.PLAYER_SIZE;
    const vy = PHYSICS.JUMP_VELOCITY;
    const g = PHYSICS.GRAVITY;
    const halfSize = PHYSICS.PLAYER_SIZE / 2;

    const t = xOffset / scrollSpeed;
    const totalAirTime = -2 * vy / g;

    if (t < 0 || t > totalAirTime) return null;

    const y = playerYAtTime(t, groundY, vy, g);
    return y + halfSize; // center Y
}

// Checks if a jump orb at (orbX, orbY) is reachable from a jump starting
// at jumpStartX. Accounts for activation radius.
// Returns { reachable, closestDistance, bestTime, playerCenterYAtBest }
export function isOrbReachable(orbX, orbY, jumpStartX, scrollSpeed = 420, activationRadius = 50) {
    const groundY = PHYSICS.GROUND_Y - PHYSICS.PLAYER_SIZE;
    const vy = PHYSICS.JUMP_VELOCITY;
    const g = PHYSICS.GRAVITY;
    const halfSize = PHYSICS.PLAYER_SIZE / 2;
    const totalAirTime = -2 * vy / g;

    // The player's world X at time t = jumpStartX + scrollSpeed * t
    // We want to find when distance to orb is minimized
    // Player center at time t: (jumpStartX + speed*t, groundY + vy*t + 0.5*g*t² + halfSize)

    let closestDist = Infinity;
    let bestTime = 0;
    let bestPlayerY = 0;

    // Sample the trajectory
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * totalAirTime;
        const px = jumpStartX + scrollSpeed * t;
        const py = playerYAtTime(t, groundY, vy, g) + halfSize;

        const dx = px - orbX;
        const dy = py - orbY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < closestDist) {
            closestDist = dist;
            bestTime = t;
            bestPlayerY = py;
        }
    }

    return {
        reachable: closestDist <= activationRadius,
        closestDistance: Math.round(closestDist),
        bestTime: Math.round(bestTime * 1000) / 1000,
        playerCenterYAtBest: Math.round(bestPlayerY)
    };
}

// Find the best jump start X for reaching an orb.
// The player can only jump when grounded, so jump start X is wherever
// the player happens to be when they press jump.
// Returns the optimal jump start X and whether the orb is reachable.
export function findBestJumpStart(orbX, orbY, scrollSpeed = 420, activationRadius = 50) {
    const totalAirTime = -2 * PHYSICS.JUMP_VELOCITY / PHYSICS.GRAVITY;
    const jumpDistance = scrollSpeed * totalAirTime;

    // Player must jump before reaching the orb (within one jump distance)
    // Try different start positions
    let bestResult = null;

    for (let startOffset = 0; startOffset <= jumpDistance; startOffset += 5) {
        const jumpStartX = orbX - startOffset;
        const result = isOrbReachable(orbX, orbY, jumpStartX, scrollSpeed, activationRadius);
        if (!bestResult || result.closestDistance < bestResult.closestDistance) {
            bestResult = { ...result, jumpStartX: Math.round(jumpStartX) };
        }
    }

    return bestResult;
}

// Suggests a good Y position for an orb at a given X, reachable from
// a jump starting at jumpStartX. Places it in the upper-middle of the arc.
export function suggestOrbY(orbX, jumpStartX, scrollSpeed = 420) {
    const xOffset = orbX - jumpStartX;
    const centerY = getPlayerCenterYAtOffset(xOffset, scrollSpeed);
    if (centerY === null) return null;
    return Math.round(centerY);
}

// Validates all jump orbs in a level's object array.
// Logs warnings for unreachable orbs and suggests fixes.
export function validateLevel(levelObjects, scrollSpeed = 420) {
    const metrics = getJumpMetrics(scrollSpeed);
    const activationRadius = 50;

    console.group('Level Reachability Report');
    console.log('Jump Metrics:', {
        'Ground Y (player top)': metrics.groundY,
        'Peak Y (player center)': metrics.peakCenterY,
        'Max jump height': metrics.maxJumpHeight + 'px',
        'Jump distance': Math.round(metrics.jumpDistance) + 'px',
        'Air time': Math.round(metrics.totalAirTime * 1000) + 'ms',
        'Activation radius': activationRadius + 'px',
        'Reachable orb Y range': `${Math.round(metrics.peakCenterY - activationRadius)} - ${Math.round(metrics.groundCenterY + activationRadius)}`
    });

    const orbs = levelObjects.filter(o => o.type === 'jump_orb');

    for (const orb of orbs) {
        const best = findBestJumpStart(orb.x, orb.y, scrollSpeed, activationRadius);
        if (best.reachable) {
            console.log(`  Orb at (${orb.x}, ${orb.y}): REACHABLE (jump from x=${best.jumpStartX}, closest=${best.closestDistance}px)`);
        } else {
            const suggestedY = suggestOrbY(orb.x, best.jumpStartX, scrollSpeed);
            console.warn(`  Orb at (${orb.x}, ${orb.y}): UNREACHABLE (closest=${best.closestDistance}px). Suggested Y: ${suggestedY}`);
        }
    }

    console.groupEnd();
    return metrics;
}

// Expose to browser console for level design
if (typeof window !== 'undefined') {
    window.reachability = {
        getJumpMetrics,
        getPlayerCenterYAtOffset,
        isOrbReachable,
        findBestJumpStart,
        suggestOrbY,
        validateLevel
    };
}
