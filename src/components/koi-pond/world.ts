import { DUCK_SPRITE_WIDTH } from "./duck-shape";

export const TAU = Math.PI * 2;
export const KOI_NODES = 20;
export const RIPPLE_SPEED = 52;

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export function smoothstep(e0: number, e1: number, x: number) {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
}

export function angleDiff(a: number, b: number) {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
}

// Deterministic integer hash to [0, 1), so textures stay pinned to the body.
export function hash3(x: number, y: number, z: number) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

export type Box = { left: number; top: number; right: number; bottom: number };

export type Variety = "kohaku" | "sanke" | "tancho";

const VARIETY_WEIGHTS: [Variety, number][] = [
    ["kohaku", 3],
    ["sanke", 2],
    ["tancho", 1],
];
const TOTAL_WEIGHT = VARIETY_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);

function pickVariety(): Variety {
    let r = Math.random() * TOTAL_WEIGHT;
    for (const [variety, weight] of VARIETY_WEIGHTS) {
        r -= weight;
        if (r <= 0) return variety;
    }
    return "kohaku";
}

export interface Koi {
    id: number;
    variety: Variety;
    length: number;
    /** Spine positions, snout first: [x0, y0, x1, y1, ...]. */
    nodes: Float32Array;
    heading: number;
    speed: number;
    phase: number;
    /** Smoothed angular velocity, used to splay the fins into turns. */
    turn: number;
    wander: number;
    /** How strongly this koi swims over to the cursor. */
    curiosity: number;
    /** 0.5 deep and dim to 1 just under the surface. */
    depth: number;
    depthTarget: number;
    depthMax: number;
    nextDive: number;
    nextSurface: number;
    /** When a koi swimming near the surface next sends a small ring off its tail. */
    nextWake: number;
    /** 1 just after food hits the water nearby, fading: the koi sprints and turns harder while it lasts. */
    rush: number;
    /** The pellet this koi is going for. It sticks with it so a burst of clicks doesn't yank it around. */
    food: Pellet | null;
    /** Tail-beat intensity: koi swim in bursts of beats, then coast with the tail still. */
    beat: number;
    burstUntil: number;
    nextBurst: number;
    /** Phase of the pectoral fins, which scull gently while the koi coasts or hovers. */
    finPhase: number;
    /** 1 right after a fright, fading as the koi calms down. */
    startle: number;
    fleeX: number;
    fleeY: number;
    /** How far the mouth is open, as the koi closes in on food. */
    gulp: number;
}

/** Which way round the duckling is seen: side-on, three-quarters toward the viewer, or three-quarters away. */
export type DuckView = "side" | "front" | "back";

/**
 * A yellow duckling floating on the surface: a bystander that drifts about and now and then joins in at feeding
 * time. It moves across the pond like the koi, but is drawn as pixel art seen from the side, turning to show its
 * face or its back as it swims down or up the screen. (x, y) is where it meets the water, under its middle.
 */
export interface Duck {
    id: number;
    /** The white mother duck leading the line; the rest are her yellow ducklings. */
    mother: boolean;
    /** Index in World.ducks of the duck this one follows in line, or null for the leader. */
    follows: number | null;
    x: number;
    y: number;
    /** Size of one sprite pixel, in screen pixels. */
    pixel: number;
    /** Sprite width in screen pixels. */
    length: number;
    heading: number;
    speed: number;
    /** Smoothed rate of turning, so the head can lead into a turn and the tail trail after it. */
    turn: number;
    /** 1 facing right, -1 facing left; the front and back views lean one way or the other too. */
    facing: number;
    view: DuckView;
    /** When it last turned to face the other way, so the sprite can flip over rather than snap. */
    flipAt: number;
    /** Phase of the paddling feet; each foot's push is a surge forward, and the body bobs and nods in time. */
    paddle: number;
    /** 0 gliding with the feet still, 1 paddling; eased, so strokes fade in and out. */
    beat: number;
    paddleUntil: number;
    nextPaddle: number;
    wander: number;
    /** 1 when the duck has decided to go for food, fading as it loses interest or fills up. */
    keen: number;
    food: Pellet | null;
    /** 0..1 while the bill dips into the water. */
    dip: number;
    /** When it last took a pellet: it pecks at it a few times, then lifts its head to swallow. */
    peckAt: number;
    /** Pecks made so far at the current pellet, so each one can splash. */
    pecks: number;
    /** When a koi last startled it, coming up under it from the pond below. */
    startleAt: number;
    dipAt: number;
    nextDip: number;
    /** Where the duck has been lately, oldest first, for drawing the V of its wake. */
    trail: TrailPoint[];
    nextTrail: number;
    nextQuack: number;
}

export interface TrailPoint {
    x: number;
    y: number;
    heading: number;
    speed: number;
    born: number;
}

/** A little "quack" that floats up off a duck and fades. */
export interface Quack {
    x: number;
    y: number;
    born: number;
    text: string;
}

export interface Pellet {
    x: number;
    y: number;
    born: number;
    /** Seconds after `born` that it hits the water; until then it's falling and koi can't eat it. */
    landAt: number;
    landed: boolean;
    /** Slow drift once it's floating. */
    vx: number;
    vy: number;
    /**
     * Thrown into the ducklings' strip on the home page, where the water is seen from the side: the height it drops
     * from onto the waterline at `y`. Absent for food thrown into the pond seen from above.
     */
    fromY?: number;
}

/** The moment a koi takes a pellet, drawn as a brief flash where it happened. */
export interface Bite {
    x: number;
    y: number;
    born: number;
}

