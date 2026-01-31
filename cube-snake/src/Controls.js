export class Controls {
    constructor() {
        this.listeners = [];
        this.setupKeyboardListeners();
    }

    setupKeyboardListeners() {
        window.addEventListener('keydown', (event) => {
            this.handleKeyPress(event.key);
        });
    }

    handleKeyPress(key) {
        // Direction controls - raw screen directions
        const directionMap = {
            'ArrowUp': { x: 0, y: 1 },
            'ArrowDown': { x: 0, y: -1 },
            'ArrowLeft': { x: -1, y: 0 },
            'ArrowRight': { x: 1, y: 0 },
            'w': { x: 0, y: 1 },
            'W': { x: 0, y: 1 },
            's': { x: 0, y: -1 },
            'S': { x: 0, y: -1 },
            'a': { x: -1, y: 0 },
            'A': { x: -1, y: 0 },
            'd': { x: 1, y: 0 },
            'D': { x: 1, y: 0 }
        };

        if (directionMap[key]) {
            this.notifyListeners('direction', directionMap[key]);
        }

        // Game controls
        if (key === ' ' || key === 'Spacebar') {
            this.notifyListeners('pause');
        }

        if (key === 'Escape') {
            this.notifyListeners('pause');
        }

        if (key === 'r' || key === 'R') {
            this.notifyListeners('restart');
        }
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
