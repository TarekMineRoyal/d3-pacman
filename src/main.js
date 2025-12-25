import { drawGrid } from './components/Grid.js';
import { Pacman } from './components/Pacman.js'; // Import the Class
import { level1 } from './data/level1.js';
import { CELL_SIZE } from './constants.js';

// 1. Calculate Dimensions
const NUM_ROWS = level1.length;
const NUM_COLS = level1[0].length;

const WIDTH = NUM_COLS * CELL_SIZE;
const HEIGHT = NUM_ROWS * CELL_SIZE;

// 2. Setup SVG Container
const svg = d3.select('#game-container')
    .append('svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT)
    .style('background-color', 'black');

// 3. Render the Static Board
console.log('Initializing D3 Pac-Man...');
drawGrid(svg, level1);

// 4. Spawn the Player
// Grid coordinates (Col: 9, Row: 16) places him just below the ghost house.
const pacman = new Pacman(svg, 9, 16);

console.log('Pac-Man Spawned at 9, 16');