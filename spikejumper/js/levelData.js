// ── Level Data ──

export const LEVELS = [
    {
        name: "Neon Genesis",
        author: "notgithub",
        bpm: 120,
        baseSpeed: 420,
        length: 14000,
        bgColor: '#1a1a3e',
        sections: [
            { x: 0,     name: "TUTORIAL",       hint: "Jump over spikes" },
            { x: 2500,  name: "JUMP ORBS",      hint: "Tap mid-air to boost" },
            { x: 4500,  name: "SPEED UP",       hint: "Watch for moving blocks" },
            { x: 7000,  name: "GRAVITY FLIP",   hint: "Everything is upside down" },
            { x: 9000,  name: "SAWBLADES",      hint: "Dodge the spinning blades" },
            { x: 11000, name: "DASH",           hint: "Stay low — don't jump!" },
            { x: 12500, name: "FINALE",         hint: "Walk under lasers, jump between" }
        ],
        objects: [
            // ═══════════════════════════════════════
            // Section 1: Tutorial (0-2500) - Basic spikes
            // ═══════════════════════════════════════
            { type: 'spike', x: 900, y: 'ground', variant: 'up' },

            { type: 'spike', x: 1400, y: 'ground', variant: 'up' },
            { type: 'spike', x: 1460, y: 'ground', variant: 'up' },

            { type: 'spike', x: 2000, y: 'ground', variant: 'up' },
            { type: 'spike', x: 2060, y: 'ground', variant: 'up' },
            { type: 'spike', x: 2120, y: 'ground', variant: 'up' },

            // ═══════════════════════════════════════
            // Section 2: Jump Orbs (2500-4500)
            // Reachability: player center peaks at y=460,
            // orbs reachable within 50px → orb y >= 410.
            // From orb at y=480, second jump peaks at y=360 (top).
            // ═══════════════════════════════════════

            { type: 'spike', x: 3000, y: 'ground', variant: 'up' },
            { type: 'spike', x: 3060, y: 'ground', variant: 'up' },
            { type: 'spike', x: 3120, y: 'ground', variant: 'up' },
            { type: 'spike', x: 3180, y: 'ground', variant: 'up' },
            // Jump orb mid-arc to clear the wide spike gap
            { type: 'jump_orb', x: 3050, y: 490 },

            // Floating spikes - orb placed in reachable arc,
            // second jump clears the spikes at y=420
            { type: 'spike', x: 3500, y: 420, variant: 'floating' },
            { type: 'spike', x: 3560, y: 420, variant: 'floating' },
            { type: 'jump_orb', x: 3400, y: 480 },

            { type: 'spike', x: 3900, y: 'ground', variant: 'up' },
            { type: 'spike', x: 3960, y: 'ground', variant: 'up' },
            { type: 'spike', x: 4020, y: 'ground', variant: 'up' },
            { type: 'spike', x: 4080, y: 'ground', variant: 'up' },
            { type: 'spike', x: 4140, y: 'ground', variant: 'up' },
            // Orb to clear the long spike run
            { type: 'jump_orb', x: 4020, y: 490 },

            // ═══════════════════════════════════════
            // Section 3: Speed Up + Moving Blocks (4500-7000)
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 4600, speed: 560 },

            { type: 'moving_block', x: 5000, y: 450, w: 70, h: 70, endX: 5000, endY: 250, period: 2.5 },
            { type: 'spike', x: 5200, y: 'ground', variant: 'up' },
            { type: 'spike', x: 5260, y: 'ground', variant: 'up' },

            { type: 'moving_block', x: 5600, y: 300, w: 80, h: 40, endX: 5600, endY: 500, period: 2.0 },
            { type: 'moving_block', x: 5800, y: 500, w: 80, h: 40, endX: 5800, endY: 300, period: 2.0 },

            { type: 'spike', x: 6100, y: 'ground', variant: 'up' },
            { type: 'spike', x: 6160, y: 'ground', variant: 'up' },
            { type: 'spike', x: 6220, y: 'ground', variant: 'up' },

            { type: 'moving_block', x: 6500, y: 400, w: 100, h: 50, endX: 6500, endY: 200, period: 3.0 },

            // ═══════════════════════════════════════
            // Section 4: Gravity Flip (7000-9000)
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 7000, speed: 420 },
            { type: 'portal', x: 7100, ability: 'gravity_flip' },

            // Ceiling spikes (player is now on ceiling)
            { type: 'spike', x: 7500, y: 'ceiling', variant: 'down' },
            { type: 'spike', x: 7560, y: 'ceiling', variant: 'down' },

            { type: 'spike', x: 7900, y: 'ceiling', variant: 'down' },
            { type: 'spike', x: 7960, y: 'ceiling', variant: 'down' },
            { type: 'spike', x: 8020, y: 'ceiling', variant: 'down' },

            { type: 'spike', x: 8400, y: 'ground', variant: 'up' },
            { type: 'spike', x: 8460, y: 'ground', variant: 'up' },

            // Flip back to normal
            { type: 'portal', x: 8700, ability: 'gravity_normal' },

            // ═══════════════════════════════════════
            // Section 5: Sawblades (9000-11000)
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 9100, speed: 480 },

            { type: 'sawblade', x: 9400, y: 400, radius: 28, path: [{x: 9400, y: 400}, {x: 9400, y: 250}], speed: 0.8 },

            { type: 'spike', x: 9700, y: 'ground', variant: 'up' },
            { type: 'spike', x: 9760, y: 'ground', variant: 'up' },

            { type: 'sawblade', x: 10100, y: 350, radius: 32, path: [{x: 10100, y: 350}, {x: 10100, y: 200}, {x: 10100, y: 350}, {x: 10100, y: 500}], speed: 1.0 },

            { type: 'spike', x: 10400, y: 'ground', variant: 'up' },
            { type: 'sawblade', x: 10600, y: 300, radius: 25, path: null, speed: 0 },

            // ═══════════════════════════════════════
            // Section 6: Dash (11000-12500)
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 11000, speed: 420 },
            { type: 'portal', x: 11100, ability: 'dash' },

            { type: 'low_ceiling', x: 11150, y: 380, w: 400, h: 175 },

            { type: 'spike', x: 11900, y: 'ground', variant: 'up' },
            { type: 'spike', x: 11960, y: 'ground', variant: 'up' },
            { type: 'spike', x: 12020, y: 'ground', variant: 'up' },

            // ═══════════════════════════════════════
            // Section 7: Lasers + Finale (12500-14000)
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 12500, speed: 520 },

            { type: 'laser', x: 12700, y: 80, length: 420, angle: 90, onTime: 0.5, offTime: 2.0, phase: 0.5 },

            { type: 'spike', x: 12900, y: 'ground', variant: 'up' },
            { type: 'spike', x: 12960, y: 'ground', variant: 'up' },

            { type: 'laser', x: 13100, y: 80, length: 420, angle: 90, onTime: 0.5, offTime: 2.0, phase: 0.8 },

            { type: 'spike', x: 13300, y: 'ground', variant: 'up' },
            { type: 'spike', x: 13360, y: 'ground', variant: 'up' },
            { type: 'spike', x: 13420, y: 'ground', variant: 'up' },

            { type: 'sawblade', x: 13600, y: 350, radius: 26, path: [{x: 13600, y: 350}, {x: 13600, y: 250}], speed: 1.2 },

            // Finish line
            { type: 'finish', x: 14000 }
        ]
    },

    // ═══════════════════════════════════════════════════
    // LEVEL 2: Cyber Drift (Medium)
    // Base speed 440, length 12000
    // Jump covers ~256px at 440, ~240px at 480
    // ═══════════════════════════════════════════════════
    {
        name: "Cyber Drift",
        author: "notgithub",
        bpm: 128,
        baseSpeed: 440,
        length: 12000,
        bgColor: '#1e2a1e',
        sections: [
            { x: 0,     name: "WARM UP",        hint: "Get in the groove" },
            { x: 2000,  name: "MOVING MAZE",    hint: "Dodge the sliding blocks" },
            { x: 4000,  name: "ORB CHAINS",     hint: "Chain orb jumps to survive" },
            { x: 6000,  name: "SAW GAUNTLET",   hint: "Thread through the blades" },
            { x: 8500,  name: "FLIP ZONE",      hint: "Gravity gets weird" },
            { x: 10500, name: "SPEED FINALE",   hint: "Hold on tight!" }
        ],
        objects: [
            // ═══════════════════════════════════════
            // Section 1: Warm Up (0-2000)
            // ═══════════════════════════════════════
            { type: 'spike', x: 700, y: 'ground', variant: 'up' },

            { type: 'spike', x: 1100, y: 'ground', variant: 'up' },
            { type: 'spike', x: 1160, y: 'ground', variant: 'up' },

            { type: 'spike', x: 1500, y: 'ground', variant: 'up' },
            { type: 'spike', x: 1560, y: 'ground', variant: 'up' },
            { type: 'spike', x: 1620, y: 'ground', variant: 'up' },

            { type: 'spike', x: 1900, y: 'ground', variant: 'up' },

            // ═══════════════════════════════════════
            // Section 2: Moving Maze (2000-4000)
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 2100, speed: 480 },

            // Vertical moving block — time your passage
            { type: 'moving_block', x: 2400, y: 500, w: 70, h: 60, endX: 2400, endY: 300, period: 2.0 },

            { type: 'spike', x: 2700, y: 'ground', variant: 'up' },
            { type: 'spike', x: 2760, y: 'ground', variant: 'up' },

            // Two blocks alternating vertically
            { type: 'moving_block', x: 3100, y: 280, w: 80, h: 50, endX: 3100, endY: 480, period: 2.2 },
            { type: 'moving_block', x: 3350, y: 480, w: 80, h: 50, endX: 3350, endY: 280, period: 2.2 },

            { type: 'spike', x: 3600, y: 'ground', variant: 'up' },
            { type: 'spike', x: 3660, y: 'ground', variant: 'up' },
            { type: 'spike', x: 3720, y: 'ground', variant: 'up' },

            // Wide block sweeping low
            { type: 'moving_block', x: 3900, y: 450, w: 120, h: 40, endX: 3900, endY: 250, period: 2.5 },

            // ═══════════════════════════════════════
            // Section 3: Orb Chains (4000-6000)
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 4100, speed: 440 },

            // Wide spike field + orb to extend jump
            { type: 'spike', x: 4400, y: 'ground', variant: 'up' },
            { type: 'spike', x: 4460, y: 'ground', variant: 'up' },
            { type: 'spike', x: 4520, y: 'ground', variant: 'up' },
            { type: 'spike', x: 4580, y: 'ground', variant: 'up' },
            { type: 'jump_orb', x: 4490, y: 490 },

            // Floating spikes — orb to go over
            { type: 'spike', x: 4900, y: 430, variant: 'floating' },
            { type: 'spike', x: 4960, y: 430, variant: 'floating' },
            { type: 'jump_orb', x: 4850, y: 480 },

            // Double orb chain: ground spikes → orb → floating spikes → orb
            { type: 'spike', x: 5300, y: 'ground', variant: 'up' },
            { type: 'spike', x: 5360, y: 'ground', variant: 'up' },
            { type: 'spike', x: 5420, y: 'ground', variant: 'up' },
            { type: 'spike', x: 5480, y: 'ground', variant: 'up' },
            { type: 'spike', x: 5540, y: 'ground', variant: 'up' },
            { type: 'jump_orb', x: 5400, y: 490 },
            { type: 'spike', x: 5600, y: 400, variant: 'floating' },
            { type: 'jump_orb', x: 5560, y: 430 },

            { type: 'spike', x: 5900, y: 'ground', variant: 'up' },
            { type: 'spike', x: 5960, y: 'ground', variant: 'up' },

            // ═══════════════════════════════════════
            // Section 4: Saw Gauntlet (6000-8500)
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 6100, speed: 460 },

            // Sawblade bouncing vertically
            { type: 'sawblade', x: 6400, y: 420, radius: 26, path: [{x: 6400, y: 420}, {x: 6400, y: 250}], speed: 0.9 },

            { type: 'spike', x: 6700, y: 'ground', variant: 'up' },
            { type: 'spike', x: 6760, y: 'ground', variant: 'up' },

            // Two sawblades alternating heights
            { type: 'sawblade', x: 7100, y: 300, radius: 28, path: [{x: 7100, y: 300}, {x: 7100, y: 480}], speed: 0.7 },
            { type: 'sawblade', x: 7400, y: 480, radius: 28, path: [{x: 7400, y: 480}, {x: 7400, y: 300}], speed: 0.7 },

            { type: 'spike', x: 7700, y: 'ground', variant: 'up' },
            { type: 'spike', x: 7760, y: 'ground', variant: 'up' },
            { type: 'spike', x: 7820, y: 'ground', variant: 'up' },

            // Static sawblade at mid-height + ground spikes
            { type: 'sawblade', x: 8100, y: 350, radius: 30, path: null, speed: 0 },
            { type: 'spike', x: 8100, y: 'ground', variant: 'up' },
            { type: 'spike', x: 8160, y: 'ground', variant: 'up' },

            // Fast vertical sawblade
            { type: 'sawblade', x: 8400, y: 400, radius: 24, path: [{x: 8400, y: 400}, {x: 8400, y: 200}], speed: 1.2 },

            // ═══════════════════════════════════════
            // Section 5: Flip Zone (8500-10500)
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 8600, speed: 420 },
            { type: 'portal', x: 8700, ability: 'gravity_flip' },

            // Ceiling spikes while flipped
            { type: 'spike', x: 9000, y: 'ceiling', variant: 'down' },
            { type: 'spike', x: 9060, y: 'ceiling', variant: 'down' },

            { type: 'spike', x: 9400, y: 'ceiling', variant: 'down' },
            { type: 'spike', x: 9460, y: 'ceiling', variant: 'down' },
            { type: 'spike', x: 9520, y: 'ceiling', variant: 'down' },

            // Ground spikes to dodge while on ceiling
            { type: 'spike', x: 9800, y: 'ground', variant: 'up' },
            { type: 'spike', x: 9860, y: 'ground', variant: 'up' },

            // Flip back
            { type: 'portal', x: 10100, ability: 'gravity_normal' },

            // Landing spikes — jump immediately!
            { type: 'spike', x: 10300, y: 'ground', variant: 'up' },
            { type: 'spike', x: 10360, y: 'ground', variant: 'up' },

            // ═══════════════════════════════════════
            // Section 6: Speed Finale (10500-12000)
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 10600, speed: 540 },

            { type: 'spike', x: 10800, y: 'ground', variant: 'up' },
            { type: 'spike', x: 10860, y: 'ground', variant: 'up' },

            { type: 'sawblade', x: 11100, y: 380, radius: 26, path: [{x: 11100, y: 380}, {x: 11100, y: 250}], speed: 1.0 },

            { type: 'spike', x: 11300, y: 'ground', variant: 'up' },
            { type: 'spike', x: 11360, y: 'ground', variant: 'up' },
            { type: 'spike', x: 11420, y: 'ground', variant: 'up' },

            { type: 'moving_block', x: 11600, y: 400, w: 80, h: 60, endX: 11600, endY: 250, period: 1.8 },

            { type: 'spike', x: 11800, y: 'ground', variant: 'up' },
            { type: 'spike', x: 11860, y: 'ground', variant: 'up' },

            // Finish line
            { type: 'finish', x: 12000 }
        ]
    },

    // ═══════════════════════════════════════════════════
    // LEVEL 3: Void Runner (Hard)
    // Base speed 480, length 16000
    // Jump covers ~280px at 480, ~310px at 520
    // ═══════════════════════════════════════════════════
    {
        name: "Void Runner",
        author: "notgithub",
        bpm: 140,
        baseSpeed: 480,
        length: 16000,
        bgColor: '#2a1a1a',
        sections: [
            { x: 0,     name: "NO MERCY",       hint: "Triple spikes from the start" },
            { x: 2500,  name: "BLADE DANCE",    hint: "Weave through the saws" },
            { x: 5000,  name: "UPSIDE DOWN",    hint: "Extended gravity madness" },
            { x: 7500,  name: "LASER HALL",     hint: "Walk low, jump between beams" },
            { x: 10000, name: "DASH GAUNTLET",  hint: "Stay low through the gaps" },
            { x: 12000, name: "ORB ASCENT",     hint: "Chain jumps through the sky" },
            { x: 14000, name: "CHAOS",          hint: "Everything at once — survive!" }
        ],
        objects: [
            // ═══════════════════════════════════════
            // Section 1: No Mercy (0-2500)
            // ═══════════════════════════════════════
            { type: 'spike', x: 600, y: 'ground', variant: 'up' },
            { type: 'spike', x: 660, y: 'ground', variant: 'up' },

            { type: 'spike', x: 1000, y: 'ground', variant: 'up' },
            { type: 'spike', x: 1060, y: 'ground', variant: 'up' },
            { type: 'spike', x: 1120, y: 'ground', variant: 'up' },

            { type: 'spike', x: 1500, y: 'ground', variant: 'up' },
            { type: 'spike', x: 1560, y: 'ground', variant: 'up' },

            { type: 'spike', x: 1800, y: 'ground', variant: 'up' },
            { type: 'spike', x: 1860, y: 'ground', variant: 'up' },
            { type: 'spike', x: 1920, y: 'ground', variant: 'up' },
            { type: 'spike', x: 1980, y: 'ground', variant: 'up' },
            { type: 'jump_orb', x: 1900, y: 490 },

            { type: 'spike', x: 2200, y: 'ground', variant: 'up' },
            { type: 'spike', x: 2260, y: 'ground', variant: 'up' },
            { type: 'spike', x: 2320, y: 'ground', variant: 'up' },

            // ═══════════════════════════════════════
            // Section 2: Blade Dance (2500-5000)
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 2600, speed: 500 },

            // Sawblade sweeping vertically
            { type: 'sawblade', x: 2900, y: 420, radius: 30, path: [{x: 2900, y: 420}, {x: 2900, y: 220}], speed: 0.9 },

            { type: 'spike', x: 3150, y: 'ground', variant: 'up' },
            { type: 'spike', x: 3210, y: 'ground', variant: 'up' },

            // Two sawblades crossing paths
            { type: 'sawblade', x: 3500, y: 300, radius: 26, path: [{x: 3500, y: 300}, {x: 3500, y: 500}], speed: 0.8 },
            { type: 'sawblade', x: 3750, y: 500, radius: 26, path: [{x: 3750, y: 500}, {x: 3750, y: 300}], speed: 0.8 },

            { type: 'spike', x: 3950, y: 'ground', variant: 'up' },
            { type: 'spike', x: 4010, y: 'ground', variant: 'up' },
            { type: 'spike', x: 4070, y: 'ground', variant: 'up' },

            // Fast sawblade + static sawblade combo
            { type: 'sawblade', x: 4350, y: 350, radius: 28, path: [{x: 4350, y: 350}, {x: 4350, y: 200}], speed: 1.3 },
            { type: 'sawblade', x: 4550, y: 480, radius: 24, path: null, speed: 0 },

            { type: 'spike', x: 4750, y: 'ground', variant: 'up' },
            { type: 'spike', x: 4810, y: 'ground', variant: 'up' },

            // ═══════════════════════════════════════
            // Section 3: Upside Down (5000-7500)
            // Extended gravity flip with mixed hazards
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 5100, speed: 460 },
            { type: 'portal', x: 5200, ability: 'gravity_flip' },

            // Ceiling spikes (player on ceiling)
            { type: 'spike', x: 5500, y: 'ceiling', variant: 'down' },
            { type: 'spike', x: 5560, y: 'ceiling', variant: 'down' },

            { type: 'spike', x: 5900, y: 'ceiling', variant: 'down' },
            { type: 'spike', x: 5960, y: 'ceiling', variant: 'down' },
            { type: 'spike', x: 6020, y: 'ceiling', variant: 'down' },

            // Sawblade while flipped
            { type: 'sawblade', x: 6300, y: 200, radius: 26, path: [{x: 6300, y: 200}, {x: 6300, y: 400}], speed: 0.7 },

            { type: 'spike', x: 6550, y: 'ceiling', variant: 'down' },
            { type: 'spike', x: 6610, y: 'ceiling', variant: 'down' },

            // Ground spikes while on ceiling — need to "jump" (toward ground) to dodge
            { type: 'spike', x: 6900, y: 'ground', variant: 'up' },
            { type: 'spike', x: 6960, y: 'ground', variant: 'up' },

            // Flip back to normal
            { type: 'portal', x: 7200, ability: 'gravity_normal' },

            { type: 'spike', x: 7350, y: 'ground', variant: 'up' },
            { type: 'spike', x: 7410, y: 'ground', variant: 'up' },

            // ═══════════════════════════════════════
            // Section 4: Laser Hall (7500-10000)
            // Shortened beams with ground gaps
            // Beam from y=80 to y=500, player walks under
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 7600, speed: 500 },

            { type: 'laser', x: 7900, y: 80, length: 420, angle: 90, onTime: 0.5, offTime: 2.0, phase: 0.3 },

            { type: 'spike', x: 8100, y: 'ground', variant: 'up' },
            { type: 'spike', x: 8160, y: 'ground', variant: 'up' },

            { type: 'laser', x: 8400, y: 80, length: 420, angle: 90, onTime: 0.5, offTime: 2.0, phase: 0.9 },

            { type: 'spike', x: 8600, y: 'ground', variant: 'up' },
            { type: 'spike', x: 8660, y: 'ground', variant: 'up' },
            { type: 'spike', x: 8720, y: 'ground', variant: 'up' },

            { type: 'laser', x: 9000, y: 80, length: 420, angle: 90, onTime: 0.5, offTime: 2.0, phase: 0.5 },

            { type: 'spike', x: 9200, y: 'ground', variant: 'up' },
            { type: 'spike', x: 9260, y: 'ground', variant: 'up' },

            // Sawblade + laser combo
            { type: 'sawblade', x: 9500, y: 400, radius: 24, path: [{x: 9500, y: 400}, {x: 9500, y: 250}], speed: 0.9 },
            { type: 'laser', x: 9700, y: 80, length: 420, angle: 90, onTime: 0.5, offTime: 2.0, phase: 1.2 },

            { type: 'spike', x: 9850, y: 'ground', variant: 'up' },
            { type: 'spike', x: 9910, y: 'ground', variant: 'up' },

            // ═══════════════════════════════════════
            // Section 5: Dash Gauntlet (10000-12000)
            // Multiple dash triggers through tight gaps
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 10100, speed: 460 },

            // First dash corridor
            { type: 'portal', x: 10200, ability: 'dash' },
            { type: 'low_ceiling', x: 10250, y: 380, w: 350, h: 175 },

            { type: 'spike', x: 10800, y: 'ground', variant: 'up' },
            { type: 'spike', x: 10860, y: 'ground', variant: 'up' },

            // Second dash corridor
            { type: 'portal', x: 11100, ability: 'dash' },
            { type: 'low_ceiling', x: 11150, y: 380, w: 400, h: 175 },

            { type: 'spike', x: 11750, y: 'ground', variant: 'up' },
            { type: 'spike', x: 11810, y: 'ground', variant: 'up' },
            { type: 'spike', x: 11870, y: 'ground', variant: 'up' },

            // ═══════════════════════════════════════
            // Section 6: Orb Ascent (12000-14000)
            // Jump orb chains over floating hazards
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 12100, speed: 480 },

            // Ground spikes + orb to fly over floating spikes
            { type: 'spike', x: 12400, y: 'ground', variant: 'up' },
            { type: 'spike', x: 12460, y: 'ground', variant: 'up' },
            { type: 'spike', x: 12520, y: 'ground', variant: 'up' },
            { type: 'spike', x: 12580, y: 'ground', variant: 'up' },
            { type: 'jump_orb', x: 12500, y: 490 },
            { type: 'spike', x: 12650, y: 420, variant: 'floating' },

            // Sawblade at mid-height + orb to go over it
            { type: 'sawblade', x: 13000, y: 400, radius: 28, path: [{x: 13000, y: 400}, {x: 13000, y: 280}], speed: 0.8 },
            { type: 'spike', x: 13000, y: 'ground', variant: 'up' },
            { type: 'spike', x: 13060, y: 'ground', variant: 'up' },
            { type: 'spike', x: 13120, y: 'ground', variant: 'up' },
            { type: 'jump_orb', x: 13050, y: 490 },

            // Floating spike field + orb chain
            { type: 'spike', x: 13400, y: 440, variant: 'floating' },
            { type: 'spike', x: 13460, y: 440, variant: 'floating' },
            { type: 'spike', x: 13400, y: 'ground', variant: 'up' },
            { type: 'spike', x: 13460, y: 'ground', variant: 'up' },
            { type: 'jump_orb', x: 13350, y: 480 },

            { type: 'spike', x: 13700, y: 'ground', variant: 'up' },
            { type: 'spike', x: 13760, y: 'ground', variant: 'up' },
            { type: 'spike', x: 13820, y: 'ground', variant: 'up' },

            // ═══════════════════════════════════════
            // Section 7: Chaos (14000-16000)
            // Everything mixed together
            // ═══════════════════════════════════════
            { type: 'speed_zone', x: 14100, speed: 540 },

            { type: 'spike', x: 14300, y: 'ground', variant: 'up' },
            { type: 'spike', x: 14360, y: 'ground', variant: 'up' },
            { type: 'spike', x: 14420, y: 'ground', variant: 'up' },

            { type: 'sawblade', x: 14600, y: 380, radius: 28, path: [{x: 14600, y: 380}, {x: 14600, y: 220}], speed: 1.1 },

            { type: 'moving_block', x: 14850, y: 450, w: 80, h: 60, endX: 14850, endY: 280, period: 1.8 },

            { type: 'spike', x: 15050, y: 'ground', variant: 'up' },
            { type: 'spike', x: 15110, y: 'ground', variant: 'up' },
            { type: 'spike', x: 15170, y: 'ground', variant: 'up' },
            { type: 'spike', x: 15230, y: 'ground', variant: 'up' },
            { type: 'jump_orb', x: 15140, y: 490 },

            { type: 'sawblade', x: 15400, y: 350, radius: 26, path: [{x: 15400, y: 350}, {x: 15400, y: 200}], speed: 1.3 },

            { type: 'spike', x: 15550, y: 'ground', variant: 'up' },
            { type: 'spike', x: 15610, y: 'ground', variant: 'up' },

            { type: 'laser', x: 15750, y: 80, length: 420, angle: 90, onTime: 0.5, offTime: 2.0, phase: 0.4 },

            { type: 'spike', x: 15850, y: 'ground', variant: 'up' },
            { type: 'spike', x: 15910, y: 'ground', variant: 'up' },

            // Finish line
            { type: 'finish', x: 16000 }
        ]
    }
];
