// --- Grid & Dimensions ---
// The size of one square tile in pixels.
// Everything in the game scales based on this value.
export const CELL_SIZE = 25;

// --- Cell Types (The Data Vocabulary) ---
// These integers represent what exists in a specific cell of the matrix.
export const CELL_TYPES = {
    EMPTY: 0,        // Walkable, no pellet (e.g., tunnel or spawn)
    WALL: 1,         // Blue barrier
    DOT: 2,          // Standard edible pellet
    POWER_PELLET: 3, // Large pellet (turns ghosts blue)
    GHOST_HOUSE: 4,  // Restricted area for ghosts
    DOOR: 5          // The gate for the ghost house
};

// --- Colors & Styling ---
// We define them here so we can change the theme easily later.
export const COLORS = {
    BACKGROUND: '#000000',
    WALL: '#1919A6',        // Classic arcade blue
    DOT: '#ffb8ae',         // Soft pink/salmon color for pellets
    POWER_PELLET: '#ffb8ae',
    DOOR: '#ffb8ff'         // Pinkish door
};

// --- Actors ---
// Identifiers for moving entities, useful for collision logic
export const ACTORS = {
    PACMAN: 'pacman',
    BLINKY: 'blinky', // Red
    PINKY: 'pinky',   // Pink
    INKY: 'inky',     // Cyan
    CLYDE: 'clyde'    // Orange
};

// --- Game Settings ---
export const GAME_SPEED = 150; // Milliseconds per tick (lower is faster)