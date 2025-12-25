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

// Spawn Actors (Updated for 28x31 Map)
// Pacman starts at (14, 23)
const pacman = new Pacman(svg, 14, 23);

// Spawn Logic
// House Area: Rows 13-15, Cols 10-17. Door at (13, 12) & (14, 12).
// Blinky: (14, 11) - Outside
// Pinky: (14, 14) - Center
// Inky: (12, 14) - Left
// Clyde: (16, 14) - Right
const ghosts = [
    new Ghost(svg, 14, 11, 'red', 0),        // Blinky
    new Ghost(svg, 14, 14, 'pink', 100),     // Pinky
    new Ghost(svg, 12, 14, 'cyan', 300),     // Inky
    new Ghost(svg, 16, 14, 'orange', 500)    // Clyde
];

const input = new InputHandler();

// --- 2. Game State ---
let score = 0;
let tick = 0;
let scaredTimer = 0;
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

function handleEat(gridX, gridY) {
    // Boundary check for tunnel eating
    if (gridY < 0 || gridY >= NUM_ROWS || gridX < 0 || gridX >= NUM_COLS) return;

    const cellType = level1[gridY][gridX];

    if (cellType === CELL_TYPES.DOT || cellType === CELL_TYPES.POWER_PELLET) {
        level1[gridY][gridX] = CELL_TYPES.EMPTY;

        svg.selectAll('.cell')
            .filter(d => d.x === gridX && d.y === gridY)
            .select('circle')
            .remove();

        if (cellType === CELL_TYPES.POWER_PELLET) {
            score += 50;
            scaredTimer = GAME_CONSTANTS.SCARED_DURATION;
            ghosts.forEach(g => g.setScared(true));
        } else {
            score += 10;
        }

        scoreSpan.innerText = score;

        totalDots--;
        if (totalDots === 0) {
            timer.stop();
            setTimeout(() => {
                alert(`YOU WIN! Perfect Score: ${score}`);
            }, 10);
        }
    }
}

function checkCollision(ghost) {
    const overlap = (ghost.gridX === pacman.gridX && ghost.gridY === pacman.gridY);
    const swap = (ghost.gridX === pacman.prevGridX && ghost.gridY === pacman.prevGridY &&
        ghost.prevGridX === pacman.gridX && ghost.prevGridY === pacman.gridY);

    if (overlap || swap) {
        if (ghost.isScared && !ghost.isEaten) {
            score += 200;
            scoreSpan.innerText = score;
            ghost.setEaten(true);
        } else if (!ghost.isScared && !ghost.isEaten) {
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

        // --- WRAPPING LOGIC (The Tunnel) ---
        if (pacman.gridX < 0) {
            pacman.gridX = NUM_COLS - 1;
            pacman.x = (pacman.gridX + 0.5) * CELL_SIZE;
            pacman.group.interrupt().attr('transform', `translate(${pacman.x}, ${pacman.y}) rotate(${pacman.rotation})`);
        }
        else if (pacman.gridX >= NUM_COLS) {
            pacman.gridX = 0;
            pacman.x = (pacman.gridX + 0.5) * CELL_SIZE;
            pacman.group.interrupt().attr('transform', `translate(${pacman.x}, ${pacman.y}) rotate(${pacman.rotation})`);
        }

        const nextDirection = input.getDirection();

        let nextX = pacman.gridX + nextDirection.x;
        let nextY = pacman.gridY + nextDirection.y;

        let isTunnel = (nextY === 14 && (nextX < 0 || nextX >= NUM_COLS));
        let nextCell = !isTunnel ? level1[nextY][nextX] : CELL_TYPES.EMPTY;

        // 1. Try to turn
        if (isTunnel || (nextCell !== CELL_TYPES.WALL && nextCell !== CELL_TYPES.GHOST_HOUSE)) {
            currentDirection = nextDirection;
        } else {
            // 2. If turn failed, keep going straight
            nextX = pacman.gridX + currentDirection.x;
            nextY = pacman.gridY + currentDirection.y;

            isTunnel = (nextY === 14 && (nextX < 0 || nextX >= NUM_COLS));
            nextCell = !isTunnel ? level1[nextY][nextX] : CELL_TYPES.EMPTY;
        }

        // 3. Move if valid
        if (isTunnel || (nextCell !== CELL_TYPES.WALL && nextCell !== CELL_TYPES.GHOST_HOUSE)) {
            pacman.move(nextX, nextY, currentDirection.angle, 4 * GAME_SPEED);
            handleEat(nextX, nextY);
        }
    }

    // C. Ghost Logic
    ghosts.forEach(ghost => {

        // 1. AT HOME
        if (ghost.state === 'AT_HOME') {
            ghost.bounce(tick);
            if (tick >= ghost.releaseTick) {
                ghost.startExit();
            }
            return;
        }

        // 2. EXITING
        if (ghost.state === 'EXITING') {
            if (tick % 5 === 0) {
                ghost.moveExiting(5 * GAME_SPEED);
            }
            return;
        }

        // 3. ACTIVE
        let moveRate = 5;
        if (ghost.isEaten) moveRate = 2;
        else if (ghost.isScared) moveRate = 8;

        if (tick % moveRate === 0) {
            const duration = moveRate * GAME_SPEED;

            // --- GHOST WRAPPING LOGIC ---
            if (ghost.gridX < 0) {
                ghost.gridX = NUM_COLS - 1;
                ghost.x = (ghost.gridX + 0.5) * CELL_SIZE;
                ghost.group.interrupt().attr('transform', `translate(${ghost.x}, ${ghost.y})`);
            } else if (ghost.gridX >= NUM_COLS) {
                ghost.gridX = 0;
                ghost.x = (ghost.gridX + 0.5) * CELL_SIZE;
                ghost.group.interrupt().attr('transform', `translate(${ghost.x}, ${ghost.y})`);
            }

            if (ghost.isEaten) {
                ghost.moveTowardsHome(duration);

                // REVIVAL CHECK: Target Center of House (14, 14)
                if (Math.abs(ghost.gridX - 14) <= 1 && Math.abs(ghost.gridY - 14) <= 1) {
                    ghost.revive();
                }
            }
            else if (ghost.isScared) {
                ghost.moveAwayFrom(pacman.gridX, pacman.gridY, duration);
            }
            else {
                // PERSONALITY AI
                if (ghost.baseColor === 'red') {
                    ghost.moveToTarget(pacman.gridX, pacman.gridY, duration);
                }
                else if (ghost.baseColor === 'pink') {
                    const offset = 4;
                    const targetX = pacman.gridX + (currentDirection.x * offset);
                    const targetY = pacman.gridY + (currentDirection.y * offset);
                    ghost.moveToTarget(targetX, targetY, duration);
                }
                else {
                    ghost.moveRandom(duration);
                }
            }

            checkCollision(ghost);
        }
    });

    // D. Global Collision
    ghosts.forEach(ghost => {
        if (ghost.state === 'ACTIVE') {
            checkCollision(ghost);
        }
    });

}, GAME_SPEED);