// agent.js — LLM decision engine for Blackjack AI agent

import { PROVIDER, RISK_PROFILE, EXPLAIN_LEVEL, ACTION, GAME_PHASE } from './config.js';
import { getHintCode } from './strategy.js';
import { getDealerUpCard } from './dealer.js';

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const OPENAI_MODEL = 'gpt-4o-mini';

function buildPrompt(gameState) {
    const { playerHands, currentHandIndex, dealerHand, riskProfile, explainLevel,
        currentBet, bankroll, shoe } = gameState;

    const hand = playerHands[currentHandIndex];
    const { total, isSoft } = hand.getScore();
    const dealerUp = getDealerUpCard(dealerHand);
    const dealerUpStr = dealerUp ? `${dealerUp.rank} of ${dealerUp.suit}` : 'unknown';

    const playerCards = hand.cards.map(c => `${c.rank} of ${c.suit}`).join(', ');
    const softLabel = isSoft ? 'soft' : 'hard';

    const availableActions = [];
    if (!hand.isBusted && !hand.isStanding) availableActions.push('HIT');
    availableActions.push('STAND');
    if (hand.canDoubleDown && bankroll >= currentBet) availableActions.push('DOUBLE');
    if (hand.canSplit && bankroll >= currentBet && playerHands.length < 4) availableActions.push('SPLIT');

    const riskInstructions = {
        [RISK_PROFILE.CONSERVATIVE]: 'Prioritize avoiding busts. Prefer standing when bust risk exceeds 40%. Only double down when holding hard 10 or 11 against dealer 2-8. Never split 4s, 5s, or 6s.',
        [RISK_PROFILE.BALANCED]: 'Follow standard basic strategy for optimal expected value.',
        [RISK_PROFILE.AGGRESSIVE]: 'Maximize expected value through aggressive doubling and splitting. Double down on soft totals when favorable. Split pairs more liberally. Factor in the Hi-Lo count trend if provided.'
    };

    const explainInstructions = {
        [EXPLAIN_LEVEL.BASIC]: 'Keep "reasoning" to one short sentence. Omit statisticalBasis and detailedAnalysis.',
        [EXPLAIN_LEVEL.STATISTICAL]: 'Include win probability estimate and dealer bust probability in statisticalBasis.',
        [EXPLAIN_LEVEL.INDEPTH]: 'Provide a detailed paragraph in detailedAnalysis covering expected value, dealer bust probability, strategy table comparison, and how the risk profile influences this decision.'
    };

    const schema = explainLevel === EXPLAIN_LEVEL.INDEPTH
        ? `{
  "action": "HIT" | "STAND" | "DOUBLE" | "SPLIT",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<one sentence>",
  "statisticalBasis": "<win% and dealer bust%>",
  "riskAssessment": "low" | "medium" | "high",
  "detailedAnalysis": "<paragraph with EV, probabilities, and strategy rationale>"
}`
        : `{
  "action": "HIT" | "STAND" | "DOUBLE" | "SPLIT",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<one sentence>",
  "statisticalBasis": "<win% estimate>",
  "riskAssessment": "low" | "medium" | "high"
}`;

    return `You are a precise Blackjack AI advisor. Respond ONLY with valid JSON — no markdown, no prose, no explanation outside the JSON object.

JSON schema to use:
${schema}

Game state:
- Player hand: [${playerCards}] — ${softLabel} ${total}
- Dealer upcard: ${dealerUpStr}
- Current bet: $${currentBet}
- Bankroll: $${bankroll}
- Cards remaining in shoe: ${shoe ? shoe.cardsRemaining : 'unknown'}
- Available actions: ${availableActions.join(', ')}

Risk profile: ${riskProfile}
${riskInstructions[riskProfile]}

${explainInstructions[explainLevel]}

Only recommend actions from the available actions list. If DOUBLE or SPLIT are not listed, do not recommend them.`;
}

async function callClaude(prompt, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: 400,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Claude API error ${response.status}: ${err?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

async function callOpenAI(prompt, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: OPENAI_MODEL,
            max_tokens: 400,
            messages: [
                { role: 'system', content: 'You are a Blackjack AI advisor. Always respond with valid JSON only.' },
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error ${response.status}: ${err?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

function parseAgentResponse(rawText) {
    // Primary: direct parse
    try {
        return JSON.parse(rawText.trim());
    } catch (_) {}

    // Fallback: extract JSON block from text
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
        try {
            return JSON.parse(match[0]);
        } catch (_) {}
    }

    throw new Error('Could not parse agent response as JSON');
}

function normalizeAction(action) {
    const upper = String(action).toUpperCase().trim();
    const map = { HIT: ACTION.HIT, STAND: ACTION.STAND, DOUBLE: ACTION.DOUBLE, SPLIT: ACTION.SPLIT };
    return map[upper] || null;
}

/**
 * Get AI agent decision for current game state.
 * @param {object} gameState
 * @returns {Promise<{action, confidence, reasoning, statisticalBasis, riskAssessment, detailedAnalysis, strategyCode, strategyMatch, rawResponse}>}
 */
export async function getAgentDecision(gameState) {
    const { apiKey, provider } = gameState;

    if (!apiKey) throw new Error('No API key loaded. Please upload a .env file.');

    const prompt = buildPrompt(gameState);
    console.log('[Agent] Sending prompt to', provider === PROVIDER.CLAUDE ? 'Claude' : 'OpenAI');
    console.log('[Agent] Prompt:\n', prompt);

    let rawText;
    if (provider === PROVIDER.CLAUDE) {
        rawText = await callClaude(prompt, apiKey);
    } else {
        rawText = await callOpenAI(prompt, apiKey);
    }

    console.log('[Agent] Raw response:\n', rawText);

    const parsed = parseAgentResponse(rawText);
    const action = normalizeAction(parsed.action);

    if (!action) throw new Error(`Invalid action in response: "${parsed.action}"`);

    // Compare to basic strategy
    const hand = gameState.playerHands[gameState.currentHandIndex];
    const dealerUp = getDealerUpCard(gameState.dealerHand);
    const strategyCode = dealerUp ? getHintCode(hand, dealerUp) : null;
    const strategyActionMap = { H: ACTION.HIT, S: ACTION.STAND, D: ACTION.DOUBLE, P: ACTION.SPLIT };
    const strategyAction = strategyCode ? (strategyActionMap[strategyCode] || null) : null;
    const strategyMatch = strategyAction ? action === strategyAction : null;

    const decision = {
        action,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
        reasoning: parsed.reasoning || '',
        statisticalBasis: parsed.statisticalBasis || '',
        riskAssessment: parsed.riskAssessment || 'medium',
        detailedAnalysis: parsed.detailedAnalysis || '',
        strategyCode,
        strategyMatch,
        rawResponse: rawText,
        provider
    };

    console.log('[Agent] Decision:', decision);
    return decision;
}

export function canAutoPlay(gameState) {
    const { phase, agentThinking, apiKey } = gameState;
    return apiKey !== null
        && !agentThinking
        && (phase === GAME_PHASE.PLAYER_TURN || phase === GAME_PHASE.SPLIT_TURN);
}
