import { bodyHalfWidth, classify, FLAG_BARBEL, FLAG_EYE, FLAG_FIN, type ShapeHit } from "./shape";
import {
    DUCK_BACK,
    DUCK_DABBLE,
    DUCK_FRONT,
    DUCK_PECK,
    DUCK_HEAD_FROM,
    DUCK_HEAD_ROWS,
    DUCK_SIDE,
    DUCK_SPRITE_HEIGHT,
    DUCK_SPRITE_WIDTH,
    DUCK_TAIL_COLS,
    DUCK_TAIL_ROWS,
    DUCK_WATERLINE,
    duckPixel,
} from "./duck-shape";
import {
    angleDiff,
    clamp,
    DUCK_FLIP_TIME,
    DUCK_GULP_TIME,
    DUCK_PECK_TIME,
    DUCK_PECKS,
    QUACK_LIFE,
    TRAIL_LIFE,
    hash3,
    BITE_LIFE,
    KOI_NODES,
    PELLET_LIFE,
    PELLET_SINK,
    RIPPLE_SPEED,
    rippleLife,
    smoothstep,
    type Box,
    type Koi,
    type World,
} from "./world";

export type Rgb = [number, number, number];

// How visible a koi stays while it swims under page content.
const DIM_UNDER_CONTENT = 0.15;
// How visible the koi are in the strip along the top of a content page, so they don't crowd the ducklings' water.
const KOI_IN_STRIP = 0.45;

export interface Palette {
    /** Page background, which tiles are mixed toward. */
    bg: Rgb;
    white: Rgb;
    red: Rgb;
    black: Rgb;
    fin: Rgb;
    eye: Rgb;
    water: Rgb;
    pellet: Rgb;
    shadow: Rgb;
    shadowAlpha: number;
    alpha: number;
    /** How much a deep koi fades, as the alpha it keeps at the bottom of the pond. */
    depthFloor: number;
    /** How much skin colour a tile carries, from shadow (0) to lit (1); the rest is page background. */
    tile: [number, number];
    /** Hi (the red-orange of koi markings) from deep shadow to a lit highlight, so patches shade across hues. */
    hi: Rgb[];
    /** Glyph brightness relative to the tile under it. */
    ink: number;
    /** The duckling's down from shadow to lit, its bill, and its quack. */
    duck: {
        shade: Rgb;
        base: Rgb;
        bill: Rgb;
        billShade: Rgb;
        quack: Rgb;
        alpha: number;
    };
    /** The mother duck's white plumage, from shadow to lit. Her bill and quack are the ducklings'. */
    mother: { shade: Rgb; base: Rgb };
}

export const DARK: Palette = {
    bg: [26, 25, 33],
    white: [236, 228, 218],
    red: [232, 96, 56],
    black: [92, 90, 108],
    fin: [214, 206, 198],
    eye: [20, 20, 26],
    water: [255, 247, 240],
    shadow: [0, 0, 0],
    shadowAlpha: 0.55,
    pellet: [236, 170, 92],
    alpha: 0.8,
    depthFloor: 0.4,
    tile: [0.68, 0.98],
    hi: [
        [112, 22, 24],
        [168, 34, 28],
        [214, 58, 30],
        [240, 96, 34],
        [250, 138, 52],
        [255, 178, 96],
    ],
    ink: 0.42,
    // A yellow duckling with an orange bill.
    // A duckling yellow toned down a little, so it's still the brightest thing in the pond without outshining the
    // koi; the bill leans a touch toward the koi's red-orange, and the bird sits slightly into the water as they do.
    duck: {
        shade: [194, 136, 43],
        base: [248, 221, 116],
        bill: [235, 126, 51],
        billShade: [181, 87, 32],
        quack: [255, 210, 80],
        alpha: 0.96,
    },
    mother: { shade: [150, 152, 166], base: [238, 234, 226] },
};

// Paper page: tiles are pale washes of the skin colour with dark glyphs etched on top.
export const LIGHT: Palette = {
    bg: [245, 244, 241],
    white: [112, 108, 104],
    red: [204, 62, 28],
    black: [36, 33, 40],
    fin: [138, 132, 126],
    eye: [24, 22, 26],
    water: [38, 37, 35],
    shadow: [60, 58, 56],
    shadowAlpha: 0.2,
    pellet: [176, 108, 40],
    alpha: 0.9,
    depthFloor: 0.55,
    tile: [0.78, 0.55],
    hi: [
        [138, 24, 22],
        [184, 38, 24],
        [222, 62, 28],
        [238, 100, 38],
        [244, 140, 66],
        [248, 176, 116],
    ],
    ink: 0.45,
    // A shade deeper on paper, so the yellow holds up against the pale page.
    duck: {
        shade: [184, 128, 44],
        base: [240, 200, 96],
        bill: [214, 108, 44],
        billShade: [160, 76, 28],
        // Yellow on paper is hard to read, so the quack is a deep amber here.
        quack: [178, 112, 10],
        alpha: 0.94,
    },
    // White on paper needs a grey edge to hold its shape against the pale page.
    mother: { shade: [128, 126, 122], base: [214, 210, 202] },
};

// Dense glyphs etched into each skin tile, sparse where it catches the light.
export const TILE_GLYPHS = "t%SX8@#";
const SUBSAMPLES = [0.25, 0.25, 0.75, 0.25, 0.25, 0.75, 0.75, 0.75];

// A line glyph that follows a direction in screen space, for fin rays and ripple rings.
function lineGlyph(dx: number, dy: number) {
    const d = Math.hypot(dx, dy) || 1;
    if (Math.abs(dy) < 0.38 * d) return "-";
    if (Math.abs(dx) < 0.38 * d) return "|";
    return dx * dy > 0 ? "\\" : "/";
}

