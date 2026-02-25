// coach.js — Coaching mode: personalized advice, deviation tracking, EV data

import { getHint, getHintCode } from './strategy.js';

// --- Expected value data (approximate, per $1 bet) ---
// Format: EV_TABLE[playerTotal][dealerUpcard] = { best, hit, stand }
// Values sourced from standard 6-deck basic strategy EV tables
// Positive = player edge, negative = house edge

// Dealer bust probability by upcard (6-deck, dealer hits soft 17)
const DEALER_BUST_PCT = {
    2: 35, 3: 37, 4: 40, 5: 42, 6: 44,
    7: 26, 8: 24, 9: 23, 10: 23, 11: 17 // 11 = Ace
};

// Approximate player win% for key scenarios (following basic strategy)
// Used to generate data-driven coaching messages
const WIN_PCT = {
    // Hard hands vs dealer upcard [dealer 2-A]
    hard: {
        8:  [52, 53, 54, 55, 56, 54, 50, 47, 44, 43],
        9:  [55, 56, 57, 58, 59, 54, 51, 48, 45, 43],
        10: [62, 63, 64, 65, 66, 60, 56, 53, 50, 48],
        11: [64, 65, 66, 67, 67, 61, 58, 55, 52, 50],
        12: [37, 38, 40, 41, 42, 37, 34, 32, 30, 29],
        13: [39, 40, 42, 43, 44, 35, 32, 30, 28, 27],
        14: [40, 41, 43, 44, 45, 34, 31, 28, 26, 25],
        15: [40, 41, 43, 44, 45, 33, 30, 27, 25, 24],
        16: [40, 41, 43, 44, 44, 32, 29, 26, 24, 23],
        17: [45, 46, 47, 48, 49, 45, 38, 33, 30, 29],
        18: [55, 56, 56, 57, 58, 54, 51, 44, 38, 35],
        19: [64, 65, 65, 66, 67, 63, 61, 57, 50, 45],
        20: [73, 74, 74, 75, 76, 72, 70, 68, 63, 56],
        21: [80, 81, 81, 82, 83, 79, 78, 77, 74, 69],
    },
    // Soft hands (total includes Ace as 11)
    soft: {
        13: [46, 47, 49, 51, 52, 44, 41, 38, 35, 34],
        14: [47, 48, 50, 52, 53, 45, 42, 39, 36, 34],
        15: [48, 49, 52, 53, 55, 46, 43, 40, 37, 35],
        16: [49, 50, 53, 55, 56, 47, 44, 41, 38, 36],
        17: [50, 52, 55, 56, 58, 48, 45, 42, 39, 37],
        18: [56, 57, 59, 60, 62, 55, 52, 46, 41, 38],
        19: [64, 65, 66, 67, 68, 63, 61, 57, 50, 45],
        20: [73, 74, 74, 75, 76, 72, 70, 68, 63, 56],
    }
};

// Cost of deviation from basic strategy (approximate cents per $1 bet)
// Format: DEVIATION_COST[scenario] = cost in cents
const DEVIATION_COSTS = {
    // Standing when should hit
    'stand_vs_hit_12': 3, 'stand_vs_hit_13': 4, 'stand_vs_hit_14': 5,
    'stand_vs_hit_15': 6, 'stand_vs_hit_16': 7,
    // Hitting when should stand
    'hit_vs_stand_13': 5, 'hit_vs_stand_14': 6, 'hit_vs_stand_15': 7,
    'hit_vs_stand_16': 8, 'hit_vs_stand_17': 15,
    // Not doubling when should
    'hit_vs_double_10': 12, 'hit_vs_double_11': 14,
    'hit_vs_double_9': 8,
    // Not splitting when should
    'hit_vs_split_8': 18, 'stand_vs_split_8': 20,
    // Generic fallbacks
    'default_minor': 3,
    'default_moderate': 8,
    'default_major': 15,
};

// --- Coach state ---
let lastAdvice = null;
let coachStats = { followed: 0, deviated: 0 };

// --- Helper: dealer card value for table lookup ---
function dealerVal(card) {
    if (card.rank === 'ace') return 11;
    return card.value[0];
}

function dealerIdx(card) {
    const v = dealerVal(card);
    if (v === 11) return 9; // Ace
    return v - 2;
}

// --- Main coaching function ---
export function getCoachAdvice(playerHand, dealerUpCard, canSplitFlag, canDoubleFlag) {
    if (!dealerUpCard || playerHand.cards.length < 2) return null;

    const hintCode = getHintCode(playerHand, dealerUpCard);
    const hintText = getHint(playerHand, dealerUpCard);
    if (!hintCode || !hintText) return null;

    const { total, isSoft } = playerHand.getScore();
    const di = dealerIdx(dealerUpCard);
    const dealerRank = dealerVal(dealerUpCard);
    const dealerBust = DEALER_BUST_PCT[dealerRank] || 23;

    // Adjust recommendation if player can't actually do it
    let action = hintText;
    let code = hintCode;
    if (code === 'D' && !canDoubleFlag) {
        action = 'Hit';
        code = 'H';
    }
    if (code === 'P' && !canSplitFlag) {
        // Fall back to hard/soft hint
        const fallback = getHintCode(playerHand, dealerUpCard, true);
        code = fallback || 'H';
        action = codeToAction(code);
    }

    // Get win% for context
    let winPct = null;
    const table = isSoft ? WIN_PCT.soft : WIN_PCT.hard;
    const key = Math.min(Math.max(total, isSoft ? 13 : 8), isSoft ? 20 : 21);
    if (table[key]) {
        winPct = table[key][di];
    }

    // Generate personalized message
    const message = generateMessage(code, total, isSoft, dealerRank, dealerBust, winPct, playerHand);

    lastAdvice = { code, action, total, isSoft, dealerRank };

    return { action, message, code };
}

