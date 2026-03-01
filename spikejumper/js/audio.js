// ── Audio System (Web Audio API - Synthesized) ──

let audioCtx = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;
let musicPlaying = false;
let musicInterval = null;
let initialized = false;

export function initAudio() {
    if (initialized) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        sfxGain = audioCtx.createGain();
        musicGain = audioCtx.createGain();

        sfxGain.connect(masterGain);
        musicGain.connect(masterGain);
        masterGain.connect(audioCtx.destination);

        masterGain.gain.value = 0.7;
        sfxGain.gain.value = 1.0;
        musicGain.gain.value = 0.4;

        initialized = true;
    } catch (e) {
        console.warn('Web Audio not available:', e);
    }
}

export function resumeContext() {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone(freq, duration, type, volume = 0.1) {
    if (!audioCtx || !initialized) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration + 0.05);
}

function playNoise(duration, volume = 0.1) {
    if (!audioCtx || !initialized) return;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    source.connect(gain);
    gain.connect(sfxGain);
    source.start();
}

function playFilteredTone(freq, duration, type, filterFreq, volume = 0.1) {
    if (!audioCtx || !initialized) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc.type = type;
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 5;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration + 0.05);
}

const SOUNDS = {
    jump() {
        playTone(520, 0.1, 'square', 0.08);
        playTone(680, 0.08, 'square', 0.05);
    },
    double_jump() {
        playTone(600, 0.06, 'square', 0.07);
        setTimeout(() => playTone(800, 0.08, 'square', 0.06), 50);
    },
    land() {
        playNoise(0.05, 0.06);
        playTone(120, 0.06, 'sine', 0.04);
    },
    death() {
        playTone(300, 0.15, 'sawtooth', 0.1);
        playTone(200, 0.25, 'sawtooth', 0.08);
        playNoise(0.2, 0.08);
    },
    portal_enter() {
        playTone(800, 0.1, 'sine', 0.08);
        setTimeout(() => playTone(1200, 0.15, 'sine', 0.06), 60);
        setTimeout(() => playTone(1600, 0.1, 'sine', 0.04), 120);
    },
    menu_select() {
        playTone(1000, 0.04, 'square', 0.05);
    },
    menu_hover() {
        playTone(800, 0.02, 'sine', 0.03);
    },
    level_complete() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => {
            setTimeout(() => playTone(f, 0.2, 'square', 0.07), i * 120);
        });
    }
};

export function play(name) {
    if (SOUNDS[name]) {
        SOUNDS[name]();
    }
}

// ── Procedural Music ──
const MUSIC_NOTES = {
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
    'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63
};

const BASS_SEQUENCE = [
    ['C3', 2], ['C3', 1], ['E3', 1], ['G3', 2], ['A3', 1], ['G3', 1],
    ['F3', 2], ['F3', 1], ['A3', 1], ['C4', 2], ['B3', 1], ['A3', 1],
    ['G3', 2], ['G3', 1], ['E3', 1], ['D3', 2], ['E3', 1], ['G3', 1],
    ['C3', 2], ['E3', 1], ['G3', 1], ['A3', 2], ['G3', 1], ['E3', 1],
];

const ARP_SEQUENCE = [
    ['E4', 0.5], ['G3', 0.5], ['C4', 0.5], ['E4', 0.5],
    ['D4', 0.5], ['G3', 0.5], ['B3', 0.5], ['D4', 0.5],
    ['C4', 0.5], ['E3', 0.5], ['A3', 0.5], ['C4', 0.5],
    ['E4', 0.5], ['C4', 0.5], ['G3', 0.5], ['E4', 0.5],
];

let bassIndex = 0;
let arpIndex = 0;
let beatAccumulator = 0;
let arpAccumulator = 0;

export function startMusic(bpm = 120) {
    if (!audioCtx || !initialized || musicPlaying) return;
    musicPlaying = true;
    bassIndex = 0;
    arpIndex = 0;
    beatAccumulator = 0;
    arpAccumulator = 0;

    const beatDuration = 60 / bpm;

    musicInterval = setInterval(() => {
        if (!musicPlaying) return;

        // Bass line
        const [bassNote, bassDur] = BASS_SEQUENCE[bassIndex % BASS_SEQUENCE.length];
        const bassFreq = MUSIC_NOTES[bassNote];
        if (bassFreq) {
            playMusicNote(bassFreq, bassDur * beatDuration * 0.8, 'sawtooth', 0.06, 400);
        }
        bassIndex++;

        // Arpeggio (every half beat)
        const [arpNote, arpDur] = ARP_SEQUENCE[arpIndex % ARP_SEQUENCE.length];
        const arpFreq = MUSIC_NOTES[arpNote];
        if (arpFreq) {
            playMusicNote(arpFreq, arpDur * beatDuration * 0.6, 'sine', 0.03, 2000);
        }
        arpIndex++;
    }, (beatDuration * 1000) / 2);
}

function playMusicNote(freq, duration, type, volume, filterFreq) {
    if (!audioCtx || !initialized) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = type;
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 2;

    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration + 0.05);
}

export function stopMusic() {
    musicPlaying = false;
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
}

export function setVolume(master, sfx, music) {
    if (!initialized) return;
    if (master !== undefined) masterGain.gain.value = master;
    if (sfx !== undefined) sfxGain.gain.value = sfx;
    if (music !== undefined) musicGain.gain.value = music;
}

export function isInitialized() {
    return initialized;
}
