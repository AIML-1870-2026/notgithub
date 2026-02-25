// sound.js — Web Audio API synthesized sound effects

let audioCtx = null;
let isMuted = false;
let isInitialized = false;

function initAudio() {
    if (isInitialized) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        isInitialized = true;

        // Load mute preference
        const saved = localStorage.getItem('blackjack_muted');
        if (saved === 'true') isMuted = true;
    } catch (e) {
        // Web Audio not supported
    }
}

function playTone(freq, duration, type = 'square', volume = 0.15) {
    if (!audioCtx || isMuted) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration, volume = 0.08) {
    if (!audioCtx || isMuted) return;

    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    // High-pass filter for crisp sound
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    source.start(audioCtx.currentTime);
}

export function play(soundName) {
    initAudio();
    if (!audioCtx || isMuted) return;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    switch (soundName) {
        case 'card-deal':
            playNoise(0.08, 0.12);
            playTone(800, 0.05, 'square', 0.05);
            break;

        case 'card-flip':
            playNoise(0.06, 0.1);
            playTone(1200, 0.04, 'square', 0.06);
            break;

        case 'chip-place':
            playTone(600, 0.08, 'square', 0.1);
            setTimeout(() => playTone(900, 0.06, 'square', 0.06), 30);
            break;

        case 'win':
            playTone(523, 0.15, 'square', 0.12);
            setTimeout(() => playTone(659, 0.15, 'square', 0.12), 100);
            setTimeout(() => playTone(784, 0.2, 'square', 0.12), 200);
            setTimeout(() => playTone(1047, 0.3, 'square', 0.1), 300);
            break;

        case 'blackjack':
            playTone(523, 0.12, 'square', 0.12);
            setTimeout(() => playTone(659, 0.12, 'square', 0.12), 80);
            setTimeout(() => playTone(784, 0.12, 'square', 0.12), 160);
            setTimeout(() => playTone(1047, 0.12, 'square', 0.12), 240);
            setTimeout(() => playTone(1319, 0.3, 'square', 0.1), 320);
            break;

        case 'lose':
            playTone(400, 0.2, 'square', 0.1);
            setTimeout(() => playTone(300, 0.2, 'square', 0.1), 150);
            setTimeout(() => playTone(200, 0.3, 'square', 0.08), 300);
            break;

        case 'bust':
            playTone(300, 0.15, 'sawtooth', 0.1);
            setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.08), 100);
            break;

        case 'push':
            playTone(440, 0.15, 'triangle', 0.1);
            setTimeout(() => playTone(440, 0.15, 'triangle', 0.1), 200);
            break;

        case 'shuffle':
            for (let i = 0; i < 8; i++) {
                setTimeout(() => playNoise(0.03, 0.06), i * 40);
            }
            break;

        case 'button':
            playTone(1000, 0.03, 'square', 0.06);
            break;
    }
}

export function mute() {
    isMuted = true;
    localStorage.setItem('blackjack_muted', 'true');
}

export function unmute() {
    initAudio();
    isMuted = false;
    localStorage.setItem('blackjack_muted', 'false');
}

export function toggleMute() {
    if (isMuted) unmute();
    else mute();
    return isMuted;
}

export function isSoundMuted() {
    return isMuted;
}

export function ensureInitialized() {
    initAudio();
}
