export class UI {
    constructor(gameState, game) {
        this.gameState = gameState;
        this.game = game;

        this.screens = {
            menu: document.getElementById('menu-screen'),
            game: document.getElementById('game-screen'),
            pause: document.getElementById('pause-screen'),
            gameover: document.getElementById('gameover-screen'),
            settings: document.getElementById('settings-screen')
        };

        this.elements = {
            score: document.getElementById('score'),
            highScore: document.getElementById('high-score'),
            finalScore: document.getElementById('final-score'),
            finalHighScore: document.getElementById('final-high-score'),
            appleCount: document.getElementById('apple-count'),
            appleCountValue: document.getElementById('apple-count-value'),
            gameSpeed: document.getElementById('game-speed'),
            gameSpeedValue: document.getElementById('game-speed-value'),
            startLength: document.getElementById('start-length'),
            startLengthValue: document.getElementById('start-length-value'),
            snakeBodyColor: document.getElementById('snake-body-color'),
            snakeHeadColor: document.getElementById('snake-head-color'),
            appleColor: document.getElementById('apple-color'),
            cubeColor: document.getElementById('cube-color')
        };

        this.settings = this.loadSettings();
        this.setupEventListeners();
        this.setupGameStateListeners();
        this.applySettingsToUI();
        this.updateHighScore();
    }

    setupEventListeners() {
        // Menu screen
        document.getElementById('start-btn').addEventListener('click', () => {
            this.game.startGame();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showScreen('settings');
        });

        // Pause screen
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.gameState.resume();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.game.restartGame();
        });

        document.getElementById('settings-pause-btn').addEventListener('click', () => {
            this.showScreen('settings');
        });

        // Game over screen
        document.getElementById('restart-gameover-btn').addEventListener('click', () => {
            this.game.restartGame();
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.gameState.restart();
        });

        // Settings screen
        document.getElementById('close-settings-btn').addEventListener('click', () => {
            this.saveSettings();
            if (this.gameState.state === 'MENU') {
                this.showScreen('menu');
            } else if (this.gameState.state === 'PAUSED') {
                this.showScreen('pause');
            }
        });

        // Settings inputs
        this.elements.appleCount.addEventListener('input', (e) => {
            this.elements.appleCountValue.textContent = e.target.value;
        });

        this.elements.gameSpeed.addEventListener('input', (e) => {
            const speedLabels = { 1: 'Slow', 2: 'Medium', 3: 'Fast' };
            this.elements.gameSpeedValue.textContent = speedLabels[e.target.value];
        });

        this.elements.startLength.addEventListener('input', (e) => {
            this.elements.startLengthValue.textContent = e.target.value;
        });
    }

    setupGameStateListeners() {
        this.gameState.on('stateChange', (state) => {
            this.onStateChange(state);
        });

        this.gameState.on('scoreChange', (score) => {
            this.updateScore(score);
        });

        this.gameState.on('gameOver', (data) => {
            this.onGameOver(data);
        });
    }

    onStateChange(state) {
        switch(state) {
            case 'MENU':
                this.showScreen('menu');
                break;
            case 'PLAYING':
                this.showScreen('game');
                break;
            case 'PAUSED':
                this.showScreen('pause');
                break;
            case 'GAME_OVER':
                this.showScreen('gameover');
                break;
        }
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });

        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    updateScore(score) {
        this.elements.score.textContent = score;
    }

    updateHighScore() {
        const highScore = this.gameState.getHighScore();
        this.elements.highScore.textContent = highScore;
    }

    onGameOver(data) {
        this.elements.finalScore.textContent = data.score;
        this.elements.finalHighScore.textContent = data.highScore;
        this.updateHighScore();
    }

    getSettings() {
        return {
            appleCount: parseInt(this.elements.appleCount.value, 10),
            gameSpeed: parseInt(this.elements.gameSpeed.value, 10),
            startLength: parseInt(this.elements.startLength.value, 10),
            snakeBodyColor: this.elements.snakeBodyColor.value,
            snakeHeadColor: this.elements.snakeHeadColor.value,
            appleColor: this.elements.appleColor.value,
            cubeColor: this.elements.cubeColor.value
        };
    }

    saveSettings() {
        this.settings = this.getSettings();
        localStorage.setItem('cubeSnakeSettings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('cubeSnakeSettings');
        if (saved) {
            return JSON.parse(saved);
        }

        // Default settings
        return {
            appleCount: 3,
            gameSpeed: 2,
            startLength: 3,
            snakeBodyColor: '#00ff00',
            snakeHeadColor: '#00cc00',
            appleColor: '#ff0000',
            cubeColor: '#ffffff'
        };
    }

    applySettingsToUI() {
        this.elements.appleCount.value = this.settings.appleCount;
        this.elements.appleCountValue.textContent = this.settings.appleCount;

        this.elements.gameSpeed.value = this.settings.gameSpeed;
        const speedLabels = { 1: 'Slow', 2: 'Medium', 3: 'Fast' };
        this.elements.gameSpeedValue.textContent = speedLabels[this.settings.gameSpeed];

        this.elements.startLength.value = this.settings.startLength;
        this.elements.startLengthValue.textContent = this.settings.startLength;

        this.elements.snakeBodyColor.value = this.settings.snakeBodyColor;
        this.elements.snakeHeadColor.value = this.settings.snakeHeadColor;
        this.elements.appleColor.value = this.settings.appleColor;
        this.elements.cubeColor.value = this.settings.cubeColor;
    }
}
