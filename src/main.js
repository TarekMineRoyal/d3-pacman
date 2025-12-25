import { drawGrid } from './components/Grid.js';
import { Pacman } from './components/Pacman.js';
import { Ghost } from './components/Ghost.js';
import { level1 } from './data/level1.js';
import { CELL_SIZE, CELL_TYPES, GAME_SPEED, GAME_CONSTANTS } from './constants.js';
import { InputHandler } from './utils/Input.js';

// --- 1. Setup & Initialization ---
const NUM_ROWS = level1.length;
const NUM_COLS = level1[0].length;
const WIDTH = NUM_COLS * CELL_SIZE;
const HEIGHT = NUM_ROWS * CELL_SIZE;

const svg = d3.select('#game-container')
    .append('svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT)
    .style('background-color', 'black');

// Render the Map
drawGrid(svg, level1);

// Spawn Actors
const pacman = new Pacman(svg, 9, 16); // Start below ghost house
const ghosts = [
    new Ghost(svg, 1, 1, 'red'),      // Blinky (Top Left)
    new Ghost(svg, 17, 1, 'pink'),    // Pinky (Top Right)
    new Ghost(svg, 1, 18, 'cyan'),    // Inky (Bottom Left)
    new Ghost(svg, 17, 18, 'orange')  // Clyde (Bottom Right)
];

const input = new InputHandler();

// --- 2. Game State ---
let score = 0;
let tick = 0;
let scaredTimer = 0; // Counts down when a power pellet is eaten
let currentDirection = { x: 0, y: 0, angle: 90 };
const scoreSpan = document.getElementById('score-value');

// Count total dots to win
let totalDots = 0;
level1.forEach(row => {
    row.forEach(cell => {
        if (cell === CELL_TYPES.DOT || cell === CELL_TYPES.POWER_PELLET) {
            totalDots++;
        }
    });
});
console.log(`Total Dots to Eat: ${totalDots}`);

// --- 3. Helper Functions ---

/**
 * Handles interactions when Pac-Man enters a tile (Eating Dots/Power Pellets)
 */
function handleEat(gridX, gridY) {
    const cellType = level1[gridY][gridX];

    if (cellType === CELL_TYPES.DOT || cellType === CELL_TYPES.POWER_PELLET) {
        // Update Data
        level1[gridY][gridX] = CELL_TYPES.EMPTY;

        // Update Visuals
        svg.selectAll('.cell')
            .filter(d => d.x === gridX && d.y === gridY)
            .select('circle')
            .remove();

        // Scoring & Logic
        if (cellType === CELL_TYPES.POWER_PELLET) {
            score += 50;
            scaredTimer = GAME_CONSTANTS.SCARED_DURATION;
            ghosts.forEach(g => g.setScared(true));
        } else {
            score += 10;
        }

        scoreSpan.innerText = score;

        // NEW: Win Condition Check
        totalDots--;

        if (totalDots === 0) {
            timer.stop();
            // Use setTimeout so the final dot disappears visually before the alert
            setTimeout(() => {
                alert(`YOU WIN! Perfect Score: ${score}`);
                // Optional: location.reload(); // Reloads page to restart
            }, 10);
        }
    }
}

/**
 * Checks if Pac-Man and a specific Ghost are occupying the same tile.
 * Handles both "Game Over" and "Eat Ghost" scenarios.
 */
function checkCollision(ghost) {
    if (ghost.gridX === pacman.gridX && ghost.gridY === pacman.gridY) {
        if (ghost.isScared) {
            // CASE A: Pac-Man eats the Ghost
            score += 200;
            scoreSpan.innerText = score;
            ghost.respawn();
        } else {
            // CASE B: Ghost eats Pac-Man
            timer.stop();
            // Small timeout to allow the render to finish before alerting
            setTimeout(() => alert("Game Over! Final Score: " + score), 10);
        }
    }
}

// --- 4. The Game Loop ---
const timer = d3.interval(() => {
    tick++;

    // A. Manage Scared Mode Timer (Global Timer)
    if (scaredTimer > 0) {
        scaredTimer--;

        // Flash white logic
        if (scaredTimer < GAME_CONSTANTS.FLASH_THRESHOLD && scaredTimer % 10 === 0) {
            ghosts.forEach(g => g.toggleFlash());
        }

        // Timer Expired: Reset ALL ghosts
        if (scaredTimer === 0) {
            ghosts.forEach(g => g.setScared(false));
        }
    }

    // B. Pac-Man Logic (Every 4 ticks)
    if (tick % 4 === 0) {
        // ... (Your existing Pac-Man Input/Move logic) ...
        const nextDirection = input.getDirection();
        let nextX = pacman.gridX + nextDirection.x;
        let nextY = pacman.gridY + nextDirection.y;
        let nextCell = level1[nextY][nextX];

        if (nextCell !== CELL_TYPES.WALL && nextCell !== CELL_TYPES.GHOST_HOUSE) {
            currentDirection = nextDirection;
        } else {
            nextX = pacman.gridX + currentDirection.x;
            nextY = pacman.gridY + currentDirection.y;
            nextCell = level1[nextY][nextX];
        }

        if (nextCell !== CELL_TYPES.WALL && nextCell !== CELL_TYPES.GHOST_HOUSE) {
            pacman.move(nextX, nextY, currentDirection.angle, 4 * GAME_SPEED);
            handleEat(nextX, nextY);
        }
    }

    // C. Ghost Logic
    const ghostTickRate = (scaredTimer > 0) ? 8 : 5;

    if (tick % ghostTickRate === 0) {
        ghosts.forEach(ghost => {
            // NEW: Pass the duration!
            // Normal: 200ms, Scared: 320ms
            const duration = ghostTickRate * GAME_SPEED;

            if (ghost.isScared) {
                ghost.moveAwayFrom(pacman.gridX, pacman.gridY, duration);
            } else {
                ghost.moveRandom(duration);
            }

            checkCollision(ghost);
        });
    }

    // D. Global Collision Check
    ghosts.forEach(ghost => checkCollision(ghost));

}, GAME_SPEED);