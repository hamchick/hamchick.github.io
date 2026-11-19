/**
 * ASCII duck pond: a full-viewport canvas drawn as a mosaic of glyph cells.
 *
 * Each cell a duck covers gets a solid colour tile, shaded as if the duck were a little dome lit from the upper left,
 * with a glyph etched on top whose density follows that shading. Edges are supersampled so outlines stay smooth.
 * The water is a wave simulation on the same grid, drawn only where it moves, with line glyphs that follow the rings.
 * Everything runs in the browser, so it works on a static host.
 */

type Rgb = [number, number, number];
type Vec = { x: number; y: number };
type Box = { left: number; top: number; right: number; bottom: number };
type Coat = "yellow" | "white" | "chick";
type Part = "body" | "head" | "wing" | "tail" | "beak";

interface Duck {
  x: number;
  y: number;
  angle: number;
  speed: number;
  turn: number;
  bend: number;
  /** Body length in px. */
  len: number;
  coat: Coat;
  leader: Duck | null;
  target: Vec;
  retargetIn: number;
  phase: number;
  wakeIn: number;
  wakeSide: number;
}

interface Crumb {
  x: number;
  y: number;
  age: number;
}

interface Quack {
  x: number;
  y: number;
  age: number;
  text: string;
}

export interface PondStats {
  ducks: number;
  crumbs: number;
  eaten: number;
}

interface Palette {
  dark: boolean;
  bg: Rgb;
  water: Rgb;
  shadow: Rgb;
  crumb: Rgb;
  beak: Rgb;
  beakShade: Rgb;
  eye: Rgb;
  coats: Record<Coat, { base: Rgb; shade: Rgb }>;
}

const STEP = 1 / 60;
const MAX_STEPS = 4;
// Wave-equation weights: different x/y weights keep rings round although cells are not square.
const WAVE = 0.42;
const DAMPING = 0.982;
const CRUMB_LIFE = 16;
const QUACK_LIFE = 1.5;
// Dense glyphs for shadowed skin, sparse ones where it catches the light.
const ETCH = "@%#*+=-:.";
// Light comes from the upper left and slightly above.
const LIGHT = (() => {
  const v = [-0.45, -0.6, 0.66];
  const n = Math.hypot(v[0], v[1], v[2]);
  return v.map((c) => c / n);
})();
// Sub-cell sample points (fractions of a cell) used to anti-alias outlines.
const SAMPLES = [
  [0.5, 0.5],
  [0.2, 0.25],
  [0.8, 0.25],
  [0.2, 0.75],
  [0.8, 0.75],
];
const INTERACTIVE = "a, button, input, textarea, select, label, summary, [role='button'], [data-pond-ignore]";
const AVOID = "[data-pond-avoid]";
const UNDER_CONTENT = 0.16;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const scale = (a: Rgb, k: number): Rgb => [a[0] * k, a[1] * k, a[2] * k];
const css = (c: Rgb) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

/** A line glyph that follows a direction on screen. */
function lineGlyph(dx: number, dy: number) {
  const d = Math.hypot(dx, dy) || 1;
  if (Math.abs(dy) < 0.38 * d) return "-";
  if (Math.abs(dx) < 0.38 * d) return "|";
  return dx * dy > 0 ? "\\" : "/";
}

function parseColor(value: string, fallback: Rgb): Rgb {
  const m = value.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : fallback;
}

/** Proportions of a duck seen from above, in fractions of its body length. */
const SHAPES = {
  adult: {
    body: { u: -0.07, v: 0, a: 0.41, b: 0.25 },
    head: { u: 0.31, v: 0, a: 0.155, b: 0.13 },
    beak: { u: 0.48, v: 0, a: 0.1, b: 0.065 },
    wing: { u: -0.13, v: 0.1, a: 0.28, b: 0.1 },
    eye: { u: 0.35, v: 0.085 },
    tail: true,
  },
  chick: {
    body: { u: -0.06, v: 0, a: 0.36, b: 0.3 },
    head: { u: 0.29, v: 0, a: 0.22, b: 0.21 },
    beak: { u: 0.52, v: 0, a: 0.08, b: 0.075 },
    wing: { u: -0.06, v: 0.22, a: 0.14, b: 0.07 },
    eye: { u: 0.35, v: 0.12 },
    tail: false,
  },
};

