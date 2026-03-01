// ── Player Entity ──

import { PHYSICS, COLORS, CANVAS } from './config.js';
import { getState, getPlayer, setPlayer } from './gameState.js';
import { consumeJumpPress, consumeJumpRelease, isJumpPressed } from './input.js';
import * as particles from './particles.js';

export function updatePlayer(dt, audio) {
    const player = getPlayer();
    const state = getState();
    if (player.dead) return;

    const gravDir = player.gravityFlipped ? -1 : 1;
    const groundY = player.gravityFlipped ? PHYSICS.CEILING_Y : PHYSICS.GROUND_Y - PHYSICS.PLAYER_SIZE;
    const ceilingY = player.gravityFlipped ? PHYSICS.GROUND_Y - PHYSICS.PLAYER_SIZE : PHYSICS.CEILING_Y;

    const worldX = player.x + state.scrollX;

    // Dash timer
    if (player.isDashing) {
        player.dashTimer -= dt;
        if (player.dashTimer <= 0) {
            player.isDashing = false;
            player.dashTimer = 0;
        }
        // Spawn trail particles (world coordinates)
        particles.spawnDashTrail(
            worldX + PHYSICS.PLAYER_SIZE / 2,
            player.y + PHYSICS.PLAYER_SIZE / 2,
            COLORS.PORTAL_DASH
        );
    }

    // Jump input
    if (consumeJumpPress()) {
        if (player.grounded) {
            // Anticipation squash applied for 1 frame then jump
            player.vy = PHYSICS.JUMP_VELOCITY * gravDir;
            player.grounded = false;
            player.targetScaleX = 0.75;
            player.targetScaleY = 1.35;
            if (audio) audio.play('jump');
            particles.spawnDust(worldX + PHYSICS.PLAYER_SIZE / 2, player.gravityFlipped ? player.y : player.y + PHYSICS.PLAYER_SIZE);
        } else if (player.nearJumpOrb) {
            // Orb-based jump: only works when near a jump orb
            const orb = player.nearJumpOrb;
            orb.used = true;
            player.nearJumpOrb = null;
            player.vy = PHYSICS.JUMP_VELOCITY * gravDir;
            player.targetScaleX = 0.7;
            player.targetScaleY = 1.4;
            if (audio) audio.play('double_jump');
            particles.spawnBurst(
                orb.x,
                orb.y,
                10, COLORS.PORTAL_DOUBLE_JUMP,
                { speed: 150, life: 0.4, size: 4 }
            );
        }
    }

    // Short hop: cut velocity when space released
    if (consumeJumpRelease()) {
        if (!player.gravityFlipped && player.vy < PHYSICS.SHORT_HOP_CUTOFF) {
            player.vy = PHYSICS.SHORT_HOP_CUTOFF;
        } else if (player.gravityFlipped && player.vy > -PHYSICS.SHORT_HOP_CUTOFF) {
            player.vy = -PHYSICS.SHORT_HOP_CUTOFF;
        }
    }

    // Gravity
    player.vy += PHYSICS.GRAVITY * gravDir * dt;

    // Terminal velocity
    if (!player.gravityFlipped) {
        player.vy = Math.min(player.vy, PHYSICS.TERMINAL_VELOCITY);
    } else {
        player.vy = Math.max(player.vy, -PHYSICS.TERMINAL_VELOCITY);
    }

    // Move
    player.y += player.vy * dt;

    // Ground collision
    if (!player.gravityFlipped) {
        if (player.y >= groundY) {
            if (!player.grounded) {
                // Landing
                player.targetScaleX = 1.3;
                player.targetScaleY = 0.7;
                if (audio) audio.play('land');
                particles.spawnDust(worldX + PHYSICS.PLAYER_SIZE / 2, groundY + PHYSICS.PLAYER_SIZE);
            }
            player.y = groundY;
            player.vy = 0;
            player.grounded = true;
        }
    } else {
        if (player.y <= groundY) {
            if (!player.grounded) {
                player.targetScaleX = 1.3;
                player.targetScaleY = 0.7;
                if (audio) audio.play('land');
                particles.spawnDust(worldX + PHYSICS.PLAYER_SIZE / 2, groundY);
            }
            player.y = groundY;
            player.vy = 0;
            player.grounded = true;
        }
    }

    // Ceiling collision (normal gravity)
    if (!player.gravityFlipped && player.y < ceilingY) {
        player.y = ceilingY;
        player.vy = 0;
    } else if (player.gravityFlipped && player.y > ceilingY) {
        player.y = ceilingY;
        player.vy = 0;
    }

    // Squash/stretch spring
    player.scaleX += (player.targetScaleX - player.scaleX) * Math.min(1, PHYSICS.SQUASH_SPRING * dt);
    player.scaleY += (player.targetScaleY - player.scaleY) * Math.min(1, PHYSICS.SQUASH_SPRING * dt);
    player.targetScaleX += (1 - player.targetScaleX) * Math.min(1, PHYSICS.SQUASH_SPRING * 0.5 * dt);
    player.targetScaleY += (1 - player.targetScaleY) * Math.min(1, PHYSICS.SQUASH_SPRING * 0.5 * dt);

    // Eye look direction
    if (player.grounded) {
        player.eyeLookX = 0.3;
        player.eyeLookY = 0;
    } else if (player.vy * gravDir < 0) {
        player.eyeLookX = 0.2;
        player.eyeLookY = -0.4 * gravDir;
    } else {
        player.eyeLookX = 0.2;
        player.eyeLookY = 0.3 * gravDir;
    }

    // Keep rotation at 0 (no spinning)
    player.rotation = 0;
}

