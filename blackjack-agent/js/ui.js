// ui.js — All DOM rendering, no game logic

import { GAME_PHASE, DEFAULTS, AGENT_MODE, PROVIDER } from './config.js';
import { getState } from './gameState.js';
import { getAnalyticsSummary, getBankrollSparkline } from './analytics.js';
import { renderStrategyMatrix, updateHighlight } from './strategyMatrix.js';
import { getDealerUpCard } from './dealer.js';

// ── DOM refs ────────────────────────────────────────────────────
let dom = {};

export function initUI() {
    dom = {
        // Header
        envDrop:       document.getElementById('env-drop-target'),
        envLabel:      document.getElementById('env-label'),
        envInput:      document.getElementById('env-file-input'),
        apiKeyInput:   document.getElementById('api-key-input'),
        btnKeyLoad:    document.getElementById('btn-key-load'),
        btnKeyClear:   document.getElementById('btn-key-clear'),
        keyPasteRow:   document.getElementById('key-zone')?.querySelector('.key-paste-row'),
        providerBadge: document.getElementById('provider-badge'),
        modeToggle:    document.getElementById('mode-toggle'),
        modeIcon:      document.getElementById('mode-icon'),
        modeLabel:     document.getElementById('mode-label'),

        // Table
        shoeDisplay:   document.getElementById('shoe-display'),
        countDisplay:  document.getElementById('count-display'),

        // Dealer
        dealerCards:   document.getElementById('dealer-cards'),
        dealerScore:   document.getElementById('dealer-score'),

        // Player
        playerCards:   document.getElementById('player-cards'),
        playerScore:   document.getElementById('player-score'),
        handTabs:      document.getElementById('hand-tabs'),

        // Message
        messageStrip:  document.getElementById('message-strip'),
        gameMessage:   document.getElementById('game-message'),

        // Actions
        actionRow:     document.getElementById('action-row'),
        btnHit:        document.getElementById('btn-hit'),
        btnStand:      document.getElementById('btn-stand'),
        btnDouble:     document.getElementById('btn-double'),
        btnSplit:      document.getElementById('btn-split'),

        // Insurance
        insuranceRow:  document.getElementById('insurance-row'),
        btnInsuranceYes: document.getElementById('btn-insurance-yes'),
        btnInsuranceNo:  document.getElementById('btn-insurance-no'),

        // Betting
        betRow:        document.getElementById('bet-row'),
        betAmount:     document.getElementById('bet-amount'),
        bankrollAmount:document.getElementById('bankroll-amount'),
        btnClearBet:   document.getElementById('btn-clear-bet'),
        btnDeal:       document.getElementById('btn-deal'),
        btnNewRound:   document.getElementById('btn-new-round'),

        // Execute
        executeRow:    document.getElementById('execute-row'),
        btnExecute:    document.getElementById('btn-execute'),
        executeActionLabel: document.getElementById('execute-action-label'),

        // Agent panel
        agentCard:     document.getElementById('agent-card'),
        thinkingDots:  document.getElementById('thinking-dots'),
        agentIdle:     document.getElementById('agent-idle'),
        agentDecision: document.getElementById('agent-decision'),
        decisionAction: document.getElementById('decision-action'),
        confidenceBar:  document.getElementById('confidence-bar'),
        confidencePct:  document.getElementById('confidence-pct'),
        decisionReasoning: document.getElementById('decision-reasoning'),
        decisionStats:  document.getElementById('decision-stats'),
        decisionDeep:   document.getElementById('decision-deep'),
        strategyMatch:  document.getElementById('strategy-match'),

        // Controls
        explainControl: document.getElementById('explain-control'),
        riskControl:    document.getElementById('risk-control'),
        riskDesc:       document.getElementById('risk-desc'),

        // Analytics bar
        statWinrate:   document.getElementById('stat-winrate'),
        statPnl:       document.getElementById('stat-pnl'),
        statHands:     document.getElementById('stat-hands'),
        statQuality:   document.getElementById('stat-quality'),
        sparklineLine: document.getElementById('sparkline-line'),

        // Bet row sub-elements
        chipRack:      document.getElementById('chip-rack'),

        // Strategy matrix
        strategyMatrix: document.getElementById('strategy-matrix'),

        // Modals
        analyticsModal: document.getElementById('analytics-modal'),
        settingsModal:  document.getElementById('settings-modal'),
        settingSound:   document.getElementById('setting-sound'),
        settingCount:   document.getElementById('setting-count'),
        settingAutodeal: document.getElementById('setting-autodeal'),
    };
}

