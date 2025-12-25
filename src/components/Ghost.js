import { CELL_SIZE, CELL_TYPES, DIRECTIONS, COLORS } from '../constants.js';
import { level1 } from '../data/level1.js';

const NUM_COLS = level1[0].length; // 28
const NUM_ROWS = level1.length;    // 31

export class Ghost {
    constructor(svg, startGridX, startGridY, color, releaseTick = 0) {
        this.svg = svg;

        // Starting Logic
        this.startGridX = startGridX;
        this.startGridY = startGridY;
        this.gridX = startGridX;
        this.gridY = startGridY;

        // Physics
        this.prevGridX = startGridX;
        this.prevGridY = startGridY;

        // Properties
        this.baseColor = color;
        this.currentColor = color;
        this.releaseTick = releaseTick; // (Kept for fallback, but we will mostly use Dot Counters now)

        // State
        this.state = (releaseTick > 0) ? 'AT_HOME' : 'ACTIVE';
        this.isScared = false;
        this.isEaten = false;
        this.currentDir = DIRECTIONS.RIGHT;

        // Render
        this.x = (startGridX + 0.5) * CELL_SIZE;
        this.y = (startGridY + 0.5) * CELL_SIZE;
        this.render();
    }

    get isInHouse() {
        return this.state === 'AT_HOME';
    }

    render() {
        this.group = this.svg.append('g')
            .attr('class', 'ghost')
            .attr('transform', `translate(${this.x}, ${this.y})`);

        this.bodyParts = this.group.append('g');

        this.bodyParts.append('circle').attr('r', CELL_SIZE * 0.4).attr('cy', -2).attr('fill', this.currentColor);
        this.bodyParts.append('rect').attr('x', -(CELL_SIZE * 0.4)).attr('y', -2)
            .attr('width', CELL_SIZE * 0.8).attr('height', CELL_SIZE * 0.45).attr('fill', this.currentColor);

        // --- EYES RENDERING ---
        this.eyesGroup = this.group.append('g').attr('class', 'eyes');

        this.eyesGroup.append('circle').attr('cx', -4).attr('cy', -4).attr('r', 3).attr('fill', 'white');
        this.eyesGroup.append('circle').attr('cx', 4).attr('cy', -4).attr('r', 3).attr('fill', 'white');

        this.pupilLeft = this.eyesGroup.append('circle').attr('cx', -2).attr('cy', -4).attr('r', 1.5).attr('fill', 'blue');
        this.pupilRight = this.eyesGroup.append('circle').attr('cx', 6).attr('cy', -4).attr('r', 1.5).attr('fill', 'blue');
    }

    // --- ACTIONS ---

    // NEW: Authentic Forced Reversal
    reverse() {
        if (this.state !== 'ACTIVE' || this.isEaten || this.isScared) return;

        // Flip Direction: Right<->Left, Up<->Down
        if (this.currentDir === DIRECTIONS.RIGHT) this.currentDir = DIRECTIONS.LEFT;
        else if (this.currentDir === DIRECTIONS.LEFT) this.currentDir = DIRECTIONS.RIGHT;
        else if (this.currentDir === DIRECTIONS.UP) this.currentDir = DIRECTIONS.DOWN;
        else if (this.currentDir === DIRECTIONS.DOWN) this.currentDir = DIRECTIONS.UP;

        // Important: Update eyes immediately to show the turn
        this.updateEyes(this.currentDir);
    }

    // NEW: Centralized Speed Logic (Cruise Elroy)
    getMoveRate(dotsRemaining) {
        if (this.isEaten) return 2; // Fast return (Zoom)
        if (this.isScared) return 8; // Slow (Scared)

        // Cruise Elroy (Blinky Only)
        if (this.baseColor === 'red' && this.state === 'ACTIVE') {
            if (dotsRemaining <= 20) return 4; // Elroy 1 (Speed up)
            if (dotsRemaining <= 10) return 3; // Elroy 2 (Super Fast)
        }

        return 5; // Normal Speed
    }

    updateEyes(dir) {
        if (!this.pupilLeft || !this.pupilRight) return;
        const offsetX = dir.x * 2;
        const offsetY = dir.y * 2;
        this.pupilLeft.attr('cx', -4 + offsetX).attr('cy', -4 + offsetY);
        this.pupilRight.attr('cx', 4 + offsetX).attr('cy', -4 + offsetY);
    }

    bounce(tick) {
        if (this.state !== 'AT_HOME') return;
        const bounceY = Math.sin(tick * 0.5) * 3;
        this.group.attr('transform', `translate(${this.x}, ${this.y + bounceY})`);
    }

