// gameState.js — Central state store with pub/sub pattern

import { GAME_PHASE, DEFAULTS, AGENT_MODE, RISK_PROFILE, PROVIDER, EXPLAIN_LEVEL } from './config.js';
import { Hand } from './hand.js';

const initialState = {
    phase: GAME_PHASE.BETTING,
    playerHands: [new Hand()],
    currentHandIndex: 0,
    dealerHand: new Hand(),
    bankroll: DEFAULTS.STARTING_BANKROLL,
    currentBet: 0,
    insuranceBet: 0,
    shoe: null,
    message: '',
    messageType: '',
    roundResult: null,

    // Agent-specific state
    provider: PROVIDER.CLAUDE,
    apiKey: null,
    agentMode: AGENT_MODE.AUTO,
    riskProfile: RISK_PROFILE.BALANCED,
    explainLevel: EXPLAIN_LEVEL.STATISTICAL,
    agentThinking: false,
    lastAgentDecision: null,
    agentError: null,

    settings: {
        soundEnabled: true,
        countEnabled: false
    }
};

let state = { ...initialState };
const subscribers = [];

export function getState() {
    return state;
}

export function setState(partial) {
    const prevState = { ...state };
    state = { ...state, ...partial };
    for (const callback of subscribers) {
        callback(state, prevState);
    }
}

export function subscribe(callback) {
    subscribers.push(callback);
    return () => {
        const index = subscribers.indexOf(callback);
        if (index > -1) subscribers.splice(index, 1);
    };
}

export function resetRound() {
    setState({
        playerHands: [new Hand()],
        currentHandIndex: 0,
        dealerHand: new Hand(),
        currentBet: 0,
        insuranceBet: 0,
        message: '',
        messageType: '',
        roundResult: null,
        agentThinking: false,
        lastAgentDecision: null,
        agentError: null,
        phase: GAME_PHASE.BETTING
    });
}

export function resetGame() {
    setState({
        ...initialState,
        shoe: state.shoe,
        provider: state.provider,
        apiKey: state.apiKey,
        agentMode: state.agentMode,
        riskProfile: state.riskProfile,
        explainLevel: state.explainLevel,
        settings: { ...state.settings },
        playerHands: [new Hand()],
        dealerHand: new Hand(),
        phase: GAME_PHASE.BETTING
    });
}

export function getCurrentHand() {
    return state.playerHands[state.currentHandIndex];
}
