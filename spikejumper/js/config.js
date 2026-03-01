// ── Game Configuration & Constants ──

export const GAME_STATE = Object.freeze({
    MENU: 'menu',
    PLAYING: 'playing',
    DEAD: 'dead',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'level_complete'
});

export const MENU_SCREEN = Object.freeze({
    TITLE: 'title',
    SETTINGS: 'settings',
    LEVEL_SELECT: 'level_select',
    HIGH_SCORES: 'high_scores'
});

export const CANVAS = Object.freeze({
    WIDTH: 1280,
    HEIGHT: 720
});

export const PHYSICS = Object.freeze({
    GRAVITY: 2400,
    JUMP_VELOCITY: -700,
    SHORT_HOP_CUTOFF: -350,
    TERMINAL_VELOCITY: 1200,
    PLAYER_SIZE: 36,
    GROUND_Y: 580,
    CEILING_Y: 60,
    PLAYER_START_X: 200,
    DASH_SPEED_MULT: 2.0,
    DASH_DURATION: 1.2,
    SQUASH_SPRING: 12,
    COLLISION_FORGIVENESS: 0.75
});

export const COLORS = Object.freeze({
    BG: '#1a1a3e',
    BG_GRADIENT_TOP: '#252552',
    BG_GRADIENT_BOTTOM: '#1a1a3e',
    GROUND: '#2a2a55',
    GROUND_EDGE: '#00e5ff',
    GROUND_EDGE_GLOW: 'rgba(0, 229, 255, 0.3)',
    PLAYER: '#4488ff',
    PLAYER_EYE_WHITE: '#ffffff',
    PLAYER_EYE_PUPIL: '#111122',
    PLAYER_DEAD_EYE: '#ff4444',
    SPIKE: '#ff3366',
    SPIKE_OUTLINE: '#ff6699',
    MOVING_BLOCK: '#8844cc',
    MOVING_BLOCK_OUTLINE: '#aa66ee',
    SAWBLADE: '#ff6600',
    SAWBLADE_INNER: '#ffaa44',
    LASER_ON: '#00ffcc',
    LASER_OFF: 'rgba(0, 255, 204, 0.15)',
    LASER_GLOW: 'rgba(0, 255, 204, 0.4)',
    PORTAL_DOUBLE_JUMP: '#00ffaa',
    PORTAL_GRAVITY_FLIP: '#ff00ff',
    PORTAL_DASH: '#ffaa00',
    PORTAL_SPEED: '#4488ff',
    GRID_LINE: 'rgba(100, 160, 255, 0.10)',
    GRID_LINE_BRIGHT: 'rgba(100, 160, 255, 0.20)',
    HUD_TEXT: 'rgba(200, 220, 255, 0.7)',
    HUD_BG: 'rgba(26, 26, 62, 0.5)',
    PROGRESS_BAR_BG: 'rgba(255, 255, 255, 0.12)',
    PROGRESS_BAR_FILL: '#4488ff',
    PARTICLE_DUST: '#aabbdd',
    FLASH_WHITE: 'rgba(255, 255, 255, 0.6)',
    MENU_BG: 'rgba(26, 26, 62, 0.90)',
    TEXT_PRIMARY: '#e0e8ff',
    TEXT_ACCENT: '#4488ff',
    TEXT_GLOW: '#00e5ff'
});

export const PORTAL_COLORS = Object.freeze({
    double_jump: COLORS.PORTAL_DOUBLE_JUMP,
    gravity_flip: COLORS.PORTAL_GRAVITY_FLIP,
    gravity_normal: COLORS.PORTAL_GRAVITY_FLIP,
    dash: COLORS.PORTAL_DASH,
    speed: COLORS.PORTAL_SPEED
});

export const DEATH = Object.freeze({
    FLASH_DURATION: 0.06,
    FREEZE_DURATION: 0.3,
    FADE_DURATION: 0.2,
    TOTAL_DURATION: 0.56,
    SHAKE_INTENSITY: 12,
    SHAKE_DURATION: 0.3,
    PARTICLE_COUNT: 20
});

export const AUDIO = Object.freeze({
    DEFAULT_MASTER: 0.7,
    DEFAULT_SFX: 1.0,
    DEFAULT_MUSIC: 0.4
});