function codeToAction(code) {
    switch (code) {
        case 'H': return 'Hit';
        case 'S': return 'Stand';
        case 'D': return 'Double Down';
        case 'P': return 'Split';
        default: return 'Hit';
    }
}

// --- Message generation (concise + friendly + data-driven) ---

function generateMessage(code, total, isSoft, dealerRank, dealerBust, winPct, hand) {
    const dealerStr = dealerRank === 11 ? 'Ace' : dealerRank;
    const handType = isSoft ? 'soft' : 'hard';
    const pctStr = winPct ? `Win rate: ~${winPct}%` : '';

    switch (code) {
        case 'H':
            return generateHitMessage(total, isSoft, dealerStr, dealerBust, winPct);
        case 'S':
            return generateStandMessage(total, isSoft, dealerStr, dealerBust, winPct);
        case 'D':
            return generateDoubleMessage(total, isSoft, dealerStr, dealerBust, winPct);
        case 'P':
            return generateSplitMessage(hand, dealerStr, dealerBust);
        default:
            return pctStr;
    }
}

function generateHitMessage(total, isSoft, dealerStr, dealerBust, winPct) {
    if (total <= 11) {
        return `You can't bust here. Take a card and improve your hand.${winPct ? ` Win rate: ~${winPct}%.` : ''}`;
    }
    if (total <= 14) {
        return `${total} is too weak to stand on against a ${dealerStr}. The risk of busting is worth it.${winPct ? ` Win rate: ~${winPct}%.` : ''}`;
    }
    if (total <= 16) {
        return `Tough spot — ${total} vs ${dealerStr}. But standing is worse. Dealer only busts ~${dealerBust}% here.`;
    }
    return `Take a card.${winPct ? ` Win rate if you play this right: ~${winPct}%.` : ''}`;
}

function generateStandMessage(total, isSoft, dealerStr, dealerBust, winPct) {
    if (total >= 17) {
        return `${total} is strong enough. Let the dealer play — they bust ~${dealerBust}% from a ${dealerStr}.`;
    }
    if (dealerBust >= 40) {
        return `Dealer shows ${dealerStr} — they bust ~${dealerBust}% of the time. Don't risk your hand.`;
    }
    return `Stand pat. Your ${total} plays best by not risking a bust here.${winPct ? ` Win rate: ~${winPct}%.` : ''}`;
}

function generateDoubleMessage(total, isSoft, dealerStr, dealerBust, winPct) {
    if (total === 11) {
        return `11 vs ${dealerStr} — this is one of your best doubling spots. ${winPct ? `Win rate: ~${winPct}%.` : 'Push the advantage.'}`;
    }
    if (total === 10) {
        return `Strong position. Double your bet — you're favored to draw a good card.${winPct ? ` Win rate: ~${winPct}%.` : ''}`;
    }
    if (isSoft) {
        return `Your soft ${total} has upside. Double here — even a bad draw leaves you competitive.`;
    }
    return `Dealer is weak (shows ${dealerStr}, busts ~${dealerBust}%). Double to maximize your edge.`;
}

function generateSplitMessage(hand, dealerStr, dealerBust) {
    const rank = hand.cards[0].rank;
    if (rank === 'ace') {
        return `Always split Aces. Two chances at 21 beats a soft 12.`;
    }
    if (rank === '8') {
        return `Always split 8s. Two hands of 8 play way better than a hard 16.`;
    }
    return `Split and play two stronger hands against the dealer's ${dealerStr} (busts ~${dealerBust}%).`;
}

// --- Deviation feedback ---

export function getDeviationFeedback(recommendedCode, actualAction, playerHand, dealerUpCard) {
    if (!recommendedCode) return null;

    const actualCode = actionToCode(actualAction);
    if (actualCode === recommendedCode) {
        coachStats.followed++;
        return { type: 'good', message: 'Good play.' };
    }

    coachStats.deviated++;

    const { total } = playerHand.getScore();
    const recAction = codeToAction(recommendedCode);

    // Estimate cost
    const costKey = `${actualCode === 'H' ? 'hit' : actualCode === 'S' ? 'stand' : actualAction.toLowerCase()}_vs_${recommendedCode === 'H' ? 'hit' : recommendedCode === 'S' ? 'stand' : recommendedCode === 'D' ? 'double' : 'split'}_${total}`;
    let cost = DEVIATION_COSTS[costKey];

    if (!cost) {
        // Fallback cost estimate
        if (recommendedCode === 'D' || recommendedCode === 'P') {
            cost = DEVIATION_COSTS['default_major'];
        } else {
            cost = DEVIATION_COSTS['default_moderate'];
        }
    }

    const costStr = `~$${(cost / 100 * 100).toFixed(0)} per $100 bet`;

    return {
        type: 'deviation',
        message: `Basic strategy says ${recAction.toLowerCase()} here. That deviation costs ${costStr} on average.`
    };
}

function actionToCode(action) {
    switch (action.toLowerCase()) {
        case 'hit': return 'H';
        case 'stand': return 'S';
        case 'double':
        case 'double down': return 'D';
        case 'split': return 'P';
        default: return 'H';
    }
}

// --- Coach stats ---

export function getCoachStats() {
    const total = coachStats.followed + coachStats.deviated;
    return {
        followed: coachStats.followed,
        deviated: coachStats.deviated,
        total,
        followRate: total > 0 ? Math.round((coachStats.followed / total) * 100) : 0
    };
}

export function resetCoachStats() {
    coachStats = { followed: 0, deviated: 0 };
}

export function getLastAdvice() {
    return lastAdvice;
}

export function clearLastAdvice() {
    lastAdvice = null;
}
