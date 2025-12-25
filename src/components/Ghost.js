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

        // Properties
        this.baseColor = color;
        this.currentColor = color;
        this.releaseTick = releaseTick; // When to leave the house

        // States
        this.isScared = false;
        this.isEaten = false;
        this.isInHouse = (releaseTick > 0); // If releaseTick is 0, start active (Blinky)

        this.currentDir = DIRECTIONS.RIGHT;

        // Pixel coordinates
        this.x = (startGridX + 0.5) * CELL_SIZE;
        this.y = (startGridY + 0.5) * CELL_SIZE;

        this.render();
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

    // NEW: Idle animation while waiting
    bounce(tick) {
        // Simple Sine wave bounce (Up/Down by 3 pixels)
        const bounceY = Math.sin(tick * 0.5) * 3;
        this.group.attr('transform', `translate(${this.x}, ${this.y + bounceY})`);
    }

    // Leave the house and enter the maze
    exitHouse() {
        this.isInHouse = false;

        // Move to the new "Door" location (Row 8)
        this.gridX = 9;
        this.gridY = 9;
        this.currentDir = DIRECTIONS.LEFT;

        this.x = (this.gridX + 0.5) * CELL_SIZE;
        this.y = (this.gridY + 0.5) * CELL_SIZE;
        this.group.attr('transform', `translate(${this.x}, ${this.y})`);
    }

    // ... (setScared, setEaten, toggleFlash, updateColor remain the same) ...
    setScared(scared) {
        if (this.isEaten || this.isInHouse) return; // Can't scare if safe in house
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

    // --- MOVEMENT ---
    // (Your existing movement methods remain the same)

    moveTowardsHome(duration) {
        // Target the door at (9, 9)
        const targetX = 9;
        const targetY = 9;

        const possibleMoves = this.getValidMoves();
        if (possibleMoves.length === 0) return;

        possibleMoves.sort((a, b) => {
            const distA = Math.hypot((this.gridX + a.x) - targetX, (this.gridY + a.y) - targetY);
            const distB = Math.hypot((this.gridX + b.x) - targetX, (this.gridY + b.y) - targetY);
            return distA - distB;
        });

        this.executeMove(possibleMoves[0], duration);
    }

    moveAwayFrom(targetX, targetY, duration) {
        const possibleMoves = this.getValidMoves();
        if (possibleMoves.length === 0) return;
        possibleMoves.sort((a, b) => {
            const distA = Math.hypot((this.gridX + a.x) - targetX, (this.gridY + a.y) - targetY);
            const distB = Math.hypot((this.gridX + b.x) - targetX, (this.gridY + b.y) - targetY);
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
        // ... (Your existing getValidMoves code) ...
        // Note: If you have "GHOST_HOUSE" tiles, make sure they are traversable
        const possibleMoves = [];
        Object.values(DIRECTIONS).forEach(dir => {
            if (dir === DIRECTIONS.NONE) return;
            const nextX = this.gridX + dir.x;
            const nextY = this.gridY + dir.y;

            const type = level1[nextY][nextX];
            // Allow moving through Empty, Dots, Pellets, and Ghost House
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
                if (level1[nextY][nextX] !== CELL_TYPES.WALL) possibleMoves.push(dir);
            });
        }
        return possibleMoves;
    }

    executeMove(dir, duration) {
        this.currentDir = dir;
        this.gridX += dir.x;
        this.gridY += dir.y;
        this.x = (this.gridX + 0.5) * CELL_SIZE;
        this.y = (this.gridY + 0.5) * CELL_SIZE;
        this.group.transition().duration(duration).ease(d3.easeLinear).attr('transform', `translate(${this.x}, ${this.y})`);
    }
}