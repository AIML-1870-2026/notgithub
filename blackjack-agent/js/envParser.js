// envParser.js — Parse .env file or raw key string, persist to localStorage

import { PROVIDER } from './config.js';
import { setState } from './gameState.js';

const STORAGE_KEY = 'bja_api_key';
const STORAGE_PROVIDER = 'bja_provider';

/** Detect provider from key prefix. sk-ant- = Claude, sk- = OpenAI. */
function detectProvider(key) {
    if (key.startsWith('sk-ant-')) return PROVIDER.CLAUDE;
    if (key.startsWith('sk-')) return PROVIDER.OPENAI;
    return null;
}

function applyKey(key, provider) {
    setState({ apiKey: key, provider });
    localStorage.setItem(STORAGE_KEY, key);
    localStorage.setItem(STORAGE_PROVIDER, provider);
    const masked = key.slice(0, 7) + '••••••••' + key.slice(-4);
    console.log(`[Agent] ${provider === PROVIDER.CLAUDE ? 'Anthropic Claude' : 'OpenAI'} key loaded (${masked})`);
    return { provider, masked };
}

/**
 * Load a raw API key string pasted by the user.
 * Auto-detects provider from key prefix.
 */
export function loadKeyFromString(raw) {
    const key = raw.trim().replace(/^['"]|['"]$/g, '');
    if (!key) throw new Error('Key cannot be empty.');

    const provider = detectProvider(key);
    if (!provider) throw new Error('Unrecognised key format. Expected sk-ant-… (Claude) or sk-… (OpenAI).');

    return applyKey(key, provider);
}

/**
 * Parse a .env file and extract the API key + provider.
 * @param {File} file
 * @returns {Promise<{ provider: string, masked: string }>}
 */
export async function parseEnvFile(file) {
    const text = await file.text();
    const lines = text.split(/\r?\n/);

    let key = null;
    let provider = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;

        const varName = trimmed.slice(0, eqIdx).trim();
        const varVal = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');

        if (varName === 'ANTHROPIC_API_KEY' && varVal) {
            key = varVal; provider = PROVIDER.CLAUDE;
        } else if (varName === 'OPENAI_API_KEY' && varVal) {
            key = varVal; provider = PROVIDER.OPENAI;
        }
    }

    if (!key || !provider) {
        // Fallback: treat entire file content as a raw key
        const raw = text.trim();
        const detected = detectProvider(raw);
        if (detected) return applyKey(raw, detected);
        throw new Error('No valid API key found. Expected ANTHROPIC_API_KEY or OPENAI_API_KEY.');
    }

    return applyKey(key, provider);
}

/** Restore key from localStorage on page load. Returns { provider, masked } or null. */
export function restoreStoredKey() {
    const key = localStorage.getItem(STORAGE_KEY);
    const provider = localStorage.getItem(STORAGE_PROVIDER);
    if (!key || !provider) return null;

    setState({ apiKey: key, provider });
    const masked = key.slice(0, 7) + '••••••••' + key.slice(-4);
    console.log(`[Agent] Restored ${provider} key from localStorage (${masked})`);
    return { provider, masked };
}

/** Remove stored key. */
export function clearStoredKey() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_PROVIDER);
    setState({ apiKey: null });
}
