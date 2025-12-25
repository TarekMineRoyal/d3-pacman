import { drawGrid } from './components/Grid.js';
import { level1 } from './data/level1.js';
import { CELL_SIZE } from './constants.js';

// 1. Calculate the dimensions of the game board
// We assume all rows have the same length (standard matrix)
const NUM_ROWS = level1.length;
const NUM_COLS = level1[0].length;

const WIDTH = NUM_COLS * CELL_SIZE;
const HEIGHT = NUM_ROWS * CELL_SIZE;

// 2. Select the container and append the SVG
// This is the "Canvas" where D3 will draw everything.
const svg = d3.select('#game-container')
    .append('svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT)
    .style('background-color', 'black');

// 3. Render the Map
console.log('Initializing D3 Pac-Man...');
drawGrid(svg, level1);

console.log(`Map Rendered: ${NUM_COLS}x${NUM_ROWS} Grid`);