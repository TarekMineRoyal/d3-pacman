import { drawGrid } from './components/Grid.js';
import { Pacman } from './components/Pacman.js';
import { level1 } from './data/level1.js';
import { CELL_SIZE, CELL_TYPES, GAME_SPEED } from './constants.js';
import { InputHandler } from './utils/Input.js';

// ... (Dimensions and SVG setup remain the same) ...
const NUM_ROWS = level1.length;
const NUM_COLS = level1[0].length;
const WIDTH = NUM_COLS * CELL_SIZE;
const HEIGHT = NUM_ROWS * CELL_SIZE;

const svg = d3.select('#game-container')
    .append('svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT)
    .style('background-color', 'black');

drawGrid(svg, level1);

// Spawn Pac-Man
const pacman = new Pacman(svg, 9, 16);
const input = new InputHandler(); // Initialize Input

// State
let score = 0;
const scoreSpan = document.getElementById('score-value');

// --- Helper Function: Handle Eating ---
function handleEat(gridX, gridY) {
    const cellType = level1[gridY][gridX];

    if (cellType === CELL_TYPES.DOT || cellType === CELL_TYPES.POWER_PELLET) {
        // 1. Update Data (So we don't eat it twice)
        level1[gridY][gridX] = CELL_TYPES.EMPTY;

        // 2. Update Visuals (D3)
        // We filter all cells to find the one at the current position
        const cell = svg.selectAll('.cell')
            .filter(d => d.x === gridX && d.y === gridY);

        // Remove the circle inside that cell group
        cell.select('circle').remove();

        // 3. Update Score
        score += (cellType === CELL_TYPES.POWER_PELLET) ? 50 : 10;
        scoreSpan.innerText = score;
    }
}

// --- The Game Loop ---
const timer = d3.interval(() => {
    const direction = input.getDirection();

    const nextX = pacman.gridX + direction.x;
    const nextY = pacman.gridY + direction.y;

    const nextCell = level1[nextY][nextX];

    if (nextCell !== CELL_TYPES.WALL && nextCell !== CELL_TYPES.GHOST_HOUSE) {
        pacman.move(nextX, nextY, direction.angle);

        // NEW: Check for food after moving
        handleEat(nextX, nextY);
    }
}, GAME_SPEED);