function valueNoise(x: number, y: number, seed: number) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = smoothstep(0, 1, x - xi);
    const v = smoothstep(0, 1, y - yi);
    const a = hash3(xi, yi, seed);
    const b = hash3(xi + 1, yi, seed);
    const c = hash3(xi, yi + 1, seed);
    const d = hash3(xi + 1, yi + 1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** A marking in body space: centred at (s, v) along and across the spine, as fractions of length. */
type Patch = { s: number; v: number; rs: number; rv: number };
type Markings = { red: Patch[]; black: Patch[] };

function inPatch(m: Patch, s: number, vn: number, wobble: number) {
    return ((s - m.s) / m.rs) ** 2 + ((vn - m.v) / m.rv) ** 2 < 1 + wobble;
}

/**
 * Each koi gets a fixed set of markings, seeded by its id, so every fish carries a clear pattern:
 * kohaku a red head and two or three red saddles on white, sanke the same plus small black spots,
 * tancho a single red disc on the crown.
 */
function koiMarkings(k: Koi): Markings {
    const r = (j: number) => hash3(k.id, j, 41);
    if (k.variety === "tancho") return { red: [{ s: 0.11, v: 0, rs: 0.05, rv: 0.055 }], black: [] };

    const red: Patch[] = [];
    if (r(0) < 0.75) red.push({ s: 0.1, v: (r(1) - 0.5) * 0.03, rs: 0.055 + r(2) * 0.03, rv: 0.11 });
    const saddles = 2 + Math.floor(r(3) * 2);
    for (let j = 0; j < saddles; j++) {
        const span = 0.42 / saddles;
        red.push({
            s: 0.25 + span * (j + 0.5) + (r(10 + j) - 0.5) * span * 0.3,
            v: (r(20 + j) - 0.5) * 0.05,
            rs: span * (0.32 + r(30 + j) * 0.12),
            rv: 0.09 + r(40 + j) * 0.05,
        });
    }

    const black: Patch[] = [];
    if (k.variety === "sanke") {
        const spots = 4 + Math.floor(r(50) * 3);
        for (let j = 0; j < spots; j++) {
            black.push({ s: 0.24 + r(60 + j) * 0.44, v: (r(70 + j) - 0.5) * 0.16, rs: 0.022, rv: 0.026 });
        }
    }
    return { red, black };
}

const packRgb = (c: Rgb) => (c[0] << 16) | (c[1] << 8) | c[2];
/** Sample a colour ramp at t in [0, 1]. */
function ramp(stops: Rgb[], t: number): Rgb {
    const x = clamp(t, 0, 1) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(x));
    return mix(stops[i], stops[i + 1], x - i);
}

export const mix = (a: Rgb, b: Rgb, k: number): Rgb => [
    (a[0] + (b[0] - a[0]) * k) | 0,
    (a[1] + (b[1] - a[1]) * k) | 0,
    (a[2] + (b[2] - a[2]) * k) | 0,
];
export const shade = (c: Rgb, k: number): Rgb => [
    Math.min(255, c[0] * k) | 0,
    Math.min(255, c[1] * k) | 0,
    Math.min(255, c[2] * k) | 0,
];

export class KoiRenderer {
    private ctx: CanvasRenderingContext2D;
    private dpr = 1;
    private cw = 8;
    private ch = 12;
    private cols = 0;
    private rows = 0;
    private palette = DARK;
    private styles = new Map<number, string>();
    private markingCache = new Map<number, Markings>();
    private fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";

    private energy = new Float32Array(0);
    private energyTmp = new Float32Array(0);
    private cellGlyph = new Uint16Array(0);
    private cellColor = new Uint32Array(0);
    private cellAlpha = new Float32Array(0);
    private cellTile = new Uint32Array(0);
    private cellTileAlpha = new Float32Array(0);
    private cellDim = new Float32Array(0);
    /** Cells under a koi's shadow on the pond floor. */
    private cellShadow = new Uint8Array(0);

    private spine = new Float32Array(KOI_NODES * 2);
    private arc = new Float32Array(KOI_NODES);
    private arcTotal = 1;
    private flareLeft = 1;
    private flareRight = 1;
    // Scratch outputs of sample(), to avoid allocating per sample.
    private hit: ShapeHit = { flag: 0, across: 1, du: 1, da: 0 };
    private hitS = 0;
    private hitV = 0;
    private hitDist = 0;
    private hitTx = 1;
    private hitTy = 0;
    private hitSeg = 0;
    /** Top of the koi's water this frame (see World.koiCeiling). */
    private koiCeiling = 0;
    /** Eases between 1 and KOI_IN_STRIP as the pond narrows to the strip or opens back out. */
    private koiFade = 1;

    constructor(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2D canvas unavailable");
        this.ctx = ctx;
    }

    setTheme(isLight: boolean) {
        this.palette = isLight ? LIGHT : DARK;
    }

    resize(width: number, height: number, dpr: number) {
        this.dpr = dpr;
        // Near-square tiles, large enough to read each etched glyph.
        this.cw = clamp(Math.round(width / 125), 8, 12);
        this.ch = this.cw + 2;
        this.cols = Math.ceil(width / this.cw);
        this.rows = Math.ceil(height / this.ch);
        this.ctx.canvas.width = Math.round(width * dpr);
        this.ctx.canvas.height = Math.round(height * dpr);

        const n = this.cols * this.rows;
        this.energy = new Float32Array(n);
        this.energyTmp = new Float32Array(n);
        this.cellGlyph = new Uint16Array(n);
        this.cellColor = new Uint32Array(n);
        this.cellAlpha = new Float32Array(n);
        this.cellTile = new Uint32Array(n);
        this.cellTileAlpha = new Float32Array(n);
        this.cellDim = new Float32Array(n).fill(1);
        this.cellShadow = new Uint8Array(n);
    }

