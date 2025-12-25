import { drawGrid } from './components/Grid.js';
import { Pacman } from './components/Pacman.js';
import { Ghost } from './components/Ghost.js';
import { level1 } from './data/level1.js';
import { CELL_SIZE, CELL_TYPES, GAME_SPEED, GAME_CONSTANTS } from './constants.js';
import { InputHandler } from './utils/Input.js';
import { SoundManager } from './utils/SoundManager.js';

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

drawGrid(svg, level1);

const pacman = new Pacman(svg, 14, 23);

// Ghosts (Blinky is Red, Pinky is Pink, Inky is Cyan, Clyde is Orange)
const ghosts = [
    new Ghost(svg, 14, 11, 'red', 0),        // Blinky (Out immediately)
    new Ghost(svg, 14, 14, 'pink', 1),       // Pinky (Out almost immediately)
    new Ghost(svg, 12, 14, 'cyan', 30),      // Inky (Waiting for 30 dots)
    new Ghost(svg, 16, 14, 'orange', 60)     // Clyde (Waiting for 60 dots)
];

const input = new InputHandler();
const sound = new SoundManager();

// --- 2. Game State ---
let score = 0;
let lives = 3;
let tick = 0;
let timer = null;
let scaredTimer = 0;
let currentDirection = { x: 0, y: 0, angle: 90 };
let isPaused = false;

// Wave State
let gameMode = 'SCATTER';
let modeClock = 0;

// NEW: Authentic Dot Counters
let dotsEatenLife = 0; // Resets on death

const scoreSpan = document.getElementById('score-value');
const livesSpan = document.getElementById('lives-value');

document.getElementById('restart-btn').addEventListener('click', () => {
    window.location.reload();
});

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
    if (gridY < 0 || gridY >= NUM_ROWS || gridX < 0 || gridX >= NUM_COLS) return false;

    const cellType = level1[gridY][gridX];

    if (cellType === CELL_TYPES.DOT || cellType === CELL_TYPES.POWER_PELLET) {
        level1[gridY][gridX] = CELL_TYPES.EMPTY;

        svg.selectAll('.cell')
            .filter(d => d.x === gridX && d.y === gridY)
            .select('circle')
            .remove();

        sound.play('waka');

        // NEW: Increment Dot Counter
        dotsEatenLife++;

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
            if (timer) timer.stop();
            sound.stopAll();
            setTimeout(() => {
                alert(`YOU WIN! Perfect Score: ${score}`);
            }, 10);
        }
        return true;
    }
    return false;
}

function handleLifeLost() {
    if (isPaused) return;

    isPaused = true;
    if (timer) timer.stop();

    sound.stopAll();
    sound.play('die');

    lives--;
    livesSpan.innerText = lives;

    ghosts.forEach(g => g.group.attr('opacity', 0));
    pacman.die();

    if (lives === 0) {
        setTimeout(() => alert("Game Over! Final Score: " + score), 2000);
    } else {
        setTimeout(() => {
            pacman.reset();
            ghosts.forEach(g => {
                g.reset();
                g.group.attr('opacity', 1);
            });

            tick = 0;
            scaredTimer = 0;
            currentDirection = { x: 0, y: 0, angle: 90 };
            gameMode = 'SCATTER';
            modeClock = 0;

            // NEW: Reset Dot Counter on Death (Makes it harder!)
            dotsEatenLife = 0;

            isPaused = false;
            startGameLoop();
        }, 2000);
    }
}

function checkCollision(ghost) {
    if (isPaused) return;

    const overlap = (ghost.gridX === pacman.gridX && ghost.gridY === pacman.gridY);
    const swap = (ghost.gridX === pacman.prevGridX && ghost.gridY === pacman.prevGridY &&
        ghost.prevGridX === pacman.gridX && ghost.prevGridY === pacman.gridY);

    if (overlap || swap) {
        if (ghost.isScared && !ghost.isEaten) {
            score += 200;
            scoreSpan.innerText = score;
            ghost.setEaten(true);
            sound.play('eatGhost');
        } else if (!ghost.isScared && !ghost.isEaten) {
            handleLifeLost();
        }
    }
}

