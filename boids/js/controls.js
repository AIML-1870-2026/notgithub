export const params = {
    boidCount: 100,
    maxSpeed: 4,
    perceptionRadius: 50,
    separationWeight: 1.5,
    alignmentWeight: 1.0,
    cohesionWeight: 1.0,
    predatorSpeed: 4.5
};

const presets = {
    default: {
        boidCount: 100,
        maxSpeed: 4,
        perceptionRadius: 50,
        separationWeight: 1.5,
        alignmentWeight: 1.0,
        cohesionWeight: 1.0,
        predatorSpeed: 4.5
    },
    murmuration: {
        boidCount: 250,
        maxSpeed: 5,
        perceptionRadius: 120,
        separationWeight: 1.2,
        alignmentWeight: 1.8,
        cohesionWeight: 2.2,
        predatorSpeed: 5.5
    },
    school: {
        boidCount: 150,
        maxSpeed: 3.5,
        perceptionRadius: 60,
        separationWeight: 0.8,
        alignmentWeight: 2.5,
        cohesionWeight: 1.8,
        predatorSpeed: 4.0
    },
    swarm: {
        boidCount: 200,
        maxSpeed: 8,
        perceptionRadius: 35,
        separationWeight: 2.8,
        alignmentWeight: 0.4,
        cohesionWeight: 0.5,
        predatorSpeed: 7.0
    },
    lazy: {
        boidCount: 80,
        maxSpeed: 1.5,
        perceptionRadius: 130,
        separationWeight: 1.0,
        alignmentWeight: 1.5,
        cohesionWeight: 1.2,
        predatorSpeed: 2.0
    }
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

    const presetButtons = document.querySelectorAll('.preset-btn');
    const togglePanel = document.getElementById('togglePanel');
    const controlsBody = document.getElementById('controlsBody');

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

    function applyPreset(presetName) {
        const preset = presets[presetName];
        if (!preset) return;

        for (const [key, value] of Object.entries(preset)) {
            if (sliders[key]) {
                sliders[key].value = value;
                updateSlider(key);
            }
        }

        presetButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === presetName);
        });
    }

    function clearActivePreset() {
        presetButtons.forEach(btn => btn.classList.remove('active'));
    }

    for (const name of Object.keys(sliders)) {
        sliders[name].addEventListener('input', () => {
            updateSlider(name);
            clearActivePreset();
        });
    }

    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            applyPreset(btn.dataset.preset);
        });
    });

    // Panel collapse toggle
    togglePanel.addEventListener('click', () => {
        controlsBody.classList.toggle('collapsed');
        togglePanel.classList.toggle('collapsed');
        togglePanel.setAttribute('data-tooltip',
            controlsBody.classList.contains('collapsed') ? 'Expand panel' : 'Collapse panel'
        );
    });

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
        applyPreset('default');
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
        isPaused: () => paused,
        applyPreset
    };
}
