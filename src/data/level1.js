import { CELL_TYPES } from '../constants.js';

// Destructuring for visual brevity. 
// This makes the matrix look like the map itself.
const {
    WALL: W,
    DOT: D,
    POWER_PELLET: P,
    EMPTY: E,
    GHOST_HOUSE: G,
    DOOR: O
} = CELL_TYPES;

// 1 = Wall (Blue)
// 2 = Dot (Pink)
// 3 = Power Pellet (Big)
// 0 = Empty (Black)
// 4 = Ghost House (Black/Restricted)
// 5 = Door (Pink Line)

export const level1 = [
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
    [W, D, D, D, D, D, D, D, D, W, D, D, D, D, D, D, D, D, W],
    [W, P, W, W, D, W, W, W, D, W, D, W, W, W, D, W, W, P, W],
    [W, D, W, W, D, W, W, W, D, W, D, W, W, W, D, W, W, D, W],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, D, W, W, D, W, D, W, W, W, W, W, D, W, D, W, W, D, W],
    [W, D, D, D, D, W, D, D, D, W, D, D, D, W, D, D, D, D, W],
    [W, W, W, W, D, W, W, W, E, W, E, W, W, W, D, W, W, W, W],
    [E, E, E, W, D, W, E, E, E, E, E, E, E, W, D, W, E, E, E],
    [W, W, W, W, D, W, E, W, W, O, W, W, E, W, D, W, W, W, W],
    [E, D, D, D, D, E, E, W, G, G, G, W, E, E, D, D, D, D, E], // Middle Row (Tunnel)
    [W, W, W, W, D, W, E, W, W, W, W, W, E, W, D, W, W, W, W],
    [E, E, E, W, D, W, E, E, E, E, E, E, E, W, D, W, E, E, E],
    [W, W, W, W, D, W, D, W, W, W, W, W, D, W, W, W, W, W, W],
    [W, D, D, D, D, D, D, D, D, W, D, D, D, D, D, D, D, D, W],
    [W, D, W, W, D, W, W, W, D, W, D, W, W, W, D, W, W, D, W],
    [W, P, D, W, D, D, D, D, D, E, D, D, D, D, D, W, D, P, W],
    [W, W, D, W, D, W, D, W, W, W, W, W, D, W, D, W, D, W, W],
    [W, D, D, D, D, W, D, D, D, W, D, D, D, W, D, D, D, D, W],
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]
];