// ── Key loaded indicator ────────────────────────────────────────
export function showKeyLoaded(provider, masked) {
    const providerName = provider === PROVIDER.CLAUDE ? 'Claude' : 'OpenAI';
    // Paste row
    if (dom.keyPasteRow) dom.keyPasteRow.classList.add('loaded');
    if (dom.apiKeyInput) {
        dom.apiKeyInput.value = masked || '••••••••';
        dom.apiKeyInput.classList.add('loaded');
        dom.apiKeyInput.readOnly = true;
    }
    if (dom.btnKeyClear) dom.btnKeyClear.classList.remove('hidden');
    if (dom.btnKeyLoad)  dom.btnKeyLoad.classList.add('hidden');
    // Drop zone label
    dom.envLabel.textContent = `✓ ${providerName} key active`;
    // Provider badge
    dom.providerBadge.textContent = provider === PROVIDER.CLAUDE ? '🟣 Claude' : '🟢 OpenAI';
    dom.providerBadge.className = `provider-badge ${provider}`;
    dom.providerBadge.classList.remove('hidden');
}

export function showKeyError(msg) {
    dom.envLabel.textContent = `⚠ ${msg}`;
    if (dom.keyPasteRow) dom.keyPasteRow.classList.remove('loaded');
}

export function clearKeyUI() {
    if (dom.keyPasteRow) dom.keyPasteRow.classList.remove('loaded');
    if (dom.apiKeyInput) {
        dom.apiKeyInput.value = '';
        dom.apiKeyInput.classList.remove('loaded');
        dom.apiKeyInput.readOnly = false;
    }
    if (dom.btnKeyClear) dom.btnKeyClear.classList.add('hidden');
    if (dom.btnKeyLoad)  dom.btnKeyLoad.classList.remove('hidden');
    dom.envLabel.textContent = 'or drop .env file';
    dom.providerBadge.classList.add('hidden');
}

// ── Mode toggle display ─────────────────────────────────────────
export function updateModeToggle(mode) {
    if (mode === AGENT_MODE.AUTO) {
        dom.modeIcon.textContent = '▶▶';
        dom.modeLabel.textContent = 'Auto';
        dom.modeToggle.classList.add('auto-active');
    } else {
        dom.modeIcon.textContent = '▶';
        dom.modeLabel.textContent = 'Step';
        dom.modeToggle.classList.remove('auto-active');
    }
}

// ── Cards ───────────────────────────────────────────────────────
function createCardEl(card, animate = false) {
    const div = document.createElement('div');
    div.className = 'card';
    if (animate) div.classList.add('dealing');

    if (!card.faceUp) {
        div.classList.add('card-back');
    } else {
        const img = document.createElement('img');
        const path = `${DEFAULTS.CARD_ASSET_PATH}/${card.rank}_of_${card.suit}.svg`;
        img.src = path;
        img.alt = `${card.rank} of ${card.suit}`;
        img.loading = 'lazy';
        div.appendChild(img);
    }
    return div;
}

export function renderDealerHand(animate = false) {
    dom.dealerCards.innerHTML = '';
    const { dealerHand, phase } = getState();
    dealerHand.cards.forEach(card => {
        dom.dealerCards.appendChild(createCardEl(card, animate));
    });
    updateDealerScore(dealerHand, phase);
}

export function renderPlayerHand(animate = false) {
    dom.playerCards.innerHTML = '';
    const { playerHands, currentHandIndex } = getState();
    const hand = playerHands[currentHandIndex];
    if (!hand) return;
    hand.cards.forEach(card => {
        dom.playerCards.appendChild(createCardEl(card, animate));
    });
    updatePlayerScore(hand);
    renderHandTabs(playerHands, currentHandIndex);
}

export function addCardToDealer(card) {
    dom.dealerCards.appendChild(createCardEl(card, true));
}

export function addCardToPlayer(card) {
    dom.playerCards.appendChild(createCardEl(card, true));
}

