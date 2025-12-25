import { CELL_SIZE } from '../constants.js';

export class Pacman {
    /**
     * @param {Object} svg - The D3 selection of the SVG container.
     * @param {Number} startGridX - Initial X position in grid units.
     * @param {Number} startGridY - Initial Y position in grid units.
     */
    constructor(svg, startGridX, startGridY) {
        this.svg = svg;

        // Convert grid coordinates to pixel coordinates
        // We center Pac-Man in the tile (+ 0.5)
        this.x = (startGridX + 0.5) * CELL_SIZE;
        this.y = (startGridY + 0.5) * CELL_SIZE;

        this.rotation = 90; // Default facing Right (90 degrees)
        this.mouthRadius = 0.2; // How wide the mouth opens (0 to 1)

        this.gridX = startGridX;
        this.gridY = startGridY;

        // 1. Define the Shape Generator (The Arc)
        // D3 Arcs start at 12 o'clock (0 radians). 
        // We draw him facing UP, then rotate the whole group to change direction.
        this.arcGenerator = d3.arc()
            .innerRadius(0)
            .outerRadius((CELL_SIZE / 2) * 0.85) // Slightly smaller than the tile
            .startAngle(Math.PI * this.mouthRadius)
            .endAngle(Math.PI * (2 - this.mouthRadius));

        // 2. Render the initial state
        this.render();
    }

    render() {
        // Create a group for Pac-Man (Body + transform)
        this.group = this.svg.append('g')
            .attr('id', 'pacman')
            .attr('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation})`);

        // Draw the yellow body
        this.path = this.group.append('path')
            .attr('d', this.arcGenerator)
            .attr('fill', '#FFD700'); // Standard Pac-Man Yellow
    }

    /**
     * Updates Pac-Man's position and rotation on the screen.
     * @param {Number} gridX - New X grid coordinate
     * @param {Number} gridY - New Y grid coordinate
     * @param {Number} directionAngle - Rotation in degrees (0=Up, 90=Right, etc.)
     */
    updatePosition(gridX, gridY, directionAngle) {
        // 1. Update internal state
        this.x = (gridX + 0.5) * CELL_SIZE;
        this.y = (gridY + 0.5) * CELL_SIZE;
        this.rotation = directionAngle;

        // 2. Apply updates to the DOM
        this.group.attr('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation})`);
    }

    /**
     * Animates the mouth opening/closing.
     * @param {Number} openness - A value between 0 (closed) and 0.2 (fully open)
     */
    updateMouth(openness) {
        // Re-configure the arc generator with new angles
        this.arcGenerator
            .startAngle(Math.PI * openness)
            .endAngle(Math.PI * (2 - openness));

        // Update the path data "d" attribute
        this.path.attr('d', this.arcGenerator);
    }

    /**
   * Moves Pac-Man to a specific grid tile.
   */
    move(newGridX, newGridY, angle) {
        this.gridX = newGridX;
        this.gridY = newGridY;

        // Call the visual update we wrote earlier
        this.updatePosition(newGridX, newGridY, angle);

        // Animate mouth (Simple toggle for now)
        // We can make this smoother later
        const mouthState = (this.gridX + this.gridY) % 2 === 0 ? 0.2 : 0.05;
        this.updateMouth(mouthState);
    }
}