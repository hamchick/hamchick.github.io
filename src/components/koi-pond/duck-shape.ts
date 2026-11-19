import { clamp } from "./world";

export const DUCK_NONE = 0;
export const DUCK_BODY = 1;
export const DUCK_HEAD = 2;
export const DUCK_WING = 3;
export const DUCK_TAIL = 4;
export const DUCK_BILL = 5;

type Ellipse = { u: number; v: number; a: number; b: number };

/** A duck seen from above, in fractions of its length: `u` forward from the middle, `v` to its right. */
export const DUCK = {
    body: { u: -0.07, v: 0, a: 0.41, b: 0.25 },
    head: { u: 0.31, v: 0, a: 0.155, b: 0.13 },
    bill: { u: 0.48, v: 0, a: 0.1, b: 0.065 },
    wing: { u: -0.13, v: 0.1, a: 0.28, b: 0.1 },
    eye: { u: 0.35, v: 0.085 },
};

// Light from the upper left and a little above, the same side the koi are lit from.
const LIGHT = (() => {
    const v = [-0.45, -0.6, 0.66];
    const n = Math.hypot(v[0], v[1], v[2]);
    return v.map((c) => c / n);
})();

export interface DuckHit {
    part: number;
    /** 0 in shadow to 1 fully lit. */
    lum: number;
    /** Which side of the spine: 1 right, -1 left. */
    side: number;
}

export interface DuckPose {
    /** Heading as cos and sin, for turning surface normals into screen space. */
    cos: number;
    sin: number;
    /** How far the rear of the body curves into a turn. */
    bend: number;
    /** Head turned on the neck, in radians. */
    look: number;
    /** 0..1 while the duck dips its bill into the water. */
    dip: number;
}

/** Height of an ellipsoid cap at (u, v), shaded by the light; -1 when outside it. `taper` narrows its back end. */
function dome(e: Ellipse, u: number, v: number, pose: DuckPose, taper = 0, size = 1) {
    const eu = (u - e.u) / (e.a * size);
    const b = e.b * size * (eu < 0 ? 1 - taper * eu * eu : 1);
    const ev = (v - e.v) / b;
    const r2 = eu * eu + ev * ev;
    if (r2 >= 1) return -1;
    const nz = Math.sqrt(1 - r2);
    const nx = eu * pose.cos - ev * pose.sin;
    const ny = eu * pose.sin + ev * pose.cos;
    return clamp(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2], 0, 1) * 0.85 + nz * 0.15;
}

/** Where the head pivots on the neck, along the spine. */
export const NECK = DUCK.head.u - DUCK.head.a;

/** Classify a point in body space (fractions of length) against the duck; fills `out`. */
export function classifyDuck(u: number, v: number, pose: DuckPose, out: DuckHit) {
    out.part = DUCK_NONE;
    out.side = v > 0 ? 1 : -1;
    // The rear of the body swings into turns.
    if (u < 0) v -= pose.bend * u * u * 1.6;

    // The head swivels on the neck, and reaches forward and down a little as the bill dips.
    const lc = Math.cos(pose.look);
    const ls = Math.sin(pose.look);
    const nu = u - NECK;
    const hu = NECK + nu * lc + v * ls - pose.dip * 0.07;
    const hv = -nu * ls + v * lc;

    let lum = dome(DUCK.bill, hu, hv, pose, 0, 1 - pose.dip * 0.15);
    if (lum >= 0) {
        out.part = DUCK_BILL;
        out.lum = lum;
        return true;
    }
    lum = dome(DUCK.head, hu, hv, pose, 0, 1 - pose.dip * 0.12);
    if (lum >= 0) {
        out.part = DUCK_HEAD;
        out.lum = lum;
        return true;
    }
    lum = dome(DUCK.body, u, v, pose, 0.35);
    if (lum >= 0) {
        const w = DUCK.wing;
        const wu = (u - w.u) / w.a;
        const wv = (v - out.side * w.v) / w.b;
        out.part = wu * wu + wv * wv < 1 ? DUCK_WING : DUCK_BODY;
        out.lum = lum;
        return true;
    }
    // A short wedge of tail feathers.
    if (u < -0.38 && u > -0.6) {
        const half = 0.13 * ((u + 0.6) / 0.22);
        if (Math.abs(v) < half) {
            out.part = DUCK_TAIL;
            out.lum = 0.35 - (v / half) * 0.15;
            return true;
        }
    }
    return false;
}