export function flipDealerHoleCard() {
    const { dealerHand } = getState();
    const cards = dom.dealerCards.querySelectorAll('.card');
    if (cards.length < 2) return;

    const holeCardEl = cards[1];
    const holeCard = dealerHand.cards[1];

    holeCardEl.classList.add('flipping');
    setTimeout(() => {
        holeCardEl.classList.remove('card-back');
        holeCardEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = `${DEFAULTS.CARD_ASSET_PATH}/${holeCard.rank}_of_${holeCard.suit}.svg`;
        img.alt = `${holeCard.rank} of ${holeCard.suit}`;
        holeCardEl.appendChild(img);
        holeCardEl.classList.remove('flipping');
        updateDealerScore(dealerHand, getState().phase);
    }, 180);
}

function updateDealerScore(hand, phase) {
    const score = hand.cards.length === 0 ? '—' : hand.visibleScore;
    dom.dealerScore.textContent = score === 0 ? '—' : score;
    dom.dealerScore.className = 'score-badge';
    if (phase !== GAME_PHASE.RESOLUTION && phase !== GAME_PHASE.DEALER_TURN) return;
    if (hand.isBusted) dom.dealerScore.classList.add('bust');
    else if (hand.isBlackjack) dom.dealerScore.classList.add('bj');
}

function updatePlayerScore(hand) {
    if (!hand || hand.cards.length === 0) {
        dom.playerScore.textContent = '—';
        dom.playerScore.className = 'score-badge';
        return;
    }
    const { total, isSoft } = hand.getScore();
    dom.playerScore.textContent = `${total}${isSoft ? ' soft' : ''}`;
    dom.playerScore.className = 'score-badge';
    if (hand.isBusted) dom.playerScore.classList.add('bust');
    else if (hand.isBlackjack) dom.playerScore.classList.add('bj');
    else if (isSoft) dom.playerScore.classList.add('soft');
}

function renderHandTabs(hands, activeIdx) {
    dom.handTabs.innerHTML = '';
    if (hands.length <= 1) return;
    hands.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.className = `hand-tab${i === activeIdx ? ' active' : ''}`;
        btn.textContent = `Hand ${i + 1}`;
        dom.handTabs.appendChild(btn);
    });
}

// ── Strategy matrix ─────────────────────────────────────────────
export function refreshStrategyMatrix() {
    const { playerHands, currentHandIndex, dealerHand } = getState();
    const hand = playerHands?.[currentHandIndex];
    const dealerUp = getDealerUpCard(dealerHand);
    renderStrategyMatrix(dom.strategyMatrix, hand?.cards?.length >= 2 ? hand : null, dealerUp);
}

export function refreshMatrixHighlight() {
    const { playerHands, currentHandIndex, dealerHand } = getState();
    const hand = playerHands?.[currentHandIndex];
    const dealerUp = getDealerUpCard(dealerHand);
    if (hand?.cards?.length >= 2 && dealerUp) {
        updateHighlight(dom.strategyMatrix, hand, dealerUp);
    }
}

// ── Message ─────────────────────────────────────────────────────
export function showMessage(text, type = '') {
    dom.gameMessage.textContent = text;
    dom.messageStrip.className = `message-strip${type ? ' ' + type : ''}`;
}

// ── Buttons ─────────────────────────────────────────────────────
const RISK_DESCS = {
    conservative: 'Prefer standing, minimize bust risk, fewer doubles/splits.',
    balanced:     'Standard basic strategy for optimal expected value.',
    aggressive:   'Exploit doubles & splits, maximize expected value aggressively.'
};

