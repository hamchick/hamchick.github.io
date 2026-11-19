/**
 * A white farmyard duck seen side-on, built from a few ellipses so it can be sampled into the pond's glyph mosaic
 * at any size, flipped, and tipped forward to dabble without going ragged. The side view is what makes it read as
 * a duck: long boat-shaped body, tail cocked up, a curved neck, a small head and a long flat bill. Proportions are
 * a real duck's, not a toy's, so it sits in the same world as the koi.
 *
 * Body space: `u` forward from the middle, `v` up from the waterline, both as fractions of the duck's length.
 */

export const DUCK_NONE = 0;
export const DUCK_BODY = 1;
export const DUCK_WING = 2;
export const DUCK_HEAD = 3;
export const DUCK_BILL = 4;
export const DUCK_EYE = 5;
export const DUCK_FOOT = 6;

type Ellipse = { u: number; v: number; a: number; b: number };

const BODY: Ellipse = { u: -0.03, v: 0.11, a: 0.37, b: 0.16 };
const WING: Ellipse = { u: -0.09, v: 0.15, a: 0.24, b: 0.075 };
const HEAD: Ellipse = { u: 0.3, v: 0.47, a: 0.105, b: 0.08 };
const BILL: Ellipse = { u: 0.43, v: 0.44, a: 0.085, b: 0.028 };
export const DUCK_EYE_AT = { u: 0.33, v: 0.49 };
const EYE_R = 0.022;
// The neck curves up from the breast to the back of the head.
const NECK_FROM = { u: 0.22, v: 0.18 };
const NECK_TO = { u: 0.27, v: 0.43 };
const NECK_R = 0.06;
const FOOT: Ellipse = { u: 0, v: -0.12, a: 0.055, b: 0.022 };

/** Where the pose puts the moving parts. */
export interface DuckPose {
    /** Head, neck and bill pushed forward along the body, nodding with the stroke. */
    nod: number;
    /** Tail tip lifted, flicking with the stroke. */
    flick: number;
    /** How far each foot is pushed forward (+) or back (-) in its stroke. */
    footA: number;
    footB: number;
    /** Light direction in body space, so shading stays lit from the screen's upper left whichever way it faces. */
    lightU: number;
}

export interface DuckHit {
    part: number;
    /** 0 in shadow to 1 fully lit. */
    lum: number;
}

/** Shading of a rounded part at (u, v): a dome lit from above and the front-left. -1 when outside it. */
function dome(e: Ellipse, u: number, v: number, pose: DuckPose) {
    const eu = (u - e.u) / e.a;
    const ev = (v - e.v) / e.b;
    const r2 = eu * eu + ev * ev;
    if (r2 >= 1) return -1;
    const nz = Math.sqrt(1 - r2);
    const lum = eu * pose.lightU + ev * 0.7 + nz * 0.6;
    return Math.max(0, Math.min(1, lum * 0.7 + 0.2));
}

/** Classify a point in body space against the duck; fills `out`. */
export function classifyDuck(u: number, v: number, pose: DuckPose, out: DuckHit) {
    out.part = DUCK_NONE;
    out.lum = 0;

    // Feet hang under the water, stroking forward and back out of step.
    if (v < -0.05) {
        const lum = Math.max(dome(FOOT, u - pose.footA, v, pose), dome(FOOT, u - pose.footB, v, pose));
        if (lum >= 0) {
            out.part = DUCK_FOOT;
            out.lum = lum;
            return true;
        }
    }

    // Head, neck and bill ride forward together with the nod.
    const hu = u - pose.nod;
    if (Math.hypot(hu - DUCK_EYE_AT.u, v - DUCK_EYE_AT.v) < EYE_R) {
        out.part = DUCK_EYE;
        return true;
    }
    let lum = dome(BILL, hu, v, pose);
    if (lum >= 0) {
        out.part = DUCK_BILL;
        out.lum = lum;
        return true;
    }
    lum = dome(HEAD, hu, v, pose);
    if (lum >= 0) {
        out.part = DUCK_HEAD;
        out.lum = lum;
        return true;
    }
    // The neck: a round-ended stroke from breast to head, shaded across its width.
    const nx = NECK_TO.u - NECK_FROM.u;
    const ny = NECK_TO.v - NECK_FROM.v;
    const t = Math.max(0, Math.min(1, ((hu - NECK_FROM.u) * nx + (v - NECK_FROM.v) * ny) / (nx * nx + ny * ny)));
    const neckD = Math.hypot(hu - NECK_FROM.u - nx * t, v - NECK_FROM.v - ny * t) / NECK_R;
    if (neckD < 1) {
        out.part = DUCK_HEAD;
        out.lum = 0.45 + 0.35 * Math.sqrt(1 - neckD * neckD);
        return true;
    }

    lum = dome(BODY, u, v, pose);
    if (lum >= 0) {
        const wu = (u - WING.u) / WING.a;
        const wv = (v - WING.v) / WING.b;
        out.part = wu * wu + wv * wv < 1 ? DUCK_WING : DUCK_BODY;
        out.lum = lum;
        return true;
    }

    // The tail: a short wedge rising off the back of the body, its tip flicking.
    if (u < -0.3 && u > -0.5) {
        const k = (-0.3 - u) / 0.2;
        const tipV = 0.27 + pose.flick;
        const lo = 0.08 + k * (tipV - 0.03 - 0.08);
        const hi = 0.22 + k * (tipV - 0.22);
        if (v > lo && v < hi) {
            out.part = DUCK_WING;
            out.lum = 0.55 - k * 0.2;
            return true;
        }
    }
    return false;
}