type Hit = { part: Part; lum: number; edge: number; side: number };

export class DuckPond {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private cw = 9;
  private ch = 12;
  private cols = 0;
  private rows = 0;
  private cur = new Float32Array(0);
  private prev = new Float32Array(0);
  private ducks: Duck[] = [];
  private crumbs: Crumb[] = [];
  private quacks: Quack[] = [];
  private boxes: Box[] = [];
  private pointer: Vec | null = null;
  private lastRipple = 0;
  private palette!: Palette;
  private styles = new Map<string, string>();
  private time = 0;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private frames = 0;
  private ambientIn = 2;
  private eaten = 0;
  private reported = "";
  private hit: Hit = { part: "body", lum: 0, edge: 0, side: 1 };
  private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  private resizeObserver: ResizeObserver;
  private themeObserver: MutationObserver;

  constructor(
    private canvas: HTMLCanvasElement,
    private onStats: (stats: PondStats) => void = () => {}
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");
    this.ctx = ctx;
    this.readPalette();
    this.resize();
    this.spawnDucks();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.themeObserver = new MutationObserver(() => this.readPalette());
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    this.colorScheme.addEventListener("change", this.readPalette);
    this.reducedMotion.addEventListener("change", this.schedule);
    document.addEventListener("visibilitychange", this.schedule);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown);
    document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("blur", this.onPointerLeave);
    this.schedule();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.resizeObserver.disconnect();
    this.themeObserver.disconnect();
    this.colorScheme.removeEventListener("change", this.readPalette);
    this.reducedMotion.removeEventListener("change", this.schedule);
    document.removeEventListener("visibilitychange", this.schedule);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("blur", this.onPointerLeave);
  }

  /** Scatter crumbs around a viewport point. */
  feed(x: number, y: number) {
    const n = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = i === 0 ? 0 : rand(10, 46);
      this.crumbs.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, age: rand(0, 0.3) });
    }
    if (this.crumbs.length > 40) this.crumbs.splice(0, this.crumbs.length - 40);
    this.drop(x, y, 3.2, 40);
    if (this.reducedMotion.matches) this.render();
    this.schedule();
  }

  // ---------------------------------------------------------------- setup

  private readPalette = () => {
    const s = getComputedStyle(this.canvas);
    const get = (name: string, fb: Rgb) => parseColor(s.getPropertyValue(name), fb);
    const bg = get("--bg", [248, 246, 240]);
    const dark = bg[0] + bg[1] + bg[2] < 384;
    const beak = get("--duck-beak", [240, 120, 40]);
    this.palette = {
      dark,
      bg,
      water: get("--pond-water", [90, 140, 200]),
      shadow: dark ? [0, 0, 0] : [70, 70, 80],
      crumb: get("--pond-crumb", [190, 130, 70]),
      beak,
      beakShade: scale(beak, 0.7),
      eye: get("--duck-eye", [25, 25, 30]),
      coats: {
        yellow: { base: get("--duck-yellow", [245, 196, 60]), shade: get("--duck-yellow-shade", [200, 140, 30]) },
        white: { base: get("--duck-white", [235, 232, 225]), shade: get("--duck-white-shade", [160, 160, 170]) },
        chick: { base: get("--duck-chick", [250, 222, 120]), shade: get("--duck-chick-shade", [215, 170, 70]) },
      },
    };
    this.styles.clear();
    if (this.reducedMotion.matches) this.render();
  };

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    // Small, near-square cells so shapes read clearly; a little larger on big screens to keep the cell count sane.
    this.cw = clamp(Math.round(this.w / 150), 7, 10);
    this.ch = this.cw + 3;
    const cols = Math.ceil(this.w / this.cw);
    const rows = Math.ceil(this.h / this.ch);
    if (cols !== this.cols || rows !== this.rows) {
      this.cols = cols;
      this.rows = rows;
      this.cur = new Float32Array(cols * rows);
      this.prev = new Float32Array(cols * rows);
    }
    const adult = this.adultLength();
    for (const d of this.ducks) {
      d.len = d.coat === "chick" ? adult * 0.42 : adult;
      d.x = clamp(d.x, 20, this.w - 20);
      d.y = clamp(d.y, 20, this.h - 20);
    }
    this.measure();
    this.render();
  }

  private adultLength() {
    return clamp(Math.min(this.w, this.h) * 0.27, 110, 240);
  }

  private spawnDucks() {
    const families = this.w * this.h < 600_000 ? [3] : [3, 2];
    const coats: Coat[] = ["yellow", "white"];
    const adult = this.adultLength();
    families.forEach((chicks, f) => {
      const start = this.openPoint();
      const mother = this.makeDuck(start.x, start.y, adult, coats[f % coats.length], null);
      this.ducks.push(mother);
      let leader = mother;
      for (let i = 0; i < chicks; i++) {
        const gap = leader.len * 0.62 + adult * 0.27 + 12;
        const chick = this.makeDuck(
          leader.x - Math.cos(leader.angle) * gap,
          leader.y - Math.sin(leader.angle) * gap,
          adult * rand(0.4, 0.44),
          "chick",
          leader
        );
        this.ducks.push(chick);
        leader = chick;
      }
    });
  }

  private makeDuck(x: number, y: number, len: number, coat: Coat, leader: Duck | null): Duck {
    const angle = leader ? leader.angle : Math.random() * Math.PI * 2;
    return {
      x,
      y,
      angle,
      speed: 0,
      turn: 0,
      bend: 0,
      len,
      coat,
      leader,
      target: { x, y },
      retargetIn: 0,
      phase: Math.random() * 10,
      wakeIn: 0,
      wakeSide: 1,
    };
  }

  /** A random point away from page content, if one can be found. */
  private openPoint(): Vec {
    const m = Math.min(120, this.w * 0.12);
    let p = { x: rand(m, this.w - m), y: rand(m, this.h - m) };
    for (let i = 0; i < 16; i++) {
      if (!this.boxes.some((b) => p.x > b.left - 60 && p.x < b.right + 60 && p.y > b.top - 60 && p.y < b.bottom + 60)) break;
      p = { x: rand(m, this.w - m), y: rand(m, this.h - m) };
    }
    return p;
  }

  private measure() {
    this.boxes = [];
    document.querySelectorAll(AVOID).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > this.h || r.width === 0) return;
      this.boxes.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    });
  }

  /** How visible something is at a point: faded under page content, easing back in around it. */
  private visibility(x: number, y: number) {
    let v = 1;
    const pad = 48;
    for (const b of this.boxes) {
      const dx = Math.max(b.left - x, 0, x - b.right);
      const dy = Math.max(b.top - y, 0, y - b.bottom);
      const d = Math.hypot(dx, dy);
      if (d < pad) v = Math.min(v, UNDER_CONTENT + (1 - UNDER_CONTENT) * smoothstep(0, pad, d));
    }
    return v;
  }

  // ---------------------------------------------------------------- input

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const p = { x: e.clientX, y: e.clientY };
    const now = performance.now();
    if (this.pointer && now - this.lastRipple > 50) {
      const moved = Math.hypot(p.x - this.pointer.x, p.y - this.pointer.y);
      if (moved > 4) {
        this.drop(p.x, p.y, clamp(moved / 30, 0.3, 1), 16);
        this.lastRipple = now;
      }
    }
    this.pointer = p;
    this.schedule();
  };

  private onPointerLeave = () => {
    this.pointer = null;
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as Element | null;
    if (target?.closest?.(INTERACTIVE) || target?.closest?.(AVOID)) return;
    this.feed(e.clientX, e.clientY);
  };

  // ---------------------------------------------------------------- loop

  private schedule = () => {
    if (this.raf || document.hidden) return;
    if (this.reducedMotion.matches) {
      this.render();
      return;
    }
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  };

  private frame = (now: number) => {
    this.raf = 0;
    if (document.hidden || this.reducedMotion.matches) return;
    this.acc = Math.min(this.acc + (now - this.last) / 1000, STEP * MAX_STEPS);
    this.last = now;
    if (++this.frames % 15 === 0) this.measure();
    while (this.acc >= STEP) {
      this.step(STEP);
      this.acc -= STEP;
    }
    this.render();
    this.raf = requestAnimationFrame(this.frame);
  };

  private step(dt: number) {
    this.time += dt;
    this.stepWater();

    this.ambientIn -= dt;
    if (this.ambientIn <= 0) {
      const p = this.openPoint();
      this.drop(p.x, p.y, rand(0.8, 1.4), 14);
      this.ambientIn = rand(2.5, 5);
    }

    for (const c of this.crumbs) c.age += dt;
    this.crumbs = this.crumbs.filter((c) => c.age < CRUMB_LIFE);
    for (const q of this.quacks) q.age += dt;
    this.quacks = this.quacks.filter((q) => q.age < QUACK_LIFE);

    for (const d of this.ducks) this.stepDuck(d, dt);
    this.separate();

    const key = `${this.crumbs.length}/${this.eaten}`;
    if (key !== this.reported) {
      this.reported = key;
      this.onStats({ ducks: this.ducks.length, crumbs: this.crumbs.length, eaten: this.eaten });
    }
  }

  private stepWater() {
    const { cols, rows, cur, prev } = this;
    const wx = WAVE;
    const wy = WAVE * (this.cw / this.ch) ** 2;
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const i = y * cols + x;
        const c = cur[i];
        const next = 2 * c - prev[i] + wx * (cur[i - 1] + cur[i + 1] - 2 * c) + wy * (cur[i - cols] + cur[i + cols] - 2 * c);
        prev[i] = clamp(next * DAMPING, -4, 4);
      }
    }
    this.prev = cur;
    this.cur = prev;
  }

  /** Push the water surface down around a point. */
  private drop(px: number, py: number, strength: number, radius: number) {
    const { cw, ch, cols, rows } = this;
    const cx = px / cw;
    const cy = py / ch;
    const rx = radius / cw;
    const ry = radius / ch;
    for (let y = Math.max(1, Math.floor(cy - ry)); y <= Math.min(rows - 2, Math.ceil(cy + ry)); y++) {
      for (let x = Math.max(1, Math.floor(cx - rx)); x <= Math.min(cols - 2, Math.ceil(cx + rx)); x++) {
        const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
        if (d < 1) this.cur[y * cols + x] -= strength * (0.5 + 0.5 * Math.cos(Math.PI * d));
      }
    }
  }

  private stepDuck(d: Duck, dt: number) {
    const chick = d.coat === "chick";
    const L = d.len;
    const head = { x: d.x + Math.cos(d.angle) * L * 0.4, y: d.y + Math.sin(d.angle) * L * 0.4 };

    // Nearest crumb worth swimming to. Ducklings only break formation for crumbs close by.
    let food: Crumb | null = null;
    let foodDist = chick ? L * 6 : Infinity;
    for (const c of this.crumbs) {
      if (c.age < 0.25) continue;
      const dist = Math.hypot(c.x - head.x, c.y - head.y);
      if (dist < foodDist) {
        foodDist = dist;
        food = c;
      }
    }

    let tx: number;
    let ty: number;
    let want: number;
    if (food) {
      tx = food.x - head.x;
      ty = food.y - head.y;
      want = L * (chick ? 2.6 : 1.1) * clamp(foodDist / (L * 0.6), 0.35, 1);
      if (foodDist < L * 0.14 + 8) {
        this.crumbs.splice(this.crumbs.indexOf(food), 1);
        this.eaten++;
        this.drop(food.x, food.y, 1.2, 18);
        if (Math.random() < (chick ? 0.4 : 0.55)) {
          this.quacks.push({ x: head.x, y: head.y - L * 0.25, age: 0, text: chick ? "peep!" : "quack!" });
        }
      }
    } else if (d.leader) {
      const l = d.leader;
      const gap = l.len * 0.62 + L * 0.62 + 12;
      const bx = l.x - Math.cos(l.angle) * gap;
      const by = l.y - Math.sin(l.angle) * gap;
      tx = bx - d.x;
      ty = by - d.y;
      const dist = Math.hypot(tx, ty);
      want = clamp(l.speed * 0.9 + dist * 2.2, 0, L * 3);
      if (dist < L * 0.15) want = l.speed * 0.8;
    } else {
      d.retargetIn -= dt;
      if (d.retargetIn <= 0 || Math.hypot(d.target.x - d.x, d.target.y - d.y) < L * 0.5) {
        d.target = this.openPoint();
        d.retargetIn = rand(7, 15);
      }
      tx = d.target.x - d.x;
      ty = d.target.y - d.y;
      want = L * 0.28;
    }

    let dist = Math.hypot(tx, ty) || 1;
    let dirX = tx / dist;
    let dirY = ty / dist;

    // Grown-ups shy away from the pointer.
    if (this.pointer && !chick && !food) {
      const px = d.x - this.pointer.x;
      const py = d.y - this.pointer.y;
      const pd = Math.hypot(px, py) || 1;
      const r = L * 1.1;
      if (pd < r) {
        const k = ((r - pd) / r) * 2.5;
        dirX += (px / pd) * k;
        dirY += (py / pd) * k;
        want = Math.max(want, L * 0.9);
      }
    }

    // Steer back from the edges of the screen.
    const m = L * 0.6;
    if (d.x < m) dirX += (m - d.x) / m;
    if (d.x > this.w - m) dirX -= (d.x - (this.w - m)) / m;
    if (d.y < m) dirY += (m - d.y) / m;
    if (d.y > this.h - m) dirY -= (d.y - (this.h - m)) / m;

    dist = Math.hypot(dirX, dirY) || 1;
    const desired = Math.atan2(dirY / dist, dirX / dist);
    const diff = Math.atan2(Math.sin(desired - d.angle), Math.cos(desired - d.angle));
    // Big bodies turn slowly; ducklings dart about.
    const maxTurn = chick ? 5 : 2;
    const turn = clamp(diff * 3, -maxTurn, maxTurn);
    d.angle += turn * dt;
    d.turn += (turn - d.turn) * Math.min(1, dt * 6);

    want *= 0.35 + 0.65 * Math.max(0, Math.cos(diff));
    d.speed += (want - d.speed) * Math.min(1, dt * (chick ? 4 : 1.8));
    d.x += Math.cos(d.angle) * d.speed * dt;
    d.y += Math.sin(d.angle) * d.speed * dt;

    // The body curves into turns and sways a little with each paddle stroke.
    const sway = Math.sin(this.time * (chick ? 9 : 5) + d.phase) * clamp(d.speed / L, 0, 1) * (chick ? 0.12 : 0.06);
    d.bend += (clamp(-d.turn * 0.22, -0.6, 0.6) + sway - d.bend) * Math.min(1, dt * 8);

    // Alternating paddles leave a V-shaped wake.
    d.wakeIn -= dt;
    if (d.speed > L * 0.08 && d.wakeIn <= 0) {
      d.wakeSide = -d.wakeSide;
      const back = L * 0.32;
      const side = L * 0.16 * d.wakeSide;
      const fx = d.x - Math.cos(d.angle) * back - Math.sin(d.angle) * side;
      const fy = d.y - Math.sin(d.angle) * back + Math.cos(d.angle) * side;
      this.drop(fx, fy, clamp(d.speed / L, 0.15, 1.2) * (chick ? 0.5 : 0.9), chick ? 9 : 13);
      d.wakeIn = chick ? 0.12 : 0.2;
    }
  }

  /** Keep bodies from overlapping. */
  private separate() {
    const ds = this.ducks;
    for (let i = 0; i < ds.length; i++) {
      for (let j = i + 1; j < ds.length; j++) {
        const a = ds[i];
        const b = ds[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const min = (a.len + b.len) * 0.36;
        if (dist >= min) continue;
        const push = (min - dist) * 0.5;
        const wa = b.len / (a.len + b.len);
        a.x -= (dx / dist) * push * wa;
        a.y -= (dy / dist) * push * wa;
        b.x += (dx / dist) * push * (1 - wa);
        b.y += (dy / dist) * push * (1 - wa);
      }
    }
  }

  // ---------------------------------------------------------------- render

  private style(key: string, color: () => Rgb) {
    let s = this.styles.get(key);
    if (!s) {
      s = css(color());
      this.styles.set(key, s);
    }
    return s;
  }

  private render() {
    const { ctx, dpr, palette } = this;
    if (!palette) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.round(this.ch * 0.78)}px ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`;

    // Ducklings first so their mothers glide over them when they bump.
    const order = [...this.ducks].sort((a, b) => a.len - b.len);
    for (const d of order) this.drawShadow(d);
    this.drawWater();
    this.drawCrumbs();
    for (const d of order) this.drawDuck(d);
    this.drawQuacks();
    ctx.globalAlpha = 1;
  }

  private drawWater() {
    const { ctx, cols, rows, cw, ch, cur, palette } = this;
    ctx.fillStyle = css(palette.water);
    const ratio = cw / ch;
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const i = y * cols + x;
        const hgt = cur[i];
        const gx = cur[i + 1] - cur[i - 1];
        const gy = (cur[i + cols] - cur[i - cols]) * ratio;
        const g = Math.hypot(gx, gy);
        const s = Math.max(Math.abs(hgt) * 0.7, g * 1.1);
        if (s < 0.12) continue;
        const px = x * cw + cw / 2;
        const py = y * ch + ch / 2;
        // Rings are drawn with strokes that run along them, perpendicular to the slope.
        const glyph = s < 0.2 ? "." : g > 0.05 ? lineGlyph(-gy, gx) : hgt > 0 ? "~" : "-";
        ctx.globalAlpha = clamp(s * 0.8 - 0.04, 0.08, palette.dark ? 0.6 : 0.5) * this.visibility(px, py);
        ctx.fillText(glyph, px, py);
      }
    }
  }

  private drawCrumbs() {
    const { ctx, palette } = this;
    for (const c of this.crumbs) {
      const fade = clamp((CRUMB_LIFE - c.age) / 2.5, 0, 1) * clamp(c.age * 4, 0, 1);
      const bob = Math.sin(this.time * 3 + c.x) * 1.2;
      ctx.globalAlpha = fade * this.visibility(c.x, c.y);
      ctx.fillStyle = this.style("crumb-tile", () => mix(palette.crumb, palette.bg, 0.15));
      ctx.fillRect(c.x - this.cw / 2, c.y - this.ch / 2 + bob, this.cw - 1, this.ch - 1);
      ctx.fillStyle = this.style("crumb-ink", () => scale(palette.crumb, 0.55));
      ctx.fillText("o", c.x, c.y + bob);
    }
  }

  private drawShadow(d: Duck) {
    const { ctx, cw, ch, palette } = this;
    const L = d.len;
    const cos = Math.cos(d.angle);
    const sin = Math.sin(d.angle);
    const ox = d.x + L * 0.05;
    const oy = d.y + L * 0.09;
    const a = L * 0.52;
    const b = L * (d.coat === "chick" ? 0.34 : 0.3);
    const R = a + cw;
    ctx.fillStyle = css(palette.shadow);
    const base = palette.dark ? 0.3 : 0.07;
    for (let cy = Math.max(0, Math.floor((oy - R) / ch)); cy <= Math.min(this.rows - 1, Math.ceil((oy + R) / ch)); cy++) {
      for (let cx = Math.max(0, Math.floor((ox - R) / cw)); cx <= Math.min(this.cols - 1, Math.ceil((ox + R) / cw)); cx++) {
        const px = cx * cw + cw / 2;
        const py = cy * ch + ch / 2;
        const dx = px - ox;
        const dy = py - oy;
        const u = (dx * cos + dy * sin) / a;
        const v = (-dx * sin + dy * cos) / b;
        const r2 = u * u + v * v;
        if (r2 >= 1) continue;
        ctx.globalAlpha = base * (1 - r2) * this.visibility(px, py);
        ctx.fillRect(cx * cw, cy * ch, cw - 1, ch - 1);
      }
    }
  }

  /** Classify a screen point against a duck. Fills this.hit and returns true when the point is on the duck. */
  private classify(d: Duck, px: number, py: number, cos: number, sin: number): boolean {
    const L = d.len;
    const shape = d.coat === "chick" ? SHAPES.chick : SHAPES.adult;
    const dx = px - d.x;
    const dy = py - d.y;
    const u = (dx * cos + dy * sin) / L;
    let v = (-dx * sin + dy * cos) / L;
    // Bend the rear half of the body.
    if (u < 0) v -= d.bend * u * u * 1.6;

    const dome = (e: { u: number; v: number; a: number; b: number }, vv: number, taper = 0) => {
      const eu = (u - e.u) / e.a;
      const bb = e.b * (eu < 0 ? 1 - taper * eu * eu : 1);
      const ev = (vv - e.v) / bb;
      const r2 = eu * eu + ev * ev;
      if (r2 >= 1) return -1;
      // Surface normal of an ellipsoid cap, rotated to screen space, dotted with the light.
      const nz = Math.sqrt(1 - r2);
      const nx = eu * cos - ev * sin;
      const ny = eu * sin + ev * cos;
      return clamp(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2], 0, 1) * 0.85 + nz * 0.15;
    };

    const hit = this.hit;
    let lum = dome(shape.beak, v);
    if (lum >= 0) {
      hit.part = "beak";
      hit.lum = lum;
      return true;
    }
    lum = dome(shape.head, v);
    if (lum >= 0) {
      hit.part = "head";
      hit.lum = lum;
      return true;
    }
    lum = dome(shape.body, v, 0.35);
    if (lum >= 0) {
      const w = shape.wing;
      const side = v > 0 ? 1 : -1;
      const wu = (u - w.u) / w.a;
      const wv = (v - side * w.v) / w.b;
      hit.side = side;
      hit.lum = lum;
      hit.part = wu * wu + wv * wv < 1 ? "wing" : "body";
      return true;
    }
    if (shape.tail && u < -0.38 && u > -0.6) {
      const half = 0.13 * ((u + 0.6) / 0.22);
      if (Math.abs(v) < half) {
        hit.part = "tail";
        hit.lum = 0.35 + (v / half) * -0.15;
        return true;
      }
    }
    return false;
  }

  private drawDuck(d: Duck) {
    const { ctx, cw, ch, palette } = this;
    const L = d.len;
    const cos = Math.cos(d.angle);
    const sin = Math.sin(d.angle);
    const coat = palette.coats[d.coat];
    const shape = d.coat === "chick" ? SHAPES.chick : SHAPES.adult;
    const R = L * 0.62 + cw;

    // The cells holding the eyes are found directly, since an eye is smaller than a cell.
    const eyes: number[] = [];
    for (const side of [-1, 1]) {
      const ev = shape.eye.v * side;
      const eu = shape.eye.u;
      const ex = d.x + (cos * eu - sin * ev) * L;
      const ey = d.y + (sin * eu + cos * ev) * L;
      eyes.push(Math.floor(ey / ch) * this.cols + Math.floor(ex / cw));
    }

    const tileAlpha = palette.dark ? 0.93 : 0.95;
    const ink = palette.dark ? 0.5 : 0.58;

    for (let cy = Math.max(0, Math.floor((d.y - R) / ch)); cy <= Math.min(this.rows - 1, Math.ceil((d.y + R) / ch)); cy++) {
      for (let cx = Math.max(0, Math.floor((d.x - R) / cw)); cx <= Math.min(this.cols - 1, Math.ceil((d.x + R) / cw)); cx++) {
        const x0 = cx * cw;
        const y0 = cy * ch;
        const i = cy * this.cols + cx;
        const vis = this.visibility(x0 + cw / 2, y0 + ch / 2);

        if (eyes.includes(i)) {
          ctx.globalAlpha = vis;
          ctx.fillStyle = css(palette.eye);
          ctx.fillRect(x0, y0, cw - 1, ch - 1);
          ctx.fillStyle = "rgb(255,255,255)";
          ctx.globalAlpha = vis * 0.85;
          ctx.fillText(".", x0 + cw * 0.35, y0 + ch * 0.3);
          continue;
        }

        // Supersample: the centre decides the part, the corners decide how much of the cell is covered.
        let covered = 0;
        let found = false;
        let part: Part = "body";
        let lum = 0;
        let side = 1;
        for (const [sx, sy] of SAMPLES) {
          if (!this.classify(d, x0 + sx * cw, y0 + sy * ch, cos, sin)) continue;
          covered++;
          if (!found) {
            found = true;
            part = this.hit.part;
            lum = this.hit.lum;
            side = this.hit.side;
          }
        }
        if (!covered) continue;
        const coverage = covered / SAMPLES.length;
        const level = clamp(Math.round(lum * 10), 0, 10);

        let tileKey: string;
        let tile: () => Rgb;
        if (part === "beak") {
          tileKey = `beak${level}`;
          tile = () => mix(palette.beakShade, palette.beak, level / 10);
        } else {
          const k = part === "wing" || part === "tail" ? 0.82 : 1;
          tileKey = `${d.coat}${part === "wing" || part === "tail" ? "w" : ""}${level}`;
          tile = () => {
            let c = mix(coat.shade, coat.base, Math.pow(level / 10, 0.8));
            if (level >= 9) c = mix(c, [255, 255, 255], 0.25);
            return scale(c, k);
          };
        }
        if (!palette.dark) {
          const inner = tile;
          tile = () => mix(inner(), palette.bg, 0.12);
          tileKey += "L";
        }

        ctx.globalAlpha = tileAlpha * vis * (coverage < 1 ? 0.35 + 0.65 * coverage : 1);
        ctx.fillStyle = this.style(tileKey, tile);
        ctx.fillRect(x0, y0, cw - 1, ch - 1);
        if (coverage < 0.6) continue;

        // Etched glyph: feather strokes on the wings and tail, shading glyphs elsewhere.
        let glyph: string;
        if (part === "wing" || part === "tail") {
          const a = d.angle + side * 0.25;
          glyph = lineGlyph(Math.cos(a), Math.sin(a));
        } else if (part === "beak") {
          glyph = level > 6 ? "=" : "#";
        } else {
          glyph = ETCH[clamp(Math.floor(lum * ETCH.length), 0, ETCH.length - 1)];
        }
        if (glyph === ".") continue;
        ctx.globalAlpha = vis * (part === "wing" || part === "tail" ? 0.55 : palette.dark ? 0.85 : 0.8);
        ctx.fillStyle = this.style(`${tileKey}i`, () => scale(tile(), ink));
        ctx.fillText(glyph, x0 + cw / 2, y0 + ch / 2 + 1);
      }
    }
  }

  private drawQuacks() {
    const { ctx, palette } = this;
    ctx.font = `600 ${Math.round(this.ch * 1.05)}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    ctx.fillStyle = css(palette.beak);
    for (const q of this.quacks) {
      ctx.globalAlpha = clamp(1 - q.age / QUACK_LIFE, 0, 1) * this.visibility(q.x, q.y);
      ctx.fillText(q.text, q.x, q.y - q.age * 22);
    }
  }
}
