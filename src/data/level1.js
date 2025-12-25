import { CELL_TYPES } from '../constants.js';

const {
    WALL: W,
    DOT: D,
    POWER_PELLET: P,
    EMPTY: E,
    GHOST_HOUSE: G,
    DOOR: O
} = CELL_TYPES;

// Standard Arcade Layout (28 x 31)
export const level1 = [
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, W, W, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, D, W, W, W, W, D, W, W, W, W, W, D, W, W, D, W, W, W, W, W, D, W, W, W, W, D, W],
    [W, P, W, W, W, W, D, W, W, W, W, W, D, W, W, D, W, W, W, W, W, D, W, W, W, W, P, W],
    [W, D, W, W, W, W, D, W, W, W, W, W, D, W, W, D, W, W, W, W, W, D, W, W, W, W, D, W],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, D, W, W, W, W, D, W, W, D, W, W, W, W, W, W, W, W, D, W, W, D, W, W, W, W, D, W],
    [W, D, W, W, W, W, D, W, W, D, W, W, W, W, W, W, W, W, D, W, W, D, W, W, W, W, D, W],
    [W, D, D, D, D, D, D, W, W, D, D, D, D, W, W, D, D, D, D, W, W, D, D, D, D, D, D, W],
    [W, W, W, W, W, W, D, W, W, W, W, W, E, W, W, E, W, W, W, W, W, D, W, W, W, W, W, W],
    [E, E, E, E, E, W, D, W, W, W, W, W, E, W, W, E, W, W, W, W, W, D, W, E, E, E, E, E], // Tunnel Row 1
    [W, W, W, W, W, W, D, W, W, E, E, E, E, E, E, E, E, E, E, W, W, D, W, W, W, W, W, W],
    [W, W, W, W, W, W, D, W, W, E, W, W, W, O, O, W, W, W, E, W, W, D, W, W, W, W, W, W],
    [W, W, W, W, W, W, D, W, W, E, W, G, G, G, G, G, G, W, E, W, W, D, W, W, W, W, W, W],
    [E, E, E, E, E, E, D, E, E, E, W, G, G, G, G, G, G, W, E, E, E, D, E, E, E, E, E, E], // Tunnel Row 2 (Middle)
    [W, W, W, W, W, W, D, W, W, E, W, G, G, G, G, G, G, W, E, W, W, D, W, W, W, W, W, W],
    [W, W, W, W, W, W, D, W, W, E, W, W, W, W, W, W, W, W, E, W, W, D, W, W, W, W, W, W],
    [W, W, W, W, W, W, D, W, W, E, E, E, E, E, E, E, E, E, E, W, W, D, W, W, W, W, W, W],
    [E, E, E, E, E, W, D, W, W, E, W, W, W, W, W, W, W, W, E, W, W, D, W, E, E, E, E, E], // Tunnel Row 3
    [W, W, W, W, W, W, D, W, W, E, W, W, W, W, W, W, W, W, E, W, W, D, W, W, W, W, W, W],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, W, W, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, D, W, W, W, W, D, W, W, W, W, W, D, W, W, D, W, W, W, W, W, D, W, W, W, W, D, W],
    [W, D, W, W, W, W, D, W, W, W, W, W, D, W, W, D, W, W, W, W, W, D, W, W, W, W, D, W],
    [W, P, D, D, W, W, D, D, D, D, D, D, D, E, E, D, D, D, D, D, D, D, W, W, D, D, P, W],
    [W, W, W, D, W, W, D, W, W, D, W, W, W, W, W, W, W, W, D, W, W, D, W, W, D, W, W, W],
    [W, W, W, D, W, W, D, W, W, D, W, W, W, W, W, W, W, W, D, W, W, D, W, W, D, W, W, W],
    [W, D, D, D, D, D, D, W, W, D, D, D, D, W, W, D, D, D, D, W, W, D, D, D, D, D, D, W],
    [W, D, W, W, W, W, W, W, W, W, W, W, D, W, W, D, W, W, W, W, W, W, W, W, W, W, D, W],
    [W, D, W, W, W, W, W, W, W, W, W, W, D, W, W, D, W, W, W, W, W, W, W, W, W, W, D, W],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]
];