export interface Ripple {
    x: number;
    y: number;
    born: number;
    strength: number;
}

const push = { x: 0, y: 0 };

/** Sum of pushes away from every box within `margin` of (x, y), each scaled 0..1 by closeness. */
function repel(boxes: Box[], x: number, y: number, margin: number, out: { x: number; y: number }) {
    out.x = 0;
    out.y = 0;
    for (const b of boxes) {
        let ox = x - clamp(x, b.left, b.right);
        let oy = y - clamp(y, b.top, b.bottom);
        let d = Math.hypot(ox, oy);
        if (d > margin) continue;
        if (d < 1e-3) {
            // Inside the box: head for the nearest edge.
            const edges = [b.left - x, x - b.right, b.top - y, y - b.bottom];
            const nearest = edges.indexOf(Math.max(...edges));
            ox = nearest === 0 ? -1 : nearest === 1 ? 1 : 0;
            oy = nearest === 2 ? -1 : nearest === 3 ? 1 : 0;
            d = 0;
        }
        const len = Math.hypot(ox, oy) || 1;
        out.x += (ox / len) * (1 - d / margin);
        out.y += (oy / len) * (1 - d / margin);
    }
    return out;
}

export const PELLET_LIFE = 14;
export const BITE_LIFE = 0.45;
const RUSH_RANGE = 650;
const FEED_CALM = 2;
/** Uneaten pellets start to sink this many seconds in, fading out by PELLET_LIFE. */
export const PELLET_SINK = 9;
const THROW_RADIUS = 34;
const STARTLE_SPEED = 1100;
const MAX_PELLETS = 24;
/** Chance that a duck joins in when food is thrown. */
const DUCK_APPETITE = 0.4;
/** A pellet landing this close, in duck lengths, gets a duck's attention anyway. */
const DUCK_NOTICE = 2.2;
const DUCK_RANGE = 460;
/** How long a duck takes to turn round and face the other way. */
export const DUCK_FLIP_TIME = 0.28;
/** How long a dabble lasts: tipping forward, head under, and back up. */
export const DUCK_DIP_TIME = 1.4;
/** Taking a pellet: this many quick pecks at the surface, over this long, then a lift of the head to swallow. */
export const DUCK_PECKS = 2;
export const DUCK_PECK_TIME = 0.9;
export const DUCK_GULP_TIME = 0.35;
/** How long a wake stays on the water behind a duck, and how often its path is sampled. */
export const TRAIL_LIFE = 6;
const TRAIL_EVERY = 0.2;
export const QUACK_LIFE = 2.4;
/** Chance of a sound on each pellet a duck takes. */
const QUACK_ON_FOOD = 0.5;
/** What a duck says over a pellet, and now and then to itself. */
const EATING_SOUNDS = ["quack!", "nom nom"];
const IDLE_SOUNDS = ["quack", "peep"];
/** A duckling keeps this far behind the duck ahead of it in line, in their two lengths added together. */
const FAMILY_GAP = 0.6;
/** How far above the foot of the strip the ducklings float, in pixels. */
const STRIP_FLOAT = 14;
/** A koi's head coming this close under the strip's edge, beneath a duck, startles it, at most this often. */
const STARTLE_REACH = 40;
const STARTLE_EVERY = 12;
/** How fast a gliding duck loses speed, per second. */
const DUCK_DRAG = 1.3;
/** Average of a foot's push over a stroke, max(0, sin) averaged: scales the push so speed settles where intended. */
const STROKE_MEAN = 1 / Math.PI;
/**
 * Ducks keep mostly to left and right, the way the side-on sprite faces: they steer with vertical pulls weakened,
 * and cover ground up and down the screen more slowly, as on a pond seen from a low angle.
 */
const DUCK_STEER_VERTICAL = 0.85;
const DUCK_VERTICAL_SPEED = 0.8;

export class World {
    width = 0;
    height = 0;
    time = 0;
    koi: Koi[] = [];
    ducks: Duck[] = [];
    quacks: Quack[] = [];
    pellets: Pellet[] = [];
    bites: Bite[] = [];
    /** Moving the mouse to throw food isn't a threat, so swipes don't startle koi for a moment after a throw. */
    private lastFeed = -Infinity;
    ripples: Ripple[] = [];
    pointer = { x: 0, y: 0, speed: 0, active: false };
    /** Page content the koi steer around, in canvas space. */
    avoid: Box[] = [];
    /**
     * On the content pages only a strip of water along the top of the screen shows, this many pixels deep: koi and
     * ducklings keep to it there. null for the whole pond, on the home page.
     */
    band: number | null = null;
    /**
     * On the home page the ducklings keep to a strip along the top as well, this many pixels deep, and the koi to the
     * water below it: the strip is the surface seen from the side, the pond below seen from above. null to let the
     * ducklings roam the whole pond.
     */
    duckStrip: number | null = null;

    /** Depth of the strip the ducklings keep to right now, or null when they roam the whole pond. */
    get duckBand() {
        return this.band ?? this.duckStrip;
    }

    /**
     * On the home page, where the ducklings' strip is the surface seen from the side, the height of its waterline,
     * where the ducklings float and food thrown into the strip lands. null elsewhere.
     */
    get waterline() {
        return this.band === null && this.duckStrip !== null ? this.duckStrip - STRIP_FLOAT : null;
    }

    /** Top of the water the koi swim in: below the ducklings' strip on the home page, the top of the screen otherwise. */
    get koiCeiling() {
        return this.band === null ? (this.duckStrip ?? 0) : 0;
    }

