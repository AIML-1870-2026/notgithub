// config.js — Constants, enums, and default settings

export const GAME_PHASE = Object.freeze({
    BETTING: 'betting',
    DEALING: 'dealing',
    PLAYER_TURN: 'player_turn',
    SPLIT_TURN: 'split_turn',
    INSURANCE: 'insurance',
    DEALER_TURN: 'dealer_turn',
    RESOLUTION: 'resolution'
});

export const ACTION = Object.freeze({
    HIT: 'hit',
    STAND: 'stand',
    DOUBLE: 'double',
    SPLIT: 'split',
    INSURANCE: 'insurance'
});

export const OUTCOME = Object.freeze({
    PLAYER_BLACKJACK: 'player_blackjack',
    DEALER_BLACKJACK: 'dealer_blackjack',
    BOTH_BLACKJACK: 'both_blackjack',
    PLAYER_WIN: 'player_win',
    DEALER_WIN: 'dealer_win',
    PUSH: 'push',
    PLAYER_BUST: 'player_bust',
    DEALER_BUST: 'dealer_bust'
});

export const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];

export const RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];

export const CARD_VALUES = Object.freeze({
    'ace': [1, 11],
    '2': [2], '3': [3], '4': [4], '5': [5], '6': [6],
    '7': [7], '8': [8], '9': [9], '10': [10],
    'jack': [10], 'queen': [10], 'king': [10]
});

export const DEFAULTS = Object.freeze({
    NUM_DECKS: 6,
    STARTING_BANKROLL: 1000,
    MIN_BET: 5,
    MAX_BET: 500,
    RESHUFFLE_THRESHOLD: 0.75,
    DEALER_HITS_SOFT_17: true,
    BLACKJACK_PAYOUT: 1.5,
    INSURANCE_PAYOUT: 2,
    ANIMATION_SPEED_MS: 350,
    CARD_ASSET_PATH: 'SVG-cards-1.3'
});

export const CHIP_DENOMINATIONS = [5, 25, 100, 500];

// Agent-specific enums
export const AGENT_MODE = Object.freeze({
    AUTO: 'auto',
    STEP: 'step'
});

export const RISK_PROFILE = Object.freeze({
    CONSERVATIVE: 'conservative',
    BALANCED: 'balanced',
    AGGRESSIVE: 'aggressive'
});

export const PROVIDER = Object.freeze({
    CLAUDE: 'claude',
    OPENAI: 'openai'
});

export const EXPLAIN_LEVEL = Object.freeze({
    BASIC: 'basic',
    STATISTICAL: 'statistical',
    INDEPTH: 'indepth'
});

export const AGENT_THINK_DELAY_MS = 1400;
export const AUTO_DEAL_DELAY_MS = 2200;