export function updateButtons() {
    const state = getState();
    const { phase, playerHands, currentHandIndex, bankroll, currentBet, agentMode, agentThinking } = state;
    const hand = playerHands[currentHandIndex];
    const isTurn = phase === GAME_PHASE.PLAYER_TURN || phase === GAME_PHASE.SPLIT_TURN;
    const isBetting = phase === GAME_PHASE.BETTING;
    const isResolution = phase === GAME_PHASE.RESOLUTION;

    // Betting controls — show row in both BETTING and RESOLUTION phases
    dom.betRow.classList.toggle('hidden', !isBetting && !isResolution);
    dom.chipRack.classList.toggle('hidden', !isBetting);
    dom.btnClearBet.classList.toggle('hidden', !isBetting);
    dom.btnDeal.classList.toggle('hidden', isResolution);
    dom.btnNewRound.classList.toggle('hidden', !isResolution);

    if (isBetting) {
        dom.btnDeal.disabled = currentBet < DEFAULTS.MIN_BET || !state.apiKey;
    }

    // Action buttons — always hidden since agent plays
    dom.actionRow.classList.add('hidden');

    // Insurance
    dom.insuranceRow.classList.toggle('hidden', phase !== GAME_PHASE.INSURANCE);

    // Execute button (step mode only)
    const showExecute = isTurn && agentMode === AGENT_MODE.STEP && state.lastAgentDecision && !agentThinking;
    dom.executeRow.classList.toggle('hidden', !showExecute);

    // Betting amount
    dom.betAmount.textContent = `$${currentBet}`;
    dom.bankrollAmount.textContent = `$${bankroll.toLocaleString()}`;
}

// ── Agent panel ─────────────────────────────────────────────────
export function showAgentThinking() {
    dom.agentCard.classList.add('thinking');
    dom.thinkingDots.classList.remove('hidden');
    dom.agentIdle.classList.add('hidden');
    dom.agentDecision.classList.remove('hidden');
}

export function showAgentDecision(decision, explainLevel) {
    dom.agentCard.classList.remove('thinking');
    dom.thinkingDots.classList.add('hidden');
    dom.agentIdle.classList.add('hidden');
    dom.agentDecision.classList.remove('hidden');

    const actionLabel = decision.action.charAt(0).toUpperCase() + decision.action.slice(1).toLowerCase();
    dom.decisionAction.textContent = actionLabel;
    dom.decisionAction.className = `decision-action action-${decision.action.toLowerCase()}`;

    const pct = Math.round(decision.confidence * 100);
    dom.confidenceBar.style.width = `${pct}%`;
    dom.confidencePct.textContent = `${pct}%`;

    dom.decisionReasoning.textContent = decision.reasoning || '';

    if (decision.statisticalBasis && explainLevel !== 'basic') {
        dom.decisionStats.textContent = decision.statisticalBasis;
        dom.decisionStats.classList.remove('hidden');
    } else {
        dom.decisionStats.classList.add('hidden');
    }

    if (decision.detailedAnalysis && explainLevel === 'indepth') {
        dom.decisionDeep.textContent = decision.detailedAnalysis;
        dom.decisionDeep.classList.remove('hidden');
    } else {
        dom.decisionDeep.classList.add('hidden');
    }

    if (decision.strategyMatch !== null) {
        dom.strategyMatch.textContent = decision.strategyMatch
            ? '✓ Matches basic strategy'
            : '⚠ Deviates from basic strategy';
        dom.strategyMatch.className = `strategy-match ${decision.strategyMatch ? 'match' : 'mismatch'}`;
    } else {
        dom.strategyMatch.textContent = '';
    }

    // Update execute button label
    dom.executeActionLabel.textContent = actionLabel;
}

export function showAgentIdle() {
    dom.agentCard.classList.remove('thinking');
    dom.thinkingDots.classList.add('hidden');
    dom.agentIdle.classList.remove('hidden');
    dom.agentDecision.classList.add('hidden');
}

export function showAgentError(msg) {
    dom.agentCard.classList.remove('thinking');
    dom.thinkingDots.classList.add('hidden');
    dom.agentIdle.classList.remove('hidden');
    dom.agentIdle.innerHTML = `<p style="color:var(--lose);font-size:11px">⚠ ${msg}</p>`;
    dom.agentDecision.classList.add('hidden');
}

// ── Shoe / count info ───────────────────────────────────────────
export function updateShoeInfo() {
    const { shoe, settings } = getState();
    if (shoe) dom.shoeDisplay.textContent = `Shoe: ${shoe.cardsRemaining}`;

    if (settings.countEnabled) {
        dom.countDisplay.removeAttribute('hidden');
    } else {
        dom.countDisplay.setAttribute('hidden', '');
    }
}

export function updateCountDisplay(running, trueCount) {
    dom.countDisplay.textContent = `Count: ${running > 0 ? '+' : ''}${running} (TC ${trueCount > 0 ? '+' : ''}${trueCount.toFixed(1)})`;
}

