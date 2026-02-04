export const params = {
    boidCount: 100,
    maxSpeed: 4,
    perceptionRadius: 50,
    separationWeight: 1.5,
    alignmentWeight: 1.0,
    cohesionWeight: 1.0,
    predatorSpeed: 4.5
};

export function initControls(flock, callbacks = {}) {
    const sliders = {
        boidCount: document.getElementById('boidCount'),
        maxSpeed: document.getElementById('maxSpeed'),
        perceptionRadius: document.getElementById('perceptionRadius'),
        separationWeight: document.getElementById('separationWeight'),
        alignmentWeight: document.getElementById('alignmentWeight'),
        cohesionWeight: document.getElementById('cohesionWeight'),
        predatorSpeed: document.getElementById('predatorSpeed')
    };

    const values = {
        boidCount: document.getElementById('boidCountValue'),
        maxSpeed: document.getElementById('maxSpeedValue'),
        perceptionRadius: document.getElementById('perceptionRadiusValue'),
        separationWeight: document.getElementById('separationWeightValue'),
        alignmentWeight: document.getElementById('alignmentWeightValue'),
        cohesionWeight: document.getElementById('cohesionWeightValue'),
        predatorSpeed: document.getElementById('predatorSpeedValue')
    };

    const buttons = {
        addPredator: document.getElementById('addPredator'),
        removePredator: document.getElementById('removePredator'),
        clearObstacles: document.getElementById('clearObstacles'),
        reset: document.getElementById('reset'),
        pausePlay: document.getElementById('pausePlay')
    };

    function updateSlider(name) {
        const slider = sliders[name];
        const valueDisplay = values[name];
        const value = parseFloat(slider.value);

        params[name] = value;
        valueDisplay.textContent = value;

        if (name === 'boidCount') {
            flock.setBoidCount(value);
        }
    }

    for (const name of Object.keys(sliders)) {
        sliders[name].addEventListener('input', () => updateSlider(name));
    }

    buttons.addPredator.addEventListener('click', () => {
        flock.addPredator();
    });

    buttons.removePredator.addEventListener('click', () => {
        flock.removePredator();
    });

    buttons.clearObstacles.addEventListener('click', () => {
        flock.clearObstacles();
    });

    buttons.reset.addEventListener('click', () => {
        for (const name of Object.keys(sliders)) {
            sliders[name].value = sliders[name].defaultValue;
            updateSlider(name);
        }
        flock.reset();
    });

    let paused = false;
    buttons.pausePlay.addEventListener('click', () => {
        paused = !paused;
        buttons.pausePlay.textContent = paused ? 'Play' : 'Pause';
        buttons.pausePlay.classList.toggle('paused', paused);
        if (callbacks.onPauseToggle) {
            callbacks.onPauseToggle(paused);
        }
    });

    return {
        isPaused: () => paused
    };
}
