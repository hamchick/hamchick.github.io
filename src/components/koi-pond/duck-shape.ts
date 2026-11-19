/**
 * The duck, side-on and facing right, as pixel art. A side view is what makes a duck read as a duck at a glance:
 * round head, flat bill, tail cocked up. It stays legible down to a few dozen screen pixels, where a duck seen
 * from above is just an oval.
 *
 *   W  plumage, lit from above
 *   G  folded wing
 *   S  underside, in shadow
 *   B  bill, with b its shaded underside
 *   E  eye
 */
export const DUCK_SPRITE = [
    ".........WWWW...",
    "........WWWWWW..",
    "........WWWWEWBB",
    "........WWWWWWbb",
    ".........WWWWW..",
    "W.........WWW...",
    "WW.......WWWW...",
    "WWWWWWWWWWWWWW..",
    "WWWWWWGGGGWWWWW.",
    "WWWWGGGGGGGWWWW.",
    ".WWWWGGGGGWWWWW.",
    "..SWWWWWWWWWWS..",
    "...SSSSSSSSSS...",
];

/**
 * Dabbling: tipped forward, tail to the sky and head under. A frame of its own rather than the sprite rotated,
 * since rotating pixel art leaves it ragged.
 */
export const DUCK_DABBLE = [
    "................",
    "..W.............",
    "..WW............",
    "..WWW...........",
    "...WWWW.........",
    "...WWWWWW.......",
    "....WWGGGGW.....",
    "....WWWGGGGWW...",
    ".....WWWGGGWWWW.",
    "......WWWWWWWWWW",
    ".......SWWWWWWWW",
    "........SSSWWWWW",
    "...........WWbBB",
];

export const DUCK_SPRITE_WIDTH = DUCK_SPRITE[0].length;
export const DUCK_SPRITE_HEIGHT = DUCK_SPRITE.length;
/** Rows from here down sit below the waterline, in both frames. */
export const DUCK_WATERLINE = 11;

/** The pixel at (col, row) of a frame, or "." when outside it. */
export function duckPixel(frame: string[], col: number, row: number) {
    if (row < 0 || row >= frame.length || col < 0 || col >= DUCK_SPRITE_WIDTH) return ".";
    return frame[row][col];
}
