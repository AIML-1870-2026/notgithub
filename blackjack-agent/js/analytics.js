// analytics.js — Performance tracking (Stretch Challenge #2)

const STORAGE_KEY = 'bja_analytics';
const SPARKLINE_WINDOW = 20;

function defaultData() {
    return {
        handsPlayed: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        blackjacks: 0,
        netProfit: 0,
        totalWagered: 0,
        bankrollHistory: [],
        decisionLog: []   // { hand, agentAction, strategyAction, match, outcome }
    };
}

let data = load();

function load() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : defaultData();
    } catch (_) {
        return defaultData();
    }
}

function save() {
    try {
        // Keep last 200 decisions to avoid unbounded storage
        if (data.decisionLog.length > 200) data.decisionLog = data.decisionLog.slice(-200);
        if (data.bankrollHistory.length > 200) data.bankrollHistory = data.bankrollHistory.slice(-200);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
}

/**
 * Record a completed hand's decision and outcome.
 * @param {object} opts
 */
export function recordDecision({ agentAction, strategyAction, outcome, bankroll, bet }) {
    data.handsPlayed++;
    data.totalWagered += bet || 0;

    const isWin = outcome === 'player_win' || outcome === 'player_blackjack' || outcome === 'dealer_bust';
    const isPush = outcome === 'push' || outcome === 'both_blackjack';

    if (isWin) data.wins++;
    else if (isPush) data.pushes++;
    else data.losses++;

    if (outcome === 'player_blackjack') data.blackjacks++;

    const profit = isWin ? (outcome === 'player_blackjack' ? bet * 1.5 : bet) : isPush ? 0 : -bet;
    data.netProfit += profit;

    const match = agentAction && strategyAction ? agentAction === strategyAction : null;
    data.decisionLog.push({
        hand: data.handsPlayed,
        agentAction,
        strategyAction,
        match,
        outcome
    });

    data.bankrollHistory.push({ hand: data.handsPlayed, bankroll });
    save();
}

export function getBankrollSparkline() {
    return data.bankrollHistory.slice(-SPARKLINE_WINDOW).map(e => e.bankroll);
}

export function getDecisionQuality() {
    const scoreable = data.decisionLog.filter(d => d.match !== null);
    if (scoreable.length === 0) return null;
    const matches = scoreable.filter(d => d.match).length;
    return Math.round((matches / scoreable.length) * 100);
}

export function getAnalyticsSummary() {
    const winRate = data.handsPlayed > 0
        ? Math.round((data.wins / data.handsPlayed) * 100)
        : null;
    return {
        handsPlayed: data.handsPlayed,
        wins: data.wins,
        losses: data.losses,
        pushes: data.pushes,
        blackjacks: data.blackjacks,
        winRate,
        netProfit: data.netProfit,
        totalWagered: data.totalWagered,
        decisionQuality: getDecisionQuality(),
        sparkline: getBankrollSparkline(),
        decisionLog: [...data.decisionLog]
    };
}

export function resetAnalytics() {
    data = defaultData();
    save();
}
