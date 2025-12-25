import { drawGrid } from './components/Grid.js';
import { Pacman } from './components/Pacman.js';
import { level1 } from './data/level1.js';
import { CELL_SIZE, CELL_TYPES, GAME_SPEED } from './constants.js';
import { InputHandler } from './utils/Input.js'; // Import Input

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

// --- The Game Loop ---
// d3.interval runs the callback every GAME_SPEED milliseconds
const timer = d3.interval(() => {

    const direction = input.getDirection();

    // Basic Movement Logic (No Collision yet)
    // We calculate the POTENTIAL new position
    const nextX = pacman.gridX + direction.x;
    const nextY = pacman.gridY + direction.y;

    // IMPORTANT: Collision Check
    // We only move if the next cell is NOT a wall
    const nextCell = level1[nextY][nextX];

    if (nextCell !== CELL_TYPES.WALL && nextCell !== CELL_TYPES.GHOST_HOUSE) {
        pacman.move(nextX, nextY, direction.angle);
    }

}, GAME_SPEED);