import { CELL_SIZE, CELL_TYPES, DIRECTIONS, COLORS } from '../constants.js';
import { level1 } from '../data/level1.js';

export class Ghost {
    constructor(svg, startGridX, startGridY, color, releaseTick = 0) {
        this.svg = svg;

        // Starting Logic
        this.startGridX = startGridX;
        this.startGridY = startGridY;
        this.gridX = startGridX;
        this.gridY = startGridY;

        // PHYSICS FIX: Track previous position
        this.prevGridX = startGridX;
        this.prevGridY = startGridY;

        // Properties
        this.baseColor = color;
        this.currentColor = color;
        this.releaseTick = releaseTick;

        // --- STATE MACHINE ---
        // 'AT_HOME' = Bouncing inside the box, waiting for releaseTick
        // 'EXITING' = Navigating from inside the box to the door (9, 8)
        // 'ACTIVE'  = Roaming the maze (Chase/Scatter/Random)
        this.state = (releaseTick > 0) ? 'AT_HOME' : 'ACTIVE';

        this.isScared = false;
        this.isEaten = false;

        this.currentDir = DIRECTIONS.RIGHT;

        // Pixel coordinates
        this.x = (startGridX + 0.5) * CELL_SIZE;
        this.y = (startGridY + 0.5) * CELL_SIZE;

        this.render();
    }

    // Helper for legacy checks or external logic
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

        this.group.append('circle').attr('cx', -4).attr('cy', -4).attr('r', 3).attr('fill', 'white');
        this.group.append('circle').attr('cx', 4).attr('cy', -4).attr('r', 3).attr('fill', 'white');
        this.group.append('circle').attr('cx', -2).attr('cy', -4).attr('r', 1.5).attr('fill', 'blue');
        this.group.append('circle').attr('cx', 6).attr('cy', -4).attr('r', 1.5).attr('fill', 'blue');
    }

    // --- ACTIONS ---

    // Idle animation while waiting
    bounce(tick) {
        if (this.state !== 'AT_HOME') return;
        // Simple Sine wave bounce (Up/Down by 3 pixels)
        const bounceY = Math.sin(tick * 0.5) * 3;
        this.group.attr('transform', `translate(${this.x}, ${this.y + bounceY})`);
    }

    // Trigger the exit sequence
    startExit() {
        if (this.state === 'AT_HOME') {
            this.state = 'EXITING';
            // Snap pixel position to grid to ensure clean movement start
            this.x = (this.gridX + 0.5) * CELL_SIZE;
            this.y = (this.gridY + 0.5) * CELL_SIZE;
            this.group.attr('transform', `translate(${this.x}, ${this.y})`);
        }
    }

    // --- STATES & MOVEMENT ---

    /**
     * Handles the hard-coded path from the ghost house to the door (9, 8).
     * Path: Center Row (y=10) -> Center Column (x=9) -> Door (9,8)
     */
    moveExiting(duration) {
        let nextDir = DIRECTIONS.NONE;

        // 1. If not at Center Column (9), move laterally
        if (this.gridX < 9) nextDir = DIRECTIONS.RIGHT;
        else if (this.gridX > 9) nextDir = DIRECTIONS.LEFT;

        // 2. If at Center Column (9), but below Door (8), move UP
        else if (this.gridY > 8) nextDir = DIRECTIONS.UP;

        // 3. If at Door (9, 8) or higher, we are OUT
        else {
            this.state = 'ACTIVE';
            this.currentDir = DIRECTIONS.LEFT; // Standard entry direction
            // Force an immediate normal move or just wait for next tick
            return;
        }

        if (nextDir !== DIRECTIONS.NONE) {
            this.executeMove(nextDir, duration);
        }
    }

    setScared(scared) {
        if (this.isEaten || this.state === 'AT_HOME' || this.state === 'EXITING') return;
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

    // --- SMART AI MOVEMENT ---

    moveTowardsHome(duration) {
        // Reuse the generic target function
        this.moveToTarget(9, 9, duration);
    }

    /**
     * The Main AI Function.
     * Evaluates all valid moves and picks the one that minimizes distance to target.
     */
    moveToTarget(targetX, targetY, duration) {
        const possibleMoves = this.getValidMoves();
        if (possibleMoves.length === 0) return;

        possibleMoves.sort((a, b) => {
            // Euclidean distance
            const distA = Math.hypot((this.gridX + a.x) - targetX, (this.gridY + a.y) - targetY);
            const distB = Math.hypot((this.gridX + b.x) - targetX, (this.gridY + b.y) - targetY);
            return distA - distB; // Shortest distance first
        });

        this.executeMove(possibleMoves[0], duration);
    }

    moveAwayFrom(targetX, targetY, duration) {
        const possibleMoves = this.getValidMoves();
        if (possibleMoves.length === 0) return;

        // Note: For "Fleeing", we might want to improve this later to avoid dead ends,
        // but for now, maximizing immediate distance is the standard simple AI.
        possibleMoves.sort((a, b) => {
            const distA = Math.hypot((this.gridX + a.x) - targetX, (this.gridY + a.y) - targetY);
            const distB = Math.hypot((this.gridX + b.x) - targetX, (this.gridY + b.y) - targetY);
            return distB - distA; // Longest distance first
        });

        this.executeMove(possibleMoves[0], duration);
    }

    getValidMoves() {
        const possibleMoves = [];
        Object.values(DIRECTIONS).forEach(dir => {
            if (dir === DIRECTIONS.NONE) return;
            const nextX = this.gridX + dir.x;
            const nextY = this.gridY + dir.y;

            const type = level1[nextY][nextX];

            // Standard Rule: Cannot hit walls
            if (type !== CELL_TYPES.WALL) {
                // Ghost Logic: Don't reverse direction 180 degrees (unless stuck)
                if (dir.x !== -this.currentDir.x || dir.y !== -this.currentDir.y) {
                    possibleMoves.push(dir);
                }
            }
        });

        // Dead End handling: Allow reverse if no other option
        if (possibleMoves.length === 0) {
            Object.values(DIRECTIONS).forEach(dir => {
                if (dir === DIRECTIONS.NONE) return;
                const nextX = this.gridX + dir.x;
                const nextY = this.gridY + dir.y;
                if (level1[nextY][nextX] !== CELL_TYPES.WALL) possibleMoves.push(dir);
            });
        }
        return possibleMoves;
    }

    executeMove(dir, duration) {
        // PHYSICS FIX: Save history
        this.prevGridX = this.gridX;
        this.prevGridY = this.gridY;

        this.currentDir = dir;
        this.gridX += dir.x;
        this.gridY += dir.y;
        this.x = (this.gridX + 0.5) * CELL_SIZE;
        this.y = (this.gridY + 0.5) * CELL_SIZE;
        this.group.transition().duration(duration).ease(d3.easeLinear).attr('transform', `translate(${this.x}, ${this.y})`);
    }
}