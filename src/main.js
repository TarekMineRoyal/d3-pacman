import { drawGrid } from './components/Grid.js';
import { Pacman } from './components/Pacman.js';
import { Ghost } from './components/Ghost.js';
import { level1 } from './data/level1.js';
import { CELL_SIZE, CELL_TYPES, GAME_SPEED } from './constants.js';
import { InputHandler } from './utils/Input.js';

// --- Setup ---
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

// --- Actors ---
const pacman = new Pacman(svg, 9, 16);
const input = new InputHandler();

// 2. Spawn the Ghosts (Corners for now to avoid trapping them)
const ghosts = [
    new Ghost(svg, 1, 1, 'red'),      // Blinky
    new Ghost(svg, 17, 1, 'pink'),    // Pinky
    new Ghost(svg, 1, 18, 'cyan'),    // Inky
    new Ghost(svg, 17, 18, 'orange')  // Clyde
];

// --- State ---
let score = 0;
let tick = 0; // Frame counter
const scoreSpan = document.getElementById('score-value');
let currentDirection = { x: 0, y: 0, angle: 90 };

// --- Helper: Eating ---
function handleEat(gridX, gridY) {
    const cellType = level1[gridY][gridX];
    if (cellType === CELL_TYPES.DOT || cellType === CELL_TYPES.POWER_PELLET) {
        level1[gridY][gridX] = CELL_TYPES.EMPTY;

        // Visual Remove
        svg.selectAll('.cell')
            .filter(d => d.x === gridX && d.y === gridY)
            .select('circle')
            .remove();

        // Score Update
        score += (cellType === CELL_TYPES.POWER_PELLET) ? 50 : 10;
        scoreSpan.innerText = score;
    }
}

// --- The Game Loop ---
const timer = d3.interval(() => {
    tick++; // Increment frame counter

    // --- PACMAN LOGIC (Runs every 4 ticks) ---
    if (tick % 4 === 0) {
        const nextDirection = input.getDirection();

        // 1. Try New Direction
        let nextX = pacman.gridX + nextDirection.x;
        let nextY = pacman.gridY + nextDirection.y;
        let nextCell = level1[nextY][nextX];

        if (nextCell !== CELL_TYPES.WALL && nextCell !== CELL_TYPES.GHOST_HOUSE) {
            currentDirection = nextDirection;
        } else {
            // 2. Fallback to Old Direction
            nextX = pacman.gridX + currentDirection.x;
            nextY = pacman.gridY + currentDirection.y;
            nextCell = level1[nextY][nextX];
        }

        // 3. Move
        if (nextCell !== CELL_TYPES.WALL && nextCell !== CELL_TYPES.GHOST_HOUSE) {
            pacman.move(nextX, nextY, currentDirection.angle);
            handleEat(nextX, nextY);
        }
    }

    // --- GHOST LOGIC (Runs every 5 ticks) ---
    if (tick % 5 === 0) {
        ghosts.forEach(ghost => {
            ghost.moveRandom();

            // Collision Check must happen here too
            if (ghost.gridX === pacman.gridX && ghost.gridY === pacman.gridY) {
                // Use a slight timeout so the render finishes before the alert
                setTimeout(() => alert("Game Over!"), 10);
                timer.stop();
            }
        });
    }

    // --- GLOBAL COLLISION CHECK ---
    // We check collision on EVERY tick to catch mid-step overlaps
    ghosts.forEach(ghost => {
        if (ghost.gridX === pacman.gridX && ghost.gridY === pacman.gridY) {
            setTimeout(() => alert("Game Over!"), 10);
            timer.stop();
        }
    });

}, GAME_SPEED);