// --- 4. Game Loop ---
function startGameLoop() {
    if (timer) timer.stop();

    sound.startSiren();

    timer = d3.interval(() => {
        if (isPaused) return;

        tick++;
        modeClock++;

        // Audio
        if (scaredTimer > 0) sound.startScared();
        else sound.startSiren();

        // --- NEW: Authentic Wave Timer with Reversals ---
        const scatterTicks = 7000 / GAME_SPEED;
        const chaseTicks = 20000 / GAME_SPEED;

        if (gameMode === 'SCATTER' && modeClock > scatterTicks) {
            gameMode = 'CHASE';
            modeClock = 0;
            // Force Reversal!
            ghosts.forEach(g => g.reverse());
        } else if (gameMode === 'CHASE' && modeClock > chaseTicks) {
            gameMode = 'SCATTER';
            modeClock = 0;
            // Force Reversal!
            ghosts.forEach(g => g.reverse());
        }

        // Scared Timer
        if (scaredTimer > 0) {
            scaredTimer--;
            if (scaredTimer <= GAME_CONSTANTS.FLASH_THRESHOLD && (scaredTimer % 10 === 0)) {
                ghosts.forEach(g => g.toggleFlash());
            }
            if (scaredTimer === 0) {
                ghosts.forEach(g => g.setScared(false));
            }
        }

        // --- NEW: Dot Counter Logic (Releasing Ghosts) ---
        // Pinky (Index 1): Releases instantly (handled by init)
        // Inky (Index 2): 30 Dots
        if (ghosts[2].isInHouse && dotsEatenLife >= 30) {
            ghosts[2].startExit();
        }
        // Clyde (Index 3): 60 Dots
        if (ghosts[3].isInHouse && dotsEatenLife >= 60) {
            ghosts[3].startExit();
        }

        // Pac-Man Logic
        if (tick % 4 === 0) {
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

            if (isTunnel || (nextCell !== CELL_TYPES.WALL && nextCell !== CELL_TYPES.GHOST_HOUSE)) {
                currentDirection = nextDirection;
            } else {
                nextX = pacman.gridX + currentDirection.x;
                nextY = pacman.gridY + currentDirection.y;
                isTunnel = (nextY === 14 && (nextX < 0 || nextX >= NUM_COLS));
                nextCell = !isTunnel ? level1[nextY][nextX] : CELL_TYPES.EMPTY;
            }

            if (isTunnel || (nextCell !== CELL_TYPES.WALL && nextCell !== CELL_TYPES.GHOST_HOUSE)) {
                pacman.move(nextX, nextY, currentDirection.angle, 4 * GAME_SPEED);
                const didEat = handleEat(nextX, nextY);
                if (!didEat) sound.stop('waka');
            }
        }

        // Ghost Logic
        ghosts.forEach(ghost => {
            if (isPaused) return;

            if (ghost.state === 'AT_HOME') {
                ghost.bounce(tick);
                // Note: startExit() is now called by Dot Counter logic above, 
                // OR by the constructor's initial releaseTick (for Blinky/Pinky).
                if (tick >= ghost.releaseTick && ghost.releaseTick > 0) {
                    ghost.startExit();
                }
                return;
            }

            if (ghost.state === 'EXITING') {
                if (tick % 5 === 0) {
                    ghost.moveExiting(5 * GAME_SPEED);
                }
                return;
            }

            // --- NEW: Dynamic Speed (Cruise Elroy) ---
            const moveRate = ghost.getMoveRate(totalDots);

            if (tick % moveRate === 0) {
                const duration = moveRate * GAME_SPEED;

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
                    if (Math.abs(ghost.gridX - 14) <= 1 && Math.abs(ghost.gridY - 14) <= 1) {
                        ghost.revive();
                    }
                }
                else if (ghost.isScared) {
                    ghost.moveAwayFrom(pacman.gridX, pacman.gridY, duration);
                }
                else {
                    pacman.currentDir = currentDirection;
                    ghost.processAI(pacman, ghosts[0], duration, gameMode);
                }

                checkCollision(ghost);
            }
        });

        ghosts.forEach(ghost => {
            if (ghost.state === 'ACTIVE') {
                checkCollision(ghost);
            }
        });

    }, GAME_SPEED);
}

startGameLoop();