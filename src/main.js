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
const pacman = new Pacman(svg, 9, 16);

// Spawn Logic
// Constructor: (svg, x, y, color, releaseTick)
// Coordinates: (9, 8) is Outside (Blinky's spot)
// Coordinates: (9, 10), (8, 10), (10, 10) are INSIDE the Ghost House
const ghosts = [
    new Ghost(svg, 9, 8, 'red', 0),         // Blinky (Starts Active)
    new Ghost(svg, 9, 10, 'pink', 100),     // Pinky (Center)
    new Ghost(svg, 8, 10, 'cyan', 300),     // Inky (Left)
    new Ghost(svg, 10, 10, 'orange', 500)   // Clyde (Right)
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

        // Win Condition Check
        totalDots--;

        if (totalDots === 0) {
            timer.stop();
            setTimeout(() => {
                alert(`YOU WIN! Perfect Score: ${score}`);
                // Optional: location.reload(); 
            }, 10);
        }
    }
}

/**
 * Checks if Pac-Man and a specific Ghost are occupying the same tile.
 * NOW INCLUDES: Physics fix for "Tunneling" (Swapping tiles).
 */
function checkCollision(ghost) {
    // 1. Standard Overlap
    const overlap = (ghost.gridX === pacman.gridX && ghost.gridY === pacman.gridY);

    // 2. Tunneling (Swap) Check
    // Occurs if they passed through each other in the same tick updates
    // Logic: Ghost is where Pac-Man WAS, and Pac-Man is where Ghost WAS.
    const swap = (ghost.gridX === pacman.prevGridX && ghost.gridY === pacman.prevGridY &&
        ghost.prevGridX === pacman.gridX && ghost.prevGridY === pacman.gridY);

    if (overlap || swap) {
        if (ghost.isScared && !ghost.isEaten) {
            // CASE A: Eat the Ghost
            score += 200;
            scoreSpan.innerText = score;
            ghost.setEaten(true);
        } else if (!ghost.isScared && !ghost.isEaten) {
            // CASE B: Game Over (Only if ghost is dangerous)
            timer.stop();
            setTimeout(() => alert("Game Over! Final Score: " + score), 10);
        }
    }
}

// --- Game Loop ---
const timer = d3.interval(() => {
    tick++;

    // A. Manage Scared Mode
    if (scaredTimer > 0) {
        scaredTimer--;
        if (scaredTimer <= GAME_CONSTANTS.FLASH_THRESHOLD && (scaredTimer % 10 === 0)) {
            ghosts.forEach(g => g.toggleFlash());
        }
        if (scaredTimer === 0) {
            ghosts.forEach(g => g.setScared(false));
        }
    }

    // B. Pac-Man Logic (Every 4 ticks)
    if (tick % 4 === 0) {
        const nextDirection = input.getDirection();

        let nextX = pacman.gridX + nextDirection.x;
        let nextY = pacman.gridY + nextDirection.y;
        let nextCell = level1[nextY][nextX];

        // 1. Try to turn
        if (nextCell !== CELL_TYPES.WALL && nextCell !== CELL_TYPES.GHOST_HOUSE) {
            currentDirection = nextDirection;
        } else {
            // 2. If turn failed, keep going straight
            nextX = pacman.gridX + currentDirection.x;
            nextY = pacman.gridY + currentDirection.y;
            nextCell = level1[nextY][nextX];
        }

        // 3. Move if valid
        if (nextCell !== CELL_TYPES.WALL && nextCell !== CELL_TYPES.GHOST_HOUSE) {
            pacman.move(nextX, nextY, currentDirection.angle, 4 * GAME_SPEED);
            handleEat(nextX, nextY);
        }
    }

    // C. Ghost Logic
    ghosts.forEach(ghost => {

        // 1. AT HOME (Bouncing)
        if (ghost.state === 'AT_HOME') {
            ghost.bounce(tick);
            if (tick >= ghost.releaseTick) {
                ghost.startExit();
            }
            return;
        }

        // 2. EXITING (Scripted Path)
        // We move them at a standard rate to look natural
        if (ghost.state === 'EXITING') {
            if (tick % 5 === 0) {
                ghost.moveExiting(5 * GAME_SPEED);
            }
            return;
        }

        // 3. ACTIVE (Standard AI)
        let moveRate = 5;
        if (ghost.isEaten) moveRate = 2; // Fast eyes
        else if (ghost.isScared) moveRate = 8; // Slow scared

        if (tick % moveRate === 0) {
            const duration = moveRate * GAME_SPEED;

            if (ghost.isEaten) {
                ghost.moveTowardsHome(duration);

                // Revival Check near door (9, 8)
                if (Math.abs(ghost.gridX - 9) <= 1 && Math.abs(ghost.gridY - 8) <= 1) {
                    ghost.setEaten(false);
                }
            }
            else if (ghost.isScared) {
                ghost.moveAwayFrom(pacman.gridX, pacman.gridY, duration);
            } else {
                ghost.moveRandom(duration);
            }

            checkCollision(ghost);
        }
    });

    // D. Global Collision (Safety Check)
    ghosts.forEach(ghost => {
        // Only check collision if ghost is fully active in the maze
        if (ghost.state === 'ACTIVE') {
            checkCollision(ghost);
        }
    });

}, GAME_SPEED);