    /** Keep the ducklings to a strip along the top on the home page too. A family out in the pond starts off in it. */
    setDuckStrip(depth: number | null) {
        this.duckStrip = depth;
        if (depth === null || this.ducks.every((d) => d.y <= depth)) return;
        this.lineUp(rand(this.width * 0.3, this.width * 0.7), depth, Math.random() < 0.5 ? 1 : -1);
    }

    /** Put the family in a line along the strip: the mother at x, her ducklings strung out behind her. */
    private lineUp(x: number, band: number, facing: number) {
        let at = x;
        for (const d of this.ducks) {
            const ahead = d.follows === null ? null : this.ducks[d.follows];
            if (ahead) at -= facing * (d.length + ahead.length) * FAMILY_GAP;
            d.x = at;
            d.y = band - rand(10, 16);
            d.heading = facing > 0 ? 0 : Math.PI;
            d.facing = facing;
            d.view = "side";
            d.trail = [];
        }
    }

    /**
     * Size of one duckling sprite pixel, in CSS pixels. Set before the first resize. It needn't be a whole number of
     * device pixels: the renderer lands each pixel's edges on whole ones.
     */
    duckPixel = 3;
    /** The same for the mother duck, a size up. */
    motherPixel = 4;

    /** Narrow the pond to a strip along the top, or open it back out with null. */
    setBand(band: number | null) {
        const entering = band !== null && this.band === null;
        this.band = band;
        if (!entering) return;
        const { width: W } = this;
        // Bring everyone up to the strip from out of sight, so they arrive in it within moments rather than
        // minutes: the family paddles in from one side in a line, koi rise from just beneath it. A family already
        // in the strip from the home page just paddles on.
        if (this.ducks.some((d) => d.y > band)) {
            const fromLeft = Math.random() < 0.5;
            const lead = this.ducks[0];
            this.lineUp(fromLeft ? -lead.length * 0.6 : W + lead.length * 0.6, band, fromLeft ? 1 : -1);
            for (const d of this.ducks) {
                // Paddling steadily, not drifting, until it's well into view.
                d.speed = 28;
                d.paddleUntil = this.time + rand(3, 5);
            }
        }
        for (const k of this.koi) {
            const hy = k.nodes[1];
            if (hy < band) continue;
            const shift = band + rand(0.2, 0.9) * k.length - hy;
            for (let n = 0; n < KOI_NODES; n++) k.nodes[n * 2 + 1] += shift;
        }
    }

    resize(width: number, height: number) {
        const first = this.width === 0;
        this.width = width;
        this.height = height;
        if (first) this.seed();
    }

    private seed() {
        const { width: W, height: H } = this;
        const minSide = Math.min(W, H);
        const baseLength = clamp(minSide * 0.5, 170, 420);
        const count = clamp(Math.round((W * H) / 240000), 3, 6);
        // Wide screens also get a couple of young koi that keep to the deep water, for a sense of depth.
        const young = W >= 1024 ? 2 : 0;

        this.koi = [];
        for (let i = 0; i < count + young; i++) {
            const isYoung = i >= count;
            const length = baseLength * (isYoung ? rand(0.32, 0.45) : rand(0.6, 1));
            const depthMax = isYoung ? 0.72 : 1;
            const heading = rand(0, TAU);
            const x = rand(W * 0.1, W * 0.9);
            const y = rand(H * 0.1, H * 0.9);
            const nodes = new Float32Array(KOI_NODES * 2);
            const seg = length / (KOI_NODES - 1);
            for (let n = 0; n < KOI_NODES; n++) {
                nodes[n * 2] = x - Math.cos(heading) * seg * n;
                nodes[n * 2 + 1] = y - Math.sin(heading) * seg * n;
            }
            this.koi.push({
                id: i + 1,
                variety: pickVariety(),
                length,
                nodes,
                heading,
                speed: 20,
                phase: rand(0, TAU),
                turn: 0,
                wander: 0,
                curiosity: rand(0.35, 1),
                depth: rand(0.5, depthMax),
                depthTarget: rand(0.5, depthMax),
                depthMax,
                nextDive: rand(6, 18),
                nextSurface: rand(3, 14),
                nextWake: rand(0, 2),
                beat: 0,
                rush: 0,
                food: null,
                burstUntil: 0,
                nextBurst: rand(0, 3),
                finPhase: rand(0, TAU),
                startle: 0,
                fleeX: 0,
                fleeY: 0,
                gulp: 0,
            });
        }

        // A mother duck and her ducklings in a line behind her: two of them on a phone, three on wider screens.
        // Small beside the grown koi, so they stay in the background.
        this.ducks = [];
        // A duckling about 42px wide on a phone, a fifth smaller on a wider screen (see duckPixel).
        for (let i = 0; i < 1 + (W >= 1024 ? 3 : 2); i++) {
            const heading = rand(0, TAU);
            const mother = i === 0;
            const pixel = mother ? this.motherPixel : this.duckPixel;
            this.ducks.push({
                id: i + 1,
                mother,
                follows: mother ? null : i - 1,
                x: rand(W * 0.15, W * 0.85),
                y: rand(H * 0.15, H * 0.85),
                pixel,
                length: DUCK_SPRITE_WIDTH * pixel,
                heading,
                speed: 8,
                turn: 0,
                facing: Math.cos(heading) >= 0 ? 1 : -1,
                view: "side",
                flipAt: -Infinity,
                paddle: rand(0, TAU),
                beat: 0,
                paddleUntil: 0,
                nextPaddle: rand(0, 2),
                wander: 0,
                keen: 0,
                food: null,
                dip: 0,
                dipAt: -Infinity,
                peckAt: -Infinity,
                pecks: DUCK_PECKS,
                startleAt: -Infinity,
                nextDip: rand(6, 16),
                trail: [],
                nextTrail: 0,
                // The first quack comes early, so a visitor finds out there are ducks before long.
                nextQuack: rand(3, 8) + i * 4,
            });
        }
        this.placeDucks();
        // Seeded after the strip was set: start the ducklings in it.
        if (this.duckStrip !== null) this.setDuckStrip(this.duckStrip);
    }

