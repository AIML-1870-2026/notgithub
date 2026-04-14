/**
 * prompts.js — Builds system and user prompts for experiment generation.
 */

/**
 * Build a system + user prompt pair from the given parameters.
 *
 * @param {object} opts
 * @param {string} opts.subject       e.g. "Chemistry"
 * @param {string} opts.gradeLevel    e.g. "6–8 (Ages 11–14)"
 * @param {string} opts.supplies      free-text list of available materials
 * @param {string} opts.context       optional additional context
 * @param {number} opts.difficulty    0–100
 * @param {number} opts.duration      0–100
 * @param {number} opts.detail        0–100
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildPrompts({ subject, gradeLevel, supplies, context, difficulty, duration, detail }) {
  const diffDesc   = _difficultyDesc(difficulty);
  const durationDesc = _durationDesc(duration);
  const detailDesc = _detailDesc(detail);

  const systemPrompt = [
    'You are an expert science educator who creates engaging, safe, hands-on experiments.',
    'Structure your response with these markdown sections:',
    '## 🔬 Experiment Title',
    '## 🎯 Learning Objectives',
    '## 📚 Background',
    '## 🧪 Materials Needed',
    '## ⚠️ Safety Notes',
    '## 📋 Step-by-Step Procedure',
    '## 💡 What\'s Happening?',
    '## 🚀 Extensions & Variations',
    '',
    'Use clear, numbered steps for the procedure. Use bullet points for materials lists.',
    'Write at a language level appropriate for the specified grade.',
    '',
    `Difficulty: ${diffDesc}`,
    `Duration: ${durationDesc}`,
    `Detail: ${detailDesc}`,
  ].join('\n');

  const parts = [
    `Subject: ${subject}`,
    `Grade Level: ${gradeLevel}`,
    `Available Supplies: ${supplies}`,
  ];
  if (context?.trim()) parts.push(`Additional Context: ${context.trim()}`);
  parts.push('\nGenerate a complete, safe, and engaging science experiment using the listed supplies. If common household items are needed beyond the list, note them clearly in the materials section.');

  return { systemPrompt, userPrompt: parts.join('\n') };
}

function _difficultyDesc(v) {
  if (v <= 25) return 'Beginner — simple concepts, minimal steps, avoid advanced measurements or calculations';
  if (v <= 75) return 'Intermediate — moderate complexity, multi-step procedure, some measurements and observations';
  return 'Advanced — complex concepts, precise measurements, data tables, quantitative analysis';
}

function _durationDesc(v) {
  if (v <= 25) return 'Quick (under 15 minutes) — ideal for a demo or warm-up activity';
  if (v <= 75) return 'Standard (30–50 minutes) — fits within a single class period';
  return 'Extended (60–90+ minutes) — in-depth investigation, may span multiple sessions';
}

function _detailDesc(v) {
  if (v <= 25) return 'Simple overview — key steps and core concept only';
  if (v <= 75) return 'Standard — clear procedure with solid explanations';
  return 'Comprehensive — full scientific explanation, data recording tables, error analysis, real-world connections';
}
