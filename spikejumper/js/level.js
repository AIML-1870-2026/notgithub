// ── Level Loader ──

import { PHYSICS } from './config.js';
import { LEVELS } from './levelData.js';
import { getState, setState } from './gameState.js';
import { TriangleSpike, MovingBlock, Sawblade, Laser, LowCeiling } from './obstacles.js';
import { Portal, JumpOrb, SpeedZone } from './portals.js';

export function loadLevel(levelIndex) {
    const level = LEVELS[levelIndex];
    if (!level) return;

    const state = getState();
    const obstacles = [];
    const portals = [];
    const jumpOrbs = [];
    const speedZones = [];

    for (const obj of level.objects) {
        switch (obj.type) {
            case 'spike': {
                let y = obj.y;
                if (y === 'ground') {
                    y = PHYSICS.GROUND_Y;
                } else if (y === 'ceiling') {
                    y = PHYSICS.CEILING_Y;
                }
                obstacles.push(new TriangleSpike(obj.x, y, obj.variant, obj.size));
                break;
            }
            case 'moving_block': {
                obstacles.push(new MovingBlock(
                    obj.x, obj.y,
                    obj.w || 60, obj.h || 60,
                    obj.endX, obj.endY,
                    obj.period
                ));
                break;
            }
            case 'sawblade': {
                obstacles.push(new Sawblade(
                    obj.x, obj.y,
                    obj.radius,
                    obj.path,
                    obj.speed
                ));
                break;
            }
            case 'laser': {
                obstacles.push(new Laser(
                    obj.x, obj.y,
                    obj.length, obj.angle,
                    obj.onTime, obj.offTime,
                    obj.phase
                ));
                break;
            }
            case 'low_ceiling': {
                obstacles.push(new LowCeiling(
                    obj.x, obj.y,
                    obj.w || 200, obj.h || 30
                ));
                break;
            }
            case 'jump_orb': {
                jumpOrbs.push(new JumpOrb(obj.x, obj.y, obj.color));
                break;
            }
            case 'portal': {
                portals.push(new Portal(obj.x, obj.ability, obj.color));
                break;
            }
            case 'speed_zone': {
                speedZones.push(new SpeedZone(obj.x, obj.speed));
                break;
            }
            case 'finish': {
                // Store finish line position
                break;
            }
        }
    }

    setState({
        obstacles,
        portals,
        jumpOrbs,
        speedZones,
        baseSpeed: level.baseSpeed,
        currentSpeed: level.baseSpeed,
        levelLength: level.length,
        levelIndex,
        sections: level.sections || [],
        currentSectionIndex: -1,
        zoneBanner: { active: false, timer: 0, name: '', hint: '' }
    });

    return level;
}

export function getLevelName(index) {
    return LEVELS[index]?.name || 'Unknown';
}

export function getLevelCount() {
    return LEVELS.length;
}
