// ── Input Manager ──

const keys = {};
let jumpPressed = false;
let jumpJustPressed = false;
let jumpReleased = false;
let escapeJustPressed = false;
let touchActive = false;

export function initInput() {
    window.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!keys[e.key]) {
                jumpJustPressed = true;
            }
            keys[e.key] = true;
            jumpPressed = true;
        }
        if (e.key === 'Escape') {
            if (!keys[e.key]) {
                escapeJustPressed = true;
            }
            keys[e.key] = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === ' ' || e.key === 'ArrowUp') {
            keys[e.key] = false;
            jumpPressed = false;
            jumpReleased = true;
        }
        if (e.key === 'Escape') {
            keys[e.key] = false;
        }
    });

    // Touch support
    window.addEventListener('touchstart', (e) => {
        // Don't capture touches on menu buttons
        if (e.target.closest('#menu-overlay')) return;
        e.preventDefault();
        touchActive = true;
        jumpPressed = true;
        jumpJustPressed = true;
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        if (e.target.closest('#menu-overlay')) return;
        touchActive = false;
        jumpPressed = false;
        jumpReleased = true;
    });
}

export function isJumpPressed() {
    return jumpPressed;
}

export function consumeJumpPress() {
    if (jumpJustPressed) {
        jumpJustPressed = false;
        return true;
    }
    return false;
}

export function consumeJumpRelease() {
    if (jumpReleased) {
        jumpReleased = false;
        return true;
    }
    return false;
}

export function consumeEscape() {
    if (escapeJustPressed) {
        escapeJustPressed = false;
        return true;
    }
    return false;
}

export function clearInputState() {
    jumpJustPressed = false;
    jumpReleased = false;
    escapeJustPressed = false;
}
