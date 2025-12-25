import { CELL_SIZE, CELL_TYPES, DIRECTIONS } from '../constants.js';
import { level1 } from '../data/level1.js'; // Ghost needs to see the map

export class Ghost {
    constructor(svg, startGridX, startGridY, color) {
        this.svg = svg;
        this.gridX = startGridX;
        this.gridY = startGridY;
        this.color = color;

        // Default Direction: Moving Right
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

        // Head
        this.group.append('circle')
            .attr('r', CELL_SIZE * 0.4).attr('cy', -2).attr('fill', this.color);
        // Body
        this.group.append('rect')
            .attr('x', -(CELL_SIZE * 0.4)).attr('y', -2)
            .attr('width', CELL_SIZE * 0.8).attr('height', CELL_SIZE * 0.45)
            .attr('fill', this.color);
        // Eyes
        this.group.append('circle').attr('cx', -4).attr('cy', -4).attr('r', 3).attr('fill', 'white');
        this.group.append('circle').attr('cx', 4).attr('cy', -4).attr('r', 3).attr('fill', 'white');
        // Pupils
        this.group.append('circle').attr('cx', -2).attr('cy', -4).attr('r', 1.5).attr('fill', 'blue');
        this.group.append('circle').attr('cx', 6).attr('cy', -4).attr('r', 1.5).attr('fill', 'blue');
    }

    /**
     * The "AI": Pick a random valid neighbor, preferring not to reverse.
     */
    moveRandom() {
        const possibleMoves = [];

        // Check all 4 cardinal directions (Up, Down, Left, Right)
        Object.values(DIRECTIONS).forEach(dir => {
            if (dir === DIRECTIONS.NONE) return;

            const nextX = this.gridX + dir.x;
            const nextY = this.gridY + dir.y;
            const nextCell = level1[nextY][nextX];

            // Rule 1: Must be a valid floor (Not a Wall)
            if (nextCell !== CELL_TYPES.WALL) {
                possibleMoves.push(dir);
            }
        });

        // Rule 2: Filter out the "Reverse" direction to prevent jittering
        // (Unless it's a dead end and we HAVE to reverse)
        const forwardMoves = possibleMoves.filter(dir => {
            return dir.x !== -this.currentDir.x || dir.y !== -this.currentDir.y;
        });

        // Decide: If we have forward options, pick one. Otherwise, take whatever is left (reverse).
        const validMoves = forwardMoves.length > 0 ? forwardMoves : possibleMoves;

        // Pick Randomly from the valid options
        if (validMoves.length > 0) {
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];

            this.currentDir = randomMove;
            this.gridX += this.currentDir.x;
            this.gridY += this.currentDir.y;

            // Update Visuals
            this.x = (this.gridX + 0.5) * CELL_SIZE;
            this.y = (this.gridY + 0.5) * CELL_SIZE;
            this.group.attr('transform', `translate(${this.x}, ${this.y})`);
        }
    }
}