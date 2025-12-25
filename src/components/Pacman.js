import { CELL_SIZE } from '../constants.js';

export class Pacman {
    /**
     * @param {Object} svg - The D3 selection of the SVG container.
     * @param {Number} startGridX - Initial X position in grid units.
     * @param {Number} startGridY - Initial Y position in grid units.
     */
    constructor(svg, startGridX, startGridY) {
        this.svg = svg;

        // Remember spawn location for resets
        this.startGridX = startGridX;
        this.startGridY = startGridY;

        // Convert grid coordinates to pixel coordinates
        this.x = (startGridX + 0.5) * CELL_SIZE;
        this.y = (startGridY + 0.5) * CELL_SIZE;

        this.rotation = 90; // Default facing Right
        this.mouthRadius = 0.2;

        this.gridX = startGridX;
        this.gridY = startGridY;

        // Physics
        this.prevGridX = startGridX;
        this.prevGridY = startGridY;

        // 1. Define the Shape Generator
        this.arcGenerator = d3.arc()
            .innerRadius(0)
            .outerRadius((CELL_SIZE / 2) * 0.85)
            .startAngle(Math.PI * this.mouthRadius)
            .endAngle(Math.PI * (2 - this.mouthRadius));

        // 2. Render
        this.render();
    }

    render() {
        this.group = this.svg.append('g')
            .attr('id', 'pacman')
            .attr('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation})`);

        this.path = this.group.append('path')
            .attr('d', this.arcGenerator)
            .attr('fill', '#FFD700');
    }

    updateMouth(openness) {
        this.arcGenerator
            .startAngle(Math.PI * openness)
            .endAngle(Math.PI * (2 - openness));
        this.path.attr('d', this.arcGenerator);
    }

    // --- NEW: Death Animation ---
    die() {
        // Stop any movement transitions
        this.group.interrupt();

        // Animate mouth opening until it disappears (implosion)
        // Transition from current openness (approx 0.2) to 1.0 (full circle gone)
        this.path.transition()
            .duration(1500) // Take 1.5 seconds
            .attrTween('d', () => {
                const interpolator = d3.interpolate(0.2, 1); // 0.2pi to 1pi
                return (t) => {
                    this.updateMouth(interpolator(t));
                    return this.path.attr('d');
                };
            })
            .on('end', () => {
                this.path.attr('opacity', 0); // Hide completely at end
            });
    }

    reset() {
        // 1. Reset Data
        this.gridX = this.startGridX;
        this.gridY = this.startGridY;
        this.prevGridX = this.startGridX;
        this.prevGridY = this.startGridY;

        this.rotation = 90;

        // 2. Reset Pixels
        this.x = (this.gridX + 0.5) * CELL_SIZE;
        this.y = (this.gridY + 0.5) * CELL_SIZE;

        // 3. Interrupt any active transition and snap to start
        this.group.interrupt()
            .attr('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation})`);

        // Reset mouth and ensure visibility
        this.updateMouth(0.2);
        this.path.attr('opacity', 1);
    }

    move(newGridX, newGridY, angle, duration) {
        this.prevGridX = this.gridX;
        this.prevGridY = this.gridY;

        this.gridX = newGridX;
        this.gridY = newGridY;

        this.x = (newGridX + 0.5) * CELL_SIZE;
        this.y = (newGridY + 0.5) * CELL_SIZE;
        this.rotation = angle;

        this.group
            .transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .attr('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation})`);

        const mouthState = (this.gridX + this.gridY) % 2 === 0 ? 0.2 : 0.05;
        this.updateMouth(mouthState);
    }
}