    startExit() {
        if (this.state === 'AT_HOME') {
            this.state = 'EXITING';
            this.x = (this.gridX + 0.5) * CELL_SIZE;
            this.y = (this.gridY + 0.5) * CELL_SIZE;
            this.group.attr('transform', `translate(${this.x}, ${this.y})`);
        }
    }

    revive() {
        this.setEaten(false);
        this.state = 'EXITING';
    }

    reset() {
        this.gridX = this.startGridX;
        this.gridY = this.startGridY;
        this.prevGridX = this.startGridX;
        this.prevGridY = this.startGridY;

        // Use releaseTick as basic fallback, but Main.js controls exit via DotCounters now
        this.state = (this.releaseTick > 0) ? 'AT_HOME' : 'ACTIVE';
        this.isScared = false;
        this.isEaten = false;
        this.currentDir = DIRECTIONS.RIGHT;
        this.updateColor(this.baseColor);

        this.x = (this.gridX + 0.5) * CELL_SIZE;
        this.y = (this.gridY + 0.5) * CELL_SIZE;

        this.group.interrupt()
            .attr('transform', `translate(${this.x}, ${this.y})`);

        this.updateEyes(this.currentDir);
        this.bodyParts.attr('opacity', 1);
    }

    // --- STATES & MOVEMENT ---

    moveExiting(duration) {
        let nextDir = DIRECTIONS.NONE;
        // Target: Center Col (14), Top of House (Row 11)
        if (this.gridX < 14) nextDir = DIRECTIONS.RIGHT;
        else if (this.gridX > 14) nextDir = DIRECTIONS.LEFT;
        else if (this.gridY > 11) nextDir = DIRECTIONS.UP;
        else {
            this.state = 'ACTIVE';
            this.currentDir = DIRECTIONS.LEFT;
            return;
        }

        if (nextDir !== DIRECTIONS.NONE) {
            this.executeMove(nextDir, duration);
        }
    }

    setScared(scared) {
        if (this.isEaten || this.state === 'AT_HOME' || this.state === 'EXITING') return;

        // Authentic: Reverse direction when becoming scared
        if (scared && !this.isScared) {
            this.reverse();
        }

        this.isScared = scared;
        this.updateColor(scared ? COLORS.SCARED_GHOST : this.baseColor);
    }

    setEaten(eaten) {
        this.isEaten = eaten;
        this.isScared = false;

        if (eaten) {
            this.bodyParts.attr('opacity', 0);
        } else {
            this.bodyParts.attr('opacity', 1);
            this.updateColor(this.baseColor);
        }
    }

    toggleFlash() {
        if (!this.isScared || this.isEaten) return;
        const newColor = (this.currentColor === COLORS.SCARED_GHOST) ? COLORS.FLASH_GHOST : COLORS.SCARED_GHOST;
        this.updateColor(newColor);
    }

    updateColor(color) {
        this.currentColor = color;
        this.bodyParts.select('circle').attr('fill', color);
        this.bodyParts.select('rect').attr('fill', color);
    }

    // --- PERSONALITY AI ENGINE ---

    processAI(pacman, blinky, duration, gameMode) {

        // 1. SCATTER MODE
        if (gameMode === 'SCATTER') {
            if (this.baseColor === 'red') {
                // Blinky: Top Right (Corner)
                // Note: Cruise Elroy DISABLES Scatter mode in original, but let's keep it simple.
                this.moveToTarget(NUM_COLS - 2, 0, duration);
            } else if (this.baseColor === 'pink') {
                this.moveToTarget(1, 0, duration);
            } else if (this.baseColor === 'cyan') {
                this.moveToTarget(NUM_COLS - 2, NUM_ROWS - 1, duration);
            } else if (this.baseColor === 'orange') {
                this.moveToTarget(0, NUM_ROWS - 1, duration);
            }
            return;
        }

        // 2. CHASE MODE
        if (this.baseColor === 'red') {
            this.moveToTarget(pacman.gridX, pacman.gridY, duration);
        }
        else if (this.baseColor === 'pink') {
            const pDir = pacman.currentDir || DIRECTIONS.RIGHT;
            const targetX = pacman.gridX + (pDir.x * 4);
            const targetY = pacman.gridY + (pDir.y * 4);
            this.moveToTarget(targetX, targetY, duration);
        }
        else if (this.baseColor === 'cyan') {
            const pDir = pacman.currentDir || DIRECTIONS.RIGHT;
            const pivotX = pacman.gridX + (pDir.x * 2);
            const pivotY = pacman.gridY + (pDir.y * 2);
            const vecX = pivotX - blinky.gridX;
            const vecY = pivotY - blinky.gridY;
            const targetX = pivotX + vecX;
            const targetY = pivotY + vecY;
            this.moveToTarget(targetX, targetY, duration);
        }
        else if (this.baseColor === 'orange') {
            const dist = this.getEuclideanDistance(this.gridX, this.gridY, pacman.gridX, pacman.gridY);
            if (dist > 8) {
                this.moveToTarget(pacman.gridX, pacman.gridY, duration);
            } else {
                this.moveToTarget(0, NUM_ROWS - 1, duration);
            }
        }
    }

