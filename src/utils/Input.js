import { DIRECTIONS } from '../constants.js';

export class InputHandler {
    constructor() {
        this.currentDirection = DIRECTIONS.NONE;
        this.nextDirection = DIRECTIONS.NONE; // For "cornering" later

        // Bind the event listener
        window.addEventListener('keydown', (e) => this.handleKey(e));
    }

    handleKey(e) {
        switch (e.key) {
            case 'ArrowUp':
                this.currentDirection = DIRECTIONS.UP;
                break;
            case 'ArrowDown':
                this.currentDirection = DIRECTIONS.DOWN;
                break;
            case 'ArrowLeft':
                this.currentDirection = DIRECTIONS.LEFT;
                break;
            case 'ArrowRight':
                this.currentDirection = DIRECTIONS.RIGHT;
                break;
        }
    }

    getDirection() {
        return this.currentDirection;
    }
}