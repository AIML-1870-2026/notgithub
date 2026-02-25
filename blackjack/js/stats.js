// stats.js — Statistics tracking with localStorage persistence

import { OUTCOME } from './config.js';

const STORAGE_KEY = 'blackjack_stats';

let stats = loadStats();

function defaultStats() {
    return {
        handsPlayed: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        blackjacks: 0,
        currentStreak: 0,
        bestStreak: 0,
        biggestWin: 0,
        totalWagered: 0,
        netProfit: 0,
        history: []
    };
}

function loadStats() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) return { ...defaultStats(), ...JSON.parse(data) };
    } catch (e) {
        // Ignore parse errors
    }
    return defaultStats();
}

function saveStats() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
        // Ignore storage errors
    }
}

export function recordResult(outcome, betAmount, payout) {
    stats.handsPlayed++;
    stats.totalWagered += betAmount;
    const profit = payout - betAmount;
    stats.netProfit += profit;

    if (profit > stats.biggestWin) {
        stats.biggestWin = profit;
    }

    switch (outcome) {
        case OUTCOME.PLAYER_BLACKJACK:
            stats.wins++;
            stats.blackjacks++;
            stats.currentStreak = Math.max(1, stats.currentStreak + 1);
            break;
        case OUTCOME.PLAYER_WIN:
        case OUTCOME.DEALER_BUST:
            stats.wins++;
            stats.currentStreak = Math.max(1, stats.currentStreak + 1);
            break;
        case OUTCOME.DEALER_WIN:
        case OUTCOME.PLAYER_BUST:
        case OUTCOME.DEALER_BLACKJACK:
            stats.losses++;
            stats.currentStreak = Math.min(-1, stats.currentStreak - 1);
            break;
        case OUTCOME.BOTH_BLACKJACK:
        case OUTCOME.PUSH:
            stats.pushes++;
            break;
    }

    if (stats.currentStreak > stats.bestStreak) {
        stats.bestStreak = stats.currentStreak;
    }

    // Add to history (keep last 50)
    stats.history.push({
        timestamp: Date.now(),
        outcome,
        bet: betAmount,
        payout,
        profit
    });
    if (stats.history.length > 50) stats.history.shift();

    saveStats();
}

export function getStats() {
    const winRate = stats.handsPlayed > 0
        ? Math.round((stats.wins / stats.handsPlayed) * 100)
        : 0;

    return {
        ...stats,
        winRate
    };
}

export function getHistory() {
    return [...stats.history];
}

export function resetStats() {
    stats = defaultStats();
    saveStats();
}