    /** A loose handful thrown at (x, y): each pellet lands a beat apart with its own splash, then drifts and sinks. */
    feed(x: number, y: number) {
        this.lastFeed = this.time;
        const line = this.waterline;
        if (line !== null && this.duckStrip !== null && y < this.duckStrip) {
            this.feedStrip(x, y, line);
            return;
        }
        this.ripples.push({ x, y, born: this.time, strength: 0.35 });
        for (const d of this.ducks) if (Math.random() < DUCK_APPETITE) d.keen = 1;
        // A full pond takes no more food, rather than dropping old pellets out from under koi already going for them.
        const count = Math.min(5 + Math.floor(Math.random() * 3), MAX_PELLETS - this.pellets.length);
        for (let k = 0; k < count; k++) {
            const a = rand(0, TAU);
            const r = Math.sqrt(Math.random()) * THROW_RADIUS;
            const drift = rand(2, 6);
            this.pellets.push({
                x: x + Math.cos(a) * r * 1.3,
                y: y + Math.sin(a) * r,
                born: this.time,
                landAt: rand(0.15, 0.45),
                landed: false,
                vx: Math.cos(a) * drift,
                vy: Math.sin(a) * drift,
            });
        }
    }

    /**
     * Food thrown into the ducklings' strip on the home page, where the water is seen from the side: a handful
     * scattered along the waterline, each dropping straight down onto it from about where it was thrown. Only the
     * ducklings go for it.
     */
    private feedStrip(x: number, y: number, line: number) {
        for (const d of this.ducks) if (Math.random() < DUCK_APPETITE * 1.5) d.keen = 1;
        const count = Math.min(4 + Math.floor(Math.random() * 3), MAX_PELLETS - this.pellets.length);
        for (let k = 0; k < count; k++) {
            const from = Math.min(line - 4, y - rand(0, 10));
            this.pellets.push({
                x: x + rand(-1, 1) * THROW_RADIUS * 1.3,
                y: line,
                fromY: from,
                born: this.time,
                // Further to fall, longer to land.
                landAt: 0.18 + Math.sqrt(Math.max(0, line - from) / 400) + rand(0, 0.15),
                landed: false,
                vx: rand(-4, 4),
                vy: 0,
            });
        }
    }

    /**
     * How much open water a duck would have at (x, y): positive when it sits clear of the page text, of every koi's
     * body and of the other ducks, negative by how far it overlaps the nearest of them.
     */
    private duckRoom(d: Duck, x: number, y: number) {
        const L = d.length;
        // Head clear of the top of the screen, where the site header sits.
        let room = y - L * 1.8;
        for (const b of this.avoid) {
            room = Math.min(room, Math.max(b.left - x, x - b.right, b.top - y, y - b.bottom) - L);
        }
        for (const k of this.koi) {
            for (let n = 0; n < KOI_NODES; n += 2) {
                const gap = Math.hypot(k.nodes[n * 2] - x, k.nodes[n * 2 + 1] - y);
                room = Math.min(room, gap - (L * 0.6 + k.length * 0.2));
            }
        }
        for (const o of this.ducks) {
            if (o !== d) room = Math.min(room, Math.hypot(o.x - x, o.y - y) - (L + o.length) * 1.2);
        }
        return room;
    }

    /**
     * Start each duck in open water, off the text and not on top of a koi or the other duck. Run at seeding and
     * again once the content has first been measured. Where nowhere is fully clear, as on a small phone screen,
     * a duck takes the roomiest spot it found.
     */
    placeDucks() {
        // In the strip along the top they're already where they belong.
        if (this.duckBand !== null) return;
        const { width: W, height: H } = this;
        for (const d of this.ducks) {
            let best = this.duckRoom(d, d.x, d.y);
            if (best > 0) continue;
            let bestX = d.x;
            let bestY = d.y;
            for (let tries = 0; tries < 60 && best <= 0; tries++) {
                const x = rand(W * 0.1, W * 0.9);
                const y = rand(H * 0.12, H * 0.88);
                const room = this.duckRoom(d, x, y);
                if (room > best) {
                    best = room;
                    bestX = x;
                    bestY = y;
                }
            }
            d.x = bestX;
            d.y = bestY;
            d.trail = [];
        }
    }

