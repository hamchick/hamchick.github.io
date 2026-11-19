/**
 * A yellow duckling as pixel art, facing right: big round head, a plump fluffy body, a stub of a tail and a small
 * bill. It has a frame for each way it can be seen as it swims about the pond, so turning reads as the duckling
 * turning round on the water rather than a picture sliding about:
 *
 *   SIDE    swimming left or right
 *   FRONT   three-quarters toward the viewer, swimming down the screen: both eyes and the bill show
 *   BACK    three-quarters away, swimming up the screen: the back of the head, the bill just peeking out
 *   DABBLE  tipped forward, tail to the sky and head under, for feeding (a frame of its own, since rotating
 *           pixel art leaves it ragged)
 *
 *   W  down, lit from above        B  bill, with b its shaded underside
 *   G  folded wing                 E  eye
 *   S  underside, in shadow
 */
export const DUCK_SIDE = [
    "........WWW...",
    ".......WWWWW..",
    "......WWWWEWBB",
    "......WWWWWWbb",
    ".......WWWWW..",
    "W.....WWWWWW..",
    "WW..WWWWWWWW..",
    "WWWWWWGGGWWWW.",
    "WWWWWGGGGGWWW.",
    ".WWWWWGGGWWWW.",
    "..SWWWWWWWWWS.",
    "...SSSSSSSSS..",
];

export const DUCK_FRONT = [
    "......WWWW....",
    ".....WWWWWW...",
    ".....WEWWEW...",
    ".....WWBBWW...",
    "......WbbW....",
    "W....WWWWWW...",
    "WW..WWWWWWWW..",
    "WWWWWGGWWWWWW.",
    ".WWWGGGWWWWWW.",
    "..WWWGGWWWWWW.",
    "...SWWWWWWWS..",
    "....SSSSSSS...",
];

export const DUCK_BACK = [
    ".......WWW....",
    "......WWWWW...",
    "......WWWWWB..",
    "......WWWWW...",
    ".......WWW....",
    "WW....WWWW....",
    "WWW.WWWWWWW...",
    "WWWWWGGGWWWW..",
    "WWWWGGGGGWWW..",
    ".WWWWGGGWWWW..",
    "..SWWWWWWWWS..",
    "...SSSSSSSS...",
];

export const DUCK_DABBLE = [
    "..............",
    ".W............",
    ".WW...........",
    ".WWWW.........",
    "..WWWWW.......",
    "..WWWGGGW.....",
    "...WWGGGGWW...",
    "...WWWGGGWWW..",
    "....WWWWWWWWW.",
    ".....SWWWWWWWW",
    "......SSWWWWWW",
    ".........WWWbB",
];

export const DUCK_SPRITE_WIDTH = DUCK_SIDE[0].length;
export const DUCK_SPRITE_HEIGHT = DUCK_SIDE.length;
/** Rows from here down sit below the waterline, in every frame. */
export const DUCK_WATERLINE = 10;
/** The head: the top rows, from this column forward. It reaches and nods while the duckling paddles. */
export const DUCK_HEAD_ROWS = 5;
export const DUCK_HEAD_FROM = 5;
/** The tail tuft: the top-left columns, which flick and lag behind in turns. */
export const DUCK_TAIL_COLS = 2;
export const DUCK_TAIL_ROWS = 7;

/** The pixel at (col, row) of a frame, or "." when outside it. */
export function duckPixel(frame: string[], col: number, row: number) {
    if (row < 0 || row >= frame.length || col < 0 || col >= DUCK_SPRITE_WIDTH) return ".";
    return frame[row][col];
}
