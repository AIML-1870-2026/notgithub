// animations.js — Card deal/flip animations, particle effects

import { DEFAULTS } from './config.js';

const SPEED = DEFAULTS.ANIMATION_SPEED_MS;

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function dealCardAnimation(cardElement) {
    cardElement.classList.add('card-dealing');
    await delay(SPEED);
    cardElement.classList.remove('card-dealing');
}

export async function flipCardAnimation(cardElement, newSrc) {
    cardElement.classList.add('card-flipping');

    // Swap image at midpoint of animation
    await delay(SPEED / 2);
    const img = cardElement.querySelector('img');
    if (img) {
        img.src = newSrc;
    } else {
        // Was a card-back div, replace with img
        cardElement.classList.remove('card-back');
        cardElement.innerHTML = `<img src="${newSrc}" alt="card">`;
    }

    await delay(SPEED / 2);
    cardElement.classList.remove('card-flipping');
}

export async function collectCardsAnimation(containerElement) {
    const cards = containerElement.querySelectorAll('.card');
    cards.forEach(card => card.classList.add('card-collecting'));
    await delay(SPEED);
    containerElement.innerHTML = '';
}

export function scorePopAnimation(element) {
    element.classList.remove('score-popping');
    void element.offsetWidth; // Trigger reflow
    element.classList.add('score-popping');
}

export function shakeAnimation(element) {
    element.classList.remove('shaking');
    void element.offsetWidth;
    element.classList.add('shaking');
}

export function winPulseAnimation(element) {
    element.classList.remove('win-pulsing');
    void element.offsetWidth;
    element.classList.add('win-pulsing');
}

export function createParticleBurst(x, y, color = '#ffd700', count = 12) {
    const container = document.createElement('div');
    container.className = 'particle-container';
    container.style.left = x + 'px';
    container.style.top = y + 'px';

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.background = color;

        const angle = (Math.PI * 2 * i) / count;
        const distance = 40 + Math.random() * 60;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        particle.style.setProperty('--dx', dx + 'px');
        particle.style.setProperty('--dy', dy + 'px');

        container.appendChild(particle);
    }

    document.body.appendChild(container);

    setTimeout(() => container.remove(), 1000);
}

export function messageAppearAnimation(element) {
    element.classList.remove('message-appearing');
    void element.offsetWidth;
    element.classList.add('message-appearing');
}