    /** Fade koi under these canvas-space boxes, easing back in over a few cells around them. */
    setDimBoxes(boxes: Box[]) {
        const { cols, rows, cw, ch, cellDim } = this;
        cellDim.fill(1);
        const pad = cw * 4;
        for (const b of boxes) {
            const c0 = Math.max(0, Math.floor((b.left - pad) / cw));
            const c1 = Math.min(cols - 1, Math.floor((b.right + pad) / cw));
            const r0 = Math.max(0, Math.floor((b.top - pad) / ch));
            const r1 = Math.min(rows - 1, Math.floor((b.bottom + pad) / ch));
            for (let r = r0; r <= r1; r++) {
                for (let c = c0; c <= c1; c++) {
                    const x = c * cw + cw / 2;
                    const y = r * ch + ch / 2;
                    const d = Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom));
                    const i = r * cols + c;
                    cellDim[i] = Math.min(
                        cellDim[i],
                        DIM_UNDER_CONTENT + (1 - DIM_UNDER_CONTENT) * smoothstep(0, pad, d)
                    );
                }
            }
        }
    }

    /** Draw a frame. `still` marks a single held frame (reduced motion), which shows everything settled at once. */
    render(world: World, dt: number, still = false) {
        const { ctx, dpr, cols } = this;
        if (cols === 0) return;

        this.cellGlyph.fill(0);
        this.cellTileAlpha.fill(0);
        this.cellShadow.fill(0);
        this.koiCeiling = world.koiCeiling;
        const fadeTo = world.band === null ? 1 : KOI_IN_STRIP;
        this.koiFade = still ? fadeTo : this.koiFade + (fadeTo - this.koiFade) * Math.min(1, dt * 3);
        // Deeper koi first, so the ones near the surface glide over them.
        for (const k of [...world.koi].sort((a, b) => a.depth - b.depth)) this.rasterizeKoi(k, world.time);
        this.fadeUnderStrip();
        this.depositWake(world);
        this.diffuse(dt);

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = `600 ${Math.round(this.ch * 0.72)}px ${this.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        this.drawShadows();
        this.drawWake();
        this.drawRipples(world);
        this.drawWaterline(world);
        this.drawDuckWakes(world);
        this.drawPellets(world);
        this.drawCells();
        // Ducks float on the surface, over every koi.
        this.drawDucks(world);
        this.drawBites(world);
        this.drawQuacks(world);
        ctx.globalAlpha = 1;
    }

    /**
     * On the home page, koi slipping under the edge of the ducklings' strip fade out over the last few rows above it,
     * as if going down under the bank, rather than being cut off along a straight line.
     */
    private fadeUnderStrip() {
        const { ch, cols, rows, cellAlpha, cellTileAlpha, cellShadow } = this;
        if (this.koiCeiling <= 0) return;
        const ceilingRow = Math.ceil(this.koiCeiling / ch);
        const span = 3;
        for (let r = ceilingRow; r < Math.min(rows, ceilingRow + span); r++) {
            const k = (r - ceilingRow + 1) / (span + 1);
            for (let i = r * cols; i < (r + 1) * cols; i++) {
                cellAlpha[i] *= k;
                cellTileAlpha[i] *= k;
                if (k < 0.5) cellShadow[i] = 0;
            }
        }
    }

    private style(rgb: number) {
        let s = this.styles.get(rgb);
        if (!s) {
            s = `rgb(${rgb >>> 16},${(rgb >>> 8) & 255},${rgb & 255})`;
            this.styles.set(rgb, s);
        }
        return s;
    }

    private glyphAt(i: number, glyph: string, rgb: Rgb, alpha: number) {
        const { ctx, cw, ch, cols } = this;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.style(packRgb(rgb));
        ctx.fillText(glyph, (i % cols) * cw + cw / 2, ((i / cols) | 0) * ch + ch / 2);
    }

    private cellIndex(x: number, y: number) {
        const c = Math.floor(x / this.cw);
        const r = Math.floor(y / this.ch);
        if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
        return r * this.cols + c;
    }

    // ── koi ─────────────────────────────────────────────────────────────

    /** Find the nearest point on the render spine, then classify it against the koi's outline. */
    private sample(px: number, py: number, L: number, from = 0, to = KOI_NODES - 2) {
        const { spine, arc } = this;
        let best = Infinity;
        let bestS = 0;
        let bestSign = 1;
        let past = 0;
        let ahead = 0;
        let lateral = 0;
        for (let n = from; n <= to; n++) {
            const ax = spine[n * 2];
            const ay = spine[n * 2 + 1];
            const sx = spine[(n + 1) * 2] - ax;
            const sy = spine[(n + 1) * 2 + 1] - ay;
            const len2 = sx * sx + sy * sy || 1;
            const raw = ((px - ax) * sx + (py - ay) * sy) / len2;
            const u = clamp(raw, 0, 1);
            const d2 = (px - ax - sx * u) ** 2 + (py - ay - sy * u) ** 2;
            if (d2 < best) {
                const len = Math.sqrt(len2);
                best = d2;
                bestS = (arc[n] + u * len) / this.arcTotal;
                bestSign = sx * (py - ay) - sy * (px - ax) >= 0 ? 1 : -1;
                past = n === KOI_NODES - 2 ? Math.max(0, raw - 1) * len : 0;
                ahead = n === 0 ? Math.max(0, -raw) * len : 0;
                lateral = Math.abs(sx * (py - ay) - sy * (px - ax)) / len;
                this.hitTx = sx / len;
                this.hitTy = sy / len;
                this.hitSeg = n;
            }
        }

        const a = Math.sqrt(best);
        this.hitDist = a;
        this.hitS = bestS;
        this.hitV = a * bestSign;
        return classify(
            bestS,
            a / L,
            past / L,
            bestSign > 0 ? this.flareLeft : this.flareRight,
            this.hit,
            ahead / L,
            lateral / L
        );
    }

    /** Skin colour for a body point, from the koi's own markings pinned to body coordinates. */
    private skin(k: Koi, s: number, v: number, across: number): Rgb {
        const p = this.palette;
        const vn = v / k.length;
        // Belly edges and the tail stalk stay white on every variety, which frames the markings.
        if (across > 0.9 || s > 0.74) return p.white;
        // Ragged edges, so patches read as painted markings rather than ellipses.
        const wobble = (valueNoise(s * 14 + k.id, vn * 30, k.id + 3) - 0.5) * 0.6;
        const markings = this.markings(k);
        for (const m of markings.black) if (inPatch(m, s, vn, wobble)) return p.black;
        for (const m of markings.red) if (inPatch(m, s, vn, wobble)) return p.red;
        return p.white;
    }

    private markings(k: Koi) {
        let m = this.markingCache.get(k.id);
        if (!m) {
            m = koiMarkings(k);
            this.markingCache.set(k.id, m);
        }
        return m;
    }

    private rasterizeKoi(k: Koi, t: number) {
        const { spine, arc, cw, ch, cols, rows, cellGlyph, cellColor, cellAlpha, cellTile, cellTileAlpha, palette } =
            this;
        const L = k.length;
        const nodes = k.nodes;
        // The body only undulates while the tail is beating; coasting koi hold almost straight.
        const swim = 0.2 + 1.1 * k.beat;

        // Travelling body wave that grows toward the tail.
        for (let n = 0; n < KOI_NODES; n++) {
            const s = n / (KOI_NODES - 1);
            const a = Math.max(0, n - 1);
            const b = Math.min(KOI_NODES - 1, n + 1);
            let tx = nodes[a * 2] - nodes[b * 2];
            let ty = nodes[a * 2 + 1] - nodes[b * 2 + 1];
            const tl = Math.hypot(tx, ty) || 1;
            tx /= tl;
            ty /= tl;
            const amp = L * 0.04 * (0.05 + 0.95 * Math.pow(s, 2.2)) * swim;
            const off = amp * Math.sin(k.phase - s * 4.6);
            spine[n * 2] = nodes[n * 2] - ty * off;
            spine[n * 2 + 1] = nodes[n * 2 + 1] + tx * off;
        }
        arc[0] = 0;
        for (let n = 1; n < KOI_NODES; n++) {
            arc[n] =
                arc[n - 1] + Math.hypot(spine[n * 2] - spine[(n - 1) * 2], spine[n * 2 + 1] - spine[(n - 1) * 2 + 1]);
        }
        this.arcTotal = arc[KOI_NODES - 1] || 1;
        // Pectorals tuck in during a burst, scull in turn while coasting, and the inner one spreads to brake on a turn.
        const spread = 1 - 0.25 * k.beat;
        const scull = 0.18 * (1 - k.beat) * Math.sin(k.finPhase);
        const bank = clamp(k.turn * 0.6, -0.35, 0.35);
        this.flareLeft = spread + scull - bank;
        this.flareRight = spread - scull + bank;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (let n = 0; n < KOI_NODES; n++) {
            minX = Math.min(minX, spine[n * 2]);
            maxX = Math.max(maxX, spine[n * 2]);
            minY = Math.min(minY, spine[n * 2 + 1]);
            maxY = Math.max(maxY, spine[n * 2 + 1]);
        }
        const reach = L * 0.26;
        const c0 = Math.max(0, Math.floor((minX - reach) / cw));
        const c1 = Math.min(cols - 1, Math.floor((maxX + reach) / cw));
        // On the home page the koi's water starts below the ducklings' strip: they slip under its edge, out of sight.
        const ceilingRow = Math.ceil(this.koiCeiling / ch);
        const r0 = Math.max(ceilingRow, Math.floor((minY - reach) / ch));
        const r1 = Math.min(rows - 1, Math.floor((maxY + reach) / ch));
        if (c0 > c1 || r0 > r1) return;

        const diag = Math.hypot(cw, ch);
        // Near the surface a koi is brighter and its shadow falls farther away on the floor.
        const shadowDc = Math.round((L * 0.07 * k.depth) / cw) + 1;
        const shadowDr = Math.round((L * 0.05 * k.depth) / ch) + 1;
        const dim = palette.alpha * (palette.depthFloor + (1 - palette.depthFloor) * k.depth) * this.koiFade;
        const [tile0, tile1] = palette.tile;
        const hit = this.hit;

        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                const x = c * cw;
                const y = r * ch;
                const centerHit = this.sample(x + cw / 2, y + ch / 2, L);
                // Nothing reaches far from the spine at the waist, where the fins end.
                if (!centerHit && this.hitDist > L * (this.hitS > 0.4 && this.hitS < 0.62 ? 0.15 : 0.25) + diag) {
                    // Distance to the spine changes by at most a cell per cell, so skip cells that can't reach it.
                    c += Math.max(0, Math.floor((this.hitDist - L * 0.25 - diag) / cw));
                    continue;
                }
                // Sub-samples sit within a cell of the centre, so only the neighbouring segments can be nearest.
                const from = Math.max(0, this.hitSeg - 2);
                const to = Math.min(KOI_NODES - 2, this.hitSeg + 2);
                let { flag, across } = hit;
                let s = this.hitS;
                let v = this.hitV;
                let tx = this.hitTx;
                let ty = this.hitTy;

                let hits = centerHit ? 1 : 0;
                // Points from the cell centre toward the covered side, i.e. across the outline into the koi.
                let gx = 0;
                let gy = 0;
                // Cells well inside the body can't have a sub-sample outside it, so skip straight to full coverage.
                const deepInside =
                    centerHit &&
                    flag !== FLAG_FIN &&
                    flag !== FLAG_BARBEL &&
                    s > 0.04 &&
                    s < 0.72 &&
                    bodyHalfWidth(s) * L - this.hitDist > diag * 0.35;
                if (deepInside) hits = 5;
                for (let q = 0; !deepInside && q < SUBSAMPLES.length; q += 2) {
                    if (!this.sample(x + SUBSAMPLES[q] * cw, y + SUBSAMPLES[q + 1] * ch, L, from, to)) continue;
                    gx += (SUBSAMPLES[q] - 0.5) * cw;
                    gy += (SUBSAMPLES[q + 1] - 0.5) * ch;
                    if (hits === 0) {
                        ({ flag, across } = hit);
                        s = this.hitS;
                        v = this.hitV;
                        tx = this.hitTx;
                        ty = this.hitTy;
                    }
                    hits++;
                }
                if (hits === 0) continue;
                this.hitTx = tx;
                this.hitTy = ty;
                const coverage = hits / 5;
                const side = v >= 0 ? 1 : -1;

                const i = r * cols + c;
                // Body-anchored key so each glyph rides along with the skin.
                const key = (hash3(Math.round(s * 90), Math.round(v / (cw * 0.8)), k.id) * 4294967295) >>> 0;
                const solid = centerHit && coverage >= 0.6;

                let glyph = " ";
                let rgb: Rgb = palette.fin;
                let alpha = dim;
                let tile: Rgb | null = null;
                let tileAlpha = 0;
                if (flag === FLAG_BARBEL) {
                    // Drawn along the whisker: forward from the mouth and angled out to its side.
                    glyph = lineGlyph(-tx - side * ty * 0.7, -ty + side * tx * 0.7);
                    rgb = shade(mix(palette.bg, palette.fin, 0.9), palette.ink + 0.3);
                } else if (flag === FLAG_EYE && solid) {
                    tile = mix(palette.bg, palette.eye, 0.85);
                    tileAlpha = dim;
                    glyph = "o";
                    rgb = mix(palette.bg, palette.white, 0.9);
                } else if (flag === FLAG_FIN) {
                    // Fins are a pale veil of tiles flecked with dots, so they never compete with the body.
                    tile = mix(palette.bg, palette.fin, 0.55);
                    tileAlpha = dim * 0.45 * coverage;
                    if (key % 2 === 0) {
                        glyph = ".";
                        alpha *= 0.6 * coverage;
                    }
                } else {
                    // Each skin cell is a tile washed in the skin colour, shaded like a rounded back lit from
                    // the top-left, with a dense glyph etched on top. Edge cells get a paler, empty tile.
                    const skin = this.skin(k, s, v, across);
                    const facing = side * (0.6 * ty - 0.8 * tx) * across;
                    const lum = clamp(0.22 + 0.5 * Math.sqrt(1 - across * across) + 0.18 * facing, 0, 1);
                    if (skin === palette.red) {
                        // Red patches run the full hi ramp: crimson in shadow, vermilion across the back, orange
                        // to amber where the light hits. Each koi leans a little redder or more orange, and a
                        // slow body-pinned noise varies the hue within a patch, like real pigment.
                        const lean = (hash3(k.id, 5, 17) - 0.5) * 0.3;
                        const grain = (valueNoise(s * 9 + k.id, (v / L) * 18, k.id + 21) - 0.5) * 0.25;
                        // A band of shine travels down the body, like light sliding over wet scales.
                        const sheen = Math.max(0, Math.sin(s * 11 - t * 1.8 + k.id) - 0.7) / 0.3;
                        tile = ramp(palette.hi, 0.15 + 0.8 * lum + lean + grain + sheen * 0.35);
                    } else {
                        tile = mix(palette.bg, skin, tile0 + (tile1 - tile0) * lum);
                    }
                    if (hits === 5) {
                        const sc = c + shadowDc;
                        const sr = r + shadowDr;
                        if (sc < cols && sr < rows) this.cellShadow[sr * cols + sc] = 1;
                        tileAlpha = dim;
                        if (s < 0.035 && across < 0.6 && k.gulp > 0.5) {
                            glyph = "o";
                            rgb = palette.eye;
                        } else {
                            const jitter = (key >>> 4) % 3;
                            glyph = TILE_GLYPHS[clamp(Math.round((1 - lum) * 4) + jitter, 0, TILE_GLYPHS.length - 1)];
                            rgb = shade(tile, palette.ink);
                            // White skin is etched lightly so the red and black patches carry the pattern.
                            if (skin === palette.white) alpha *= 0.6;
                            // Scales glint on a staggered clock.
                            const tick = Math.floor(t * 1.4 + (key % 997) / 97);
                            if (hash3(key, tick, 7) < 0.03) tile = mix(tile, palette.bg, 0.45);
                        }
                    } else {
                        tileAlpha = dim * coverage * 0.55;
                        if (Math.hypot(gx, gy) > cw * 0.2 && key % 3 === 0) {
                            glyph = ".";
                            rgb = shade(tile, palette.ink);
                        }
                    }
                }
                if (glyph === " " && tileAlpha === 0) continue;
                cellTile[i] = tile ? packRgb(tile) : 0;
                cellTileAlpha[i] = tileAlpha;
                cellGlyph[i] = glyph.charCodeAt(0);
                cellColor[i] = packRgb(rgb);
                cellAlpha[i] = alpha;
            }
        }
    }

    // ── ducks ───────────────────────────────────────────────────────────

    /**
     * Each duckling as a crisp pixel sprite, on a grid of its own much finer than the pond's tiles, so it stays
     * legible at a small size. It shows its side, its face or its back depending on which way it swims, and moves
     * like it is paddling: feet stroking under the water, the body lifting with each stroke, the head reaching
     * forward on every push, leading into turns while the tail trails after, and it flips over when it turns round.
     * It switches to a tail-up frame to dabble, and to a head-down frame to peck at a pellet, a few quick pecks and
     * then a lift of the head to swallow. What sits below the waterline shows faintly through the water.
     *
     * Each sprite pixel is a solid tile with a faint seam between it and its neighbours, like grout between tiles:
     * enough to echo the tiled koi and name up close, without breaking so small a sprite into a busy mesh (cut-out
     * gaps did). Tiles on the edge of the body facing the light are a touch brighter, the far edges a touch darker.
     * No outline: like everything else in the pond, it reads by its tiles and their light and shade.
     */
    private drawDucks(world: World) {
        const { ctx, palette, cellDim } = this;
        const W = DUCK_SPRITE_WIDTH;
        // Seen through a little water: the bill's orange, only slightly muted.
        const feet = mix(palette.duck.bill, palette.bg, 0.2);
        // Every edge of the pixel art lands on a whole device pixel, so it stays crisp. A sprite pixel needn't be a
        // whole number of device pixels (see World.duckPixel): where it isn't, some pixels come out a device pixel
        // wider or taller than others, too small a difference to see, rather than blurred.
        const dpr = this.dpr;
        const snap = (v: number) => Math.round(v * dpr) / dpr;

        for (const d of world.ducks) {
            const p = d.pixel;
            const look = d.mother ? { ...palette.duck, ...palette.mother } : palette.duck;
            // A seam is one device pixel: as fine a line as the screen can draw.
            const seam = 1 / dpr;
            const peckAge = world.time - d.peckAt;
            // Head down for the first part of each peck, back up for the rest.
            const pecking = peckAge < DUCK_PECK_TIME && ((peckAge / DUCK_PECK_TIME) * DUCK_PECKS) % 1 < 0.5;
            const gulping = peckAge >= DUCK_PECK_TIME && peckAge < DUCK_PECK_TIME + DUCK_GULP_TIME;
            const dabbling = d.dip > 0.3 && !pecking;
            const still = dabbling || pecking;
            const frame = pecking
                ? DUCK_PECK
                : dabbling
                  ? DUCK_DABBLE
                  : d.view === "front"
                  ? DUCK_FRONT
                  : d.view === "back"
                    ? DUCK_BACK
                    : DUCK_SIDE;
            const anchor = this.cellIndex(d.x, d.y);
            const dim = anchor >= 0 ? cellDim[anchor] : 1;
            const at = (c: number, r: number) => duckPixel(frame, c, r) !== ".";

            // Paddling: a lazy stroke while drifting, a full one when it hurries over for food, and none at all
            // through a glide, when the feet hang still and the body rides level.
            const effort = clamp(d.speed / 30, 0.4, 1) * d.beat;
            const stroke = Math.sin(d.paddle);
            // Turning round: the sprite narrows, then opens out facing the other way.
            const flipT = (world.time - d.flipAt) / DUCK_FLIP_TIME;
            const squeeze = flipT < 1 ? Math.max(0.2, Math.abs(Math.cos(Math.PI * flipT))) : 1;
            const dir = flipT < 0.5 ? -d.facing : d.facing;
            const pw = p * squeeze;
            const cx = snap(d.x);
            // The body lifts a screen pixel with each stroke of either foot, and rides the swell slowly when it
            // glides, so even a duck at rest still floats rather than sits.
            const swell = Math.sin(world.time * 1.3 + d.id * 2.1) * 0.7 * (1 - d.beat);
            const top = snap(d.y - DUCK_WATERLINE * p - Math.max(0, Math.sin(d.paddle * 2)) * effort + swell);
            // The body isn't rigid. The head reaches forward on each push and nods with the stroke; in a turn it leads
            // the way up or down while the tail trails the other way, and the tail flicks after each stroke.
            const push = Math.max(0, Math.sin(d.paddle * 2));
            const reach = still ? 0 : Math.round(effort * (0.8 * stroke + 1.4 * push)) * dir;
            // Positive while the bill swings down the screen.
            const lean = still ? 0 : clamp(d.turn * dir * 4, -2, 2);
            // Swallowing, the head tips up a pixel.
            const headDrop = Math.round(lean) - (gulping ? Math.round(p) : 0);
            const tailDrop = Math.round(-lean * 0.6) + (still ? 0 : Math.round(Math.sin(d.paddle + 1.2) * effort));

            // Where sprite pixel (c, r) lands on screen: mirrored to face left, narrowed while turning, and nudged
            // where it belongs to the head (top rows, front) or the tail tuft (top rows, back).
            const rect = (c: number, r: number) => {
                const head = r < DUCK_HEAD_ROWS && c >= DUCK_HEAD_FROM;
                const tail = c < DUCK_TAIL_COLS && r < DUCK_TAIL_ROWS;
                const left = cx + (dir > 0 ? c - W / 2 : W / 2 - 1 - c) * pw;
                const dx = head ? reach : 0;
                const x0 = snap(left) + dx;
                const x1 = snap(left + pw) + dx;
                const nudge = head ? headDrop : tail ? tailDrop : 0;
                const y0 = snap(top + r * p) + nudge;
                const y1 = snap(top + (r + 1) * p) + nudge;
                // When the head lifts, its bottom row stretches down to the neck, so they never come apart.
                const h = Math.max(1 / dpr, y1 - y0) + (head && r === DUCK_HEAD_ROWS - 1 ? Math.max(0, -headDrop) : 0);
                return { x: x0, y: y0, w: Math.max(1, x1 - x0), h };
            };

            // A few short ripples where the body meets the water, either side. The ones behind swell with each push
            // of the feet, as the water they shove back churns up.
            const wy = Math.round(d.y);
            ctx.fillStyle = this.style(packRgb(palette.water));
            for (const side of [-1, 1]) {
                const churn = side === -dir && !dabbling ? push * d.beat * 0.35 : 0;
                for (let k = 0; k < 2; k++) {
                    const wx = cx + side * (W / 2 + 1 + k * 3) * p;
                    const calm = (0.4 - k * 0.18) * (0.75 + 0.25 * Math.sin(world.time * 2.3 + k + d.id));
                    ctx.globalAlpha = Math.min(1, calm + churn * (1 - k * 0.4)) * dim;
                    ctx.fillRect(side > 0 ? wx : wx - 2 * p, wy, 2 * p, Math.max(1, Math.round(p / 2)));
                }
            }

            for (let r = 0; r < frame.length; r++) {
                for (let c = 0; c < W; c++) {
                    const px = duckPixel(frame, c, r);
                    if (px === ".") continue;
                    const { x: sx, y: sy, w, h } = rect(c, r);
                    const under = r >= DUCK_WATERLINE;
                    // Plumage is lit from above: brightest on the crown and back, greying toward the water.
                    const lit = clamp(1 - r / DUCK_WATERLINE, 0, 1);
                    // And from the screen's upper left, as the koi are: tiles on an edge facing it catch the light,
                    // tiles on the far edges fall into shade. Left and right swap when the duckling faces left.
                    const nearSide = dir > 0 ? c - 1 : c + 1;
                    const farSide = dir > 0 ? c + 1 : c - 1;
                    const bevel =
                        (at(c, r - 1) ? 0 : 0.14) +
                        (at(nearSide, r) ? 0 : 0.07) -
                        (at(c, r + 1) ? 0 : 0.14) -
                        (at(farSide, r) ? 0 : 0.07);
                    let rgb: Rgb;
                    switch (px) {
                        case "B":
                            rgb = mix(look.billShade, look.bill, clamp(0.85 + bevel, 0, 1));
                            break;
                        case "b":
                            rgb = look.billShade;
                            break;
                        case "E":
                            rgb = palette.eye;
                            break;
                        case "G":
                            rgb = mix(look.shade, look.base, clamp(0.55 + 0.25 * lit + bevel, 0, 1));
                            break;
                        case "S":
                            rgb = mix(look.shade, look.base, clamp(0.3 + bevel, 0, 1));
                            break;
                        default:
                            rgb = mix(look.shade, look.base, clamp(0.62 + 0.38 * lit + bevel, 0, 1));
                    }
                    let alpha = look.alpha * dim;
                    // Below the waterline the duck shows only faintly, through the water.
                    if (under) {
                        rgb = mix(rgb, palette.bg, 0.5);
                        alpha *= 0.35;
                    }
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.style(packRgb(rgb));
                    ctx.fillRect(sx, sy, w, h);
                    // Faint seams along this tile's shared edges with the tile below and the one to its right on screen,
                    // in a shade only a little darker than the tile, so they show up close but don't break it into a
                    // grid. None on the outer edge, which stays clean.
                    if (under) continue;
                    ctx.globalAlpha = alpha * 0.45;
                    ctx.fillStyle = this.style(packRgb(shade(rgb, 0.78)));
                    if (r + 1 < DUCK_WATERLINE && at(c, r + 1)) ctx.fillRect(sx, sy + h - seam, w, seam);
                    if (at(farSide, r)) ctx.fillRect(sx + w - seam, sy, seam, h);
                }
            }

            // Two orange feet tucked under the back of the belly, seen faintly through the water. They paddle rather
            // than step: on the push back a foot spreads its web into a fan, and swings forward again folded into a
            // thin strip, sweeping smoothly by screen pixels. Through a glide they trail behind, folded and still.
            if (!dabbling) {
                ctx.fillStyle = this.style(packRgb(feet));
                const reachOfStroke = clamp(d.speed / 30, 0.5, 1);
                const thick = Math.max(1, Math.round(p));
                for (const [base, phase] of [
                    [5, 1],
                    [7, -1],
                ]) {
                    // Where the foot is in its kick, from -1 (back) to 1 (forward); trailing back when gliding.
                    const kick = d.beat * stroke * phase * reachOfStroke + (1 - d.beat) * -0.8;
                    // Pushing back while this foot's stroke is falling.
                    const open = d.beat > 0.3 && Math.cos(d.paddle) * phase < 0;
                    const ankle = rect(base, DUCK_WATERLINE + 1);
                    const w = ankle.w;
                    const fx = ankle.x + Math.round(kick * 1.5 * p) * dir;
                    const fy = ankle.y;
                    ctx.globalAlpha = (open ? 0.72 : 0.48) * dim;
                    // One tile at the ankle, then the web: spread three wide behind the ankle on the push, two tiles
                    // trailing when folded.
                    ctx.fillRect(fx, fy, w, thick);
                    if (open) ctx.fillRect(dir > 0 ? fx - 2 * w : fx, fy + thick, 3 * w, thick);
                    else ctx.fillRect(dir > 0 ? fx - w : fx, fy + thick, 2 * w, thick);
                }
            }
        }
    }

    /**
     * The V a duck draws on the surface: two arms opening back from its chest at the Kelvin angle, laid along the
     * path it actually swam, so the V bends behind a turning duck. Each point spreads out from the path as it ages.
     */
    private drawDuckWakes(world: World) {
        // A V is only seen from above. In a strip the water is seen from the side, and the ripples either side of the
        // body are all the wake that shows.
        if (world.duckBand !== null) return;
        const { cw, ch, cellGlyph, cellDim, palette } = this;
        const spread = Math.tan((19.5 * Math.PI) / 180);
        const step = Math.min(cw, ch) * 0.6;
        for (const d of world.ducks) {
            const L = d.length;
            // The current position closes the path, so the V stays attached to the duck between samples.
            const now = { x: d.x, y: d.y, heading: d.heading, speed: d.speed, born: world.time };
            const path = [...d.trail, now];
            for (let p = path.length - 1; p > 0; p--) {
                const a = path[p];
                const b = path[p - 1];
                const segLen = Math.hypot(a.x - b.x, a.y - b.y);
                const n = Math.max(1, Math.ceil(segLen / step));
                for (let k = 0; k < n; k++) {
                    const f = k / n;
                    const x = a.x + (b.x - a.x) * f;
                    const y = a.y + (b.y - a.y) * f;
                    const heading = a.heading + angleDiff(a.heading, b.heading) * f;
                    const speed = a.speed + (b.speed - a.speed) * f;
                    const age = world.time - (a.born + (b.born - a.born) * f);
                    const life = age / TRAIL_LIFE;
                    if (life >= 1) continue;
                    // A slow duck barely marks the water; one paddling for food leaves a clear V.
                    const strength = clamp(speed / 22, 0.25, 1) * Math.pow(1 - life, 1.4);
                    // The arms start at the chest, either side of the body, and open out behind.
                    const half = L * 0.3 + speed * age * spread;
                    const cos = Math.cos(heading);
                    const sin = Math.sin(heading);
                    const cx = x + cos * L * 0.2;
                    const cy = y + sin * L * 0.2;
                    for (const side of [-1, 1]) {
                        const px = cx - sin * half * side;
                        const py = cy + cos * half * side;
                        const i = this.cellIndex(px, py);
                        if (i < 0 || cellGlyph[i]) continue;
                        // On the home page the V stays in the ducklings' strip, above its edge.
                        if (this.koiCeiling > 0 && py >= Math.ceil(this.koiCeiling / ch) * ch) continue;
                        // Each arm runs back and outward from the duck.
                        const ax = -cos - sin * spread * side;
                        const ay = -sin + cos * spread * side;
                        this.glyphAt(i, lineGlyph(ax, ay), palette.water, 0.42 * strength * cellDim[i]);
                    }
                }
            }
        }
    }

    /** "quack" floats up off the duck in the bill's colour and fades. */
    private drawQuacks(world: World) {
        const { ctx, ch, cellDim, palette } = this;
        if (world.quacks.length === 0) return;
        ctx.font = `700 ${Math.round(ch * 1.05)}px ${this.fontFamily}`;
        ctx.fillStyle = this.style(packRgb(palette.duck.quack));
        for (const q of world.quacks) {
            const t = (world.time - q.born) / QUACK_LIFE;
            const y = q.y - t * 26;
            const i = this.cellIndex(q.x, y);
            // Under page text a quack fades less than a koi does: it is a small word, easily lost.
            const dim = i >= 0 ? 0.4 + 0.6 * cellDim[i] : 1;
            // A quick pop in, a long hold, then a fade as it rises.
            ctx.globalAlpha = Math.min(1, t * 10) * (1 - smoothstep(0.7, 1, t)) * dim;
            ctx.fillText(q.text, q.x, y);
        }
        ctx.font = `600 ${Math.round(ch * 0.72)}px ${this.fontFamily}`;
    }

    private drawCells() {
        const { ctx, cw, ch, cols, cellGlyph, cellColor, cellAlpha, cellTile, cellTileAlpha, cellDim } = this;
        for (let i = 0; i < cellGlyph.length; i++) {
            const code = cellGlyph[i];
            if (!code) continue;
            const x = (i % cols) * cw;
            const y = ((i / cols) | 0) * ch;
            if (cellTileAlpha[i] > 0) {
                ctx.globalAlpha = cellTileAlpha[i] * cellDim[i];
                ctx.fillStyle = this.style(cellTile[i]);
                ctx.fillRect(x + 1, y + 1, cw - 1, ch - 1);
            }
            if (code === 32) continue;
            ctx.globalAlpha = cellAlpha[i] * cellDim[i];
            ctx.fillStyle = this.style(cellColor[i]);
            ctx.fillText(String.fromCharCode(code), x + cw / 2, y + ch / 2 + 1);
        }
    }

    // ── water ───────────────────────────────────────────────────────────

    private depositWake(world: World) {
        const { energy } = this;
        for (const k of world.koi) {
            for (let n = KOI_NODES - 4; n < KOI_NODES; n++) {
                const i = this.cellIndex(k.nodes[n * 2], k.nodes[n * 2 + 1]);
                if (i >= 0) energy[i] = Math.min(1.5, energy[i] + 0.035 + k.speed * 0.0012);
            }
        }
        if (world.pointer.active) {
            const i = this.cellIndex(world.pointer.x, world.pointer.y);
            if (i >= 0) energy[i] = Math.min(1.5, energy[i] + 0.12);
        }
    }

    /** Blur and decay so wakes spread like ripples and fade. */
    private diffuse(dt: number) {
        const { cols, rows, energy, energyTmp: tmp } = this;
        const decay = Math.exp(-dt * 1.1);
        // On the home page the edge of the ducklings' strip is a wall: wakes below it don't spread up into it.
        const edge = this.koiCeiling > 0 ? Math.ceil(this.koiCeiling / this.ch) : -1;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const i = r * cols + c;
                const l = c > 0 ? energy[i - 1] : energy[i];
                const rt = c < cols - 1 ? energy[i + 1] : energy[i];
                const u = r > 0 && r !== edge ? energy[i - cols] : energy[i];
                const d = r < rows - 1 && r + 1 !== edge ? energy[i + cols] : energy[i];
                tmp[i] = (energy[i] * 4 + l + rt + u + d) * 0.125 * decay;
            }
        }
        this.energy = tmp;
        this.energyTmp = energy;
    }

    private drawShadows() {
        const { cellShadow, cellGlyph, cellDim, palette } = this;
        for (let i = 0; i < cellShadow.length; i++) {
            if (!cellShadow[i] || cellGlyph[i]) continue;
            this.glyphAt(i, ":", palette.shadow, palette.shadowAlpha * cellDim[i]);
        }
    }

    private drawWake() {
        const { energy, cellGlyph, cellShadow, palette } = this;
        for (let i = 0; i < energy.length; i++) {
            const e = energy[i];
            if (e < 0.22 || cellGlyph[i] || cellShadow[i]) continue;
            this.glyphAt(i, e > 0.5 ? "-" : ".", palette.water, Math.min(1, (e - 0.22) * 1.4) * 0.35);
        }
    }

    /** Expanding rings drawn as ASCII circles: the glyph follows the ring's tangent. */
    private drawRipples(world: World) {
        const { cw, ch, cols, rows, cellGlyph, palette } = this;
        // On the home page a ring stays on its own side of the strip's edge, as if the edge were a bank.
        const edge = this.koiCeiling > 0 ? Math.ceil(this.koiCeiling / ch) : -1;
        for (const rp of world.ripples) {
            const above = edge >= 0 && rp.y < edge * ch;
            if (above) {
                this.drawSplash(world, rp);
                continue;
            }
            const age = world.time - rp.born;
            const life = rippleLife(rp);
            const fade = Math.pow(1 - age / life, 1.5) * rp.strength;
            for (let ring = 0; ring < 2; ring++) {
                const radius = Math.max(0, age - ring * 0.45) * RIPPLE_SPEED * (0.7 + 0.5 * rp.strength);
                if (radius < 2) continue;
                const band = cw * 0.6;
                const c0 = Math.max(0, Math.floor((rp.x - radius - cw) / cw));
                const c1 = Math.min(cols - 1, Math.floor((rp.x + radius + cw) / cw));
                const r0 = Math.max(0, Math.floor((rp.y - radius - ch) / ch));
                const r1 = Math.min(rows - 1, Math.floor((rp.y + radius + ch) / ch));
                const alpha = fade * (ring === 0 ? 0.55 : 0.3);
                for (let r = r0; r <= r1; r++) {
                    for (let c = c0; c <= c1; c++) {
                        const i = r * cols + c;
                        if (cellGlyph[i]) continue;
                        if (edge >= 0 && r < edge !== above) continue;
                        const dx = c * cw + cw / 2 - rp.x;
                        const dy = r * ch + ch / 2 - rp.y;
                        const d = Math.hypot(dx, dy);
                        if (Math.abs(d - radius) > band) continue;
                        const glyph = ring === 1 ? "." : lineGlyph(-dy, dx);
                        this.glyphAt(i, glyph, palette.water, alpha);
                    }
                }
            }
        }
    }

    /**
     * A ripple in the ducklings' strip on the home page, where the water is seen from the side: a few drops thrown up
     * at first, then two wavelets running out along the waterline either way, fading as they go.
     */
    private drawSplash(world: World, rp: World["ripples"][number]) {
        const { cw, ch, cols, cellGlyph, palette } = this;
        const age = world.time - rp.born;
        const life = rippleLife(rp);
        const fade = Math.pow(1 - age / life, 1.5) * rp.strength;
        const row = Math.floor(rp.y / ch);
        if (age < 0.35) {
            // Drops thrown up off the water.
            for (const [dc, dr, glyph] of [
                [0, -1, "'"],
                [-1, -1, "."],
                [1, -1, "."],
            ] as const) {
                const c = Math.floor(rp.x / cw) + dc;
                const r = row + dr - (age > 0.18 ? 1 : 0);
                if (c < 0 || c >= cols || r < 0) continue;
                const i = r * cols + c;
                if (!cellGlyph[i]) this.glyphAt(i, glyph, palette.water, Math.min(1, rp.strength * 2) * (1 - age / 0.35));
            }
        }
        const run = age * RIPPLE_SPEED * (0.7 + 0.5 * rp.strength);
        for (const side of [-1, 1]) {
            for (let k = 0; k < 2; k++) {
                const c = Math.floor((rp.x + side * Math.max(cw * 0.6, run - k * cw * 1.2)) / cw);
                if (c < 0 || c >= cols || row < 0) continue;
                const i = row * cols + c;
                if (cellGlyph[i]) continue;
                this.glyphAt(i, k === 0 ? "~" : "-", palette.water, fade * (k === 0 ? 0.7 : 0.4));
            }
        }
    }

    /**
     * Along the ducklings' strip on the home page: the waterline, a row of faint ~ drifting slowly along it, so the
     * strip reads as the pond's surface seen from the side.
     */
    private drawWaterline(world: World) {
        const line = world.waterline;
        if (line === null) return;
        const { ch, cols, cellGlyph, palette } = this;
        const t = world.time;
        const row = Math.floor((line + ch * 0.4) / ch);
        if (row < 0 || row >= this.rows) return;
        for (let c = 0; c < cols; c++) {
            const i = row * cols + c;
            if (cellGlyph[i]) continue;
            const v = Math.sin(c * 0.45 - t * 0.7) * 0.6 + Math.sin(c * 0.17 + t * 0.3) * 0.4;
            if (v < 0.35) continue;
            this.glyphAt(i, "~", palette.water, 0.08 + 0.22 * ((v - 0.35) / 0.65));
        }
    }

    /** A bite flashes * over the koi's mouth, settling to + then a dot as the splash takes over. */
    private drawBites(world: World) {
        const { palette } = this;
        for (const b of world.bites) {
            const i = this.cellIndex(b.x, b.y);
            if (i < 0) continue;
            const t = (world.time - b.born) / BITE_LIFE;
            const glyph = t < 0.35 ? "*" : t < 0.7 ? "+" : ".";
            this.glyphAt(i, glyph, palette.pellet, Math.min(1, palette.alpha * 1.6) * (1 - t * t));
        }
    }

    /** Pellets fall in (' then .), land as o with a splash, bob while floating, then dim to . as they sink. */
    private drawPellets(world: World) {
        const { cellGlyph, palette, ch } = this;
        for (const p of world.pellets) {
            const age = world.time - p.born;
            if (!p.landed) {
                const fall = age / p.landAt;
                // Drawn a little above where it will land, closing in as it drops; thrown into the ducklings' strip,
                // it drops all the way from where it was thrown, speeding up as it falls.
                const y = p.fromY === undefined ? p.y - (1 - fall) * ch * 1.5 : p.fromY + (p.y - p.fromY) * fall * fall;
                const i = this.cellIndex(p.x, y);
                if (i < 0 || cellGlyph[i]) continue;
                this.glyphAt(i, fall < 0.5 ? "'" : ".", palette.pellet, palette.alpha * (0.5 + 0.4 * fall));
                continue;
            }
            const i = this.cellIndex(p.x, p.y);
            if (i < 0 || cellGlyph[i]) continue;
            const sink = smoothstep(PELLET_SINK, PELLET_LIFE, age);
            const bob = 0.8 + 0.2 * Math.sin(age * 3 + p.x);
            this.glyphAt(i, sink > 0.55 ? "." : "o", palette.pellet, palette.alpha * bob * (1 - 0.85 * sink));
        }
    }
}