    step(dt: number) {
        this.time += dt;
        this.pointer.speed *= Math.exp(-dt * 8);
        for (const k of this.koi) this.stepKoi(k, dt);
        for (const d of this.ducks) this.stepDuck(d, dt);
        const t = this.time;
        this.pellets = this.pellets.filter((p) => t - p.born < PELLET_LIFE);
        for (const p of this.pellets) {
            if (!p.landed) {
                if (t - p.born < p.landAt) continue;
                p.landed = true;
                this.ripples.push({ x: p.x, y: p.y, born: t, strength: 0.1 });
                // The splash is what koi react to: every koi in range turns and bolts for it at once.
                for (const k of this.koi) {
                    if (Math.hypot(k.nodes[0] - p.x, k.nodes[1] - p.y) < RUSH_RANGE) k.rush = 1;
                }
                // A duck takes no notice of food far off, but one landing under its bill is hard to ignore.
                for (const d of this.ducks) {
                    if (Math.hypot(d.x - p.x, d.y - p.y) < d.length * DUCK_NOTICE) d.keen = Math.max(d.keen, 0.7);
                }
                continue;
            }
            const damp = Math.exp(-dt * 0.2);
            p.vx *= damp;
            p.vy *= damp;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
        this.ripples = this.ripples.filter((r) => t - r.born < rippleLife(r));
        this.bites = this.bites.filter((b) => t - b.born < BITE_LIFE);
        this.quacks = this.quacks.filter((q) => t - q.born < QUACK_LIFE);
    }

    private stepKoi(k: Koi, dt: number) {
        const { width: W, height: H, pointer, time } = this;
        const L = k.length;
        const nodes = k.nodes;
        const hx = nodes[0];
        const hy = nodes[1];

        let dx = Math.cos(k.heading);
        let dy = Math.sin(k.heading);

        k.wander = clamp(k.wander + (Math.random() - 0.5) * dt * 2.4, -0.9, 0.9);
        dx += Math.cos(k.heading + k.wander) * 0.6;
        dy += Math.sin(k.heading + k.wander) * 0.6;

        const food = this.pickFood(k, hx, hy, Math.max(L * 1.6 + 220, k.rush > 0 ? RUSH_RANGE : 0));

        // A fast swipe close by spooks a koi: it bolts away, then calms down over a couple of seconds.
        // A koi already going for food ignores it; feeding beats fear, and clicking to feed moves the mouse fast.
        const pointerD = Math.hypot(pointer.x - hx, pointer.y - hy);
        const feeding = time - this.lastFeed < FEED_CALM;
        if (!food && !feeding && pointer.active && pointer.speed > STARTLE_SPEED && pointerD < L * 0.9) {
            k.startle = 1;
            k.fleeX = pointer.x;
            k.fleeY = pointer.y;
        }
        k.startle = Math.max(0, k.startle - dt * 0.6);
        const fleeing = k.startle > 0.3 && !food;

        let chasing = false;
        let curious = false;
        let closing = 0;
        if (fleeing) {
            const ox = hx - k.fleeX;
            const oy = hy - k.fleeY;
            const d = Math.hypot(ox, oy) || 1;
            dx += (ox / d) * 4 * k.startle;
            dy += (oy / d) * 4 * k.startle;
        } else if (food) {
            const tx = food.x - hx;
            const ty = food.y - hy;
            const d = Math.hypot(tx, ty) || 1;
            dx += (tx / d) * 3;
            dy += (ty / d) * 3;
            chasing = true;
            closing = clamp(1 - d / (L * 1.2), 0, 1);
        } else if (pointer.active) {
            const tx = pointer.x - hx;
            const ty = pointer.y - hy;
            const d = Math.hypot(tx, ty) || 1;
            const range = 300;
            if (d < range) {
                // Swim up to the cursor, then circle under it rather than parking.
                const w = k.curiosity * (1 - d / range) * 2.2;
                const near = clamp(d / (L * 0.6), 0, 1);
                dx += ((tx / d) * near - (ty / d) * (1 - near)) * w;
                dy += ((ty / d) * near + (tx / d) * (1 - near)) * w;
                curious = true;
            }
        }

        for (const other of this.koi) {
            if (other === k) continue;
            const ohx = other.nodes[0];
            const ohy = other.nodes[1];
            if (Math.abs(ohx - hx) > L * 2 || Math.abs(ohy - hy) > L * 2) continue;
            for (let n = 0; n < KOI_NODES; n += 3) {
                const ox = hx - other.nodes[n * 2];
                const oy = hy - other.nodes[n * 2 + 1];
                const d = Math.hypot(ox, oy);
                // Koi going for food jostle in close, so personal space shrinks and never outweighs the pull.
                const range = (L + other.length) * (food ? 0.12 : 0.28);
                if (d < range && d > 1e-3) {
                    const w = (1 - d / range) * 2.4;
                    dx += (ox / d) * w;
                    dy += (oy / d) * w;
                }
            }
            // Loose shoaling: nearby koi drift the same way.
            if (!chasing && Math.hypot(ohx - hx, ohy - hy) < L * 1.6) {
                dx += Math.cos(other.heading) * 0.18;
                dy += Math.sin(other.heading) * 0.18;
            }
        }

        // Drift around page content rather than under it; food and the cursor can still lure them across.
        repel(this.avoid, hx, hy, L * 0.4, push);
        dx += push.x * (chasing || curious ? 0.5 : 1.8);
        dy += push.y * (chasing || curious ? 0.5 : 1.8);

        // Let the body slip off-screen now and then, but always turn back. On a content page the "bottom" is the
        // foot of the strip of water along the top.
        const floor = this.band ?? H;
        // On the home page the top of their water is the foot of the ducklings' strip.
        const ceiling = this.koiCeiling;
        const over = Math.max(-hx, hx - W, ceiling - hy, hy - floor);
        if (over > -L * 0.25) {
            const w = clamp((over + L * 0.25) / (L * 0.5), 0, 1) * 3.5;
            const toX = W / 2 - hx;
            const toY = (ceiling + floor) / 2 - hy;
            const d = Math.hypot(toX, toY) || 1;
            dx += (toX / d) * w;
            dy += (toY / d) * w;
        }

        const desired = Math.atan2(dy, dx);
        // Long bodies can't pivot on the spot: the turning circle grows with length.
        const agility =
            (1 + k.rush * 0.6) *
            Math.min(fleeing ? 3 : chasing ? 1.9 + closing : curious ? 1.2 : 0.7, (k.speed / L) * 4);
        const maxTurn = agility * dt;
        const turned = clamp(angleDiff(k.heading, desired), -maxTurn, maxTurn);
        k.heading += turned;
        k.turn += (turned / dt - k.turn) * Math.min(1, dt * 3);

        // Burst and coast: a few strong tail beats, then a long glide that bleeds off speed.
        // Chasing or fleeing koi beat without pause.
        if (time > k.nextBurst && time > k.burstUntil) {
            k.burstUntil = time + rand(0.7, 1.6);
            k.nextBurst = k.burstUntil + rand(1.2, 4);
        }
        const bursting = fleeing || chasing || time < k.burstUntil;
        k.beat += ((bursting ? 1 : 0) - k.beat) * Math.min(1, dt * 3);
        // Tail beats near the surface push small rings out behind the koi; gliding or deep koi leave none.
        if (k.beat > 0.6 && k.depth > 0.65 && time > k.nextWake) {
            const tail = (KOI_NODES - 3) * 2;
            this.ripples.push({ x: nodes[tail], y: nodes[tail + 1], born: time, strength: 0.25 + 0.2 * k.depth });
            k.nextWake = time + rand(0.8, 1.6) / k.beat;
        }
        k.rush = Math.max(0, k.rush - dt * 0.7);
        const cruise = 12 + L * 0.05;
        const target =
            (1 + k.rush * 0.8) *
            (fleeing
                ? cruise * 3.2
                : chasing
                  ? cruise * (1.9 + closing)
                  : bursting
                    ? cruise * (curious ? 1.6 : 1.35)
                    : cruise * 0.45);
        k.speed += (target - k.speed) * Math.min(1, dt * (bursting ? 1.6 + k.rush * 3 : 0.35));
        k.phase += dt * (0.6 + k.beat * (2.2 + k.speed / 11));
        k.finPhase += dt * 2.4;
        k.gulp += ((chasing && closing > 0.55 ? 1 : 0) - k.gulp) * Math.min(1, dt * 6);

        // Koi drift between the deep and the surface, and rise for food.
        if (time > k.nextDive) {
            k.depthTarget = rand(0.5, k.depthMax);
            k.nextDive = time + rand(8, 20);
        }
        k.depth += ((chasing ? 1 : k.depthTarget) - k.depth) * Math.min(1, dt * (chasing ? 0.8 : 0.15));

        nodes[0] += Math.cos(k.heading) * k.speed * dt;
        nodes[1] += Math.sin(k.heading) * k.speed * dt;

        const seg = L / (KOI_NODES - 1);
        const maxBend = 0.16;
        let prevAngle = k.heading + Math.PI;
        for (let n = 1; n < KOI_NODES; n++) {
            const px = nodes[(n - 1) * 2];
            const py = nodes[(n - 1) * 2 + 1];
            let angle = Math.atan2(nodes[n * 2 + 1] - py, nodes[n * 2] - px);
            angle = prevAngle + clamp(angleDiff(prevAngle, angle), -maxBend, maxBend);
            nodes[n * 2] = px + Math.cos(angle) * seg;
            nodes[n * 2 + 1] = py + Math.sin(angle) * seg;
            prevAngle = angle;
        }

        const mouthR = L * 0.08 + 6;
        const before = this.pellets.length;
        this.pellets = this.pellets.filter(
            (p) => !p.landed || (p.x - nodes[0]) ** 2 + (p.y - nodes[1]) ** 2 > mouthR * mouthR
        );
        if (this.pellets.length < before) {
            this.ripples.push({ x: nodes[0], y: nodes[1], born: time, strength: 0.6 });
            this.bites.push({ x: nodes[0], y: nodes[1], born: time });
            k.nextSurface = time + rand(6, 16);
        } else if (time > k.nextSurface) {
            this.ripples.push({ x: nodes[0], y: nodes[1], born: time, strength: 0.3 });
            k.nextSurface = time + rand(8, 20);
        }
    }

    private stepDuck(d: Duck, dt: number) {
        const { width: W, height: H, time } = this;
        const L = d.length;
        const cos = Math.cos(d.heading);
        const sin = Math.sin(d.heading);
        // The bill is at the front of the side-on sprite, where its tip meets the water when the duck dabbles.
        const billX = d.x + d.facing * L * 0.45;
        const billY = d.y;

        let dx = cos;
        let dy = sin;
        d.wander = clamp(d.wander + (Math.random() - 0.5) * dt * 1.6, -0.7, 0.7);
        dx += Math.cos(d.heading + d.wander) * 0.5;
        dy += Math.sin(d.heading + d.wander) * 0.5;

        // Interest wears off within ten seconds or so, sooner with every pellet eaten.
        d.keen = Math.max(0, d.keen - dt * 0.09);
        const food = d.keen > 0.2 ? this.duckFood(d, billX, billY) : (d.food = null);
        if (food) {
            const tx = food.x - billX;
            const ty = food.y - billY;
            const dist = Math.hypot(tx, ty) || 1;
            dx += (tx / dist) * 3;
            dy += (ty / dist) * 3;
        }

        // A duckling with no food in view keeps its place in line: a little way behind the duck ahead, going her way.
        const ahead = d.follows === null ? null : this.ducks[d.follows];
        let lag = 0;
        if (ahead && !food) {
            const gap = (L + ahead.length) * FAMILY_GAP;
            const tx = ahead.x - Math.cos(ahead.heading) * gap - d.x;
            const ty = ahead.y - Math.sin(ahead.heading) * gap - d.y;
            lag = Math.hypot(tx, ty);
            const pull = clamp(lag / gap, 0, 1.5);
            const ux = tx / (lag || 1);
            const uy = ty / (lag || 1);
            dx = Math.cos(d.heading) * 0.4 + Math.cos(ahead.heading) * (1 - pull * 0.5) + ux * pull * 2.5;
            dy = Math.sin(d.heading) * 0.4 + Math.sin(ahead.heading) * (1 - pull * 0.5) + uy * pull * 2.5;
        }

        for (const other of this.ducks) {
            if (other === d) continue;
            const ox = d.x - other.x;
            const oy = d.y - other.y;
            const dist = Math.hypot(ox, oy) || 1;
            // Room to paddle, but the pair never wanders far apart.
            // Family keep close, just not on top of each other; the line keeps them together.
            const room = (L + other.length) * 0.55;
            if (dist < room) {
                dx += (ox / dist) * (1 - dist / room) * 2.5;
                dy += (oy / dist) * (1 - dist / room) * 2.5;
            } else if (dist > L * 6 && !food && d.follows === null && this.duckBand === null) {
                dx -= (ox / dist) * 0.3;
                dy -= (oy / dist) * 0.3;
            }
        }

        // Ducks keep to open water, out from under the page's text.
        repel(this.avoid, d.x, d.y, L * 1.5, push);
        const crowded = Math.min(1, Math.hypot(push.x, push.y));
        dx += push.x * (food ? 0.6 : 3);
        dy += push.y * (food ? 0.6 : 3);

        // And they turn back well before the edge, straight away from it rather than toward the middle,
        // which on most layouts is where the text sits.
        const edge = (dist: number) => clamp(1 - dist / (L * 1.6), 0, 1) * 3;
        dx += edge(d.x) - edge(W - d.x);
        // The side-on sprite stands up off the waterline, so the top edge counts from its head, which keeps it
        // out from under the site header too.
        const band = this.duckBand;
        if (band !== null) {
            // In the strip along the top, a duckling rides near its lower edge, clear of the header above.
            dy += clamp((band - STRIP_FLOAT - d.y) / 12, -3, 3);
        } else {
            dy += edge(d.y - L) - edge(H - d.y);
        }

        const maxTurn = (food ? 1.8 : 0.4) * dt;
        // In a strip, the water is seen from the side: a duck can only paddle left or right along it.
        const steer = band !== null ? Math.atan2(0, dx || d.facing) : Math.atan2(dy * DUCK_STEER_VERTICAL, dx);
        const turned = clamp(angleDiff(d.heading, steer), -maxTurn, maxTurn);
        d.heading += turned;
        d.turn += (turned / dt - d.turn) * Math.min(1, dt * 4);
        // Flip only once clearly headed the other way, so a duck paddling up or down the screen doesn't flicker.
        const across = Math.cos(d.heading);
        const facing = across > 0.3 ? 1 : across < -0.3 ? -1 : d.facing;
        if (facing !== d.facing) {
            d.facing = facing;
            d.flipAt = time;
        }
        // Swimming down the screen it turns its face to the viewer, up the screen its back; with some slack
        // between, so it doesn't flicker from one view to the next on a diagonal.
        const down = Math.sin(d.heading);
        if (down > 0.6) d.view = "front";
        else if (down < -0.6) d.view = "back";
        else if (Math.abs(down) < 0.45) d.view = "side";

        // Paddle and glide: a few strokes, then a glide that bleeds off speed with the feet still. A duck going for
        // food, or caught under text, paddles without a break.
        if (time > d.nextPaddle && time > d.paddleUntil) {
            d.paddleUntil = time + rand(1.2, 2.6);
            d.nextPaddle = d.paddleUntil + rand(1.5, 4);
        }
        const following = ahead !== null && !food;
        const paddling =
            food !== null ||
            crowded > 0.2 ||
            time < d.paddleUntil ||
            (ahead !== null && following && (lag > L * 0.3 || ahead.beat > 0.5));
        d.beat += ((paddling ? 1 : 0) - d.beat) * Math.min(1, dt * 4);
        // The speed it settles at while paddling, and how quick the strokes come.
        // It all but stops to peck at a pellet it has just taken.
        const pecking = time - d.peckAt < DUCK_PECK_TIME;
        // In line, a duckling matches the duck ahead and hurries to close a gap.
        const cruise =
            ahead !== null && following
                ? clamp(ahead.speed * 0.9 + lag * 0.7, 4, 50)
                : food
                  ? 30 + L * 0.12
                  : 12 + L * 0.05 + crowded * 22;
        const target = cruise * (pecking ? 0.3 : 1);
        if (paddling) d.paddle += dt * (food ? 9 : 5.5 + crowded * 3);
        // Each foot's push back is a surge forward; between pushes, and through a glide, drag bleeds speed away.
        const thrust = Math.max(0, Math.sin(d.paddle * 2)) * d.beat;
        d.speed = Math.max(0, d.speed + (thrust * (target / STROKE_MEAN) - d.speed) * DUCK_DRAG * dt);
        d.x += Math.cos(d.heading) * d.speed * dt;
        if (band !== null) {
            // Afloat on the waterline, every duck at the same height, the way they'd look from the bank.
            d.y += (band - STRIP_FLOAT - d.y) * Math.min(1, dt * 4);
        } else {
            d.y += Math.sin(d.heading) * d.speed * DUCK_VERTICAL_SPEED * dt;
        }

        // Only floating pellets: once they sink they're the koi's.
        const reach = L * 0.12 + 6;
        const bite = this.pellets.findIndex(
            (p) =>
                p.landed &&
                time - p.born < PELLET_SINK &&
                (p.x - billX) ** 2 + (p.y - billY) ** 2 < reach * reach
        );
        if (bite >= 0) {
            this.pellets.splice(bite, 1);
            this.ripples.push({ x: billX, y: billY, born: time, strength: 0.4 });
            this.bites.push({ x: billX, y: billY, born: time });
            d.keen -= 0.35;
            d.peckAt = time;
            d.pecks = 0;
            d.nextDip = time + rand(6, 14);
            if (Math.random() < QUACK_ON_FOOD) this.quack(d, pick(EATING_SOUNDS));
        } else if (!food && time > d.nextDip) {
            // Now and then, while idling, the duck dabbles at the surface.
            d.dipAt = time;
            this.ripples.push({ x: billX, y: billY, born: time, strength: 0.15 });
            d.nextDip = time + rand(8, 20);
        }
        // Each peck after the first splashes a little where the bill meets the water.
        const peck = Math.floor(((time - d.peckAt) / DUCK_PECK_TIME) * DUCK_PECKS);
        if (peck > d.pecks && peck < DUCK_PECKS) {
            d.pecks = peck;
            this.ripples.push({ x: billX, y: billY, born: time, strength: 0.2 });
        }
        const dipAge = time - d.dipAt;
        d.dip = dipAge < DUCK_DIP_TIME ? Math.sin((Math.PI * dipAge) / DUCK_DIP_TIME) : 0;

        // On the home page, a koi coming up under the strip's edge right beneath a duck startles it: a peep or a quack,
        // and the mother turns and leads her line away from it.
        const ceiling = this.koiCeiling;
        if (ceiling > 0 && time - d.startleAt > STARTLE_EVERY) {
            for (const k of this.koi) {
                const hx = k.nodes[0];
                if (k.nodes[1] - ceiling > STARTLE_REACH || Math.abs(hx - d.x) > L * 0.8) continue;
                d.startleAt = time;
                this.quack(d, d.mother ? "quack!" : "peep!");
                this.ripples.push({ x: d.x, y: d.y, born: time, strength: 0.3 });
                if (d.mother) {
                    d.heading = hx > d.x ? Math.PI : 0;
                    d.paddleUntil = time + rand(1.5, 2.5);
                }
                break;
            }
        }

        // Left to itself, a duck quacks once in a long while.
        if (time > d.nextQuack) this.quack(d, d.mother ? "quack" : pick(IDLE_SOUNDS));

        if (time > d.nextTrail) {
            d.trail.push({ x: d.x, y: d.y, heading: d.heading, speed: d.speed, born: time });
            d.nextTrail = time + TRAIL_EVERY;
        }
        while (d.trail.length > 0 && time - d.trail[0].born > TRAIL_LIFE) d.trail.shift();
    }

    private quack(d: Duck, text: string) {
        // Rising from just above the head, nudged so two quacks in a row don't stack on each other.
        this.quacks.push({
            x: d.x + d.facing * d.length * 0.3 + rand(-6, 6),
            y: d.y - d.length * 0.95,
            born: this.time,
            text,
        });
        d.nextQuack = this.time + rand(25, 55);
    }

    /** The nearest floating pellet in reach of the bill, sticking with the current one while it lasts. */
    private duckFood(d: Duck, x: number, y: number) {
        const floating = (p: Pellet) => p.landed && this.time - p.born < PELLET_SINK;
        if (d.food && (!this.pellets.includes(d.food) || !floating(d.food))) d.food = null;
        if (d.food) return d.food;
        let bestD = DUCK_RANGE * DUCK_RANGE;
        const band = this.duckBand;
        for (const p of this.pellets) {
            if (!floating(p)) continue;
            // Kept to the strip, a duckling only goes for food that lands in it.
            if (band !== null && p.y > band + d.length * 0.3) continue;
            const dist = (p.x - x) ** 2 + (p.y - y) ** 2;
            if (dist < bestD) {
                bestD = dist;
                d.food = p;
            }
        }
        return d.food;
    }

    /** Keep the current target while it lasts; only switch for a pellet less than half as far away. */
    private pickFood(k: Koi, x: number, y: number, range: number) {
        if (k.food && !this.pellets.includes(k.food)) k.food = null;
        const nearest = this.nearestPellet(x, y, range);
        if (!k.food) return (k.food = nearest);
        const current = Math.hypot(k.food.x - x, k.food.y - y);
        if (current > range * 1.3) k.food = nearest;
        else if (nearest && Math.hypot(nearest.x - x, nearest.y - y) < current * 0.5) k.food = nearest;
        return k.food;
    }

    private nearestPellet(x: number, y: number, range: number) {
        let best: Pellet | null = null;
        let bestD = range * range;
        const ceiling = this.koiCeiling;
        for (const p of this.pellets) {
            if (!p.landed) continue;
            // Food in the ducklings' strip is out of the koi's reach.
            if (p.y < ceiling) continue;
            const d = (p.x - x) ** 2 + (p.y - y) ** 2;
            if (d < bestD) {
                bestD = d;
                best = p;
            }
        }
        return best;
    }
}

export function rippleLife(r: Ripple) {
    return 2.2 + r.strength * 1.6;
}