    // --- MOVEMENT HELPERS ---

    getEuclideanDistance(x1, y1, x2, y2) {
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        const distDirect = Math.hypot(dx, dy);
        const distWrapped = Math.hypot(NUM_COLS - dx, dy);
        return Math.min(distDirect, distWrapped);
    }

    moveTowardsHome(duration) {
        this.moveToTarget(14, 14, duration);
    }

    moveToTarget(targetX, targetY, duration) {
        const possibleMoves = this.getValidMoves();
        if (possibleMoves.length === 0) return;

        possibleMoves.sort((a, b) => {
            const distA = this.getEuclideanDistance(this.gridX + a.x, this.gridY + a.y, targetX, targetY);
            const distB = this.getEuclideanDistance(this.gridX + b.x, this.gridY + b.y, targetX, targetY);
            return distA - distB;
        });

        this.executeMove(possibleMoves[0], duration);
    }

    moveAwayFrom(targetX, targetY, duration) {
        const possibleMoves = this.getValidMoves();
        if (possibleMoves.length === 0) return;

        possibleMoves.sort((a, b) => {
            const distA = this.getEuclideanDistance(this.gridX + a.x, this.gridY + a.y, targetX, targetY);
            const distB = this.getEuclideanDistance(this.gridX + b.x, this.gridY + b.y, targetX, targetY);
            return distB - distA;
        });

        this.executeMove(possibleMoves[0], duration);
    }

    moveRandom(duration) {
        const possibleMoves = this.getValidMoves();
        if (possibleMoves.length > 0) {
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            this.executeMove(randomMove, duration);
        }
    }

    getValidMoves() {
        const possibleMoves = [];
        Object.values(DIRECTIONS).forEach(dir => {
            if (dir === DIRECTIONS.NONE) return;
            const nextX = this.gridX + dir.x;
            const nextY = this.gridY + dir.y;

            let type = CELL_TYPES.WALL;
            if (nextX < 0 || nextX >= NUM_COLS) {
                type = CELL_TYPES.EMPTY;
            } else {
                type = level1[nextY][nextX];
            }

            if (this.state === 'ACTIVE' && !this.isEaten) {
                if (type === CELL_TYPES.GHOST_HOUSE || type === CELL_TYPES.DOOR) {
                    type = CELL_TYPES.WALL;
                }
            }

            if (type !== CELL_TYPES.WALL) {
                if (dir.x !== -this.currentDir.x || dir.y !== -this.currentDir.y) {
                    possibleMoves.push(dir);
                }
            }
        });

        if (possibleMoves.length === 0) {
            Object.values(DIRECTIONS).forEach(dir => {
                if (dir === DIRECTIONS.NONE) return;
                const nextX = this.gridX + dir.x;
                const nextY = this.gridY + dir.y;
                let type = (nextX < 0 || nextX >= NUM_COLS) ? CELL_TYPES.EMPTY : level1[nextY][nextX];
                if (this.state === 'ACTIVE' && !this.isEaten) {
                    if (type === CELL_TYPES.GHOST_HOUSE || type === CELL_TYPES.DOOR) type = CELL_TYPES.WALL;
                }
                if (type !== CELL_TYPES.WALL) possibleMoves.push(dir);
            });
        }
        return possibleMoves;
    }

    executeMove(dir, duration) {
        this.prevGridX = this.gridX;
        this.prevGridY = this.gridY;
        this.currentDir = dir;
        this.gridX += dir.x;
        this.gridY += dir.y;
        this.updateEyes(dir);
        this.x = (this.gridX + 0.5) * CELL_SIZE;
        this.y = (this.gridY + 0.5) * CELL_SIZE;
        this.group.transition().duration(duration).ease(d3.easeLinear).attr('transform', `translate(${this.x}, ${this.y})`);
    }
}