// ── Analytics bar ───────────────────────────────────────────────
export function updateAnalyticsBar() {
    const s = getAnalyticsSummary();

    dom.statHands.textContent = s.handsPlayed;
    dom.statWinrate.textContent = s.winRate !== null ? `${s.winRate}%` : '—';

    const pnl = s.netProfit;
    dom.statPnl.textContent = `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl)}`;
    dom.statPnl.className = pnl > 0 ? 'pnl-positive' : pnl < 0 ? 'pnl-negative' : 'pnl-neutral';

    dom.statQuality.textContent = s.decisionQuality !== null ? `${s.decisionQuality}%` : '—';

    updateSparkline(s.sparkline);
}

function updateSparkline(values) {
    if (!values || values.length < 2) { dom.sparklineLine.setAttribute('points', ''); return; }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const w = 120, h = 26;
    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = range === 0 ? h / 2 : h - ((v - min) / range) * (h - 2) + 1;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    dom.sparklineLine.setAttribute('points', pts);
}

// ── Analytics modal ─────────────────────────────────────────────
export function updateAnalyticsModal() {
    const s = getAnalyticsSummary();
    const q = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    q('modal-winrate',    s.winRate !== null ? `${s.winRate}%` : '—');
    q('modal-hands',      s.handsPlayed);
    q('modal-quality',    s.decisionQuality !== null ? `${s.decisionQuality}%` : '—');
    q('modal-blackjacks', s.blackjacks);
    const pnl = s.netProfit;
    q('modal-pnl', `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl)}`);
    q('modal-wagered', `$${s.totalWagered.toLocaleString()}`);

    // Bankroll chart
    const line = document.getElementById('bankroll-line');
    if (line) {
        const values = s.sparkline;
        if (values.length >= 2) {
            const min = Math.min(...values);
            const max = Math.max(...values);
            const range = max - min || 1;
            const pts = values.map((v, i) => {
                const x = (i / (values.length - 1)) * 398;
                const y = 98 - ((v - min) / range) * 96 + 1;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(' ');
            line.setAttribute('points', pts);
        }
    }
}

// ── Modal visibility ────────────────────────────────────────────
export function showAnalyticsModal() {
    updateAnalyticsModal();
    dom.analyticsModal.classList.remove('hidden');
}
export function hideAnalyticsModal() { dom.analyticsModal.classList.add('hidden'); }

export function showSettingsModal() { dom.settingsModal.classList.remove('hidden'); }
export function hideSettingsModal() { dom.settingsModal.classList.add('hidden'); }

// ── Risk profile / explain level UI ────────────────────────────
export function updateRiskDisplay(profile) {
    dom.riskControl.querySelectorAll('.risk-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === profile);
    });
    dom.riskDesc.textContent = RISK_DESCS[profile] || '';
}

export function updateExplainDisplay(level) {
    dom.explainControl.querySelectorAll('.seg-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === level);
    });
}

// ── Score refresh (without re-rendering cards) ──────────────────
export function refreshScores() {
    const { playerHands, currentHandIndex, dealerHand, phase } = getState();
    const hand = playerHands[currentHandIndex];
    if (hand) updatePlayerScore(hand);
    updateDealerScore(dealerHand, phase);
}

// ── Clear table ─────────────────────────────────────────────────
export function clearCardRows() {
    dom.dealerCards.innerHTML = '';
    dom.playerCards.innerHTML = '';
    dom.handTabs.innerHTML = '';
    dom.dealerScore.textContent = '—';
    dom.dealerScore.className = 'score-badge';
    dom.playerScore.textContent = '—';
    dom.playerScore.className = 'score-badge';
}

// ── Animations ──────────────────────────────────────────────────
export function shakePlayerCards() {
    dom.playerCards.classList.add('shaking');
    setTimeout(() => dom.playerCards.classList.remove('shaking'), 450);
}

export function pulseWin() {
    dom.playerCards.classList.add('winning');
    setTimeout(() => dom.playerCards.classList.remove('winning'), 600);
}

// ── DOM refs getter (for input.js) ─────────────────────────────
export function getDom() { return dom; }
