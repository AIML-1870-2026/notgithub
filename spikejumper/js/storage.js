// ── localStorage Wrapper ──

const STORAGE_KEY = 'spikeJumper';

function load() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

function save(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* quota exceeded or private mode */ }
}

export function getSettings() {
    const data = load();
    return data.settings || {
        masterVolume: 0.7,
        sfxVolume: 1.0,
        musicVolume: 0.4
    };
}

export function saveSettings(settings) {
    const data = load();
    data.settings = settings;
    save(data);
}

export function getBestScore(levelIndex) {
    const data = load();
    if (!data.scores) return { bestProgress: 0, bestAttempts: 0, completed: false };
    return data.scores[levelIndex] || { bestProgress: 0, bestAttempts: 0, completed: false };
}

export function saveLevelScore(levelIndex, progress, attempts) {
    const data = load();
    if (!data.scores) data.scores = {};
    const existing = data.scores[levelIndex] || { bestProgress: 0, bestAttempts: Infinity, completed: false };

    if (progress > existing.bestProgress) {
        existing.bestProgress = progress;
    }
    if (progress >= 100) {
        existing.completed = true;
        if (attempts < existing.bestAttempts || existing.bestAttempts === 0) {
            existing.bestAttempts = attempts;
        }
    }

    data.scores[levelIndex] = existing;
    save(data);
}

export function getAllScores() {
    const data = load();
    return data.scores || {};
}