export function renderPlayer(ctx, cameraX) {
    const player = getPlayer();
    // Player is always at fixed screen position (not affected by camera scroll)
    const sx = player.x;
    const size = PHYSICS.PLAYER_SIZE;
    const cx = sx + size / 2;
    const cy = player.y + size / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // Rotation
    ctx.rotate(player.rotation);

    // Squash/stretch
    const sX = player.scaleX;
    const sY = player.scaleY * (player.gravityFlipped ? -1 : 1);
    ctx.scale(sX, sY);

    // Dash visual: squish horizontally
    if (player.isDashing) {
        ctx.scale(1.3, 0.6);
    }

    const hs = size / 2;

    // Shadow
    ctx.fillStyle = 'rgba(68, 136, 255, 0.15)';
    ctx.fillRect(-hs + 3, -hs + 3, size, size);

    // Body
    const bodyGrad = ctx.createLinearGradient(-hs, -hs, hs, hs);
    bodyGrad.addColorStop(0, '#5599ff');
    bodyGrad.addColorStop(1, COLORS.PLAYER);
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(-hs, -hs, size, size);

    // Border
    ctx.strokeStyle = '#6aadff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-hs, -hs, size, size);

    // Inner detail
    ctx.strokeStyle = 'rgba(100, 170, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-hs + 4, -hs + 4, size - 8, size - 8);

    // Eyes
    if (!player.dead) {
        _renderEyes(ctx, player, size);
    } else {
        _renderDeadEyes(ctx, size);
    }

    ctx.restore();

    // Dash trail glow
    if (player.isDashing) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.shadowColor = COLORS.PORTAL_DASH;
        ctx.shadowBlur = 20;
        ctx.fillStyle = COLORS.PORTAL_DASH;
        ctx.fillRect(sx - 10, player.y + size * 0.2, 10, size * 0.6);
        ctx.restore();
    }
}

function _renderEyes(ctx, player, size) {
    const hs = size / 2;
    const eyeSize = size * 0.22;
    const pupilSize = eyeSize * 0.55;
    const eyeY = -hs * 0.3;
    const eyeSpacing = size * 0.28;

    // Left eye white
    ctx.fillStyle = COLORS.PLAYER_EYE_WHITE;
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Right eye white
    ctx.beginPath();
    ctx.arc(eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = COLORS.PLAYER_EYE_PUPIL;
    const lookX = player.eyeLookX * eyeSize * 0.5;
    const lookY = player.eyeLookY * eyeSize * 0.5;

    ctx.beginPath();
    ctx.arc(-eyeSpacing + lookX, eyeY + lookY, pupilSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(eyeSpacing + lookX, eyeY + lookY, pupilSize, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const shineSize = pupilSize * 0.35;
    ctx.beginPath();
    ctx.arc(-eyeSpacing + lookX - pupilSize * 0.25, eyeY + lookY - pupilSize * 0.3, shineSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing + lookX - pupilSize * 0.25, eyeY + lookY - pupilSize * 0.3, shineSize, 0, Math.PI * 2);
    ctx.fill();
}

function _renderDeadEyes(ctx, size) {
    const hs = size / 2;
    const eyeY = -hs * 0.3;
    const eyeSpacing = size * 0.28;
    const xSize = size * 0.15;

    ctx.strokeStyle = COLORS.PLAYER_DEAD_EYE;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    // Left X
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - xSize, eyeY - xSize);
    ctx.lineTo(-eyeSpacing + xSize, eyeY + xSize);
    ctx.moveTo(-eyeSpacing + xSize, eyeY - xSize);
    ctx.lineTo(-eyeSpacing - xSize, eyeY + xSize);
    ctx.stroke();

    // Right X
    ctx.beginPath();
    ctx.moveTo(eyeSpacing - xSize, eyeY - xSize);
    ctx.lineTo(eyeSpacing + xSize, eyeY + xSize);
    ctx.moveTo(eyeSpacing + xSize, eyeY - xSize);
    ctx.lineTo(eyeSpacing - xSize, eyeY + xSize);
    ctx.stroke();
}

export function getPlayerBounds() {
    const player = getPlayer();
    const state = getState();
    const f = PHYSICS.COLLISION_FORGIVENESS;
    const size = PHYSICS.PLAYER_SIZE;
    const margin = size * (1 - f) / 2;
    // Convert to world coordinates by adding scrollX
    const worldX = player.x + state.scrollX;

    // Dash: smaller hitbox
    if (player.isDashing) {
        const h = size * 0.5;
        return {
            x: worldX + margin,
            y: player.y + size - h + margin / 2,
            w: size * f,
            h: h * f
        };
    }

    return {
        x: worldX + margin,
        y: player.y + margin,
        w: size * f,
        h: size * f
    };
}
