// Comparison mode: overlay toggle with draggable slider divider
// Core logic is handled by renderer.js and controls.js
// This module provides utility for divider positioning relative to the canvas

export function initComparison(canvas) {
    const divider = document.getElementById('comparison-divider');
    const container = document.getElementById('canvas-container');

    function updateDividerPosition(dividerPos) {
        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const x = canvasRect.left - containerRect.left + dividerPos * canvasRect.width;
        divider.style.left = x + 'px';
    }

    // Center the divider initially
    updateDividerPosition(0.5);

    // Update on resize
    const observer = new ResizeObserver(() => {
        if (!divider.classList.contains('hidden')) {
            updateDividerPosition(0.5);
        }
    });
    observer.observe(container);

    return { updateDividerPosition };
}
