export class GameState {
    constructor() {
        this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAME_OVER
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.listeners = [];
    }

    start() {
        this.state = 'PLAYING';
        this.score = 0;
        this.notifyListeners('stateChange', this.state);
        this.notifyListeners('scoreChange', this.score);
    }

    pause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.notifyListeners('stateChange', this.state);
        }
    }

    resume() {
        if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.notifyListeners('stateChange', this.state);
        }
    }

    gameOver() {
        this.state = 'GAME_OVER';

        // Update high score if needed
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }

        this.notifyListeners('stateChange', this.state);
        this.notifyListeners('gameOver', { score: this.score, highScore: this.highScore });
    }

    restart() {
        this.state = 'MENU';
        this.score = 0;
        this.notifyListeners('stateChange', this.state);
    }

    incrementScore() {
        this.score++;
        this.notifyListeners('scoreChange', this.score);
    }

    getState() {
        return this.state;
    }

    getScore() {
        return this.score;
    }

    getHighScore() {
        return this.highScore;
    }

    loadHighScore() {
        const saved = localStorage.getItem('cubeSnakeHighScore');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveHighScore() {
        localStorage.setItem('cubeSnakeHighScore', this.highScore.toString());
    }

    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    notifyListeners(event, data) {
        this.listeners
            .filter(listener => listener.event === event)
            .forEach(listener => listener.callback(data));
    }
}
