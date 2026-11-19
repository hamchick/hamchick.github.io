export const TAU = Math.PI * 2;
export const KOI_NODES = 20;
export const RIPPLE_SPEED = 52;

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

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

/** A white duck floating on the surface: a bystander that drifts about and now and then joins in at feeding time. */
export interface Duck {
    id: number;
    x: number;
    y: number;
    length: number;
    heading: number;
    speed: number;
    /** Smoothed angular velocity, which curves the body into turns. */
    turn: number;
    wander: number;
    /** Head turned on the neck, easing toward `lookTarget`. */
    look: number;
    lookTarget: number;
    nextLook: number;
    /** 1 when the duck has decided to go for food, fading as it loses interest or fills up. */
    keen: number;
    food: Pellet | null;
    /** 0..1 while the bill dips into the water. */
    dip: number;
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
export const DUCK_DIP_TIME = 0.9;
/** How long a wake stays on the water behind a duck, and how often its path is sampled. */
export const TRAIL_LIFE = 6;
const TRAIL_EVERY = 0.2;
export const QUACK_LIFE = 2.4;
/** Chance of a quack on each pellet a duck takes. */
const QUACK_ON_FOOD = 0.5;

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

        // One duck, or a pair on wide screens, small beside the grown koi so they stay in the background.
        this.ducks = [];
        const duckLength = clamp(baseLength * 0.36, 70, 132);
        for (let i = 0; i < (W >= 1024 ? 2 : 1); i++) {
            this.ducks.push({
                id: i + 1,
                x: rand(W * 0.15, W * 0.85),
                y: rand(H * 0.15, H * 0.85),
                length: duckLength * rand(0.92, 1.05),
                heading: rand(0, TAU),
                speed: 8,
                turn: 0,
                wander: 0,
                look: 0,
                lookTarget: 0,
                nextLook: rand(2, 6),
                keen: 0,
                food: null,
                dip: 0,
                dipAt: -Infinity,
                nextDip: rand(6, 16),
                trail: [],
                nextTrail: 0,
                // The first quack comes early, so a visitor finds out there are ducks before long.
                nextQuack: rand(3, 8) + i * 4,
            });
        }
    }

    /** A loose handful thrown at (x, y): each pellet lands a beat apart with its own splash, then drifts and sinks. */
    feed(x: number, y: number) {
        this.lastFeed = this.time;
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

    /** Move any duck sitting under page content to open water. Called once the content has first been measured. */
    placeDucks() {
        const { width: W, height: H } = this;
        for (const d of this.ducks) {
            const clear = (x: number, y: number) =>
                this.avoid.every(
                    (b) => x < b.left - d.length || x > b.right + d.length || y < b.top - d.length || y > b.bottom + d.length
                );
            if (clear(d.x, d.y)) continue;
            for (let tries = 0; tries < 40; tries++) {
                const x = rand(W * 0.1, W * 0.9);
                const y = rand(H * 0.12, H * 0.88);
                if (!clear(x, y)) continue;
                d.x = x;
                d.y = y;
                d.trail = [];
                break;
            }
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

        // Let the body slip off-screen now and then, but always turn back.
        const over = Math.max(-hx, hx - W, -hy, hy - H);
        if (over > -L * 0.25) {
            const w = clamp((over + L * 0.25) / (L * 0.5), 0, 1) * 3.5;
            const toX = W / 2 - hx;
            const toY = H / 2 - hy;
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
        const billX = d.x + cos * L * 0.55;
        const billY = d.y + sin * L * 0.55;

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

        for (const other of this.ducks) {
            if (other === d) continue;
            const ox = d.x - other.x;
            const oy = d.y - other.y;
            const dist = Math.hypot(ox, oy) || 1;
            // Room to paddle, but the pair never wanders far apart.
            const room = (L + other.length) * 0.8;
            if (dist < room) {
                dx += (ox / dist) * (1 - dist / room) * 2.5;
                dy += (oy / dist) * (1 - dist / room) * 2.5;
            } else if (dist > L * 6 && !food) {
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
        dy += edge(d.y) - edge(H - d.y);

        const maxTurn = (food ? 1.8 : 0.4) * dt;
        const turned = clamp(angleDiff(d.heading, Math.atan2(dy, dx)), -maxTurn, maxTurn);
        d.heading += turned;
        d.turn += (turned / dt - d.turn) * Math.min(1, dt * 2.5);

        // A duck caught under text paddles out briskly instead of idling there.
        const target = food ? 30 + L * 0.12 : 10 + L * 0.05 + crowded * 22;
        d.speed += (target - d.speed) * Math.min(1, dt * (food ? 1.2 : 0.5));
        d.x += Math.cos(d.heading) * d.speed * dt;
        d.y += Math.sin(d.heading) * d.speed * dt;

        if (time > d.nextLook) {
            d.lookTarget = rand(-0.45, 0.45);
            d.nextLook = time + rand(1.5, 5);
        }
        d.look += ((food ? 0 : d.lookTarget) - d.look) * Math.min(1, dt * 3);

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
            d.dipAt = time;
            d.nextDip = time + rand(6, 14);
            if (Math.random() < QUACK_ON_FOOD) this.quack(d, Math.random() < 0.3 ? "quack quack!" : "quack!");
        } else if (!food && time > d.nextDip) {
            // Now and then, while idling, the duck dabbles at the surface.
            d.dipAt = time;
            this.ripples.push({ x: billX, y: billY, born: time, strength: 0.15 });
            d.nextDip = time + rand(8, 20);
        }
        const dipAge = time - d.dipAt;
        d.dip = dipAge < DUCK_DIP_TIME ? Math.sin((Math.PI * dipAge) / DUCK_DIP_TIME) : 0;

        // Left to itself, a duck quacks once in a long while.
        if (time > d.nextQuack) this.quack(d, "quack");

        if (time > d.nextTrail) {
            d.trail.push({ x: d.x, y: d.y, heading: d.heading, speed: d.speed, born: time });
            d.nextTrail = time + TRAIL_EVERY;
        }
        while (d.trail.length > 0 && time - d.trail[0].born > TRAIL_LIFE) d.trail.shift();
    }

    private quack(d: Duck, text: string) {
        // Rising from just above the head, nudged so two quacks in a row don't stack on each other.
        this.quacks.push({
            x: d.x + Math.cos(d.heading) * d.length * 0.35 + rand(-6, 6),
            y: d.y - d.length * 0.35,
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
        for (const p of this.pellets) {
            if (!floating(p)) continue;
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
        for (const p of this.pellets) {
            if (!p.landed) continue;
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
