import { CELL_SIZE, CELL_TYPES, COLORS } from '../constants.js';

/**
 * Renders the static game board (Walls, Dots, Pellets).
 * @param {Object} svg - The D3 selection of the SVG container.
 * @param {Array} gridData - The 2D matrix representing the level.
 */
export function drawGrid(svg, gridData) {

    // 1. Flatten the 2D grid into a list of objects that D3 can iterate over.
    // We also filter out "EMPTY" cells to avoid creating unnecessary DOM nodes.
    const cells = [];

    gridData.forEach((row, rowIndex) => {
        row.forEach((cellType, colIndex) => {
            if (cellType !== CELL_TYPES.EMPTY && cellType !== CELL_TYPES.GHOST_HOUSE) {
                cells.push({
                    x: colIndex,
                    y: rowIndex,
                    type: cellType
                });
            }
        });
    });

    // 2. Create a Group for the board to keep the DOM organized
    const boardGroup = svg.append('g').attr('class', 'game-board');

    // 3. Bind Data: The Standard D3 Pattern
    const cellSelection = boardGroup.selectAll('.cell')
        .data(cells)
        .enter()
        .append('g')
        .attr('class', 'cell')
        .attr('transform', d => `translate(${d.x * CELL_SIZE}, ${d.y * CELL_SIZE})`);

    // 4. Render Walls & Doors (Rectangles)
    cellSelection.filter(d => d.type === CELL_TYPES.WALL || d.type === CELL_TYPES.DOOR)
        .append('rect')
        .attr('width', CELL_SIZE)
        .attr('height', d => d.type === CELL_TYPES.DOOR ? CELL_SIZE / 4 : CELL_SIZE) // Doors are thin
        .attr('y', d => d.type === CELL_TYPES.DOOR ? CELL_SIZE / 2 - 2 : 0) // Center the door
        .attr('fill', d => d.type === CELL_TYPES.DOOR ? COLORS.DOOR : COLORS.WALL);

    // 5. Render Dots (Small Circles)
    cellSelection.filter(d => d.type === CELL_TYPES.DOT)
        .append('circle')
        .attr('cx', CELL_SIZE / 2)
        .attr('cy', CELL_SIZE / 2)
        .attr('r', 3) // Small radius
        .attr('fill', COLORS.DOT);

    // 6. Render Power Pellets (Big Circles)
    cellSelection.filter(d => d.type === CELL_TYPES.POWER_PELLET)
        .append('circle')
        .attr('cx', CELL_SIZE / 2)
        .attr('cy', CELL_SIZE / 2)
        .attr('r', 8) // Larger radius
        .attr('fill', COLORS.POWER_PELLET);
}